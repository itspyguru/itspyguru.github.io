import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, panel } from './engine'

export default function Racing() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 300, H = 440, LANES = 4, LW = W / LANES, CW = LW * 0.54, CH = 56
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const laneX = (l: number) => LW * l + (LW - CW) / 2
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let lane = 1, px = laneX(1), foes: { x: number; y: number; passed: boolean }[] = [], dist = 0, speed = 4, t = 0, dash = 0, flash = 0, best = getBest('racing'), so = { dx: 0, dy: 0 }
    const reset = () => { lane = 1; px = laneX(1); foes = []; dist = 0; speed = 4; t = 0; dash = 0; flash = 0 }
    const start = () => { reset(); state = 'play'; sfx.start() }
    const crash = () => { state = 'over'; flash = 1; shake.kick(13); sfx.explode(); parts.burst(px + CW / 2, H - CH - 8, { color: '#ff9040', count: 26, speed: 4.5, life: 0.7, gravity: 0.04 }); best = setBest('racing', Math.floor(dist / 10)) }

    function car(x: number, y: number, color: string, tail: boolean) {
      glow(ctx, color, 8); const g = ctx.createLinearGradient(x, 0, x + CW, 0); g.addColorStop(0, color + 'cc'); g.addColorStop(0.5, color); g.addColorStop(1, color + 'cc')
      ctx.fillStyle = g; roundRect(ctx, x, y, CW, CH, 7); ctx.fill(); noGlow(ctx)
      ctx.fillStyle = 'rgba(10,12,10,0.7)'; roundRect(ctx, x + 4, y + (tail ? 10 : CH - 26), CW - 8, 16, 3); ctx.fill()
      ctx.fillStyle = tail ? '#ff5555' : '#fff6c0'; const ly = tail ? y + CH - 5 : y + 2; ctx.fillRect(x + 4, ly, 6, 3); ctx.fillRect(x + CW - 10, ly, 6, 3)
    }
    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt); if (flash > 0) flash -= dt * 2
      if (state !== 'play') return
      t++
      px += (laneX(lane) - px) * 0.25; speed = 4 + dist / 1500; dist += speed; dash += speed
      if (t % Math.max(40 - Math.floor(dist / 800), 16) === 0) { const l = (Math.random() * LANES) | 0; foes.push({ x: laneX(l), y: -CH, passed: false }) }
      foes.forEach((f) => f.y += speed)
      for (const f of foes) {
        if (!f.passed && f.y > H) { f.passed = true }
        if (Math.abs(f.x - px) < CW - 8 && f.y + CH > H - CH - 12 && f.y < H - 12) return crash()
      }
      foes = foes.filter((f) => f.y < H + CH)
    }
    function render() {
      const a = accent()
      ctx.fillStyle = '#0c0e0c'; ctx.fillRect(0, 0, W, H)
      // roadside
      ctx.fillStyle = '#10140f'; ctx.fillRect(0, 0, 10, H); ctx.fillRect(W - 10, 0, 10, H)
      ctx.fillStyle = a; for (let y = -30; y < H; y += 40) { const yy = (y + dash) % (H + 40); ctx.globalAlpha = 0.5; ctx.fillRect(3, yy, 4, 22); ctx.fillRect(W - 7, yy, 4, 22) } ctx.globalAlpha = 1
      // lane dashes
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; for (let l = 1; l < LANES; l++) for (let y = -40; y < H; y += 44) ctx.fillRect(l * LW - 1.5, (y + dash) % (H + 44), 3, 24)
      // speed lines
      if (state === 'play' && speed > 6) { ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = 14 + Math.random() * (W - 28); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 24); ctx.stroke() } }
      ctx.save(); ctx.translate(so.dx, so.dy)
      foes.forEach((f) => car(f.x, f.y, '#ff5566', true))
      car(px, H - CH - 8, a, false)
      parts.draw(ctx); ctx.restore()
      ctx.fillStyle = a; ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(Math.floor(dist / 10) + 'm', 14, 22)
      ctx.textAlign = 'right'; ctx.fillText(Math.round(speed * 14) + ' km/h', W - 14, 22)
      if (flash > 0) { ctx.fillStyle = `rgba(255,120,60,${flash * 0.45})`; ctx.fillRect(0, 0, W, H) }
      if (state === 'start') panel(ctx, W, H, 'RACING', '← → steer · best ' + best + 'm', 'press SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, 'CRASH 💥', `${Math.floor(dist / 10)}m · best ${best}m`, 'press R to retry')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state === 'start' || state === 'over') start() }
      else if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
      else if ((k === 'arrowleft' || k === 'a') && state === 'play') { lane = Math.max(0, lane - 1); e.preventDefault() }
      else if ((k === 'arrowright' || k === 'd') && state === 'play') { lane = Math.min(LANES - 1, lane + 1); e.preventDefault() }
    }
    const click = () => { if (state === 'start' || state === 'over') start() }
    document.addEventListener('keydown', key); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">←→ steer · SPACE start · P pause · R retry · Esc quit</div>
    </>
  )
}
