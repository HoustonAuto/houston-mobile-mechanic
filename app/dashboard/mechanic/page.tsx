'use client'

import Link from 'next/link'
import { useMemo, useSyncExternalStore } from 'react'

const fallbackVehicle = {
  vin: 'No VIN submitted',
  licensePlate: 'No plate submitted',
  issue: 'No active repair issue.',
  status: 'Open',
  createdAt: '',
}

export default function MechanicDashboardPage() {
  const storedVehicle = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem('hmm:vehicle') || '',
    () => ''
  )
  const vehicle = useMemo(
    () =>
      storedVehicle
        ? { ...fallbackVehicle, ...JSON.parse(storedVehicle) }
        : fallbackVehicle,
    [storedVehicle]
  )

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
              Mechanic dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">
              Active repair queue
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md bg-white px-4 py-3 text-center font-semibold text-zinc-950 hover:bg-zinc-200"
          >
            Client view
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.75fr]">
          <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <p className="text-sm font-semibold text-zinc-400">
                  Incoming request
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  {vehicle.licensePlate}
                </h2>
              </div>
              <span className="h-fit rounded-md bg-amber-300 px-3 py-2 text-sm font-bold text-zinc-950">
                {vehicle.status}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-zinc-400">VIN</dt>
                <dd className="mt-1 text-zinc-100">{vehicle.vin}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-400">Submitted</dt>
                <dd className="mt-1 text-zinc-100">
                  {vehicle.createdAt
                    ? new Date(vehicle.createdAt).toLocaleString()
                    : 'Not available'}
                </dd>
              </div>
            </dl>

            <p className="mt-6 leading-7 text-zinc-300">{vehicle.issue}</p>
          </article>

          <aside className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-bold text-white">Next actions</h2>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200">
                Accept job
              </button>
              <button className="w-full rounded-md border border-zinc-700 px-4 py-3 font-semibold text-zinc-100 hover:bg-zinc-800">
                Request details
              </button>
              <button className="w-full rounded-md border border-zinc-700 px-4 py-3 font-semibold text-zinc-100 hover:bg-zinc-800">
                Mark complete
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}
