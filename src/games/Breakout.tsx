import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
import { getBest, setBest } from './scores'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Breakout() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, W = cv.width, H = cv.height
    const COLS = 8, ROWS = 4, BW = W / COLS, BH = 16, PW = 64, PH = 8
    let bricks: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(true))
    let px = W / 2 - PW / 2, bx = W / 2, by = H - 40, vx = 3, vy = -3, score = 0, lives = 3, over = false, best = getBest('breakout')
    const setHud = () => { if (hud.current) hud.current.textContent = `score ${score} · lives ${lives} · best ${best}` }
    const mouse = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); px = Math.max(0, Math.min(W - PW, (e.clientX - r.left) * (W / r.width) - PW / 2)) }
    const key = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k === 'arrowleft') px = Math.max(0, px - 28); else if (k === 'arrowright') px = Math.min(W - PW, px + 28); if (k.startsWith('arrow')) e.preventDefault() }
    cv.addEventListener('mousemove', mouse); document.addEventListener('keydown', key)
    let raf = 0
    const loop = () => {
      const a = accent()
      if (!over) {
        bx += vx; by += vy
        if (bx < 6 || bx > W - 6) vx = -vx
        if (by < 6) vy = -vy
        if (by > H) { lives--; setHud(); beep(160, 0.1); if (lives <= 0) { over = true; best = setBest('breakout', score); setHud() } else { bx = W / 2; by = H - 40; vx = 3; vy = -3 } }
        if (by > H - 16 - PH && by < H - 16 && bx > px && bx < px + PW) { vy = -Math.abs(vy); vx += (bx - (px + PW / 2)) / 20; beep(440, 0.02) }
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (bricks[r][c]) { const x = c * BW, y = 30 + r * (BH + 4); if (bx > x && bx < x + BW && by > y && by < y + BH) { bricks[r][c] = false; vy = -vy; score += 10; setHud(); beep(620, 0.02) } }
        if (bricks.every((row) => row.every((b) => !b))) { over = true; best = setBest('breakout', score); setHud() }
      }
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (bricks[r][c]) { ctx.fillStyle = ['#00e6e6', '#00e000', '#ffd400', '#ff6b6b'][r]; ctx.fillRect(c * BW + 1, 30 + r * (BH + 4), BW - 2, BH) }
      ctx.fillStyle = a; ctx.fillRect(px, H - 16, PW, PH); ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fill()
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText((bricks.some((r) => r.some((b) => b)) ? 'GAME OVER · ' : 'CLEARED · ') + score, W / 2, H / 2) }
      raf = requestAnimationFrame(loop)
    }
    setHud(); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('mousemove', mouse); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={384} height={300} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline"><span ref={hud} className="text-primary-fixed-dim">score 0 · lives 3</span> · mouse / ←→ · Esc quit</div>
    </>
  )
}
