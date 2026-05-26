'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  deleteCompletedTicket,
  getCurrentProfile,
  listMechanicTickets,
  saveMechanicProfile,
  ticketStatuses,
  updateTicketStatus,
  type Ticket,
  type TicketStatus,
} from '@/lib/serviceRequests'

export default function MechanicDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [profile, setProfile] = useState({
    company_name: '',
    garage_address: '',
    contact_info: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      const [databaseTickets, databaseProfile] = await Promise.all([
        listMechanicTickets(),
        getCurrentProfile(),
      ])
      const localTickets = JSON.parse(
        window.localStorage.getItem('hmm:tickets') || '[]'
      )

      if (active) {
        setTickets(databaseTickets.length ? databaseTickets : localTickets)
        setProfile({
          company_name: databaseProfile?.company_name || '',
          garage_address: databaseProfile?.garage_address || '',
          contact_info: databaseProfile?.contact_info || '',
        })
        setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    try {
      await saveMechanicProfile(profile)
      setMessage('Profile saved.')
    } catch (error) {
      window.localStorage.setItem('hmm:mechanicProfile', JSON.stringify(profile))
      setMessage(
        error instanceof Error
          ? `${error.message} Saved locally until the database is connected.`
          : 'Profile saved locally.'
      )
    }
  }

  async function changeTicketStatus(ticketId: string, status: TicketStatus) {
    setMessage('')

    try {
      await updateTicketStatus(ticketId, status)
    } catch (error) {
      const updatedTickets = tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              mechanic_id: status === 'Denied' ? null : 'local-mechanic',
              client_notified_at:
                status === 'Accepted'
                  ? new Date().toISOString()
                  : ticket.client_notified_at,
            }
          : ticket
      )

      window.localStorage.setItem('hmm:tickets', JSON.stringify(updatedTickets))

      if (error instanceof Error) {
        setMessage(`${error.message} Updated locally for now.`)
      }
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              mechanic_id: status === 'Denied' ? null : ticket.mechanic_id,
              client_notified_at:
                status === 'Accepted'
                  ? new Date().toISOString()
                  : ticket.client_notified_at,
            }
          : ticket
      )
    )
  }

  async function eraseTicket(ticketId: string) {
    setMessage('')

    try {
      await deleteCompletedTicket(ticketId)
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`${error.message} Removed locally for now.`)
      }
    }

    const updatedTickets = tickets.filter((ticket) => ticket.id !== ticketId)
    window.localStorage.setItem('hmm:tickets', JSON.stringify(updatedTickets))
    setTickets(updatedTickets)
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
              Mechanic dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              Incoming tickets
            </h1>
          </div>
        </div>

        {message ? (
          <p className="mt-6 rounded-md bg-amber-300 p-3 text-sm font-semibold text-zinc-950">
            {message}
          </p>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleProfileSave}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
          >
            <h2 className="text-xl font-bold text-white">Mechanic profile</h2>

            <label className="mt-5 block text-sm font-medium text-zinc-300">
              Company name
              <input
                value={profile.company_name}
                onChange={(event) =>
                  setProfile({ ...profile, company_name: event.target.value })
                }
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Houston Auto Shop"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-300">
              Garage address
              <input
                value={profile.garage_address}
                onChange={(event) =>
                  setProfile({ ...profile, garage_address: event.target.value })
                }
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Optional physical shop address"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-300">
              Contact information
              <textarea
                required
                rows={4}
                value={profile.contact_info}
                onChange={(event) =>
                  setProfile({ ...profile, contact_info: event.target.value })
                }
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Phone, email, hours, or dispatch instructions"
              />
            </label>

            <button className="mt-5 w-full rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
              Save profile
            </button>
          </form>

          <div className="space-y-4">
            {loading ? (
              <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                Loading incoming tickets...
              </article>
            ) : tickets.length ? (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onStatusChange={changeTicketStatus}
                  onErase={eraseTicket}
                />
              ))
            ) : (
              <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                No incoming tickets yet.
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function TicketCard({
  ticket,
  onStatusChange,
  onErase,
}: {
  ticket: Ticket
  onStatusChange: (ticketId: string, status: TicketStatus) => void
  onErase: (ticketId: string) => void
}) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="text-sm font-semibold text-zinc-400">
            Vehicle location
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {ticket.vehicle_address}
          </h2>
        </div>
        <span className="h-fit rounded-md bg-amber-300 px-3 py-2 text-sm font-bold text-zinc-950">
          {ticket.status}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <dt className="font-semibold text-zinc-400">Problem</dt>
          <dd className="mt-1 leading-6 text-zinc-200">
            {ticket.description}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-400">Client contact</dt>
          <dd className="mt-1 leading-6 text-zinc-200">
            {ticket.contact_info}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <button
          onClick={() => onStatusChange(ticket.id, 'Accepted')}
          className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-300"
        >
          Accept
        </button>
        <button
          onClick={() => onStatusChange(ticket.id, 'Denied')}
          className="rounded-md bg-red-400 px-3 py-2 text-sm font-bold text-zinc-950 hover:bg-red-300"
        >
          Deny
        </button>
        {ticketStatuses.slice(3).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(ticket.id, status)}
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
          >
            {status}
          </button>
        ))}
        {ticket.status === 'Completed' ? (
          <button
            onClick={() => onErase(ticket.id)}
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-950 hover:bg-white"
          >
            Erase
          </button>
        ) : null}
      </div>
    </article>
  )
}
