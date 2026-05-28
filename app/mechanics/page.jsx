'use client'

import { useEffect, useState } from 'react'
import MapEmbed from '@/components/MapEmbed'
import { listMechanics } from '@/lib/serviceRequests'

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadMechanics() {
      const databaseMechanics = await listMechanics()

      if (active) {
        setMechanics(databaseMechanics)
        setLoading(false)
      }
    }

    loadMechanics()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Mechanics
        </p>
        <h1 className="mt-3 text-4xl font-bold">Find a Houston mechanic</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Browse mechanics, garage locations, ratings, and approved customer
          reviews.
        </p>

        <div className="mt-8 grid gap-5">
          {loading ? (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              Loading mechanics...
            </article>
          ) : mechanics.length ? (
            mechanics.map((mechanic) => (
              <MechanicCard key={mechanic.id} mechanic={mechanic} />
            ))
          ) : (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              No mechanics are listed yet.
            </article>
          )}
        </div>
      </section>
    </main>
  )
}

function MechanicCard({ mechanic }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {mechanic.company_name || 'Independent mechanic'}
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            {mechanic.full_name || 'Houston mechanic'}
          </h2>
          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Contact</dt>
              <dd className="mt-1 text-slate-700">
                {mechanic.contact_info || mechanic.phone || 'Not listed'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Garage</dt>
              <dd className="mt-1 text-slate-700">
                {mechanic.garage_address || 'Mobile service only'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Average rating</dt>
              <dd className="mt-1 text-slate-700">
                {mechanic.average_rating
                  ? `${mechanic.average_rating.toFixed(1)}/5`
                  : 'No reviews yet'}
              </dd>
            </div>
          </dl>

          <div className="mt-5 space-y-3">
            {mechanic.reviews.slice(0, 3).map((review) => (
              <blockquote
                key={review.id}
                className="rounded-md bg-slate-50 p-4 text-sm text-slate-700"
              >
                <p className="font-semibold">{review.rating}/5 stars</p>
                <p className="mt-2">&quot;{review.comment}&quot;</p>
                <footer className="mt-2 text-slate-500">
                  {review.client_name}
                  {review.created_at
                    ? ` - ${new Date(review.created_at).toLocaleDateString()}`
                    : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>

        <MapEmbed
          address={mechanic.garage_address}
          title={`${mechanic.company_name || mechanic.full_name || 'Mechanic'} garage location`}
        />
      </div>
    </article>
  )
}
