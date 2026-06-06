import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Pong() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const pRef = useRef<HTMLSpanElement>(null)
  const aRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, W = cv.width, H = cv.height, PH = 58, PW = 8
    let py = H / 2 - PH / 2, ay = py, bx = W / 2, by = H / 2, vx = 4, vy = 2.4, ps = 0, as = 0
    const mouse = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); py = Math.max(0, Math.min(H - PH, e.clientY - r.top - PH / 2)) }
    const key = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k === 'arrowup') { py = Math.max(0, py - 26); e.preventDefault() } else if (k === 'arrowdown') { py = Math.min(H - PH, py + 26); e.preventDefault() } }
    cv.addEventListener('mousemove', mouse); document.addEventListener('keydown', key)
    const reset = (d: number) => { bx = W / 2; by = H / 2; vx = 4 * d; vy = (Math.random() * 4 - 2) || 2 }
    let done = false
    const tick = () => {
      if (done) return
      const a = accent(); bx += vx; by += vy; if (by < 0 || by > H) { vy = -vy; by = Math.max(0, Math.min(H, by)) }
      ay += Math.max(-3.1, Math.min(3.1, (by - PH / 2) - ay))
      if (bx < PW + 6 && by > py && by < py + PH) { vx = Math.abs(vx) + 0.25; vy += (by - (py + PH / 2)) / 16; beep(440, 0.03) }
      if (bx > W - PW - 6 && by > ay && by < ay + PH) { vx = -(Math.abs(vx) + 0.25) }
      if (bx < 0) { as++; if (aRef.current) aRef.current.textContent = String(as); reset(1) }
      if (bx > W) { ps++; if (pRef.current) pRef.current.textContent = String(ps); beep(660, 0.05); reset(-1) }
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = a; ctx.fillRect(4, py, PW, PH); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(W - PW - 4, ay, PW, PH)
      ctx.fillStyle = a; ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fill()
      if (ps >= 5 || as >= 5) { done = true; ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; ctx.font = '22px monospace'; ctx.textAlign = 'center'; ctx.fillText(ps >= 5 ? 'YOU WIN 🏆' : 'CPU WINS', W / 2, H / 2) }
    }
    const loop = setInterval(tick, 1000 / 60)
    return () => { clearInterval(loop); cv.removeEventListener('mousemove', mouse); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={480} height={300} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline">you <span ref={pRef} className="text-primary-fixed-dim">0</span> — <span ref={aRef} className="text-error">0</span> cpu · mouse / ↑↓ · first to 5 · Esc quit</div>
    </>
  )
}
