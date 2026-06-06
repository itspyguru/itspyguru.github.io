import { useEffect, useRef, useState } from 'react'
import { beep } from '../os/sound'

export default function Guess() {
  const secret = useRef(1 + ((Math.random() * 100) | 0))
  const [val, setVal] = useState('')
  const [lines, setLines] = useState<{ t: string; c: string }[]>([])
  const [done, setDone] = useState(false)
  const tries = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const g = parseInt(val, 10); setVal('')
    if (isNaN(g)) { setLines((l) => [...l, { t: 'enter a number 1–100', c: 'text-error' }]); return }
    tries.current++
    if (g === secret.current) { beep(880, 0.08); setLines((l) => [...l, { t: `correct! 🎉 ${secret.current} in ${tries.current} tries`, c: 'text-primary-fixed-dim' }]); setDone(true) }
    else setLines((l) => [...l, { t: `${g} → ${g < secret.current ? 'higher ↑' : 'lower ↓'}`, c: 'text-tertiary-fixed-dim' }])
  }
  function again() { secret.current = 1 + ((Math.random() * 100) | 0); tries.current = 0; setLines([]); setDone(false); setTimeout(() => inputRef.current?.focus(), 20) }

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed-dim/40 p-6 w-[min(420px,92vw)]">
      <h3 className="text-terminal-bold text-primary-fixed-dim mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-base">casino</span> NUMBER GUESS</h3>
      <p className="text-[11px] text-outline font-data-label mb-3">I picked a number from 1–100. Guess it.</p>
      <div className="font-terminal-code text-[12px] space-y-1 mb-3 max-h-40 overflow-y-auto">
        {lines.map((l, i) => <div key={i} className={l.c}>{l.t}</div>)}
      </div>
      {done ? (
        <button onClick={again} className="border border-primary-fixed-dim/40 px-4 py-1.5 text-[11px] font-data-label text-primary-fixed-dim hover:bg-primary-fixed-dim/10">PLAY AGAIN</button>
      ) : (
        <form onSubmit={submit} className="flex items-center gap-2">
          <span className="text-primary-fixed-dim">&gt;</span>
          <input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)} type="number" className="flex-1 bg-black/40 border border-primary-fixed-dim/30 px-3 py-2 text-terminal-code text-primary focus:ring-0 focus:border-primary-fixed-dim" placeholder="1–100" autoComplete="off" />
        </form>
      )}
      <p className="text-[10px] text-outline font-data-label mt-3">Esc to quit</p>
    </div>
  )
}
