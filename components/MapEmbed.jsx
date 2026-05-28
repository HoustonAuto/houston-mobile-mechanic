export default function MapEmbed({ address, title = 'Map location' }) {
  if (!address) {
    return null
  }

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <iframe
        title={title}
        src={mapUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-56 w-full"
      />
    </div>
  )
}
