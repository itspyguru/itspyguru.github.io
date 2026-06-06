import { useState } from 'react'
import { sfx } from '../os/sound'

const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const wins = (b: string[], p: string) => L.some((l) => l.every((i) => b[i] === p))
const winLine = (b: string[]) => L.find((l) => b[l[0]] && l.every((i) => b[i] === b[l[0]]))
const full = (b: string[]) => b.every((x) => x)
function minimax(b: string[], pl: string): { s: number; i?: number } {
  if (wins(b, 'O')) return { s: 1 }; if (wins(b, 'X')) return { s: -1 }; if (full(b)) return { s: 0 }
  let best: { s: number; i?: number } = pl === 'O' ? { s: -2 } : { s: 2 }
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = pl; const r = minimax(b, pl === 'O' ? 'X' : 'O'); b[i] = ''; if (pl === 'O') { if (r.s > best.s) best = { s: r.s, i } } else { if (r.s < best.s) best = { s: r.s, i } } }
  return best
}

function Mark({ v }: { v: string }) {
  if (v === 'X') return (
    <svg viewBox="0 0 40 40" className="w-12 h-12 text-primary-fixed-dim" style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}>
      <line x1="9" y1="9" x2="31" y2="31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="ttt-stroke" />
      <line x1="31" y1="9" x2="9" y2="31" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="ttt-stroke" style={{ animationDelay: '.1s' }} />
    </svg>
  )
  if (v === 'O') return (
    <svg viewBox="0 0 40 40" className="w-12 h-12 text-error" style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}>
      <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="4" className="ttt-stroke" />
    </svg>
  )
  return null
}

export default function TicTacToe() {
  const [b, setB] = useState<string[]>(Array(9).fill(''))
  const line = winLine(b)
  const result = wins(b, 'X') ? 'win' : wins(b, 'O') ? 'lose' : full(b) ? 'draw' : null
  function play(i: number) {
    if (b[i] || result) return
    const nb = b.slice(); nb[i] = 'X'; sfx.hit()
    if (wins(nb, 'X')) { setB(nb); sfx.clear(); return }
    if (full(nb)) { setB(nb); return }
    const m = minimax(nb.slice(), 'O'); if (m.i != null) nb[m.i] = 'O'
    setB(nb); if (wins(nb, 'O')) sfx.lose()
  }
  const again = () => setB(Array(9).fill(''))
  const msg = result === 'win' ? 'YOU WIN 🎉' : result === 'lose' ? 'CPU WINS' : result === 'draw' ? 'DRAW' : 'you are X'
  return (
    <div className="bg-surface-container-lowest border border-primary-fixed-dim/40 rounded p-4">
      <div className="grid grid-cols-3 gap-2">
        {b.map((v, i) => (
          <button key={i} onClick={() => play(i)} disabled={!!v || !!result}
            className={'w-20 h-20 rounded flex items-center justify-center border transition-colors ' + (line && line.includes(i) ? 'border-primary-fixed-dim bg-primary-fixed-dim/15 shadow-[0_0_14px_rgb(var(--accent-rgb)_/_0.4)]' : 'border-outline-variant/30 bg-black/30 hover:bg-primary-fixed-dim/5')}>
            <Mark v={v} />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-data-label font-data-label">
        <span className={result === 'win' ? 'text-primary-fixed-dim' : result === 'lose' ? 'text-error' : 'text-outline'}>{msg}</span>
        <button onClick={again} className="border border-primary-fixed-dim/40 px-3 py-1 text-[11px] text-primary-fixed-dim hover:bg-primary-fixed-dim/10">{result ? 'PLAY AGAIN' : 'RESET'}</button>
      </div>
    </div>
  )
}
