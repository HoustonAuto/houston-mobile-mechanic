'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)

    const existingUser = window.localStorage.getItem('hmm:user')
    const fallbackUser = existingUser
      ? JSON.parse(existingUser)
      : { email, role: 'client' }
    const user = await syncLoginToSupabase(email, password, fallbackUser)

    window.localStorage.setItem('hmm:user', JSON.stringify(user))
    setLoading(false)
    router.push(user.role === 'mechanic' ? '/dashboard/mechanic' : '/dashboard')
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <form
        onSubmit={handleLogin}
        className="mx-auto mt-12 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-slate-950">Welcome back</h1>
        <p className="mt-3 text-sm text-slate-600">
          Log in to continue to your repair dashboard.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-800">
          Email
          <input
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-800">
          Password
          <input
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          disabled={loading}
          className="mt-6 w-full rounded-md bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-600">
          New here?{' '}
          <Link className="font-semibold text-cyan-700" href="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  )
}

async function syncLoginToSupabase(email, password, fallbackUser) {
  if (!supabase) {
    return fallbackUser
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    alert(error.message)
    return fallbackUser
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return {
    id: data.user.id,
    name: profile?.full_name || fallbackUser.name || '',
    email: data.user.email || email,
    phone: profile?.phone || fallbackUser.phone || '',
    role: profile?.role || fallbackUser.role || 'client',
  }
}
