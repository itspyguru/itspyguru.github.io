import { useEffect, useRef, useState } from 'react'

type Station = { name: string; genre?: string; url: string }
// SomaFM — listener-supported internet radio, https streams
const BUILTIN: Station[] = [
  { name: 'DEF CON Radio', genre: 'hacker / electronic', url: 'https://ice2.somafm.com/defcon-128-mp3' },
  { name: 'Groove Salad', genre: 'ambient / downtempo', url: 'https://ice2.somafm.com/groovesalad-128-mp3' },
  { name: 'Fluid', genre: 'lo-fi hip hop', url: 'https://ice2.somafm.com/fluid-128-mp3' },
  { name: 'Secret Agent', genre: 'spy jazz / lounge', url: 'https://ice2.somafm.com/secretagent-128-mp3' },
  { name: 'Sonic Universe', genre: 'avant jazz', url: 'https://ice2.somafm.com/sonicuniverse-128-mp3' },
  { name: 'Indie Pop Rocks', genre: 'indie', url: 'https://ice2.somafm.com/indiepop-128-mp3' },
  { name: 'Underground 80s', genre: 'synthpop / new wave', url: 'https://ice2.somafm.com/u80s-128-mp3' },
  { name: 'Drone Zone', genre: 'atmospheric space', url: 'https://ice2.somafm.com/dronezone-128-mp3' },
  { name: 'Beat Blender', genre: 'deep house / techno', url: 'https://ice2.somafm.com/beatblender-128-mp3' },
  { name: 'Synphaera', genre: 'space music', url: 'https://ice2.somafm.com/synphaera-128-mp3' },
  { name: 'Lush', genre: 'vocal chillout', url: 'https://ice2.somafm.com/lush-128-mp3' },
]
const KEY = 'itspyguru_radio'

export default function Radio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [custom, setCustom] = useState<Station[]>([])
  const [idx, setIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(false)
  const [vol, setVol] = useState(0.8)
  const [url, setUrl] = useState('')

  useEffect(() => { try { setCustom(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch {} }, [])
  useEffect(() => () => { const a = audioRef.current; if (a) { a.pause(); a.src = '' } }, []) // stop when window closes
  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol }, [vol])

  const all = [...BUILTIN, ...custom]
  const save = (c: Station[]) => { try { localStorage.setItem(KEY, JSON.stringify(c)) } catch {} }

  function play(st: Station, i: number) {
    const a = audioRef.current!; setErr(false)
    if (i === idx && playing) { a.pause(); setPlaying(false); return }
    if (i !== idx) { a.src = st.url; setIdx(i) }
    setLoading(true)
    a.play().then(() => { setPlaying(true); setLoading(false) }).catch(() => { setErr(true); setLoading(false); setPlaying(false) })
  }
  function addCustom(e: React.FormEvent) {
    e.preventDefault()
    const u = url.trim(); if (!u) return
    let name = 'Custom'; try { name = 'Custom · ' + new URL(u).hostname.replace(/^www\./, '') } catch { name = 'Custom · ' + u.slice(0, 22) }
    const st: Station = { name, genre: 'custom stream', url: u }
    const next = [...custom, st]; setCustom(next); save(next); setUrl('')
    play(st, BUILTIN.length + next.length - 1)
  }
  function removeCustom(ci: number) {
    const removedIdx = BUILTIN.length + ci
    const next = custom.filter((_, k) => k !== ci); setCustom(next); save(next)
    if (idx === removedIdx) { audioRef.current?.pause(); setIdx(-1); setPlaying(false) }
    else if (idx > removedIdx) setIdx(idx - 1)
  }

  const cur = idx >= 0 ? all[idx] : null
  return (
    <div className="p-3 w-[344px]">
      <audio ref={audioRef} onPlaying={() => { setPlaying(true); setLoading(false) }} onPause={() => setPlaying(false)} onWaiting={() => setLoading(true)} onError={() => { if (idx >= 0) { setErr(true); setPlaying(false) } }} />
      <div className="border border-primary-fixed-dim/30 bg-black/40 p-3 mb-3 flex items-center gap-3">
        <button onClick={() => cur ? play(cur, idx) : play(all[0], 0)} className="w-11 h-11 shrink-0 border border-primary-fixed-dim/50 text-primary-fixed-dim flex items-center justify-center hover:bg-primary-fixed-dim/10">
          <span className="material-symbols-outlined">{playing ? 'pause' : 'play_arrow'}</span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-primary-fixed-dim font-data-label truncate">{cur ? cur.name : 'select a station'}</div>
          <div className="text-[9px] text-outline truncate">{err ? 'stream unavailable — try another' : loading ? 'buffering…' : cur ? (playing ? 'on air · ' + (cur.genre || '') : 'paused') : 'itspyguru radio'}</div>
        </div>
        <div className="flex items-end gap-0.5 h-6">{[0, 1, 2, 3].map((i) => <span key={i} className={'w-1 bg-primary-fixed-dim ' + (playing ? 'eq-bar' : '')} style={playing ? { animationDelay: i * 0.15 + 's' } : { height: 4 }} />)}</div>
      </div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="material-symbols-outlined text-sm text-outline">volume_up</span>
        <input type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => setVol(+e.target.value)} className="flex-1 accent-primary-fixed-dim" />
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {all.map((s, i) => {
          const isCustom = i >= BUILTIN.length
          return (
            <div key={s.name + i} className={'group w-full flex items-center justify-between px-2 py-1.5 border ' + (i === idx ? 'border-primary-fixed-dim/50 bg-primary-fixed-dim/5' : 'border-outline-variant/20 hover:bg-primary-fixed-dim/5')}>
              <button onClick={() => play(s, i)} className="min-w-0 flex-1 text-left">
                <span className="text-[11px] text-on-surface font-data-label block truncate">{s.name}</span>
                <span className="text-[9px] text-outline">{s.genre}</span>
              </button>
              {i === idx && playing && <span className="material-symbols-outlined text-primary-fixed-dim text-sm mr-1">graphic_eq</span>}
              {isCustom && <button onClick={() => removeCustom(i - BUILTIN.length)} title="remove" className="material-symbols-outlined text-outline hover:text-error text-sm">close</button>}
            </div>
          )
        })}
      </div>
      <form onSubmit={addCustom} className="flex items-center gap-2 mt-3">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="paste a stream URL (mp3/aac)…" className="flex-1 bg-black/40 border border-outline-variant/30 px-2 py-1.5 text-[11px] text-primary placeholder:text-outline/40 focus:ring-0 focus:border-primary-fixed-dim/40" autoComplete="off" spellCheck={false} />
        <button type="submit" title="add station" className="border border-primary-fixed-dim/40 px-2 py-1.5 text-primary-fixed-dim hover:bg-primary-fixed-dim/10"><span className="material-symbols-outlined text-sm">add</span></button>
      </form>
      <p className="text-[9px] text-outline/70 font-data-label mt-2">11 stations via SomaFM · add your own stream (incl. news) · plays in the background</p>
    </div>
  )
}
