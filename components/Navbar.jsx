import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex gap-6">

      <Link href="/">
        Home
      </Link>

      <Link href="/services">
        Services
      </Link>

      <Link href="/login">
        Login
      </Link>

      <Link href="/signup">
        Signup
      </Link>

    </nav>
  )
}