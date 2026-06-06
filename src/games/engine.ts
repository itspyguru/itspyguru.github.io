// Shared "juice" toolkit for the canvas games — hi-DPI canvas, particles, screen-shake, draw helpers.
export const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#00e639').trim()
export const accentRGB = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb') || '0 230 57').trim().split(/\s+/).join(',')
export const rgba = (a: number) => `rgba(${accentRGB()},${a})`
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// crisp + responsive: backing store at DPR, displayed fluid up to logical size, drawing in logical px
export function fitCanvas(cv: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
  cv.style.width = '100%'; cv.style.maxWidth = w + 'px'; cv.style.aspectRatio = `${w} / ${h}`
  const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

export function glow(ctx: CanvasRenderingContext2D, color: string, blur = 12) { ctx.shadowColor = color; ctx.shadowBlur = blur }
export function noGlow(ctx: CanvasRenderingContext2D) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent' }

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; g: number }
export class Particles {
  ps: P[] = []
  burst(x: number, y: number, o: { count?: number; color?: string; speed?: number; life?: number; gravity?: number; size?: number } = {}) {
    const n = o.count ?? 12
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * (o.speed ?? 2.6) + 0.4
      this.ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: o.life ?? 0.6, color: o.color ?? accent(), size: o.size ?? 3, g: o.gravity ?? 0 })
    }
  }
  update(dt: number) {
    const k = dt * 60
    this.ps = this.ps.filter((p) => { p.life += dt; p.x += p.vx * k; p.y += p.vy * k; p.vy += p.g * k; return p.life < p.max })
  }
  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.ps) { ctx.globalAlpha = Math.max(0, 1 - p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size) }
    ctx.globalAlpha = 1
  }
}

export class Shake {
  t = 0; power = 0
  kick(power: number) { this.power = Math.max(this.power, power); this.t = 1 }
  frame(dt: number) { if (this.t <= 0) return { dx: 0, dy: 0 }; this.t -= dt * 3.5; const m = Math.max(0, this.t) * this.power; return { dx: (Math.random() * 2 - 1) * m, dy: (Math.random() * 2 - 1) * m } }
}

export type Star = { x: number; y: number; z: number }
export const makeStars = (n: number, W: number, H: number): Star[] => Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.8 + 0.2 }))
export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], W: number, dx: number) {
  ctx.fillStyle = '#ffffff'
  for (const s of stars) { s.x -= dx * s.z; if (s.x < 0) s.x += W; ctx.globalAlpha = s.z * 0.7; ctx.fillRect(s.x, s.y, s.z * 1.6 + 0.4, s.z * 1.6 + 0.4) }
  ctx.globalAlpha = 1
}

// consistent start / paused / game-over panel
export function panel(ctx: CanvasRenderingContext2D, W: number, H: number, title: string, sub?: string, hint?: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H)
  const a = accent(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  glow(ctx, a, 18); ctx.fillStyle = a; ctx.font = 'bold 26px "JetBrains Mono", monospace'; ctx.fillText(title, W / 2, H / 2 - 8); noGlow(ctx)
  if (sub) { ctx.fillStyle = '#cdd8cd'; ctx.font = '13px "JetBrains Mono", monospace'; ctx.fillText(sub, W / 2, H / 2 + 16) }
  if (hint) { ctx.fillStyle = '#7d8d7d'; ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillText(hint, W / 2, H / 2 + 40) }
}
