import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()

export default function Snake() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, N = 16, S = cv.width / N
    let snake = [{ x: 8, y: 8 }], dir = { x: 1, y: 0 }, food = { x: 4, y: 4 }, score = 0, over = false
    const place = () => { food = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 } }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((k === 'arrowup' || k === 'w') && dir.y === 0) dir = { x: 0, y: -1 }
      else if ((k === 'arrowdown' || k === 's') && dir.y === 0) dir = { x: 0, y: 1 }
      else if ((k === 'arrowleft' || k === 'a') && dir.x === 0) dir = { x: -1, y: 0 }
      else if ((k === 'arrowright' || k === 'd') && dir.x === 0) dir = { x: 1, y: 0 }
      if (k.startsWith('arrow')) e.preventDefault()
    }
    document.addEventListener('keydown', key)
    const end = () => { const a = accent(); ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = a; ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER · ' + score, cv.width / 2, cv.height / 2) }
    const tick = () => {
      if (over) return
      const h = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N }
      if (snake.some((s) => s.x === h.x && s.y === h.y)) { over = true; end(); return }
      snake.unshift(h)
      if (h.x === food.x && h.y === food.y) { score++; if (scoreRef.current) scoreRef.current.textContent = String(score); beep(880, 0.05); place() } else snake.pop()
      const a = accent()
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(food.x * S, food.y * S, S - 1, S - 1)
      ctx.fillStyle = a; snake.forEach((s) => ctx.fillRect(s.x * S, s.y * S, S - 1, S - 1))
    }
    const loop = setInterval(tick, 110)
    return () => { clearInterval(loop); document.removeEventListener('keydown', key) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={320} height={320} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline">score: <span ref={scoreRef} className="text-primary-fixed-dim">0</span> · arrows/WASD · Esc to quit</div>
    </>
  )
}
