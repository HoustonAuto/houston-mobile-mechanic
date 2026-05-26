import Image from 'next/image'
import Link from 'next/link'
import heroImage from '../image1.jpg'

const values = [
  {
    title: 'Integrity',
    text: 'Honest assessments and transparent pricing.',
  },
  {
    title: 'Reliability',
    text: 'On time, prepared, and done right.',
  },
  {
    title: 'Convenience',
    text: 'No waiting rooms. No towing. We come to you.',
  },
  {
    title: 'Quality Workmanship',
    text: 'Repairs performed with care and attention to detail.',
  },
  {
    title: 'Customer First',
    text: 'Clear communication and long-term trust.',
  },
]

const services = [
  'Diagnostics',
  'Brake Repair',
  'Battery Replacement',
  'Oil Changes',
  'Alternators',
  'Starters',
  'Tune-Ups',
  'Suspension',
  'Check Engine Light',
  'Pre-Purchase Inspections',
]

const reviews = [
  {
    name: 'Marisol R.',
    stars: 5,
    text: 'Showed up on time, explained the issue clearly, and had my car running the same afternoon.',
  },
  {
    name: 'Kevin T.',
    stars: 5,
    text: 'Fair price, no pressure, and I did not have to tow my truck across town.',
  },
  {
    name: 'Angela M.',
    stars: 4,
    text: 'Easy scheduling and solid communication from start to finish.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative min-h-[620px] overflow-hidden bg-slate-950 text-white">
        <Image
          src={heroImage}
          alt="Mobile mechanic service in Houston"
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />

        <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col justify-center px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Houston Mobile Mechanic
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-tight text-white md:text-7xl">
            Auto repair that comes to you.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Diagnostics, repairs, and maintenance across Houston without the
            shop wait.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-md bg-cyan-500 px-6 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Request Service
            </Link>
            <Link
              href="#services"
              className="rounded-md border border-white/40 px-6 py-3 text-center font-semibold text-white hover:bg-white/10"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Our Mission
            </p>
            <h2 className="mt-3 text-3xl font-bold">Mission Statement</h2>
          </div>
          <p className="text-xl leading-9 text-slate-700">
            To provide Houston drivers with honest, convenient, and dependable
            mobile automotive services that save time and eliminate repair shop
            hassle.
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            Our Values
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-lg border border-slate-200 p-5"
              >
                <h3 className="font-bold">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {value.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Services
            </p>
            <h2 className="mt-3 text-3xl font-bold">What we handle</h2>
          </div>
          <Link
            href="/signup"
            className="rounded-md bg-slate-950 px-5 py-3 text-center font-semibold text-white hover:bg-slate-800"
          >
            Book a mobile mechanic
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {services.map((service) => (
            <div
              key={service}
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm font-semibold shadow-sm"
            >
              {service}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Customer Reviews
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.name}
                className="rounded-lg border border-white/10 bg-white/5 p-6"
              >
                <p className="text-sm font-semibold text-amber-300">
                  {review.stars}/5 stars
                </p>
                <p className="mt-4 leading-7 text-slate-200">
                  &quot;{review.text}&quot;
                </p>
                <p className="mt-5 font-semibold">{review.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
