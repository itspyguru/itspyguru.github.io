import { useEffect, useRef } from 'react'
import { useOS } from '../store/os'

export default function Screensaver() {
  const on = useOS((s) => s.screensaverOn)
  const setOn = useOS((s) => s.setScreensaver)
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = cvRef.current!
    if (!on) { cv.style.display = 'none'; return }
    cv.style.display = 'block'; cv.width = window.innerWidth; cv.height = window.innerHeight
    const ctx = cv.getContext('2d')!, fs = 14, cols = Math.floor(cv.width / fs), drops = Array(cols).fill(1)
    const chars = 'アイウカキ0123456789ABCDEF<>/{}$#'.split('')
    const loop = setInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.fillStyle = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()
      ctx.font = fs + 'px monospace'
      for (let i = 0; i < drops.length; i++) { ctx.fillText(chars[(Math.random() * chars.length) | 0], i * fs, drops[i] * fs); if (drops[i] * fs > cv.height && Math.random() > 0.975) drops[i] = 0; drops[i]++ }
    }, 45)
    const onResize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    const stop = () => setOn(false)
    const evs = ['keydown', 'mousedown', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, stop, { once: true }))
    return () => { clearInterval(loop); window.removeEventListener('resize', onResize); evs.forEach((e) => window.removeEventListener(e, stop)) }
  }, [on])

  return <canvas id="screensaver" ref={cvRef} onClick={() => setOn(false)} />
}
