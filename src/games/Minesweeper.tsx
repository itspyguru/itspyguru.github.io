import { useEffect, useRef, useState } from 'react'
import { sfx } from '../os/sound'

const N = 9, MINES = 10
type Cell = { m: boolean; r: boolean; f: boolean; c: number; d: number }
const NUM_COLOR = ['', '#4d8bff', '#28e060', '#ff5566', '#b760f0', '#ffa030', '#00d8ff', '#ff5599', '#cccccc']

function build(): Cell[][] {
  const g: Cell[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ m: false, r: false, f: false, c: 0, d: 0 })))
  let placed = 0
  while (placed < MINES) { const r = (Math.random() * N) | 0, c = (Math.random() * N) | 0; if (!g[r][c].m) { g[r][c].m = true; placed++ } }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (g[r][c].m) continue; let n = 0; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < N && nc >= 0 && nc < N && g[nr][nc].m) n++ } g[r][c].c = n }
  return g
}

export default function Minesweeper() {
  const [grid, setGrid] = useState(build)
  const [over, setOver] = useState<null | 'win' | 'lose'>(null)
  const [started, setStarted] = useState(false)
  const [time, setTime] = useState(0)
  const t0 = useRef(0)
  const flags = grid.flat().filter((c) => c.f).length
  useEffect(() => {
    if (!started || over) return
    const id = setInterval(() => setTime(Math.floor((Date.now() - t0.current) / 1000)), 250)
    return () => clearInterval(id)
  }, [started, over])

  function reveal(r: number, c: number) {
    if (over || grid[r][c].r || grid[r][c].f) return
    if (!started) { setStarted(true); t0.current = Date.now() }
    const g = grid.map((row) => row.map((x) => ({ ...x })))
    if (g[r][c].m) { g.forEach((row) => row.forEach((x) => { if (x.m) x.r = true })); setGrid(g); setOver('lose'); sfx.explode(); return }
    const stack = [[r, c]]; let ord = 0
    while (stack.length) {
      const [y, x] = stack.shift()!
      if (y < 0 || y >= N || x < 0 || x >= N || g[y][x].r || g[y][x].m || g[y][x].f) continue
      g[y][x].r = true; g[y][x].d = Math.min(0.26, ord++ * 0.012)
      if (g[y][x].c === 0) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) stack.push([y + dr, x + dc])
    }
    setGrid(g); sfx.bounce()
    if (g.flat().every((x) => x.m || x.r)) { setOver('win'); sfx.clear() }
  }
  function flag(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault(); if (over || grid[r][c].r) return
    setGrid(grid.map((row, ri) => row.map((x, ci) => (ri === r && ci === c ? { ...x, f: !x.f } : x))))
  }
  function reset() { setGrid(build()); setOver(null); setStarted(false); setTime(0) }
  const face = over === 'win' ? '😎' : over === 'lose' ? '💀' : '🙂'

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed-dim/40 rounded p-4">
      <div className="flex justify-between items-center mb-3 font-terminal-bold">
        <span className="text-data-label text-error tabular-nums">💣 {String(Math.max(0, MINES - flags)).padStart(2, '0')}</span>
        <button onClick={reset} className="text-2xl leading-none hover:scale-110 transition-transform" title="new game">{face}</button>
        <span className="text-data-label text-primary-fixed-dim tabular-nums">⏱ {String(time).padStart(3, '0')}</span>
      </div>
      <div className="grid gap-[3px] p-2 bg-black/40 rounded" style={{ gridTemplateColumns: `repeat(${N}, 28px)` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={r + '-' + c} onClick={() => reveal(r, c)} onContextMenu={(e) => flag(e, r, c)}
            className={'w-[28px] h-[28px] text-[14px] font-terminal-bold flex items-center justify-center rounded-sm transition-colors ' +
              (cell.r ? (cell.m ? 'bg-error/30 ' : 'bg-black/50 ') + 'cell-pop border border-white/5' : 'border-t border-l border-white/10 border-b border-r border-black/40 bg-surface-container-high hover:bg-primary-fixed-dim/15')}
            style={cell.r ? { color: cell.c ? NUM_COLOR[cell.c] : undefined, animationDelay: cell.d + 's' } : undefined}>
            {cell.r ? (cell.m ? '💣' : cell.c || '') : cell.f ? '🚩' : ''}
          </button>
        )))}
      </div>
      <div className="mt-3 text-data-label font-data-label text-center">
        {over === 'win' ? <span className="text-primary-fixed-dim">CLEARED in {time}s 🎉</span> : over === 'lose' ? <span className="text-error">BOOM 💥 — tap 💀 to retry</span> : <span className="text-outline">click reveal · right-click flag · Esc quit</span>}
      </div>
    </div>
  )
}
