import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
import { getBest, setBest } from './scores'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Flappy() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, W = cv.width, H = cv.height
    const GAP = 130, PW = 46, BX = 64, R = 12
    let by = H / 2, vy = 0, pipes: { x: number; gap: number; passed: boolean }[] = [], t = 0, score = 0, over = false, started = false, best = getBest('flappy')
    const setHud = () => { if (hud.current) hud.current.textContent = `score ${score} · best ${best}` }
    const flap = () => { if (over) return; started = true; vy = -6; beep(720, 0.03) }
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap() } }
    const onClick = () => flap()
    document.addEventListener('keydown', onKey); cv.addEventListener('mousedown', onClick)
    let raf = 0
    const loop = () => {
      t++
      if (started && !over) {
        vy += 0.4; by += vy
        if (t % 95 === 0) pipes.push({ x: W, gap: 60 + Math.random() * (H - 160), passed: false })
        pipes.forEach((p) => p.x -= 2.6)
        pipes = pipes.filter((p) => p.x > -PW)
        for (const p of pipes) {
          if (!p.passed && p.x + PW < BX) { p.passed = true; score++; setHud(); beep(520, 0.03) }
          if (BX + R > p.x && BX - R < p.x + PW && (by - R < p.gap || by + R > p.gap + GAP)) { over = true; best = setBest('flappy', score); setHud(); beep(140, 0.18, 'sawtooth', 0.05) }
        }
        if (by + R > H || by - R < 0) { over = true; best = setBest('flappy', score); setHud() }
      }
      const a = accent()
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = a
      pipes.forEach((p) => { ctx.fillRect(p.x, 0, PW, p.gap); ctx.fillRect(p.x, p.gap + GAP, PW, H - p.gap - GAP) })
      ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(BX, by, R, 0, 7); ctx.fill()
      ctx.fillStyle = a; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(score), W / 2, 44)
      if (!started) { ctx.fillStyle = a; ctx.font = '14px monospace'; ctx.fillText('space / click to flap', W / 2, H / 2) }
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; ctx.font = '20px monospace'; ctx.fillText('GAME OVER · ' + score, W / 2, H / 2); ctx.font = '12px monospace'; ctx.fillStyle = '#888'; ctx.fillText('best ' + best, W / 2, H / 2 + 22) }
      raf = requestAnimationFrame(loop)
    }
    setHud(); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); cv.removeEventListener('mousedown', onClick) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={320} height={420} className="border border-primary-fixed-dim/40 cursor-pointer" />
      <div className="text-data-label text-outline"><span ref={hud} className="text-primary-fixed-dim">score 0 · best 0</span> · space / click to flap · Esc quit</div>
    </>
  )
}
