'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log(data)

    if (error) {
      alert(error.message)
    } else {
      alert('Account created! Check your email.')
    }
  }

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold">
        Login
      </h1>

      <div className="mt-6 flex flex-col gap-4 max-w-md">

        <input
          className="border p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="bg-black text-white p-3 rounded"
        >
          Sign Up
        </button>

      </div>
    </div>
  )
}