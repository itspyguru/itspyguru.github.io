import { useEffect, useState } from 'react'

const VARANASI = { lat: 25.32, lon: 82.99, name: 'Varanasi, IN' }

export default function Maps() {
  const [c, setC] = useState<{ lat: number; lon: number; name?: string }>(VARANASI)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  function locate() {
    setErr('')
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      (p) => setC({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' }),
      () => setErr('location unavailable'),
      { timeout: 6000 },
    )
  }
  useEffect(() => { locate() }, [])

  function search(e: React.FormEvent) {
    e.preventDefault(); const name = q.trim(); if (!name) return; setErr('')
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`)
      .then((r) => r.json())
      .then((d) => { const r = d.results && d.results[0]; if (r) setC({ lat: r.latitude, lon: r.longitude, name: r.name + (r.country_code ? ', ' + r.country_code : '') }); else setErr('place not found') })
      .catch(() => setErr('search failed'))
  }

  const dlon = 0.06, dlat = 0.045
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${c.lon - dlon}%2C${c.lat - dlat}%2C${c.lon + dlon}%2C${c.lat + dlat}&layer=mapnik&marker=${c.lat}%2C${c.lon}`
  const link = `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=13/${c.lat}/${c.lon}`

  return (
    <div className="p-3 w-[400px]">
      <form onSubmit={search} className="flex items-center gap-2 mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search a place…" autoComplete="off"
          className="flex-1 bg-black/40 border border-outline-variant/30 px-2 py-1.5 text-[11px] text-primary placeholder:text-outline/40 focus:ring-0 focus:border-primary-fixed-dim/40" />
        <button type="submit" title="Search" className="border border-primary-fixed-dim/40 px-2 py-1.5 text-primary-fixed-dim hover:bg-primary-fixed-dim/10"><span className="material-symbols-outlined text-sm">search</span></button>
        <button type="button" onClick={locate} title="My location" className="border border-outline-variant/40 px-2 py-1.5 text-outline hover:text-primary-fixed"><span className="material-symbols-outlined text-sm">my_location</span></button>
      </form>
      {err && <div className="text-error text-[10px] font-data-label mb-1">{err}</div>}
      <iframe title="map" src={src} loading="lazy" className="w-full border border-primary-fixed-dim/40 bg-black" style={{ height: 300 }} />
      <div className="flex justify-between items-center mt-1.5 text-[9px] text-outline font-data-label">
        <span className="flex items-center gap-1 truncate"><span className="material-symbols-outlined text-xs text-primary-fixed-dim">location_on</span>{c.name || `${c.lat.toFixed(3)}, ${c.lon.toFixed(3)}`}</span>
        <a href={link} target="_blank" rel="noopener" className="text-primary-fixed-dim hover:underline shrink-0">open larger ↗</a>
      </div>
      <p className="text-[8px] text-outline/60 font-data-label mt-1.5">map · openstreetmap.org</p>
    </div>
  )
}
