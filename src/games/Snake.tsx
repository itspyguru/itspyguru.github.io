import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, rgba, panel } from './engine'

type V = { x: number; y: number }

export default function Snake() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const bestRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 360, H = 360, N = 15, S = W / N
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let snake: V[] = [], dir: V = { x: 1, y: 0 }, nextDir: V = { x: 1, y: 0 }, food: V = { x: 4, y: 4 }
    let score = 0, acc = 0, interval = 0.13, flash = 0, best = getBest('snake'), so = { dx: 0, dy: 0 }

    const place = () => { while (true) { const f = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 }; if (!snake.some((s) => s.x === f.x && s.y === f.y)) { food = f; return } } }
    const reset = () => { snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]; dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 }; score = 0; acc = 0; interval = 0.13; flash = 0; place() }
    const start = () => { reset(); state = 'play'; sfx.start() }
    const die = () => { state = 'over'; flash = 1; shake.kick(11); sfx.lose(); best = setBest('snake', score); if (bestRef.current) bestRef.current.textContent = String(best) }

    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt)
      if (state !== 'play') return
      if (flash > 0) flash -= dt * 2
      acc += dt
      if (acc >= interval) {
        acc -= interval
        if (nextDir.x !== -dir.x || nextDir.y !== -dir.y) dir = nextDir
        const h = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N }
        if (snake.some((s) => s.x === h.x && s.y === h.y)) return die()
        snake.unshift(h)
        if (h.x === food.x && h.y === food.y) { score++; sfx.eat(); parts.burst((food.x + 0.5) * S, (food.y + 0.5) * S, { color: '#ff6b6b', count: 16, speed: 3, life: 0.5 }); interval = Math.max(0.06, 0.13 - score * 0.003); place() }
        else snake.pop()
      }
    }
    function render(t: number) {
      const a = accent()
      ctx.fillStyle = '#070b07'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
      for (let i = 1; i < N; i++) { ctx.beginPath(); ctx.moveTo(i * S, 0); ctx.lineTo(i * S, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * S); ctx.lineTo(W, i * S); ctx.stroke() }
      ctx.save(); ctx.translate(so.dx, so.dy)
      const pr = S * 0.3 + Math.sin(t / 170) * 2.2
      glow(ctx, '#ff6b6b', 14); ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc((food.x + 0.5) * S, (food.y + 0.5) * S, pr, 0, 7); ctx.fill(); noGlow(ctx)
      for (let i = snake.length - 1; i >= 0; i--) { const s = snake[i], head = i === 0; ctx.fillStyle = head ? a : rgba(0.85 - (i / snake.length) * 0.5); if (head) glow(ctx, a, 12); roundRect(ctx, s.x * S + 2, s.y * S + 2, S - 4, S - 4, 6); ctx.fill(); noGlow(ctx) }
      parts.draw(ctx); ctx.restore()
      ctx.fillStyle = a; ctx.font = 'bold 14px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; glow(ctx, a, 8); ctx.fillText(String(score), 10, 22); noGlow(ctx)
      if (flash > 0) { ctx.fillStyle = `rgba(255,60,60,${flash * 0.4})`; ctx.fillRect(0, 0, W, H) }
      if (state === 'start') panel(ctx, W, H, 'SNAKE', 'arrows / WASD to move', 'press SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, 'GAME OVER', `score ${score} · best ${best}`, 'press R to retry')
    }
    let raf = 0, last = performance.now()
    const loop = (t: number) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; step(dt); render(t); raf = requestAnimationFrame(loop) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state === 'start' || state === 'over') start() }
      else if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
      else { let nd: V | null = null; if (k === 'arrowup' || k === 'w') nd = { x: 0, y: -1 }; else if (k === 'arrowdown' || k === 's') nd = { x: 0, y: 1 }; else if (k === 'arrowleft' || k === 'a') nd = { x: -1, y: 0 }; else if (k === 'arrowright' || k === 'd') nd = { x: 1, y: 0 }; if (nd) { e.preventDefault(); nextDir = nd; if (state === 'start') start() } }
    }
    const click = () => { if (state === 'start' || state === 'over') start() }
    reset(); document.addEventListener('keydown', key); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">best: <span ref={bestRef} className="text-primary-fixed-dim">{getBest('snake')}</span> · SPACE start · P pause · R retry · Esc quit</div>
    </>
  )
}
