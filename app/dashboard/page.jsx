'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { listClientTickets } from '@/lib/serviceRequests'

const fallbackTickets = []

export default function DashboardPage() {
  const [tickets, setTickets] = useState(fallbackTickets)
  const [loading, setLoading] = useState(true)
  const storedUser = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem('hmm:user') || '',
    () => ''
  )
  const user = useMemo(
    () => (storedUser ? JSON.parse(storedUser) : {}),
    [storedUser]
  )

  useEffect(() => {
    let active = true

    async function loadTickets() {
      const databaseTickets = await listClientTickets()
      const localTickets = JSON.parse(
        window.localStorage.getItem('hmm:tickets') || '[]'
      )

      if (active) {
        setTickets(databaseTickets.length ? databaseTickets : localTickets)
        setLoading(false)
      }
    }

    loadTickets()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Client dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              {user.name ? `${user.name}'s service tickets` : 'Service tickets'}
            </h1>
          </div>
          <Link
            href="/onboarding"
            className="rounded-md bg-slate-950 px-4 py-3 text-center font-semibold text-white hover:bg-slate-800"
          >
            Create request
          </Link>
        </div>

        <div className="mt-8 grid gap-5">
          {loading ? (
            <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              Loading tickets...
            </article>
          ) : tickets.length ? (
            tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">No tickets yet</h2>
              <p className="mt-3 text-slate-600">
                Create a service request to send your vehicle location and issue
                to the mechanic dashboard.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}

function TicketCard({ ticket }) {
  const acceptedNotice =
    ticket.status === 'Accepted' || ticket.status === 'In Progress'
  const deniedNotice = ticket.status === 'Denied'

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            Vehicle location
          </p>
          <h2 className="mt-2 text-2xl font-bold">{ticket.vehicle_address}</h2>
        </div>
        <span className="h-fit rounded-md bg-cyan-100 px-3 py-2 text-sm font-bold text-cyan-800">
          {ticket.status}
        </span>
      </div>

      {acceptedNotice ? (
        <p className="mt-5 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          A mechanic accepted your ticket and will contact you soon.
        </p>
      ) : null}

      {deniedNotice ? (
        <p className="mt-5 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          This ticket was denied and is available for another mechanic to
          review.
        </p>
      ) : null}

      <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Problem</dt>
          <dd className="mt-1 leading-6 text-slate-700">
            {ticket.description}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Contact</dt>
          <dd className="mt-1 leading-6 text-slate-700">
            {ticket.contact_info}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function subscribeToStorage(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}
