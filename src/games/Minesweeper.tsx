import { useState } from 'react'
import { beep } from '../os/sound'

const N = 9, MINES = 10
type Cell = { m: boolean; r: boolean; f: boolean; c: number }
const NUM_COLOR = ['', '#4d8bff', '#00e000', '#ff5555', '#b080ff', '#ffa000', '#00d8ff', '#ff5599', '#cccccc']

function build(): Cell[][] {
  const g: Cell[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ m: false, r: false, f: false, c: 0 })))
  let placed = 0
  while (placed < MINES) { const r = (Math.random() * N) | 0, c = (Math.random() * N) | 0; if (!g[r][c].m) { g[r][c].m = true; placed++ } }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (g[r][c].m) continue
    let n = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < N && nc >= 0 && nc < N && g[nr][nc].m) n++ }
    g[r][c].c = n
  }
  return g
}

export default function Minesweeper() {
  const [grid, setGrid] = useState(build)
  const [over, setOver] = useState<null | 'win' | 'lose'>(null)
  const flags = grid.flat().filter((c) => c.f).length

  function reveal(r: number, c: number) {
    if (over || grid[r][c].r || grid[r][c].f) return
    const g = grid.map((row) => row.map((x) => ({ ...x })))
    if (g[r][c].m) { g.forEach((row) => row.forEach((x) => { if (x.m) x.r = true })); setGrid(g); setOver('lose'); beep(120, 0.18, 'sawtooth', 0.05); return }
    const stack = [[r, c]]
    while (stack.length) {
      const [y, x] = stack.pop()!
      if (y < 0 || y >= N || x < 0 || x >= N || g[y][x].r || g[y][x].m) continue
      g[y][x].r = true
      if (g[y][x].c === 0) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) stack.push([y + dr, x + dc])
    }
    setGrid(g); beep(660, 0.02)
    if (g.flat().every((x) => x.m || x.r)) { setOver('win'); beep(880, 0.1) }
  }
  function flag(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault()
    if (over || grid[r][c].r) return
    setGrid(grid.map((row, ri) => row.map((x, ci) => (ri === r && ci === c ? { ...x, f: !x.f } : x))))
  }
  function reset() { setGrid(build()); setOver(null) }

  return (
    <div className="bg-surface-container-lowest border border-primary-fixed-dim/40 p-4">
      <div className="flex justify-between items-center mb-2 text-data-label font-data-label">
        <span className="text-outline">💣 {MINES - flags}</span>
        <span className={over === 'win' ? 'text-primary-fixed-dim' : over === 'lose' ? 'text-error' : 'text-outline'}>{over === 'win' ? 'CLEARED 🎉' : over === 'lose' ? 'BOOM 💥' : 'minesweeper'}</span>
        <button onClick={reset} className="material-symbols-outlined text-base text-outline hover:text-primary-fixed">refresh</button>
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${N}, 26px)` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={r + '-' + c} onClick={() => reveal(r, c)} onContextMenu={(e) => flag(e, r, c)}
            className={'w-[26px] h-[26px] text-[13px] font-terminal-bold flex items-center justify-center border ' + (cell.r ? 'border-outline-variant/20 bg-black/40' : 'border-outline-variant/40 bg-surface-container-high hover:bg-primary-fixed-dim/10')}
            style={{ color: cell.r && cell.c ? NUM_COLOR[cell.c] : undefined }}>
            {cell.r ? (cell.m ? '💣' : cell.c || '') : cell.f ? '🚩' : ''}
          </button>
        )))}
      </div>
      <p className="text-[10px] text-outline font-data-label mt-3">click to reveal · right-click to flag · Esc to quit</p>
    </div>
  )
}
