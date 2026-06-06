import { useEffect, useRef, useState } from 'react'
import { beep } from '../os/sound'

const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Ship early, ship often, and iterate fast.',
  'Make it work, make it right, make it fast.',
  'Code is poetry written for machines and humans.',
  'Premature optimization is the root of all evil.',
]

export default function Typing() {
  const [target] = useState(() => SENTENCES[(Math.random() * SENTENCES.length) | 0])
  const [val, setVal] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const t0 = useRef(performance.now())
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const secs = (performance.now() - t0.current) / 1000
    const words = target.trim().split(/\s+/).length
    const wpm = Math.max(0, Math.round(words / (secs / 60)))
    let ok = 0; for (let i = 0; i < Math.min(val.length, target.length); i++) if (val[i] === target[i]) ok++
    const acc = Math.round((ok / target.length) * 100); beep(700, 0.05)
    setResult(`${wpm} WPM · ${acc}% accuracy · ${secs.toFixed(1)}s`)
  }
  function again() { setResult(null); setVal(''); t0.current = performance.now(); setTimeout(() => inputRef.current?.focus(), 20) }

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed-dim/40 p-6 w-[min(560px,92vw)]">
      <h3 className="text-terminal-bold text-primary-fixed-dim mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-base">keyboard</span> TYPING TEST</h3>
      <p className="font-terminal-code text-[13px] text-primary mb-4 leading-relaxed">{target}</p>
      {result ? (
        <div className="space-y-3">
          <div className="text-primary-fixed-dim font-terminal-bold text-lg">{result}</div>
          <button onClick={again} className="border border-primary-fixed-dim/40 px-4 py-1.5 text-[11px] font-data-label text-primary-fixed-dim hover:bg-primary-fixed-dim/10">RETRY</button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex items-center gap-2">
          <span className="text-primary-fixed-dim">&gt;</span>
          <input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)} className="flex-1 bg-black/40 border border-primary-fixed-dim/30 px-3 py-2 text-terminal-code text-primary focus:ring-0 focus:border-primary-fixed-dim" placeholder="start typing…" autoComplete="off" spellCheck={false} />
        </form>
      )}
      <p className="text-[10px] text-outline font-data-label mt-3">Enter to score · Esc to quit</p>
    </div>
  )
}
