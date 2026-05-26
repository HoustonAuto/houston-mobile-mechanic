"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("client")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)

    const user = {
      name,
      email,
      phone,
      role,
      signedUpAt: new Date().toISOString(),
    }

    const signedUp = await syncSignupToSupabase(user, password)

    window.localStorage.setItem("hmm:user", JSON.stringify(user))
    setLoading(false)
    router.push(signedUp.role === "mechanic" ? "/dashboard/mechanic" : "/onboarding")
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_0.85fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Houston Mobile Mechanic
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Get roadside repairs moving faster.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Create an account, tell us what you drive, and send the first repair
            request straight into your dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          className="rounded-lg border border-slate-800 bg-white p-6 text-slate-950 shadow-xl"
        >
          <h2 className="text-2xl font-semibold">Create account</h2>

          <div className="mt-6 space-y-4">
            <input
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <input
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  role === "client"
                    ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole("mechanic")}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  role === "mechanic"
                    ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Mechanic
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-md bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-700 disabled:opacity-70"
            >
              {loading ? "Creating..." : "Continue to onboarding"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-semibold text-cyan-700" href="/login">
              Log in
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}

async function syncSignupToSupabase(user, password) {
  if (!supabase) {
    return user
  }

  const { data, error } = await supabase.auth.signUp({
    email: user.email,
    password,
  })

  if (error) {
    alert(error.message)
    return user
  }

  await supabase.from("profiles").insert({
    id: data.user?.id,
    full_name: user.name,
    phone: user.phone,
    role: user.role,
  })

  return { ...user, id: data.user?.id }
}
