import { useEffect, useRef } from 'react'
import { beep } from '../os/sound'
const accentHex = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()
const hexCommas = (hex: string) => { const m = hex.replace('#', '').match(/.{1,2}/g) || ['0', '0', '0']; return m.map((x) => parseInt(x, 16)).join(',') }

export default function Game2048() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, ctx = cv.getContext('2d')!, N = 4, gap = 8, S = (cv.width - gap * (N + 1)) / N
    let board = Array.from({ length: N }, () => Array(N).fill(0)), score = 0, over = false
    const add = () => { const e: number[][] = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!board[r][c]) e.push([r, c]); if (!e.length) return; const [r, c] = e[(Math.random() * e.length) | 0]; board[r][c] = Math.random() < 0.9 ? 2 : 4 }
    const slide = (row: number[]) => { let a = row.filter((x) => x); for (let i = 0; i < a.length - 1; i++) { if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a.splice(i + 1, 1) } } while (a.length < N) a.push(0); return a }
    const rot = (bd: number[][]) => { const n = bd.length, m = Array.from({ length: n }, () => Array(n).fill(0)); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) m[c][n - 1 - r] = bd[r][c]; return m }
    const isOver = () => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (!board[r][c]) return false; if (c < N - 1 && board[r][c] === board[r][c + 1]) return false; if (r < N - 1 && board[r][c] === board[r + 1][c]) return false } return true }
    const drawOver = () => { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = accentHex(); ctx.font = '22px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER · ' + score, cv.width / 2, cv.height / 2) }
    const draw = () => {
      const rgb = hexCommas(accentHex()); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, cv.width, cv.height)
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const x = gap + c * (S + gap), y = gap + r * (S + gap), v = board[r][c]
        ctx.fillStyle = v ? `rgba(${rgb},${Math.min(0.15 + Math.log2(v) / 11, 0.95)})` : 'rgba(255,255,255,0.04)'
        ctx.fillRect(x, y, S, S)
        if (v) { ctx.fillStyle = '#0a0a0a'; ctx.font = 'bold ' + (v >= 1024 ? 20 : 26) + 'px JetBrains Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(v), x + S / 2, y + S / 2) }
      }
    }
    const move = (dir: number) => {
      let bd = board.map((r) => r.slice()); for (let i = 0; i < dir; i++) bd = rot(bd)
      let moved = false; const nb = bd.map((row) => { const s = slide(row); if (s.join() !== row.join()) moved = true; return s })
      let res = nb; for (let i = 0; i < (4 - dir) % 4; i++) res = rot(res)
      if (moved) { board = res; add(); if (scoreRef.current) scoreRef.current.textContent = String(score); beep(330, 0.02); draw(); if (isOver()) { over = true; drawOver() } }
    }
    const key = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); let d = -1; if (k === 'arrowleft' || k === 'a') d = 0; else if (k === 'arrowup' || k === 'w') d = 1; else if (k === 'arrowright' || k === 'd') d = 2; else if (k === 'arrowdown' || k === 's') d = 3; if (d >= 0) { e.preventDefault(); if (!over) move(d) } }
    document.addEventListener('keydown', key); add(); add(); draw()
    return () => document.removeEventListener('keydown', key)
  }, [])
  return (
    <>
      <canvas ref={cvRef} width={360} height={360} className="border border-primary-fixed-dim/40" />
      <div className="text-data-label text-outline">score: <span ref={scoreRef} className="text-primary-fixed-dim">0</span> · arrows/WASD · Esc to quit</div>
    </>
  )
}
