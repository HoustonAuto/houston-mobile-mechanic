'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendRecovery(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (!supabase) {
      setMessage('Password recovery needs Supabase to be configured.')
      setLoading(false)
      return
    }

    const redirectTo = `${window.location.origin}/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)
    setMessage(
      error
        ? error.message
        : 'Password recovery email sent. Check your inbox.'
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <form
        onSubmit={sendRecovery}
        className="mx-auto mt-12 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-slate-950">
          Recover password
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Enter your email and we will send a password reset link.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-800">
          Email
          <input
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <button
          disabled={loading}
          className="mt-6 w-full rounded-md bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {loading ? 'Sending...' : 'Send recovery email'}
        </button>

        {message ? (
          <p className="mt-4 rounded-md bg-cyan-50 p-3 text-sm text-cyan-900">
            {message}
          </p>
        ) : null}

        <p className="mt-5 text-center text-sm">
          <Link className="font-semibold text-cyan-700" href="/login">
            Back to login
          </Link>
        </p>
      </form>
    </main>
  )
}
