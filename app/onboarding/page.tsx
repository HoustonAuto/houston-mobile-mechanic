'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useSyncExternalStore } from 'react'

type StoredUser = {
  name?: string
  email?: string
  role?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const storedUser = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem('hmm:user') || '',
    () => ''
  )
  const user = useMemo<StoredUser>(
    () => (storedUser ? JSON.parse(storedUser) : {}),
    [storedUser]
  )

  function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const vehicle = {
      vin: String(formData.get('vin') || '').trim(),
      licensePlate: String(formData.get('licensePlate') || '').trim(),
      issue: String(formData.get('issue') || '').trim(),
      status: 'New request',
      createdAt: new Date().toISOString(),
    }

    window.localStorage.setItem('hmm:vehicle', JSON.stringify(vehicle))
    router.push(user.role === 'mechanic' ? '/dashboard/mechanic' : '/dashboard')
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Vehicle intake
        </p>
        <h1 className="mt-3 text-4xl font-bold">Tell us what needs attention.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Add the VIN, plate, and the issue you are seeing so the right repair
          details are ready on your dashboard.
        </p>

        <form
          onSubmit={saveVehicle}
          className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium">
              VIN
              <input
                name="vin"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="1HGCM82633A004352"
              />
            </label>

            <label className="block text-sm font-medium">
              License plate
              <input
                name="licensePlate"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="TX ABC1234"
              />
            </label>
          </div>

          <label className="mt-5 block text-sm font-medium">
            What is going on?
            <textarea
              required
              name="issue"
              rows={5}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Truck will crank but not start. Battery was replaced last month."
            />
          </label>

          <button className="mt-6 rounded-md bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-700">
            Save and open dashboard
          </button>
        </form>
      </section>
    </main>
  )
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}
