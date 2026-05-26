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
  full_name?: string
  phone?: string
  role?: 'client' | 'mechanic'
  company_name?: string
  garage_address?: string
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
  created_at?: string
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

  return data ? ({ ...data, email: user.email } as Profile & { email?: string }) : null
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
    ...input,
    client_id: user.id,
    status: 'Pending',
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

  return (data || []) as Ticket[]
}

export async function listMechanicTickets() {
  if (!supabase) {
    return []
  }

  const { data } = await supabase
    .from('tickets')
    .select('*')
    .in('status', ['Pending', 'Denied', 'Accepted', 'In Progress'])
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

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    throw new Error('Please log in as a mechanic first.')
  }

  const updates =
    status === 'Accepted'
      ? {
          status,
          mechanic_id: user.id,
          client_notified_at: new Date().toISOString(),
        }
      : status === 'Denied'
        ? { status, mechanic_id: null }
        : { status, mechanic_id: user.id }

  const { error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)

  if (error) {
    throw error
  }
}
