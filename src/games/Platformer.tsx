import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, rgba, makeStars, drawStars, panel } from './engine'

export default function Platformer() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 560, H = 320, PW = 14, PH = 18
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const stars = makeStars(34, W, H)
    const plats = [
      { x: 0, y: 286, w: 150, h: 34 }, { x: 180, y: 240, w: 90, h: 14 }, { x: 300, y: 190, w: 90, h: 14 },
      { x: 200, y: 130, w: 70, h: 14 }, { x: 60, y: 170, w: 80, h: 14 }, { x: 420, y: 250, w: 140, h: 34 },
      { x: 470, y: 150, w: 90, h: 14 },
    ]
    type Coin = { x: number; y: number; got: boolean }
    const coins: Coin[] = [{ x: 215, y: 215, got: false }, { x: 335, y: 165, got: false }, { x: 95, y: 145, got: false }, { x: 235, y: 105, got: false }, { x: 500, y: 125, got: false }]
    const goal = { x: 520, y: 110, w: 16, h: 40 }
    let state: 'start' | 'play' | 'pause' | 'win' = 'start'
    let px = 20, py = 250, vx = 0, vy = 0, onGround = false, got = 0, time = 0, so = { dx: 0, dy: 0 }
    const keys: Record<string, boolean> = {}
    const reset = () => { px = 20; py = 250; vx = 0; vy = 0; onGround = false; got = 0; time = 0; coins.forEach((c) => c.got = false) }
    const start = () => { reset(); state = 'play'; sfx.start() }

    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt)
      if (state !== 'play') return
      time += dt
      vx = (keys['arrowleft'] || keys['a']) ? -3 : (keys['arrowright'] || keys['d']) ? 3 : 0
      if ((keys['arrowup'] || keys['w'] || keys[' ']) && onGround) { vy = -8.4; onGround = false; sfx.flap(); parts.burst(px + PW / 2, py + PH, { count: 6, color: rgba(0.7), speed: 1.6, life: 0.35 }) }
      vy += 0.46; px += vx; py += vy
      const wasGround = onGround; onGround = false
      for (const p of plats) if (px + PW > p.x && px < p.x + p.w && py + PH > p.y && py + PH < p.y + p.h + 16 && vy >= 0) { py = p.y - PH; vy = 0; onGround = true }
      if (!wasGround && onGround) parts.burst(px + PW / 2, py + PH, { count: 7, color: '#cdd8cd', speed: 2, life: 0.3, gravity: 0.04 })
      if (px < 0) px = 0; if (px > W - PW) px = W - PW
      if (py > H) { shake.kick(6); reset2() }
      coins.forEach((c) => { if (!c.got && Math.abs(c.x - (px + PW / 2)) < 14 && Math.abs(c.y - (py + PH / 2)) < 14) { c.got = true; got++; sfx.score(); parts.burst(c.x, c.y, { color: '#ffd400', count: 12, speed: 2.6, life: 0.5 }) } })
      if (px + PW > goal.x && px < goal.x + goal.w && py + PH > goal.y && got >= coins.length) { state = 'win'; sfx.clear() }
    }
    function reset2() { px = 20; py = 250; vx = 0; vy = 0 }

    function render(t: number) {
      const a = accent()
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#06120d'); bg.addColorStop(1, '#0a0a0a')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); drawStars(ctx, stars, W, 0.05)
      ctx.save(); ctx.translate(so.dx, so.dy)
      for (const p of plats) { const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, rgba(0.28)); g.addColorStop(1, rgba(0.08)); ctx.fillStyle = g; roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill(); ctx.fillStyle = a; ctx.globalAlpha = 0.5; ctx.fillRect(p.x, p.y, p.w, 2); ctx.globalAlpha = 1 }
      coins.forEach((c) => { if (c.got) return; const sx = Math.abs(Math.cos(t / 200)); glow(ctx, '#ffd400', 8); ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 5 * sx + 0.6, 5, 0, 0, 7); ctx.fill(); noGlow(ctx) })
      const lit = got >= coins.length; if (lit) glow(ctx, a, 12); ctx.fillStyle = lit ? a : 'rgba(255,255,255,0.18)'; ctx.fillRect(goal.x, goal.y, 3, goal.h); ctx.beginPath(); ctx.moveTo(goal.x + 3, goal.y); ctx.lineTo(goal.x + goal.w, goal.y + 6); ctx.lineTo(goal.x + 3, goal.y + 12); ctx.fill(); noGlow(ctx)
      const stretch = 1 + Math.max(-0.3, Math.min(0.3, -vy / 30)), sw = PW / stretch, sh = PH * stretch
      glow(ctx, a, 10); ctx.fillStyle = a; roundRect(ctx, px + (PW - sw) / 2, py + (PH - sh), sw, sh, 4); ctx.fill(); noGlow(ctx)
      parts.draw(ctx); ctx.restore()
      ctx.fillStyle = a; ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(`◆ ${got}/${coins.length}`, 12, 22)
      ctx.textAlign = 'right'; ctx.fillText(time.toFixed(1) + 's', W - 12, 22)
      if (state === 'start') panel(ctx, W, H, 'PLATFORMER', '← → move · ↑/SPACE jump', 'collect all ◆ then reach the flag · SPACE')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'win') panel(ctx, W, H, 'YOU WIN! 🏁', `time ${time.toFixed(1)}s`, 'press R to play again')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(ts); raf = requestAnimationFrame(loop) }
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' '].includes(k)) e.preventDefault()
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; return }
      if (k === 'r') { if (state !== 'start') start(); return }
      if (k === ' ' && (state === 'start' || state === 'win')) { start(); return }
      keys[k] = true
    }
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
    const click = () => { if (state === 'start' || state === 'win') start() }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">←→ move · ↑/SPACE jump · collect ◆ then reach the flag · R retry · Esc quit</div>
    </>
  )
}
