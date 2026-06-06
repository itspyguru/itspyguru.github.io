import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, glow, noGlow, accent, panel } from './engine'

const COLORS = ['#00e6e6', '#ff5566', '#ffd400', '#28e060', '#b760f0']
const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, ((n >> 16) & 255) + f), g = Math.min(255, ((n >> 8) & 255) + f), b = Math.min(255, (n & 255) + f); return `rgb(${r},${g},${b})` }

export default function BubbleShooter() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, R = 16, COLS = 9, ROWS = 13, D = R * 2, W = COLS * D + 4, H = 430
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles()
    const cellX = (c: number) => R + 2 + c * D, cellY = (r: number) => R + 2 + r * D
    const sx = W / 2, sy = H - 22
    let grid: (string | null)[][] = [], cur = COLORS[0], next = COLORS[1], mx = W / 2, my = 80
    let shot: { x: number; y: number; vx: number; vy: number } | null = null, score = 0, best = getBest('bubble')
    let state: 'start' | 'play' | 'pause' | 'over' = 'start', result = ''
    const rnd = () => COLORS[(Math.random() * COLORS.length) | 0]
    const reset = () => { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); for (let r = 0; r < 4; r++) for (let c = 0; c < COLS; c++) grid[r][c] = rnd(); cur = rnd(); next = rnd(); shot = null; score = 0 }
    const start = () => { reset(); state = 'play'; result = ''; sfx.start() }

    const neighbors = (r: number, c: number) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
    function cluster(r: number, c: number, color: string) {
      const seen = new Set<string>(), st = [[r, c]], out: number[][] = []
      while (st.length) { const [y, x] = st.pop()!; const k = y + ',' + x; if (seen.has(k)) continue; seen.add(k); if (y < 0 || y >= ROWS || x < 0 || x >= COLS || grid[y][x] !== color) continue; out.push([y, x]); neighbors(y, x).forEach((n) => st.push(n)) }
      return out
    }
    function gridHit(x: number, y: number) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && (cellX(c) - x) ** 2 + (cellY(r) - y) ** 2 < (D - 4) ** 2) return true; return false }
    function land() {
      let best2 = [-1, -1], bd = 1e9
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c]) { const d = (cellX(c) - shot!.x) ** 2 + (cellY(r) - shot!.y) ** 2; if (d < bd) { bd = d; best2 = [r, c] } }
      const [r, c] = best2; if (r < 0) { shot = null; return }
      grid[r][c] = cur
      const cl = cluster(r, c, cur)
      if (cl.length >= 3) { cl.forEach(([y, x]) => { parts.burst(cellX(x), cellY(y), { color: grid[y][x]!, count: 8, speed: 3, life: 0.5 }); grid[y][x] = null }); score += cl.length * 10; sfx.clear() }
      else sfx.bounce()
      if (grid[ROWS - 1].some((x) => x)) { state = 'over'; result = 'GAME OVER'; best = setBest('bubble', score) }
      else if (grid.every((row) => row.every((x) => !x))) { state = 'over'; result = 'CLEARED 🎉'; best = setBest('bubble', score) }
      shot = null; cur = next; next = rnd()
    }
    function fire() { if (shot || state !== 'play') return; const a = Math.atan2(my - sy, mx - sx); shot = { x: sx, y: sy, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7 }; sfx.flap() }

    function bubble(x: number, y: number, color: string, rad = R - 1) {
      const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 1, x, y, rad); g.addColorStop(0, shade(color, 70)); g.addColorStop(1, color)
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - rad * 0.32, y - rad * 0.32, rad * 0.28, 0, 7); ctx.fill()
    }
    function aimDots() {
      let x = sx, y = sy, ang = Math.atan2(my - sy, mx - sx); if (my > sy - 8) return
      let vx = Math.cos(ang) * 7, vy = Math.sin(ang) * 7
      ctx.fillStyle = accent()
      for (let i = 0; i < 90; i++) { x += vx; y += vy; if (x < R || x > W - R) vx = -vx; if (y < R || gridHit(x, y)) break; if (i % 5 === 0) { ctx.globalAlpha = 0.5 - i / 200; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill() } }
      ctx.globalAlpha = 1
    }
    function step(dt: number) {
      parts.update(dt)
      if (state !== 'play' || !shot) return
      for (let i = 0; i < 2; i++) { shot.x += shot.vx / 2; shot.y += shot.vy / 2; if (shot.x < R || shot.x > W - R) shot.vx = -shot.vx; if (shot.y < R + 2 || gridHit(shot.x, shot.y)) { land(); return } }
    }
    function render() {
      const a = accent()
      ctx.fillStyle = '#070b07'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(0, sy - R - 6); ctx.lineTo(W, sy - R - 6); ctx.stroke()
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) bubble(cellX(c), cellY(r), grid[r][c]!)
      if (state === 'play' && !shot) aimDots()
      if (shot) { glow(ctx, cur, 10); bubble(shot.x, shot.y, cur); noGlow(ctx) }
      // shooter + next
      glow(ctx, cur, 10); bubble(sx, sy, cur); noGlow(ctx)
      ctx.fillStyle = '#7d8d7d'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText('NEXT', 8, sy - 4); bubble(40, sy, next, R - 5)
      ctx.fillStyle = a; ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'right'; ctx.fillText(String(score), W - 8, sy + 4)
      parts.draw(ctx)
      if (state === 'start') panel(ctx, W, H, 'BUBBLE', 'aim with mouse · best ' + best, 'click / SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, result, `score ${score} · best ${best}`, 'press R to play again')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    const move = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) * (W / r.width); my = Math.min(sy - 10, (e.clientY - r.top) * (H / r.height)) }
    const click = () => { if (state === 'start' || state === 'over') start(); else fire() }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state === 'start' || state === 'over') start(); else fire(); return }
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
    }
    reset(); cv.addEventListener('mousemove', move); cv.addEventListener('click', click); document.addEventListener('keydown', key); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('mousemove', move); cv.removeEventListener('click', click); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-crosshair" />
      <div className="text-data-label text-outline">aim with mouse · click / SPACE to fire · P pause · R retry · Esc quit</div>
    </>
  )
}
