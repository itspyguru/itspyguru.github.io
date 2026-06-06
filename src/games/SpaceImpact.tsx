import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function SpaceImpact() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, W = cv.width, H = cv.height
    let py = H / 2, score = 0, lives = 3, over = false, t = 0
    const keys: Record<string, boolean> = {}
    let bullets: { x: number; y: number }[] = []
    let foes: { x: number; y: number; vy: number }[] = []
    let cool = 0
    const onKey = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(k)) e.preventDefault(); keys[k] = e.type === 'keydown' }
    const kd = (e: KeyboardEvent) => onKey(e); const ku = (e: KeyboardEvent) => onKey(e)
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku)
    const setHud = () => { if (hud.current) hud.current.textContent = `score ${score} · lives ${lives}` }
    let raf = 0
    const loop = () => {
      t++
      if (!over) {
        if (keys['arrowup'] || keys['w']) py = Math.max(16, py - 5)
        if (keys['arrowdown'] || keys['s']) py = Math.min(H - 16, py + 5)
        if (keys[' '] && cool <= 0) { bullets.push({ x: 40, y: py }); cool = 10; beep(900, 0.02, 'square', 0.015) }
        cool--
        bullets = bullets.filter((b) => { b.x += 9; return b.x < W })
        if (t % Math.max(28 - Math.floor(score / 60), 12) === 0) foes.push({ x: W + 10, y: 16 + Math.random() * (H - 32), vy: (Math.random() - 0.5) * 1.5 })
        foes.forEach((f) => { f.x -= 3 + score / 400; f.y += f.vy; if (f.y < 12 || f.y > H - 12) f.vy *= -1 })
        // collisions
        foes = foes.filter((f) => {
          for (const b of bullets) if (Math.abs(b.x - f.x) < 14 && Math.abs(b.y - f.y) < 14) { score += 10; setHud(); beep(500, 0.03); b.x = 9999; return false }
          if (f.x < 34 && Math.abs(f.y - py) < 16) { lives--; setHud(); beep(140, 0.12, 'sawtooth', 0.04); if (lives <= 0) over = true; return false }
          return f.x > -12
        })
      }
      const a = accent()
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 53 - t * 2) % W + W, (i * 71) % H, 2, 2)
      ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(20, py - 10); ctx.lineTo(40, py); ctx.lineTo(20, py + 10); ctx.closePath(); ctx.fill()
      ctx.fillStyle = a; bullets.forEach((b) => ctx.fillRect(b.x, b.y - 1.5, 8, 3))
      ctx.fillStyle = '#ff6b6b'; foes.forEach((f) => { ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, 7); ctx.fill() })
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; ctx.font = '22px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER · ' + score, W / 2, H / 2) }
      raf = requestAnimationFrame(loop)
    }
    setHud(); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={480} height={300} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline"><span ref={hud} className="text-primary-fixed-dim">score 0 · lives 3</span> · ↑↓ move · space fire · Esc quit</div>
    </>
  )
}
