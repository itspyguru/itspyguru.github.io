import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
import { getBest, setBest } from './scores'

const PIECES = [
  { c: '#00e6e6', m: [[1, 1, 1, 1]] },
  { c: '#e6e600', m: [[1, 1], [1, 1]] },
  { c: '#b000f0', m: [[0, 1, 0], [1, 1, 1]] },
  { c: '#00e000', m: [[0, 1, 1], [1, 1, 0]] },
  { c: '#ff5555', m: [[1, 1, 0], [0, 1, 1]] },
  { c: '#4060ff', m: [[1, 0, 0], [1, 1, 1]] },
  { c: '#ffa000', m: [[0, 0, 1], [1, 1, 1]] },
]
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Tetris() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const bestRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, C = 10, R = 20, S = cv.width / C
    let grid: string[][] = Array.from({ length: R }, () => Array(C).fill(''))
    let m: number[][] = [], col = '#fff', px = 0, py = 0, score = 0, over = false, dropMs = 600, acc = 0, last = performance.now()
    const collide = (x: number, y: number, mm: number[][]) => {
      for (let r = 0; r < mm.length; r++) for (let c = 0; c < mm[r].length; c++) if (mm[r][c]) { const nx = x + c, ny = y + r; if (nx < 0 || nx >= C || ny >= R || (ny >= 0 && grid[ny][nx])) return true }
      return false
    }
    const newPiece = () => { const p = PIECES[(Math.random() * PIECES.length) | 0]; m = p.m.map((r) => r.slice()); col = p.c; px = ((C - m[0].length) / 2) | 0; py = 0; if (collide(px, py, m)) { over = true; const b = setBest('tetris', score); if (bestRef.current) bestRef.current.textContent = String(b) } }
    const merge = () => m.forEach((row, r) => row.forEach((v, c) => { if (v && py + r >= 0) grid[py + r][px + c] = col }))
    const clearLines = () => {
      let n = 0; grid = grid.filter((row) => { if (row.every((c) => c)) { n++; return false } return true })
      while (grid.length < R) grid.unshift(Array(C).fill(''))
      if (n) { score += [0, 40, 100, 300, 1200][n]; if (scoreRef.current) scoreRef.current.textContent = String(score); dropMs = Math.max(120, 600 - Math.floor(score / 400) * 60); beep(600, 0.04) }
    }
    const rotate = () => { const nm = m[0].map((_, i) => m.map((r) => r[i]).reverse()); if (!collide(px, py, nm)) m = nm }
    const step = () => { if (collide(px, py + 1, m)) { merge(); clearLines(); newPiece() } else py++ }
    const cell = (x: number, y: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x * S + 1, y * S + 1, S - 2, S - 2) }
    const draw = () => {
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, cv.width, cv.height)
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (grid[r][c]) cell(c, r, grid[r][c])
      m.forEach((row, r) => row.forEach((v, c) => { if (v) cell(px + c, py + r, col) }))
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = accent(); ctx.font = '18px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER · ' + score, cv.width / 2, cv.height / 2) }
    }
    const key = (e: KeyboardEvent) => {
      if (over) return; const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') { if (!collide(px - 1, py, m)) px-- }
      else if (k === 'arrowright' || k === 'd') { if (!collide(px + 1, py, m)) px++ }
      else if (k === 'arrowdown' || k === 's') step()
      else if (k === 'arrowup' || k === 'w') rotate()
      else if (k === ' ') { while (!collide(px, py + 1, m)) py++; step() }
      else return
      if (k.startsWith('arrow') || k === ' ') e.preventDefault(); draw()
    }
    document.addEventListener('keydown', key); newPiece()
    let raf = 0
    const loop = (t: number) => { const dt = t - last; last = t; acc += dt; if (!over && acc > dropMs) { acc = 0; step() } draw(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={200} height={400} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline">score: <span ref={scoreRef} className="text-primary-fixed-dim">0</span> · best: <span ref={bestRef} className="text-primary-fixed-dim">{getBest('tetris')}</span> · ←→ ↑rotate ↓ space · Esc</div>
    </>
  )
}
