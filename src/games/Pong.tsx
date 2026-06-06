import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, rgba, panel } from './engine'

export default function Pong() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 480, H = 300, PH = 56, PW = 9
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let py = H / 2 - PH / 2, ay = py, bx = W / 2, by = H / 2, vx = 4, vy = 2, ps = 0, as = 0, result = '', so = { dx: 0, dy: 0 }
    let trail: { x: number; y: number }[] = []
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const serve = (d: number) => { bx = W / 2; by = H / 2; vx = 4.2 * d; vy = (Math.random() * 4 - 2) || 2; trail = [] }
    const start = () => { ps = 0; as = 0; py = H / 2 - PH / 2; ay = py; result = ''; serve(Math.random() < 0.5 ? 1 : -1); state = 'play'; sfx.start() }

    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt)
      if (state !== 'play') return
      bx += vx; by += vy
      trail.push({ x: bx, y: by }); if (trail.length > 12) trail.shift()
      if (by < 6) { by = 6; vy = -vy; sfx.bounce() } else if (by > H - 6) { by = H - 6; vy = -vy; sfx.bounce() }
      ay += clamp((by - PH / 2) - ay, -3.6, 3.6)
      if (bx < 6 + PW && by > py && by < py + PH) { vx = Math.abs(vx) + 0.3; vy += (by - (py + PH / 2)) / 14; bx = 6 + PW; sfx.hit(); parts.burst(bx, by, { count: 9, speed: 3.5, life: 0.4 }) }
      if (bx > W - 6 - PW && by > ay && by < ay + PH) { vx = -(Math.abs(vx) + 0.3); vy += (by - (ay + PH / 2)) / 14; bx = W - 6 - PW; sfx.hit() }
      if (bx < -4) { as++; sfx.score(); shake.kick(8); parts.burst(0, by, { color: '#ff6b6b', count: 14, speed: 4 }); if (as >= 7) { state = 'over'; result = 'CPU WINS' } else serve(1) }
      else if (bx > W + 4) { ps++; sfx.score(); shake.kick(8); parts.burst(W, by, { count: 14, speed: 4 }); if (ps >= 7) { state = 'over'; result = 'YOU WIN 🏆' } else serve(-1) }
    }
    function render() {
      const a = accent()
      ctx.fillStyle = '#070b07'; ctx.fillRect(0, 0, W, H)
      ctx.save(); ctx.translate(so.dx, so.dy)
      ctx.strokeStyle = rgba(0.18); ctx.lineWidth = 2; ctx.setLineDash([7, 10]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = a; ctx.font = 'bold 40px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.25; ctx.fillText(String(ps), W / 2 - 40, 46); ctx.fillText(String(as), W / 2 + 40, 46); ctx.globalAlpha = 1
      trail.forEach((p, i) => { ctx.globalAlpha = (i / trail.length) * 0.5; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 7); ctx.fill() }); ctx.globalAlpha = 1
      glow(ctx, a, 14); ctx.fillStyle = a; roundRect(ctx, 6, py, PW, PH, 4); ctx.fill()
      glow(ctx, '#ff6b6b', 14); ctx.fillStyle = '#ff6b6b'; roundRect(ctx, W - 6 - PW, ay, PW, PH, 4); ctx.fill()
      glow(ctx, a, 12); ctx.fillStyle = a; ctx.beginPath(); ctx.arc(bx, by, 6, 0, 7); ctx.fill(); noGlow(ctx)
      parts.draw(ctx); ctx.restore()
      if (state === 'start') panel(ctx, W, H, 'PONG', 'mouse or ↑ ↓ · first to 7', 'press SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, result, `${ps} — ${as}`, 'press R to play again')
    }
    let raf = 0, last = performance.now()
    const loop = (t: number) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; step(dt); render(); raf = requestAnimationFrame(loop) }
    const mouse = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); py = clamp((e.clientY - r.top) * (H / r.height) - PH / 2, 0, H - PH) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state === 'start' || state === 'over') start() }
      else if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
      else if (k === 'arrowup') { py = clamp(py - 26, 0, H - PH); e.preventDefault() }
      else if (k === 'arrowdown') { py = clamp(py + 26, 0, H - PH); e.preventDefault() }
    }
    const click = () => { if (state === 'start' || state === 'over') start() }
    cv.addEventListener('mousemove', mouse); cv.addEventListener('click', click); document.addEventListener('keydown', key); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('mousemove', mouse); cv.removeEventListener('click', click); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">mouse / ↑↓ · first to 7 · SPACE start · P pause · Esc quit</div>
    </>
  )
}
