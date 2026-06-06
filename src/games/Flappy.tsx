import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, rgba, makeStars, drawStars, panel } from './engine'

export default function Flappy() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 320, H = 440, GAP = 132, PW = 50, BX = 70, R = 12
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const stars = makeStars(40, W, H)
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let by = H / 2, vy = 0, pipes: { x: number; gap: number; passed: boolean }[] = [], t = 0, score = 0, flash = 0, best = getBest('flappy'), so = { dx: 0, dy: 0 }
    const reset = () => { by = H / 2; vy = 0; pipes = []; t = 0; score = 0; flash = 0 }
    const start = () => { reset(); state = 'play'; vy = -5.5; sfx.start() }
    const flap = () => { if (state === 'start' || state === 'over') return start(); if (state === 'play') { vy = -6; sfx.flap(); parts.burst(BX - 6, by + 6, { count: 5, speed: 1.6, life: 0.4, color: rgba(0.8) }) } }
    const die = () => { state = 'over'; flash = 1; shake.kick(12); sfx.explode(); parts.burst(BX, by, { color: '#ffd400', count: 22, speed: 4, life: 0.7, gravity: 0.05 }); best = setBest('flappy', score) }

    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt); if (flash > 0) flash -= dt * 2
      if (state !== 'play') return
      vy += 0.42; by += vy
      t++
      if (t % 92 === 0) pipes.push({ x: W, gap: 60 + Math.random() * (H - 160 - GAP), passed: false })
      pipes.forEach((p) => p.x -= 2.7); pipes = pipes.filter((p) => p.x > -PW)
      for (const p of pipes) {
        if (!p.passed && p.x + PW < BX) { p.passed = true; score++; sfx.score() }
        if (BX + R > p.x && BX - R < p.x + PW && (by - R < p.gap || by + R > p.gap + GAP)) return die()
      }
      if (by + R > H || by - R < 0) return die()
    }
    function render() {
      const a = accent()
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05140f'); bg.addColorStop(1, '#0a0a0a')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      drawStars(ctx, stars, W, state === 'play' ? 0.4 : 0.1)
      // city silhouette
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 8; i++) { const bw = 40, bh = 30 + (i * 37 % 60); ctx.fillRect(i * 42 - ((t * 0.4) % 42), H - bh, bw - 6, bh) }
      ctx.save(); ctx.translate(so.dx, so.dy)
      pipes.forEach((p) => {
        const g = ctx.createLinearGradient(p.x, 0, p.x + PW, 0); g.addColorStop(0, a); g.addColorStop(1, rgba(0.55))
        glow(ctx, a, 8); ctx.fillStyle = g
        roundRect(ctx, p.x, 0, PW, p.gap, 4); ctx.fill(); roundRect(ctx, p.x - 3, p.gap - 14, PW + 6, 14, 3); ctx.fill()
        roundRect(ctx, p.x, p.gap + GAP, PW, H - p.gap - GAP, 4); ctx.fill(); roundRect(ctx, p.x - 3, p.gap + GAP, PW + 6, 14, 3); ctx.fill()
        noGlow(ctx)
      })
      // bird
      ctx.save(); ctx.translate(BX, by); ctx.rotate(Math.max(-0.5, Math.min(1, vy / 12)))
      glow(ctx, '#ffd400', 12); ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); noGlow(ctx)
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(3, -5, 3, 3); ctx.fillStyle = '#ff8c00'; ctx.beginPath(); ctx.moveTo(R - 2, 0); ctx.lineTo(R + 6, -2); ctx.lineTo(R + 6, 3); ctx.fill()
      ctx.restore()
      parts.draw(ctx); ctx.restore()
      glow(ctx, a, 10); ctx.fillStyle = a; ctx.font = 'bold 30px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; if (state === 'play') ctx.fillText(String(score), W / 2, 50); noGlow(ctx)
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.5})`; ctx.fillRect(0, 0, W, H) }
      if (state === 'start') panel(ctx, W, H, 'FLAPPY', 'best ' + best, 'SPACE / click to flap')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, 'GAME OVER', `score ${score} · best ${best}`, 'press R / click to retry')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ' || k === 'arrowup') { e.preventDefault(); flap() }
      else if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
    }
    const click = () => flap()
    document.addEventListener('keydown', key); cv.addEventListener('mousedown', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); cv.removeEventListener('mousedown', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">SPACE / click to flap · P pause · R retry · Esc quit</div>
    </>
  )
}
