import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-server-workflow-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Authentication required.' }, 401)
  }

  const body = await readJson(req)
  if (!body.ok) {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const ticketId = body.value.ticketId
  if (typeof ticketId !== 'string' || !uuidPattern.test(ticketId)) {
    return json({ error: 'ticketId must be a valid UUID.' }, 400)
  }

  console.log('ticket_accepted_email_requested', { ticketId })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
  const twilioFromPhone = Deno.env.get('TWILIO_FROM_PHONE') || ''
  const serverWorkflowSecret = Deno.env.get('SERVER_WORKFLOW_SECRET') || ''
  const fromEmail =
    Deno.env.get('FROM_EMAIL') ||
    'Houston Auto Shop <onboarding@resend.dev>'

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    console.error('ticket_accepted_email_config_missing', { ticketId })
    return json({ error: 'Email service is not configured.' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const token = authHeader.replace('Bearer ', '')
  const serverWorkflow =
    Boolean(serverWorkflowSecret) &&
    req.headers.get('x-server-workflow-secret') === serverWorkflowSecret &&
    token === serviceRoleKey
  const { data: authData } = await supabase.auth.getUser(token)
  const requesterId = authData.user?.id

  if (!requesterId && !serverWorkflow) {
    return json({ error: 'Authentication required.' }, 401)
  }

  const allowed = await checkRateLimit(supabase, requesterId || 'server', ticketId)
  if (!allowed) {
    console.warn('ticket_accepted_email_rate_limited', { ticketId, requesterId })
    return json({ error: 'Too many email attempts. Try again later.' }, 429)
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(
      'id, client_id, mechanic_id, status, accepted_email_sent_at, accepted_sms_sent_at, vehicle_address, description, contact_info'
    )
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    console.warn('ticket_accepted_email_ticket_missing', { ticketId })
    return json({ error: 'Ticket not found.' }, 404)
  }

  const isAssignedMechanic =
    Boolean(requesterId) && ticket.mechanic_id === requesterId
  if (!serverWorkflow && !isAssignedMechanic) {
    console.warn('ticket_accepted_email_forbidden', { ticketId, requesterId })
    return json({ error: 'Not allowed to email this ticket.' }, 403)
  }

  if (ticket.status !== 'Accepted') {
    return json({ error: 'Ticket is not accepted.' }, 409)
  }

  if (ticket.accepted_email_sent_at && ticket.accepted_sms_sent_at) {
    console.log('ticket_accepted_notifications_duplicate_skipped', { ticketId })
    return json({ ok: true, skipped: true }, 200)
  }

  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('email, full_name, phone')
    .eq('id', ticket.client_id)
    .single()

  if (!clientProfile?.email) {
    console.warn('ticket_accepted_email_client_missing', { ticketId })
    return json({ error: 'Client email not found.' }, 404)
  }

  const result = { emailSent: false, smsSent: false }

  if (!ticket.accepted_email_sent_at) {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: clientProfile.email,
        subject: 'Your Houston Mobile Mechanic ticket was accepted',
        html: `
          <p>Hello ${escapeHtml(clientProfile.full_name || 'there')},</p>
          <p>A mechanic accepted your service request.</p>
          <p><strong>Vehicle location:</strong> ${escapeHtml(ticket.vehicle_address)}</p>
          <p><strong>Issue:</strong> ${escapeHtml(ticket.description)}</p>
          <p>The mechanic will contact you soon.</p>
        `,
      }),
    })

    if (!emailResponse.ok) {
      console.error('ticket_accepted_email_send_failed', {
        ticketId,
        status: emailResponse.status,
      })
      return json({ error: 'Unable to send email right now.' }, 502)
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ accepted_email_sent_at: new Date().toISOString() })
      .eq('id', ticketId)
      .is('accepted_email_sent_at', null)

    if (updateError) {
      console.error('ticket_accepted_email_timestamp_failed', { ticketId })
      return json(
        { error: 'Email sent, but ticket timestamp was not updated.' },
        500
      )
    }

    result.emailSent = true
    console.log('ticket_accepted_email_sent', { ticketId })
  }

  if (!ticket.accepted_sms_sent_at) {
    const phone = normalizePhone(clientProfile.phone || ticket.contact_info)

    if (twilioAccountSid && twilioAuthToken && twilioFromPhone && phone) {
      const smsResponse = await sendSms({
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
        from: twilioFromPhone,
        to: phone,
        body: `Houston Mobile Mechanic: your ticket at ${ticket.vehicle_address} was accepted. A mechanic will contact you soon.`,
      })

      if (!smsResponse.ok) {
        console.error('ticket_accepted_sms_send_failed', {
          ticketId,
          status: smsResponse.status,
        })
        return json({ error: 'Unable to send SMS right now.' }, 502)
      }

      const { error: smsUpdateError } = await supabase
        .from('tickets')
        .update({ accepted_sms_sent_at: new Date().toISOString() })
        .eq('id', ticketId)
        .is('accepted_sms_sent_at', null)

      if (smsUpdateError) {
        console.error('ticket_accepted_sms_timestamp_failed', { ticketId })
        return json(
          { error: 'SMS sent, but ticket timestamp was not updated.' },
          500
        )
      }

      result.smsSent = true
      console.log('ticket_accepted_sms_sent', { ticketId })
    } else {
      console.warn('ticket_accepted_sms_skipped_missing_config_or_phone', {
        ticketId,
      })
    }
  }

  return json({ ok: true, ...result }, 200)
})

async function readJson(req: Request) {
  try {
    return { ok: true as const, value: await req.json() }
  } catch {
    return { ok: false as const, value: null }
  }
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  requesterId: string,
  ticketId: string
) {
  const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('email_function_events')
    .select('*', { count: 'exact', head: true })
    .eq('requester_id', requesterId)
    .gte('created_at', windowStart)

  if ((count || 0) >= 3) {
    return false
  }

  await supabase.from('email_function_events').insert({
    requester_id: requesterId,
    ticket_id: ticketId,
  })

  return true
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function normalizePhone(value: string) {
  const match = value.match(/(?:\+?1[-.\s]?)?\(?([2-9]\d{2})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/)

  if (!match) {
    return ''
  }

  return `+1${match[1]}${match[2]}${match[3]}`
}

function sendSms({
  accountSid,
  authToken,
  from,
  to,
  body,
}: {
  accountSid: string
  authToken: string
  from: string
  to: string
  body: string
}) {
  const auth = btoa(`${accountSid}:${authToken}`)
  const params = new URLSearchParams({
    From: from,
    To: to,
    Body: body,
  })

  return fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    }
  )
}

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
