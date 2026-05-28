'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import MapEmbed from '@/components/MapEmbed'
import { createReview, listClientTickets } from '@/lib/serviceRequests'
import { isSupabaseConfigured } from '@/lib/supabase'

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
        setTickets(
          isSupabaseConfigured
            ? databaseTickets
            : databaseTickets.length
              ? databaseTickets
              : localTickets
        )
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
  const completedNotice = ticket.status === 'Completed'

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

      {completedNotice ? (
        <ReviewForm ticketId={ticket.id} />
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

      {ticket.mechanic ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-bold">Assigned mechanic</h3>
          <p className="mt-2 text-sm text-slate-700">
            {ticket.mechanic.company_name ||
              ticket.mechanic.full_name ||
              'Mechanic'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {ticket.mechanic.contact_info ||
              ticket.mechanic.phone ||
              'Contact details not listed'}
          </p>
          <MapEmbed
            address={ticket.mechanic.garage_address}
            title="Mechanic garage location"
          />
        </div>
      ) : null}
    </article>
  )
}

function ReviewForm({ ticketId }) {
  const [rating, setRating] = useState('5')
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')

  async function submitReview(event) {
    event.preventDefault()
    const review = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      client_name: name || 'Houston customer',
      rating: Number(rating),
      comment,
      created_at: new Date().toISOString(),
    }

    try {
      await createReview(review)
      setMessage('Thanks. Your review was posted.')
    } catch {
      const localReviews = JSON.parse(
        window.localStorage.getItem('hmm:reviews') || '[]'
      )
      window.localStorage.setItem(
        'hmm:reviews',
        JSON.stringify([review, ...localReviews])
      )
      setMessage('Thanks. Your review was saved.')
    }

    setComment('')
  }

  return (
    <form
      onSubmit={submitReview}
      className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <h3 className="font-bold">How was the service?</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px]">
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
        >
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
        </select>
      </div>
      <textarea
        required
        rows={3}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder="Write a short review"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <button className="mt-3 rounded-md bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700">
        Post review
      </button>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </form>
  )
}

function subscribeToStorage(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}
