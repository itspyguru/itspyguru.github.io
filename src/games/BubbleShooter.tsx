import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'

const COLORS = ['#00e6e6', '#ff5555', '#e6e600', '#00e000', '#b080ff']
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function BubbleShooter() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, R = 16, COLS = 9, ROWS = 14, D = R * 2
    const W = cv.width, H = cv.height
    const cellX = (c: number) => R + 2 + c * D, cellY = (r: number) => R + 2 + r * D
    const grid: (string | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    for (let r = 0; r < 4; r++) for (let c = 0; c < COLS; c++) grid[r][c] = COLORS[(Math.random() * COLORS.length) | 0]
    let curColor = COLORS[(Math.random() * COLORS.length) | 0]
    let mx = W / 2, my = 60, shot: { x: number; y: number; vx: number; vy: number } | null = null, score = 0, over = false
    const sx = W / 2, sy = H - 20

    const neighbors = (r: number, c: number) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
    function cluster(r: number, c: number, color: string) {
      const seen = new Set<string>(), stack = [[r, c]], out: number[][] = []
      while (stack.length) { const [y, x] = stack.pop()!; const k = y + ',' + x; if (seen.has(k)) continue; seen.add(k); if (y < 0 || y >= ROWS || x < 0 || x >= COLS || grid[y][x] !== color) continue; out.push([y, x]); neighbors(y, x).forEach((n) => stack.push(n)) }
      return out
    }
    function land() {
      // nearest empty cell to shot
      let best = [-1, -1], bd = 1e9
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c]) { const d = (cellX(c) - shot!.x) ** 2 + (cellY(r) - shot!.y) ** 2; if (d < bd) { bd = d; best = [r, c] } }
      const [r, c] = best; if (r < 0) { shot = null; return }
      grid[r][c] = curColor
      const cl = cluster(r, c, curColor)
      if (cl.length >= 3) { cl.forEach(([y, x]) => grid[y][x] = null); score += cl.length * 10; if (scoreRef.current) scoreRef.current.textContent = String(score); beep(700, 0.05) }
      if (grid[ROWS - 1].some((x) => x)) over = true
      shot = null; curColor = COLORS[(Math.random() * COLORS.length) | 0]
    }
    function fire() { if (shot || over) return; const a = Math.atan2(my - sy, mx - sx); shot = { x: sx, y: sy, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6 } }
    const onMove = (e: MouseEvent) => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = Math.min(sy - 10, e.clientY - b.top) }
    const onClick = () => fire()
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); fire() } }
    cv.addEventListener('mousemove', onMove); cv.addEventListener('click', onClick); document.addEventListener('keydown', onKey)
    const ball = (x: number, y: number, c: string) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, R - 1, 0, 7); ctx.fill() }
    let raf = 0
    const loop = () => {
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) ball(cellX(c), cellY(r), grid[r][c]!)
      if (shot) { shot.x += shot.vx; shot.y += shot.vy; if (shot.x < R || shot.x > W - R) shot.vx *= -1; const hit = shot.y < R + 2 || gridHit(shot.x, shot.y); if (hit) land(); else ball(shot.x, shot.y, curColor) }
      // aim
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.stroke()
      ball(sx, sy, curColor)
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = accent(); ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER · ' + score, W / 2, H / 2) }
      raf = requestAnimationFrame(loop)
    }
    function gridHit(x: number, y: number) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) { if ((cellX(c) - x) ** 2 + (cellY(r) - y) ** 2 < (D - 4) ** 2) return true } return false }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('mousemove', onMove); cv.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={306} height={420} className="border border-primary-fixed-dim/40 cursor-crosshair" />
      <div className="text-data-label text-outline">score: <span ref={scoreRef} className="text-primary-fixed-dim">0</span> · move mouse to aim · click / space to fire · Esc quit</div>
    </>
  )
}
