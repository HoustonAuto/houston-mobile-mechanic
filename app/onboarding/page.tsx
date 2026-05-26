'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState, useSyncExternalStore } from 'react'
import { createClientTicket } from '@/lib/serviceRequests'

type StoredUser = {
  name?: string
  email?: string
  role?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const storedUser = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem('hmm:user') || '',
    () => ''
  )
  const user = useMemo<StoredUser>(
    () => (storedUser ? JSON.parse(storedUser) : {}),
    [storedUser]
  )

  async function saveTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData(event.currentTarget)

    const ticket = {
      id: crypto.randomUUID(),
      vehicle_address: String(formData.get('vehicleAddress') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      contact_info: String(formData.get('contactInfo') || '').trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }

    try {
      await createClientTicket({
        vehicle_address: ticket.vehicle_address,
        description: ticket.description,
        contact_info: ticket.contact_info,
      })
    } catch (error) {
      const existingTickets = JSON.parse(
        window.localStorage.getItem('hmm:tickets') || '[]'
      )

      window.localStorage.setItem(
        'hmm:tickets',
        JSON.stringify([ticket, ...existingTickets])
      )

      if (error instanceof Error) {
        setMessage(error.message)
      }
    }

    setSaving(false)
    router.push(user.role === 'mechanic' ? '/dashboard/mechanic' : '/dashboard')
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Vehicle intake
        </p>
        <h1 className="mt-3 text-4xl font-bold">Create a service request.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Share the vehicle location, issue, and best contact details so a
          mechanic can review and respond.
        </p>

        <form
          onSubmit={saveTicket}
          className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6"
        >
          <label className="block text-sm font-medium">
            Vehicle address or location
            <input
              required
              name="vehicleAddress"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="1234 Main St, Houston, TX 77002"
            />
          </label>

          <label className="mt-5 block text-sm font-medium">
            Description of the issue
            <textarea
              required
              name="description"
              rows={5}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Truck will crank but not start. Battery was replaced last month."
            />
          </label>

          <label className="mt-5 block text-sm font-medium">
            Contact information
            <textarea
              required
              name="contactInfo"
              rows={3}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Name, phone, email, and best time to reach you."
            />
          </label>

          {message ? (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {message} Saved locally until the database is connected.
            </p>
          ) : null}

          <button
            disabled={saving}
            className="mt-6 rounded-md bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-700 disabled:opacity-70"
          >
            {saving ? 'Creating...' : 'Create ticket'}
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
