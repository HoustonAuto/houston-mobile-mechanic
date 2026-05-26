import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { ticketId } = await req.json()
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'Houston Auto Shop <onboarding@resend.dev>'

  if (!ticketId || !supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response('Missing email function configuration.', { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('vehicle_address, description, profiles!tickets_client_id_fkey(email, full_name)')
    .eq('id', ticketId)
    .single()

  if (error || !ticket?.profiles?.email) {
    return new Response('Ticket or client email not found.', { status: 404 })
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ticket.profiles.email,
      subject: 'Your Houston Mobile Mechanic ticket was accepted',
      html: `
        <p>Hello ${ticket.profiles.full_name || 'there'},</p>
        <p>A mechanic accepted your service request.</p>
        <p><strong>Vehicle location:</strong> ${ticket.vehicle_address}</p>
        <p><strong>Issue:</strong> ${ticket.description}</p>
        <p>The mechanic will contact you soon.</p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    return new Response(await emailResponse.text(), { status: 502 })
  }

  return Response.json({ ok: true })
})
