import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-center gap-3 bg-slate-950 px-4 py-4 shadow">

      <Link
        href="/"
        className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        Home
      </Link>

      <Link
        href="/login"
        className="rounded-md border border-cyan-400 px-4 py-2 font-semibold text-cyan-100 hover:bg-cyan-400 hover:text-slate-950"
      >
        Login
      </Link>

      <Link
        href="/signup"
        className="rounded-md border border-cyan-400 px-4 py-2 font-semibold text-cyan-100 hover:bg-cyan-400 hover:text-slate-950"
      >
        Signup
      </Link>

    </nav>
  )
}
