import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, roundRect, accent, rgba, lerp, panel } from './engine'

let _id = 0
type Tile = { id: number; val: number; r: number; c: number; px: number; py: number; fx: number; fy: number; tx: number; ty: number; sc: number }

export default function Game2048() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, N = 4, W = 360, H = 360, gap = 10, S = (W - gap * (N + 1)) / N
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const cp = (i: number) => gap + i * (S + gap)
    let tiles: Tile[] = [], state: 'start' | 'play' | 'over' = 'start'
    let score = 0, best = getBest('2048'), anim = 0, ANIM = 0.1, pending: (() => void) | null = null, so = { dx: 0, dy: 0 }
    const gridOf = () => { const g: (Tile | null)[][] = Array.from({ length: N }, () => Array(N).fill(null)); tiles.forEach((t) => { g[t.r][t.c] = t }); return g }
    const mk = (r: number, c: number, val: number): Tile => ({ id: ++_id, val, r, c, px: cp(c), py: cp(r), fx: cp(c), fy: cp(r), tx: cp(c), ty: cp(r), sc: 0 })
    function addTile() { const g = gridOf(), e: [number, number][] = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) e.push([r, c]); if (!e.length) return; const [r, c] = e[(Math.random() * e.length) | 0]; tiles.push(mk(r, c, Math.random() < 0.9 ? 2 : 4)) }
    const reset = () => { tiles = []; score = 0; addTile(); addTile() }
    const start = () => { reset(); state = 'play'; sfx.start() }
    function isOver() { const g = gridOf(); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (!g[r][c]) return false; if (c < N - 1 && g[r][c]!.val === g[r][c + 1]?.val) return false; if (r < N - 1 && g[r][c]!.val === g[r + 1][c]?.val) return false } return true }

    function move(dir: number) {
      if (state !== 'play' || anim > 0) return
      const g = gridOf(); let moved = false; const gone: Tile[] = [], dbl: Tile[] = []
      for (let i = 0; i < N; i++) {
        const line: [number, number][] = []
        for (let j = 0; j < N; j++) { let r: number, c: number; if (dir === 0) { r = i; c = j } else if (dir === 2) { r = i; c = N - 1 - j } else if (dir === 1) { r = j; c = i } else { r = N - 1 - j; c = i } line.push([r, c]) }
        const seq = line.map(([r, c]) => g[r][c]).filter(Boolean) as Tile[]
        let pos = 0, k = 0
        while (k < seq.length) {
          const t = seq[k]
          if (k + 1 < seq.length && seq[k + 1].val === t.val) {
            const [tr, tc] = line[pos], o = seq[k + 1]
            if (t.r !== tr || t.c !== tc || o.r !== tr || o.c !== tc) moved = true
            t.r = tr; t.c = tc; o.r = tr; o.c = tc; gone.push(o); dbl.push(t); pos++; k += 2
          } else { const [tr, tc] = line[pos]; if (t.r !== tr || t.c !== tc) moved = true; t.r = tr; t.c = tc; pos++; k++ }
        }
      }
      if (!moved) return
      tiles.forEach((t) => { t.fx = t.px; t.fy = t.py; t.tx = cp(t.c); t.ty = cp(t.r) })
      anim = ANIM; sfx.bounce()
      pending = () => {
        dbl.forEach((t) => { t.val *= 2; score += t.val; t.sc = 1.25; parts.burst(cp(t.c) + S / 2, cp(t.r) + S / 2, { color: accent(), count: 8, speed: 2.4, life: 0.45 }) })
        tiles = tiles.filter((t) => !gone.includes(t))
        addTile(); if (score > best) best = setBest('2048', score)
        if (isOver()) { state = 'over'; best = setBest('2048', score); shake.kick(6); sfx.lose() } else if (dbl.length) sfx.score()
      }
    }
    function step(dt: number) {
      parts.update(dt); so = shake.frame(dt)
      tiles.forEach((t) => { t.sc += (1 - t.sc) * 0.2 })
      if (anim > 0) { anim -= dt; const p = anim <= 0 ? 1 : 1 - anim / ANIM, e = p * (2 - p); tiles.forEach((t) => { t.px = lerp(t.fx, t.tx, e); t.py = lerp(t.fy, t.ty, e) }); if (anim <= 0) { tiles.forEach((t) => { t.px = t.tx; t.py = t.ty }); pending?.(); pending = null } }
    }
    function tileColor(v: number) { return rgba(Math.min(0.14 + Math.log2(v) / 11, 0.92)) }
    function render() {
      const a = accent()
      ctx.fillStyle = '#0a0f0a'; ctx.fillRect(0, 0, W, H)
      ctx.save(); ctx.translate(so.dx, so.dy)
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRect(ctx, cp(c), cp(r), S, S, 8); ctx.fill() }
      for (const t of tiles) {
        const cx = t.px + S / 2, cy = t.py + S / 2, s = S * t.sc
        ctx.fillStyle = tileColor(t.val); roundRect(ctx, cx - s / 2, cy - s / 2, s, s, 8); ctx.fill()
        ctx.fillStyle = t.val <= 4 ? a : '#06120d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.font = `bold ${t.val >= 1024 ? 20 : 28}px "JetBrains Mono", monospace`; ctx.globalAlpha = Math.min(1, t.sc); ctx.fillText(String(t.val), cx, cy + 1); ctx.globalAlpha = 1
      }
      parts.draw(ctx); ctx.restore()
      ctx.textBaseline = 'alphabetic'; ctx.fillStyle = a; ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText('score ' + score, 8, H - 6); ctx.textAlign = 'right'; ctx.fillText('best ' + best, W - 8, H - 6)
      if (state === 'start') panel(ctx, W, H, '2048', 'join the numbers · best ' + best, 'arrows / WASD · SPACE to start')
      else if (state === 'over') panel(ctx, W, H, 'GAME OVER', `score ${score} · best ${best}`, 'press R to retry')
    }
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); if (state !== 'play') start(); return }
      if (k === 'r') { if (state !== 'start') start(); return }
      let d = -1; if (k === 'arrowleft' || k === 'a') d = 0; else if (k === 'arrowup' || k === 'w') d = 1; else if (k === 'arrowright' || k === 'd') d = 2; else if (k === 'arrowdown' || k === 's') d = 3
      if (d >= 0) { e.preventDefault(); move(d) }
    }
    const click = () => { if (state !== 'play') start() }
    reset(); document.addEventListener('keydown', key); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">arrows / WASD · SPACE start · R retry · Esc quit</div>
    </>
  )
}
