import { useState } from 'react'
import { beep } from '../os/sound'

const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
const wins = (b: string[], p: string) => L.some((l) => l.every((i) => b[i] === p))
const full = (b: string[]) => b.every((x) => x)
function minimax(b: string[], pl: string): { s: number; i?: number } {
  if (wins(b, 'O')) return { s: 1 }; if (wins(b, 'X')) return { s: -1 }; if (full(b)) return { s: 0 }
  let best: { s: number; i?: number } = pl === 'O' ? { s: -2 } : { s: 2 }
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = pl; const r = minimax(b, pl === 'O' ? 'X' : 'O'); b[i] = ''; if (pl === 'O') { if (r.s > best.s) best = { s: r.s, i } } else { if (r.s < best.s) best = { s: r.s, i } } }
  return best
}

export default function TicTacToe() {
  const [b, setB] = useState<string[]>(Array(9).fill(''))
  const [msg, setMsg] = useState('you are X · click a cell · Esc quit')
  const result = wins(b, 'X') ? 'win' : wins(b, 'O') ? 'lose' : full(b) ? 'draw' : null
  function play(i: number) {
    if (b[i] || result) return
    const nb = b.slice(); nb[i] = 'X'; beep(520, 0.03)
    if (wins(nb, 'X')) { setB(nb); setMsg('YOU WIN'); return }
    if (full(nb)) { setB(nb); setMsg('DRAW'); return }
    const m = minimax(nb.slice(), 'O'); if (m.i != null) nb[m.i] = 'O'
    setB(nb)
    setMsg(wins(nb, 'O') ? 'CPU WINS' : full(nb) ? 'DRAW' : 'you are X · click a cell · Esc quit')
  }
  function again() { setB(Array(9).fill('')); setMsg('you are X · click a cell · Esc quit') }
  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {b.map((v, i) => (
          <button key={i} onClick={() => play(i)} className={'w-20 h-20 border border-primary-fixed-dim/30 text-3xl font-display-lg hover:bg-primary-fixed-dim/5 ' + (v === 'X' ? 'text-primary-fixed-dim' : 'text-error')}>{v}</button>
        ))}
      </div>
      <div className="text-data-label text-outline">
        {result ? <span className={result === 'win' ? 'text-primary-fixed-dim' : result === 'lose' ? 'text-error' : ''}>{msg} · <button onClick={again} className="text-primary-fixed-dim underline">play again</button></span> : msg}
      </div>
    </>
  )
}
