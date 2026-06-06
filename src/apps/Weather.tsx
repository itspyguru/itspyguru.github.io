import { useEffect, useState } from 'react'

const VARANASI = { lat: 25.32, lon: 82.99, name: 'Varanasi' }
function desc(c: number): { l: string; i: string } {
  if (c === 0) return { l: 'Clear', i: 'clear_day' }
  if (c <= 2) return { l: 'Partly cloudy', i: 'partly_cloudy_day' }
  if (c === 3) return { l: 'Overcast', i: 'cloud' }
  if (c <= 48) return { l: 'Fog', i: 'foggy' }
  if (c <= 57) return { l: 'Drizzle', i: 'rainy' }
  if (c <= 67) return { l: 'Rain', i: 'rainy' }
  if (c <= 77) return { l: 'Snow', i: 'weather_snowy' }
  if (c <= 82) return { l: 'Showers', i: 'rainy' }
  if (c <= 86) return { l: 'Snow showers', i: 'weather_snowy' }
  return { l: 'Thunderstorm', i: 'thunderstorm' }
}
const day = (iso: string) => { try { return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' }) } catch { return iso.slice(5) } }

export default function Weather() {
  const [data, setData] = useState<any>(null)
  const [place, setPlace] = useState('')
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  function fetchAt(lat: number, lon: number, name: string) {
    setStatus('loading'); setPlace(name)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`)
      .then((r) => { if (!r.ok) throw 0; return r.json() })
      .then((d) => { setData(d); setStatus('ok') })
      .catch(() => setStatus('error'))
  }
  function locate() {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      (p) => fetchAt(p.coords.latitude, p.coords.longitude, 'Your location'),
      () => fetchAt(VARANASI.lat, VARANASI.lon, VARANASI.name),
      { timeout: 6000 },
    )
    else fetchAt(VARANASI.lat, VARANASI.lon, VARANASI.name)
  }
  useEffect(() => { locate() }, [])

  const cur = data?.current, dly = data?.daily
  const d = cur ? desc(cur.weather_code) : null
  return (
    <div className="p-4 w-[300px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-data-label text-primary-fixed-dim flex items-center gap-1 truncate"><span className="material-symbols-outlined text-sm">location_on</span>{place || '…'}</span>
        <button onClick={locate} title="Refresh" className="material-symbols-outlined text-sm text-outline hover:text-primary-fixed">refresh</button>
      </div>
      {status === 'loading' && <div className="py-8 text-center text-outline text-data-label">fetching weather…</div>}
      {status === 'error' && <div className="py-8 text-center text-error text-data-label">weather unavailable</div>}
      {status === 'ok' && cur && d && (
        <>
          <div className="flex items-center gap-3 py-2">
            <span className="material-symbols-outlined text-primary-fixed-dim text-5xl">{d.i}</span>
            <div>
              <div className="text-4xl font-display-lg text-primary-fixed-dim leading-none">{Math.round(cur.temperature_2m)}°</div>
              <div className="text-[11px] text-outline font-data-label">{d.l}</div>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-outline font-data-label border-y border-outline-variant/20 py-2 my-2">
            {dly && <span>H {Math.round(dly.temperature_2m_max[0])}° · L {Math.round(dly.temperature_2m_min[0])}°</span>}
            <span>💨 {Math.round(cur.wind_speed_10m)} km/h</span>
            <span>💧 {cur.relative_humidity_2m}%</span>
          </div>
          {dly && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center border border-outline-variant/20 py-2">
                  <div className="text-[9px] text-outline font-data-label">{day(dly.time[i])}</div>
                  <span className="material-symbols-outlined text-primary-fixed-dim text-lg my-0.5">{desc(dly.weather_code[i]).i}</span>
                  <div className="text-[9px] text-on-surface font-data-label">{Math.round(dly.temperature_2m_max[i])}°/{Math.round(dly.temperature_2m_min[i])}°</div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[8px] text-outline/60 font-data-label mt-3">data · open-meteo.com</p>
        </>
      )}
    </div>
  )
}
