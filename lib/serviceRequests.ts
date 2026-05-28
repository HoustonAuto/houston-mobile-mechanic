import { supabase } from '@/lib/supabase'

export const ticketStatuses = [
  'Pending',
  'Accepted',
  'Denied',
  'In Progress',
  'Completed',
] as const

export type TicketStatus = (typeof ticketStatuses)[number]

export type Profile = {
  id?: string
  email?: string
  full_name?: string
  phone?: string
  role?: 'client' | 'mechanic' | 'admin'
  company_name?: string
  garage_address?: string
  garage_lat?: number | null
  garage_lng?: number | null
  contact_info?: string
}

export type Ticket = {
  id: string
  client_id?: string
  mechanic_id?: string | null
  vehicle_address: string
  description: string
  contact_info: string
  status: TicketStatus
  client_notified_at?: string | null
  accepted_email_sent_at?: string | null
  accepted_sms_sent_at?: string | null
  created_at?: string
  updated_at?: string
  vehicle_lat?: number | null
  vehicle_lng?: number | null
  mechanic?: Profile | null
}

export type Review = {
  id: string
  ticket_id?: string
  client_id?: string
  mechanic_id?: string
  client_name: string
  rating: number
  comment: string
  created_at?: string
  updated_at?: string
  mechanic_name?: string
}

export type MechanicProfile = Profile & {
  id: string
  average_rating: number
  reviews: Review[]
}

export async function getCurrentProfile() {
  if (!supabase) {
    return null
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ? ({ ...data, email: user.email } as Profile) : null
}

export async function createClientTicket(input: {
  vehicle_address: string
  description: string
  contact_info: string
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    throw new Error('Please log in before creating a service request.')
  }

  const { error } = await supabase.from('tickets').insert({
    vehicle_address: input.vehicle_address,
    description: input.description,
    contact_info: input.contact_info,
    client_id: user.id,
  })

  if (error) {
    throw error
  }
}

export async function listClientTickets() {
  if (!supabase) {
    return []
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const tickets = (data || []) as Ticket[]
  const mechanicIds = [
    ...new Set(tickets.map((ticket) => ticket.mechanic_id).filter(Boolean)),
  ] as string[]

  if (!mechanicIds.length) {
    return tickets
  }

  const { data: mechanics } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, phone, contact_info, garage_address, garage_lat, garage_lng')
    .in('id', mechanicIds)

  const mechanicMap = new Map(
    (mechanics || []).map((mechanic) => [mechanic.id, mechanic as Profile])
  )

  return tickets.map((ticket) => ({
    ...ticket,
    mechanic: ticket.mechanic_id
      ? mechanicMap.get(ticket.mechanic_id) || null
      : null,
  }))
}

export async function listMechanicTickets() {
  if (!supabase) {
    return []
  }

  const { data } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  return (data || []) as Ticket[]
}

export async function saveMechanicProfile(profile: {
  company_name: string
  garage_address: string
  contact_info: string
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    throw new Error('Please log in as a mechanic first.')
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    role: 'mechanic',
    ...profile,
  })

  if (error) {
    throw error
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  if (status === 'Accepted') {
    const { error } = await supabase.rpc('accept_ticket', {
      ticket_id: ticketId,
    })

    if (error) {
      throw error
    }

    await notifyTicketAccepted(ticketId)
    return
  }

  const updates =
    status === 'Denied'
      ? { status, mechanic_id: null }
      : { status }

  const { error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)

  if (error) {
    throw error
  }
}

export async function deleteCompletedTicket(ticketId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('status', 'Completed')

  if (error) {
    throw error
  }
}

export async function createReview(input: {
  ticket_id: string
  client_name: string
  rating: number
  comment: string
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.rpc('create_ticket_review', {
    p_ticket_id: input.ticket_id,
    p_client_name: input.client_name,
    p_rating: input.rating,
    p_comment: input.comment,
  })

  if (error) {
    throw error
  }
}

export async function listPublishedReviews() {
  if (!supabase) {
    return []
  }

  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const reviews = (data || []) as Review[]
  return attachMechanicNames(reviews)
}

export async function listMechanics() {
  if (!supabase) {
    return []
  }

  const { data: mechanics } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, phone, contact_info, garage_address, garage_lat, garage_lng')
    .eq('role', 'mechanic')
    .order('company_name', { ascending: true })

  const mechanicRows = (mechanics || []) as Profile[]

  if (!mechanicRows.length) {
    return []
  }

  const mechanicIds = mechanicRows.map((mechanic) => mechanic.id as string)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .in('mechanic_id', mechanicIds)
    .order('created_at', { ascending: false })

  const reviewsByMechanic = new Map<string, Review[]>()
  for (const review of ((reviews || []) as Review[])) {
    const current = reviewsByMechanic.get(review.mechanic_id || '') || []
    reviewsByMechanic.set(review.mechanic_id || '', [...current, review])
  }

  return mechanicRows.map((mechanic) => {
    const mechanicReviews = reviewsByMechanic.get(mechanic.id as string) || []
    const average =
      mechanicReviews.length > 0
        ? mechanicReviews.reduce((sum, review) => sum + review.rating, 0) /
          mechanicReviews.length
        : 0

    return {
      ...mechanic,
      id: mechanic.id as string,
      average_rating: average,
      reviews: mechanicReviews,
    }
  }) as MechanicProfile[]
}

async function notifyTicketAccepted(ticketId: string) {
  if (!supabase) {
    return
  }

  const { error } = await supabase.functions.invoke(
    'send-ticket-accepted-email',
    {
      body: { ticketId },
    }
  )

  if (error) {
    console.warn('Accepted ticket email was not sent.')
  }
}

async function attachMechanicNames(reviews: Review[]) {
  if (!supabase || !reviews.length) {
    return reviews
  }

  const mechanicIds = [
    ...new Set(reviews.map((review) => review.mechanic_id).filter(Boolean)),
  ] as string[]

  if (!mechanicIds.length) {
    return reviews
  }

  const { data: mechanics } = await supabase
    .from('profiles')
    .select('id, full_name, company_name')
    .in('id', mechanicIds)

  const mechanicMap = new Map(
    (mechanics || []).map((mechanic) => [
      mechanic.id,
      mechanic.company_name || mechanic.full_name || 'Mechanic',
    ])
  )

  return reviews.map((review) => ({
    ...review,
    mechanic_name: review.mechanic_id
      ? mechanicMap.get(review.mechanic_id)
      : undefined,
  }))
}
