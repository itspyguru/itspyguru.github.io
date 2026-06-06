import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, accent, makeStars, drawStars, panel } from './engine'

export default function SpaceImpact() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 520, H = 320
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const far = makeStars(26, W, H), near = makeStars(16, W, H)
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let py = H / 2, score = 0, lives = 3, t = 0, cool = 0, flash = 0, best = getBest('spaceimpact'), so = { dx: 0, dy: 0 }
    let bullets: { x: number; y: number }[] = [], foes: { x: number; y: number; vy: number }[] = []
    const keys: Record<string, boolean> = {}
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const reset = () => { py = H / 2; score = 0; lives = 3; t = 0; cool = 0; flash = 0; bullets = []; foes = [] }
    const start = () => { reset(); state = 'play'; sfx.start() }
    const hurt = () => { lives--; flash = 1; shake.kick(11); sfx.explode(); if (lives <= 0) { state = 'over'; best = setBest('spaceimpact', score) } }

    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt); if (flash > 0) flash -= dt * 2
      if (state !== 'play') return
      t++
      if (keys['arrowup'] || keys['w']) py = clamp(py - 5, 16, H - 16)
      if (keys['arrowdown'] || keys['s']) py = clamp(py + 5, 16, H - 16)
      if (keys[' '] && cool <= 0) { bullets.push({ x: 48, y: py }); cool = 9; sfx.hit() }
      cool--
      if (t % 4 === 0) parts.burst(16, py + 6, { count: 1, color: '#ff9040', speed: 1.4, life: 0.3, size: 2 })
      bullets = bullets.filter((b) => { b.x += 9; return b.x < W })
      if (t % Math.max(26 - Math.floor(score / 60), 11) === 0) foes.push({ x: W + 10, y: 16 + Math.random() * (H - 32), vy: (Math.random() - 0.5) * 1.6 })
      foes.forEach((f) => { f.x -= 3 + score / 400; f.y += f.vy; if (f.y < 12 || f.y > H - 12) f.vy *= -1 })
      foes = foes.filter((f) => {
        for (const b of bullets) if (Math.abs(b.x - f.x) < 15 && Math.abs(b.y - f.y) < 15) { score += 10; sfx.explode(); parts.burst(f.x, f.y, { color: '#ff6b6b', count: 14, speed: 3.5, life: 0.6 }); b.x = 9999; return false }
        if (f.x < 38 && Math.abs(f.y - py) < 17) { hurt(); parts.burst(f.x, f.y, { color: '#ff9040', count: 12, speed: 3 }); return false }
        return f.x > -12
      })
    }
    function render() {
      const a = accent()
      ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H)
      drawStars(ctx, far, W, state === 'play' ? 0.6 : 0.15); drawStars(ctx, near, W, state === 'play' ? 1.3 : 0.3)
      ctx.save(); ctx.translate(so.dx, so.dy)
      glow(ctx, a, 12); ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(20, py - 11); ctx.lineTo(46, py); ctx.lineTo(20, py + 11); ctx.lineTo(26, py); ctx.closePath(); ctx.fill(); noGlow(ctx)
      glow(ctx, a, 8); ctx.fillStyle = a; bullets.forEach((b) => ctx.fillRect(b.x, b.y - 1.5, 10, 3)); noGlow(ctx)
      foes.forEach((f) => { glow(ctx, '#ff6b6b', 8); ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, 7); ctx.fill(); noGlow(ctx); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(f.x - 4, f.y - 2, 8, 4) })
      parts.draw(ctx); ctx.restore()
      ctx.fillStyle = a; ctx.font = 'bold 14px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(String(score), 10, 22)
      ctx.fillStyle = '#ff6b6b'; ctx.textAlign = 'right'; ctx.fillText('♥'.repeat(Math.max(0, lives)), W - 10, 22)
      if (flash > 0) { ctx.fillStyle = `rgba(255,120,60,${flash * 0.4})`; ctx.fillRect(0, 0, W, H) }
      if (state === 'start') panel(ctx, W, H, 'SPACE IMPACT', '↑ ↓ move · SPACE fire · best ' + best, 'press SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, 'GAME OVER', `score ${score} · best ${best}`, 'press R to retry')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(k)) e.preventDefault()
      if (k === ' ' && state !== 'play') { if (state === 'start' || state === 'over') start() }
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
      else keys[k] = true
    }
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
    const click = () => { if (state === 'start' || state === 'over') start() }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">↑↓ move · SPACE fire · P pause · R retry · Esc quit</div>
    </>
  )
}
