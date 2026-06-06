import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Platformer() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, W = cv.width, H = cv.height
    const plats = [
      { x: 0, y: 280, w: 140, h: 20 }, { x: 180, y: 240, w: 90, h: 14 }, { x: 300, y: 190, w: 90, h: 14 },
      { x: 200, y: 130, w: 70, h: 14 }, { x: 60, y: 170, w: 80, h: 14 }, { x: 420, y: 250, w: 140, h: 20 },
      { x: 470, y: 150, w: 90, h: 14 },
    ]
    const coins = [{ x: 215, y: 215 }, { x: 335, y: 165 }, { x: 95, y: 145 }, { x: 235, y: 105 }, { x: 500, y: 125 }]
    const goal = { x: 520, y: 110, w: 16, h: 40 }
    let px = 20, py = 250, vx = 0, vy = 0, onGround = false, got = 0, won = false
    const keys: Record<string, boolean> = {}
    const onKey = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' '].includes(k)) e.preventDefault(); keys[k] = e.type === 'keydown' }
    document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKey)
    const PW = 14, PH = 18
    let raf = 0
    const loop = () => {
      if (!won) {
        if (keys['arrowleft'] || keys['a']) vx = -3; else if (keys['arrowright'] || keys['d']) vx = 3; else vx = 0
        if ((keys['arrowup'] || keys['w'] || keys[' ']) && onGround) { vy = -8.2; onGround = false; beep(660, 0.04) }
        vy += 0.45; px += vx; py += vy
        onGround = false
        for (const p of plats) {
          if (px + PW > p.x && px < p.x + p.w && py + PH > p.y && py + PH < p.y + p.h + 16 && vy >= 0) { py = p.y - PH; vy = 0; onGround = true }
        }
        if (px < 0) px = 0; if (px > W - PW) px = W - PW
        if (py > H) { px = 20; py = 250; vy = 0 } // fell — respawn
        coins.forEach((c) => { if (!(c as any).got && Math.abs(c.x - (px + PW / 2)) < 14 && Math.abs(c.y - (py + PH / 2)) < 14) { (c as any).got = true; got++; if (hud.current) hud.current.textContent = `coins ${got}/${coins.length}`; beep(880, 0.05) } })
        if (px + PW > goal.x && px < goal.x + goal.w && py + PH > goal.y && got >= coins.length) won = true
      }
      const a = accent()
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; plats.forEach((p) => ctx.fillRect(p.x, p.y, p.w, p.h))
      ctx.strokeStyle = a; plats.forEach((p) => ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1))
      ctx.fillStyle = '#e6e600'; coins.forEach((c) => { if (!(c as any).got) { ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, 7); ctx.fill() } })
      ctx.fillStyle = got >= coins.length ? a : 'rgba(255,255,255,0.2)'; ctx.fillRect(goal.x, goal.y, goal.w, goal.h)
      ctx.fillStyle = a; ctx.fillRect(px, py, PW, PH)
      if (won) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; ctx.font = '22px monospace'; ctx.textAlign = 'center'; ctx.fillText('YOU WIN! 🏁', W / 2, H / 2) }
      raf = requestAnimationFrame(loop)
    }
    if (hud.current) hud.current.textContent = `coins 0/${coins.length}`
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={560} height={320} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline"><span ref={hud} className="text-primary-fixed-dim">coins</span> · ←→ move · ↑/space jump · collect all coins then reach the flag · Esc quit</div>
    </>
  )
}
