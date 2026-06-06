import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Racing() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, W = cv.width, H = cv.height
    const LANES = 4, LW = W / LANES, CW = LW * 0.5, CH = 46
    let lane = 1, px = LW * lane + (LW - CW) / 2
    let foes: { x: number; y: number }[] = [], dist = 0, speed = 4, over = false, t = 0, dash = 0
    const laneX = (l: number) => LW * l + (LW - CW) / 2
    const onKey = (e: KeyboardEvent) => {
      if (over) return; const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') { lane = Math.max(0, lane - 1); e.preventDefault() }
      else if (k === 'arrowright' || k === 'd') { lane = Math.min(LANES - 1, lane + 1); e.preventDefault() }
    }
    document.addEventListener('keydown', onKey)
    let raf = 0
    const loop = () => {
      t++
      if (!over) {
        const tx = laneX(lane); px += (tx - px) * 0.25
        speed = 4 + dist / 1500; dist += speed; dash += speed
        if (hud.current) hud.current.textContent = 'distance ' + Math.floor(dist / 10) + 'm'
        if (t % Math.max(40 - Math.floor(dist / 800), 16) === 0) { const l = (Math.random() * LANES) | 0; foes.push({ x: laneX(l), y: -CH }) }
        foes.forEach((f) => f.y += speed)
        for (const f of foes) if (Math.abs(f.x - px) < CW - 6 && f.y + CH > H - CH - 12 && f.y < H - 12) { over = true; beep(120, 0.2, 'sawtooth', 0.05) }
        foes = foes.filter((f) => f.y < H + CH)
      }
      const a = accent()
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
      // lane dashes
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      for (let l = 1; l < LANES; l++) for (let y = -40; y < H; y += 40) ctx.fillRect(l * LW - 1, ((y + dash) % (H + 40)), 2, 22)
      // foes
      ctx.fillStyle = '#ff6b6b'; foes.forEach((f) => ctx.fillRect(f.x, f.y, CW, CH))
      // player
      ctx.fillStyle = a; ctx.fillRect(px, H - CH - 12, CW, CH)
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText('CRASH · ' + Math.floor(dist / 10) + 'm', W / 2, H / 2) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={300} height={420} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline"><span ref={hud} className="text-primary-fixed-dim">distance 0m</span> · ←→ steer · avoid traffic · Esc quit</div>
    </>
  )
}
