'use client'

import Link from 'next/link'
import { useMemo, useSyncExternalStore } from 'react'

const fallbackVehicle = {
  vin: 'Not added yet',
  licensePlate: 'Not added yet',
  issue: 'No repair issue has been submitted.',
  status: 'Waiting for intake',
}

export default function DashboardPage() {
  const storedUser = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem('hmm:user') || '',
    () => ''
  )
  const storedVehicle = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem('hmm:vehicle') || '',
    () => ''
  )
  const user = useMemo(() => (storedUser ? JSON.parse(storedUser) : {}), [storedUser])
  const vehicle = useMemo(
    () => (storedVehicle ? { ...fallbackVehicle, ...JSON.parse(storedVehicle) } : fallbackVehicle),
    [storedVehicle]
  )

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Client dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              {user.name ? `${user.name}'s repair hub` : 'Your repair hub'}
            </h1>
          </div>
          <Link
            href="/onboarding"
            className="rounded-md bg-slate-950 px-4 py-3 text-center font-semibold text-white hover:bg-slate-800"
          >
            Update vehicle
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Vehicle</p>
            <h2 className="mt-3 text-xl font-bold">Primary request</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">VIN</dt>
                <dd>{vehicle.vin}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Plate</dt>
                <dd>{vehicle.licensePlate}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">
              Repair request
            </p>
            <h2 className="mt-3 text-xl font-bold">{vehicle.status}</h2>
            <p className="mt-4 leading-7 text-slate-700">{vehicle.issue}</p>
          </article>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Dispatch</p>
            <p className="mt-3 text-2xl font-bold">Pending</p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Estimate</p>
            <p className="mt-3 text-2xl font-bold">Reviewing</p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Invoice</p>
            <p className="mt-3 text-2xl font-bold">Not issued</p>
          </article>
        </div>
      </section>
    </main>
  )
}

function subscribeToStorage(onStoreChange) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}
