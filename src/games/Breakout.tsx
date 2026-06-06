import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, panel } from './engine'

const ROW_HUE = ['#00e6e6', '#22dd88', '#ffd400', '#ff9040', '#ff5577']

export default function Breakout() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 384, H = 320, COLS = 9, ROWS = 5, BW = W / COLS, BH = 18, PW = 66, PH = 9
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    let state: 'start' | 'play' | 'pause' | 'over' = 'start'
    let bricks: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(true)), px = W / 2 - PW / 2, bx = W / 2, by = H - 40, vx = 3, vy = -3.4
    let score = 0, lives = 3, result = '', best = getBest('breakout'), so = { dx: 0, dy: 0 }
    let trail: { x: number; y: number }[] = []
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const resetBall = () => { bx = px + PW / 2; by = H - 40; vx = 3 * (Math.random() < 0.5 ? 1 : -1); vy = -3.4; trail = [] }
    const start = () => { bricks = Array.from({ length: ROWS }, () => Array(COLS).fill(true)); score = 0; lives = 3; result = ''; px = W / 2 - PW / 2; resetBall(); state = 'play'; sfx.start() }

    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt)
      if (state !== 'play') return
      bx += vx; by += vy
      trail.push({ x: bx, y: by }); if (trail.length > 10) trail.shift()
      if (bx < 6) { bx = 6; vx = -vx; sfx.bounce() } else if (bx > W - 6) { bx = W - 6; vx = -vx; sfx.bounce() }
      if (by < 6) { by = 6; vy = -vy; sfx.bounce() }
      if (by > H - 18 - PH && by < H - 12 && bx > px && bx < px + PW && vy > 0) { vy = -Math.abs(vy); vx += (bx - (px + PW / 2)) / 16; sfx.hit() }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (bricks[r][c]) {
        const x = c * BW, y = 34 + r * (BH + 5)
        if (bx > x && bx < x + BW && by > y && by < y + BH) { bricks[r][c] = false; vy = -vy; score += 10; sfx.hit(); parts.burst(bx, by, { color: ROW_HUE[r], count: 10, speed: 3, life: 0.5 }) }
      }
      if (by > H) { lives--; sfx.lose(); shake.kick(9); if (lives <= 0) { state = 'over'; result = 'GAME OVER'; best = setBest('breakout', score) } else resetBall() }
      if (bricks.every((row) => row.every((b) => !b))) { state = 'over'; result = 'CLEARED 🎉'; best = setBest('breakout', score) }
    }
    function render() {
      const a = accent()
      ctx.fillStyle = '#070b07'; ctx.fillRect(0, 0, W, H)
      ctx.save(); ctx.translate(so.dx, so.dy)
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (bricks[r][c]) {
        const x = c * BW, y = 34 + r * (BH + 5), col = ROW_HUE[r]
        const g = ctx.createLinearGradient(0, y, 0, y + BH); g.addColorStop(0, col); g.addColorStop(1, col + '88')
        glow(ctx, col, 8); ctx.fillStyle = g; roundRect(ctx, x + 2, y, BW - 4, BH, 4); ctx.fill(); noGlow(ctx)
      }
      trail.forEach((p, i) => { ctx.globalAlpha = (i / trail.length) * 0.4; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 7); ctx.fill() }); ctx.globalAlpha = 1
      glow(ctx, a, 14); ctx.fillStyle = a; roundRect(ctx, px, H - 16, PW, PH, 4); ctx.fill(); ctx.beginPath(); ctx.arc(bx, by, 5.5, 0, 7); ctx.fill(); noGlow(ctx)
      ctx.fillStyle = a; ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(String(score), 8, 20)
      ctx.textAlign = 'right'; ctx.fillText('♥'.repeat(Math.max(0, lives)), W - 8, 20)
      parts.draw(ctx); ctx.restore()
      if (state === 'start') panel(ctx, W, H, 'BREAKOUT', 'mouse or ← → · best ' + best, 'press SPACE to start')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'over') panel(ctx, W, H, result, `score ${score} · best ${best}`, 'press R to play again')
    }
    let raf = 0, last = performance.now()
    const loop = (t: number) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; step(dt); render(); raf = requestAnimationFrame(loop) }
    const mouse = (e: MouseEvent) => { const r = cv.getBoundingClientRect(); px = clamp((e.clientX - r.left) * (W / r.width) - PW / 2, 0, W - PW) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state === 'start' || state === 'over') start() }
      else if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play' }
      else if (k === 'r') { if (state !== 'start') start() }
      else if (k === 'arrowleft') { px = clamp(px - 28, 0, W - PW); e.preventDefault() }
      else if (k === 'arrowright') { px = clamp(px + 28, 0, W - PW); e.preventDefault() }
    }
    const click = () => { if (state === 'start' || state === 'over') start() }
    cv.addEventListener('mousemove', mouse); cv.addEventListener('click', click); document.addEventListener('keydown', key); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('mousemove', mouse); cv.removeEventListener('click', click); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">mouse / ←→ · SPACE start · P pause · R retry · Esc quit</div>
    </>
  )
}
