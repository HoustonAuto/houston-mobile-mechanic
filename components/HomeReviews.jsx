'use client'

import { useEffect, useState } from 'react'
import { listPublishedReviews } from '@/lib/serviceRequests'

const fallbackReviews = [
  {
    id: 'marisol',
    client_name: 'Marisol R.',
    rating: 5,
    comment:
      'Showed up on time, explained the issue clearly, and had my car running the same afternoon.',
  },
  {
    id: 'kevin',
    client_name: 'Kevin T.',
    rating: 5,
    comment: 'Fair price, no pressure, and I did not have to tow my truck across town.',
  },
  {
    id: 'angela',
    client_name: 'Angela M.',
    rating: 4,
    comment: 'Easy scheduling and solid communication from start to finish.',
  },
]

export default function HomeReviews() {
  const [reviews, setReviews] = useState(fallbackReviews)

  useEffect(() => {
    let active = true

    async function loadReviews() {
      const databaseReviews = await listPublishedReviews()
      const localReviews = JSON.parse(
        window.localStorage.getItem('hmm:reviews') || '[]'
      )
      const nextReviews = databaseReviews.length
        ? databaseReviews
        : localReviews.length
          ? localReviews
          : fallbackReviews

      if (active) {
        setReviews(nextReviews)
      }
    }

    loadReviews()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {reviews.slice(0, 3).map((review) => (
        <article
          key={review.id}
          className="rounded-lg border border-white/10 bg-white/5 p-6"
        >
          <p className="text-sm font-semibold text-amber-300">
            {review.rating}/5 stars
          </p>
          <p className="mt-4 leading-7 text-slate-200">
            &quot;{review.comment}&quot;
          </p>
          <p className="mt-5 font-semibold">{review.client_name}</p>
        </article>
      ))}
    </div>
  )
}
