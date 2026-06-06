import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, accent, panel } from './engine'

const PIECES = [
  { c: '#00e6e6', m: [[1, 1, 1, 1]] },
  { c: '#e6e600', m: [[1, 1], [1, 1]] },
  { c: '#b760f0', m: [[0, 1, 0], [1, 1, 1]] },
  { c: '#28e060', m: [[0, 1, 1], [1, 1, 0]] },
  { c: '#ff5566', m: [[1, 1, 0], [0, 1, 1]] },
  { c: '#4d80ff', m: [[1, 0, 0], [1, 1, 1]] },
  { c: '#ffa030', m: [[0, 0, 1], [1, 1, 1]] },
]
const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + f)), g = Math.min(255, Math.max(0, ((n >> 8) & 255) + f)), b = Math.min(255, Math.max(0, (n & 255) + f)); return `rgb(${r},${g},${b})` }

export default function Tetris() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, C = 10, R = 20, S = 20, BW = C * S, W = BW + 112, H = R * S, PX = BW + 12
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let grid: string[][] = [], m: number[][] = [], col = '#fff', px = 0, py = 0, nextI = 0
    let score = 0, lines = 0, level = 0, dropMs = 0.6, acc = 0, flash = 0, best = getBest('tetris'), so = { dx: 0, dy: 0 }

    const collide = (x: number, y: number, mm: number[][]) => { for (let r = 0; r < mm.length; r++) for (let c = 0; c < mm[r].length; c++) if (mm[r][c]) { const nx = x + c, ny = y + r; if (nx < 0 || nx >= C || ny >= R || (ny >= 0 && grid[ny][nx])) return true } return false }
    const spawn = () => { const p = PIECES[nextI]; nextI = (Math.random() * PIECES.length) | 0; m = p.m.map((r) => r.slice()); col = p.c; px = ((C - m[0].length) / 2) | 0; py = 0; if (collide(px, py, m)) { state = 'over'; best = setBest('tetris', score); sfx.lose() } }
    const reset = () => { grid = Array.from({ length: R }, () => Array(C).fill('')); score = 0; lines = 0; level = 0; dropMs = 0.6; acc = 0; flash = 0; nextI = (Math.random() * PIECES.length) | 0; spawn() }
    const start = () => { reset(); state = 'play'; sfx.start() }
    const merge = () => m.forEach((row, r) => row.forEach((v, c) => { if (v && py + r >= 0) grid[py + r][px + c] = col }))
    const clearLines = () => {
      let n = 0; const kept: string[][] = []
      for (let r = 0; r < R; r++) { if (grid[r].every((c) => c)) { n++; for (let c = 0; c < C; c++) parts.burst(c * S + S / 2, r * S + S / 2, { color: grid[r][c], count: 3, speed: 2.5, life: 0.5 }) } else kept.push(grid[r]) }
      while (kept.length < R) kept.unshift(Array(C).fill(''))
      grid = kept
      if (n) { score += [0, 40, 100, 300, 1200][n] * (level + 1); lines += n; level = Math.floor(lines / 10); dropMs = Math.max(0.08, 0.6 - level * 0.05); flash = 1; shake.kick(n >= 4 ? 9 : 4); sfx.clear() }
    }
    const lock = () => { merge(); clearLines(); spawn() }
    const rotate = () => { const nm = m[0].map((_, i) => m.map((r) => r[i]).reverse()); if (!collide(px, py, nm)) m = nm }
    const hardDrop = () => { while (!collide(px, py + 1, m)) py++; shake.kick(3); lock() }
    const ghostY = () => { let y = py; while (!collide(px, y + 1, m)) y++; return y }

    function cell(x: number, y: number, color: string) {
      const g = ctx.createLinearGradient(x, y, x, y + S); g.addColorStop(0, shade(color, 40)); g.addColorStop(1, shade(color, -30))
      ctx.fillStyle = g; ctx.fillRect(x + 1, y + 1, S - 2, S - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 1, y + 1, S - 2, 2)
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + 1, y + S - 3, S - 2, 2)
    }
    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt); if (flash > 0) flash -= dt * 3
      if (state !== 'play') return
      acc += dt; if (acc >= dropMs) { acc = 0; if (collide(px, py + 1, m)) lock(); else py++ }
    }
    function render() {
      const a = accent()
      ctx.fillStyle = '#070b07'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#0a0f0a'; ctx.fillRect(0, 0, BW, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; for (let i = 1; i < C; i++) { ctx.beginPath(); ctx.moveTo(i * S, 0); ctx.lineTo(i * S, H); ctx.stroke() } for (let i = 1; i < R; i++) { ctx.beginPath(); ctx.moveTo(0, i * S); ctx.lineTo(BW, i * S); ctx.stroke() }
      ctx.save(); ctx.translate(so.dx, so.dy)
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (grid[r][c]) cell(c * S, r * S, grid[r][c])
      if (state === 'play' || state === 'pause') {
        const gy = ghostY(); ctx.strokeStyle = col; ctx.globalAlpha = 0.3; m.forEach((row, r) => row.forEach((v, c) => { if (v) ctx.strokeRect(px * S + c * S + 2, gy * S + r * S + 2, S - 4, S - 4) })); ctx.globalAlpha = 1
        m.forEach((row, r) => row.forEach((v, c) => { if (v) cell((px + c) * S, (py + r) * S, col) }))
      }
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.25})`; ctx.fillRect(0, 0, BW, H) }
      parts.draw(ctx); ctx.restore()
      // panel
      ctx.textAlign = 'left'; ctx.font = '10px "JetBrains Mono", monospace'
      const stat = (label: string, val: string, y: number) => { ctx.fillStyle = '#7d8d7d'; ctx.fillText(label, PX, y); ctx.fillStyle = a; ctx.font = 'bold 16px "JetBrains Mono", monospace'; ctx.fillText(val, PX, y + 17); ctx.font = '10px "JetBrains Mono", monospace' }
      stat('SCORE', String(score), 18); stat('BEST', String(best), 58); stat('LEVEL', String(level), 98); stat('LINES', String(lines), 138)
      ctx.fillStyle = '#7d8d7d'; ctx.fillText('NEXT', PX, 178)
      const np = PIECES[nextI]; ctx.save(); ctx.translate(PX, 188); np.m.forEach((row, r) => row.forEach((v, c) => { if (v) cell(c * 16, r * 16, np.c) })); ctx.restore()
      if (state === 'start') panel(ctx, W, H, 'TETRIS', 'best ' + best, 'press SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, 'GAME OVER', `score ${score} · best ${best}`, 'press R to retry')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state === 'play') hardDrop(); else if (state === 'start' || state === 'over') start(); return }
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; return }
      if (k === 'r') { if (state !== 'start') start(); return }
      if (state !== 'play') return
      if (k === 'arrowleft' || k === 'a') { if (!collide(px - 1, py, m)) px--; e.preventDefault() }
      else if (k === 'arrowright' || k === 'd') { if (!collide(px + 1, py, m)) px++; e.preventDefault() }
      else if (k === 'arrowdown' || k === 's') { if (!collide(px, py + 1, m)) py++; e.preventDefault() }
      else if (k === 'arrowup' || k === 'w') { rotate(); e.preventDefault() }
    }
    const click = () => { if (state === 'start' || state === 'over') start() }
    reset(); document.addEventListener('keydown', key); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">←→ move · ↑ rotate · ↓ soft · SPACE drop · P pause · R retry · Esc</div>
    </>
  )
}
