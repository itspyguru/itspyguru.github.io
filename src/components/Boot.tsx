import { useEffect, useRef, useState } from 'react'
import { useOS } from '../store/os'

const LINES = [
  'Booting itspyguru_OS v3.0 …',
  'Loading kernel modules … ok',
  'Mounting /home/itspyguru/dev … ok',
  'Initializing Python 3.12 runtime … ok',
  'Starting FastAPI dev server :8000 … ok',
  'Spinning up AI agents (CrewAI · LangChain) … ok',
  'Installing dependencies … 1,240 packages … ok',
  'Connecting to GitHub @itspyguru … ok',
  'Running test suite … 142 passed … ok',
  'Compiling portfolio assets … ok',
  'Build passed. Launching workspace …',
]

export default function Boot() {
  const setBooted = useOS((s) => s.setBooted)
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const done = useRef(false)

  function reveal() {
    if (done.current) return
    done.current = true
    setFading(true)
    setTimeout(() => setBooted(true), 700)
  }

  useEffect(() => {
    if (idx >= LINES.length) { const t = setTimeout(reveal, 700); return () => clearTimeout(t) }
    const t = setTimeout(() => setIdx((i) => i + 1), 230 + Math.random() * 230)
    return () => clearTimeout(t)
  }, [idx])

  const pct = Math.round((idx / LINES.length) * 100)
  const shown = LINES.slice(Math.max(0, idx - 4), idx)

  return (
    <div className={'fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center p-margin-page transition-opacity duration-700 ' + (fading ? 'opacity-0' : '')}>
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="text-primary-fixed-dim font-terminal-bold text-3xl tracking-tighter matrix-glow">itspyguru<span className="text-outline">_OS</span></div>
          <div className="text-outline font-data-label text-data-label mt-2">v3.0 // developer workspace</div>
        </div>
        <div className="w-full h-3 bg-surface-container-low border border-primary-fixed-dim/30 overflow-hidden">
          <div className="h-full bg-primary-fixed-dim neon-glow-primary" style={{ width: pct + '%', transition: 'width .25s linear' }} />
        </div>
        <div className="flex justify-between mt-2 font-data-label text-data-label">
          <span className="text-outline">{pct >= 100 ? 'ready' : 'loading…'}</span>
          <span className="text-primary-fixed-dim">{pct}%</span>
        </div>
        <div className="mt-6 h-24 overflow-hidden font-terminal-code text-[12px] text-primary-fixed-dim/70 space-y-1">
          {shown.map((l, i) => (
            <p key={i} className={i === shown.length - 1 ? 'typing-cursor' : ''}><span className="text-outline">&gt;</span> {l}</p>
          ))}
        </div>
        <div className="text-center">
          <button onClick={reveal} className="mt-4 text-outline hover:text-primary-fixed text-data-label font-data-label border border-outline-variant/40 px-3 py-1 transition-all">[SKIP_BOOT]</button>
        </div>
      </div>
    </div>
  )
}
