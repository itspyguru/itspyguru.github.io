import { useEffect, useRef } from 'react'
import { sfx, engineStart, engineSet, engineStop, skid } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent } from './engine'

// pseudo-3D OutRun-style racer: day/night, boost, banking, near-miss combos, stages, tunnels
type Pt = { world: { x?: number; y: number; z: number }; camera: { z: number }; screen: { x: number; y: number; w: number; scale: number } }
type Spr = { x: number; type: 'scenery' | 'lamp' | 'sign'; s: number }
type Seg = { index: number; curve: number; y: number; p1: Pt; p2: Pt; sprites: Spr[]; tunnel: boolean }
type Car = { z: number; offset: number; speed: number; color: string; big: boolean; hit: number; prevD: number; scored: boolean }
type Fuel = { z: number; offset: number; taken: boolean }

const W = 360, H = 440, SEG = 200, ROAD_W = 1100, CAM_H = 1100, DEPTH = 0.84, DRAW = 110, RUMBLE = 7, LANES = 3
const MAXBASE = 12000, MAXBOOST = 17000, STAGE_LEN = 600000
const easeIn = (a: number, b: number, p: number) => a + (b - a) * p * p
const easeIO = (a: number, b: number, p: number) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5)
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0]
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const hash = (a: number, b: number, c: number) => { const v = Math.sin(a * 99.7 + b * 12.9 + c * 78.2) * 43758.5; return v - Math.floor(v) }
const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const lerpC = (a: string, b: string, t: number) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})` }
const mul = (h: string, f: number) => { const A = hx(h); return `rgb(${A.map((v) => Math.round(v * f)).join(',')})` }

const STAGES = [
  { name: 'NEO CITY', grass: '#163a22', far: '#1a2636', scene: 'city' },
  { name: 'DUST FLATS', grass: '#6b5a2a', far: '#7a5a3a', scene: 'desert' },
  { name: 'COASTLINE', grass: '#1f6b5a', far: '#2a6a7a', scene: 'coast' },
]

export default function Racing() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.45, z: Math.random() }))

    // ---- build endless track ----
    const segs: Seg[] = []
    const lastY = () => (segs.length ? segs[segs.length - 1].y : 0)
    const addSeg = (curve: number, y: number) => segs.push({ index: segs.length, curve, y, sprites: [], tunnel: false, p1: null as any, p2: null as any })
    const addRoad = (en: number, ho: number, le: number, curve: number, hill: number) => {
      const sY = lastY(), eY = sY + hill, tot = en + ho + le
      for (let n = 0; n < en; n++) addSeg(easeIn(0, curve, n / en), easeIO(sY, eY, n / tot))
      for (let n = 0; n < ho; n++) addSeg(curve, easeIO(sY, eY, (en + n) / tot))
      for (let n = 0; n < le; n++) addSeg(easeIO(curve, 0, n / le), easeIO(sY, eY, (en + ho + n) / tot))
    }
    addRoad(30, 30, 30, 0, 0)
    while (segs.length < 1600) { addRoad(pick([20, 40]), pick([30, 60]), pick([20, 40]), pick([-6, -4, -2, 0, 0, 2, 4, 6]), pick([-4500, -2200, 0, 0, 2200, 4500, 6500])) }
    const LEN = segs.length, LZ = LEN * SEG
    segs.forEach((s, i) => { s.p1 = { world: { y: s.y, z: i * SEG }, camera: { z: 0 }, screen: { x: 0, y: 0, w: 0, scale: 0 } }; const nx = segs[i + 1] || s; s.p2 = { world: { y: nx.y, z: (i + 1) * SEG }, camera: { z: 0 }, screen: { x: 0, y: 0, w: 0, scale: 0 } } })
    // scenery (stage-resolved at render), lamps (alternating), signs, tunnels
    for (let i = 16; i < LEN; i += 3 + ((Math.random() * 5) | 0)) { const side = Math.random() < 0.5 ? -1 : 1; segs[i].sprites.push({ x: side * (1.6 + Math.random() * 1.8), type: 'scenery', s: Math.random() }) }
    for (let i = 12; i < LEN; i += 18) segs[i].sprites.push({ x: (i % 36 === 12 ? -1 : 1) * 1.15, type: 'lamp', s: 0 })
    for (let i = 60; i < LEN; i += 140) segs[i].sprites.push({ x: (Math.random() < 0.5 ? -1 : 1) * 1.7, type: 'sign', s: Math.random() })
    for (let i = 320; i < LEN; i += 360) for (let j = 0; j < 44; j++) if (segs[i + j]) segs[i + j].tunnel = true

    const cars: Car[] = []
    for (let i = 0; i < 18; i++) { const big = Math.random() < 0.22; cars.push({ z: 5000 + Math.random() * (LZ - 5000), offset: Math.random() * 1.3 - 0.65, speed: (big ? 1400 : 2200) + Math.random() * 2400, color: big ? pick(['#c0844a', '#7a8a99']) : pick(['#ff5566', '#4d80ff', '#ffd400', '#e0e0e8']), big, hit: 0, prevD: 0, scored: false }) }
    const fuels: Fuel[] = []
    for (let z = 1500; z < LZ; z += 7000 + Math.random() * 4000) fuels.push({ z, offset: Math.random() * 1.2 - 0.6, taken: false })

    // ---- state ----
    let state: 'start' | 'count' | 'play' | 'pause' | 'over' = 'start'
    let pos = 0, playerX = 0, speed = 0, steer = 0, dist = 0, fuel = 1, best = getBest('racing'), so = { dx: 0, dy: 0 }
    let lastPos = 0, bgX = 0, boost = 1, boosting = false, depth = DEPTH, bank = 0, wasOff = false, countT = 0
    let combo = 0, comboT = 0, score = 0, pop = { text: '', t: 0 }
    const keys: Record<string, boolean> = {}
    const reset = () => { pos = 0; playerX = 0; speed = 0; steer = 0; dist = 0; fuel = 1; lastPos = 0; bgX = 0; boost = 1; boosting = false; depth = DEPTH; bank = 0; combo = 0; comboT = 0; score = 0; pop = { text: '', t: 0 }; cars.forEach((c) => { c.hit = 0; c.scored = false; c.prevD = 0 }); fuels.forEach((f) => f.taken = false) }
    const begin = () => { reset(); state = 'count'; countT = 3.6; sfx.start() }
    const segAt = (z: number) => segs[Math.floor(z / SEG) % LEN]
    const wrapDelta = (a: number, b: number) => { let d = a - b; while (d < -LZ / 2) d += LZ; while (d > LZ / 2) d -= LZ; return d }
    const stageAt = (d: number) => STAGES[Math.floor(d / STAGE_LEN) % STAGES.length]
    const showPop = (t: string) => { pop = { text: t, t: 1 } }

    function update(dt: number) {
      parts.update(dt); so = shake.frame(dt)
      if (pop.t > 0) pop.t -= dt * 1.2
      if (state === 'count') { countT -= dt; if (countT <= 0) state = 'play'; return }
      if (state !== 'play') return
      const seg = segAt(pos), spct = speed / MAXBASE
      boosting = !!keys['shift'] && boost > 0.02 && speed > 1000
      const cap = boosting ? MAXBOOST : MAXBASE
      if (keys['arrowup'] || keys['w']) speed += (MAXBASE / (boosting ? 2 : 3.5)) * dt
      else if (keys['arrowdown'] || keys['s']) speed -= (MAXBASE / 2) * dt
      else speed -= (MAXBASE / 6) * dt
      if (boosting) { boost = Math.max(0, boost - dt * 0.4) } else boost = Math.min(1, boost + dt * 0.12)
      depth += ((boosting ? 0.94 : DEPTH) - depth) * 0.1
      steer = (keys['arrowleft'] || keys['a']) ? -1 : (keys['arrowright'] || keys['d']) ? 1 : 0
      playerX += steer * dt * (1.4 + spct)
      playerX -= dt * spct * seg.curve * 0.32
      const off = Math.abs(playerX) > 1
      if (off) { speed -= (MAXBASE / 1.5) * dt; if (speed > 1500 && Math.random() < 0.5) { parts.burst(W / 2 + playerX * 20, H - 40, { color: '#6b5a3a', count: 2, speed: 2, life: 0.4, gravity: 0.05 }); shake.kick(2) } if (!wasOff && speed > 3000) skid() }
      wasOff = off
      speed = clamp(speed, 0, cap); playerX = clamp(playerX, -2.4, 2.4)
      bank += (-seg.curve * spct * 0.02 - bank) * 0.08
      lastPos = pos; pos = (pos + speed * dt) % LZ; dist += speed * dt
      if (pos < lastPos) fuels.forEach((f) => f.taken = false)
      fuel -= dt * (0.008 + spct * 0.028)
      if (fuel <= 0) { fuel = 0; state = 'over'; best = setBest('racing', Math.floor(dist / 100)); shake.kick(10); sfx.lose(); return }
      if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0 }
      cars.forEach((c) => {
        c.z = (c.z + c.speed * dt) % LZ; if (c.hit > 0) c.hit -= dt
        const d = wrapDelta(c.z, pos), lat = Math.abs(playerX - c.offset)
        if (c.hit <= 0 && d > -SEG && d < SEG * 1.4 && lat < 0.42 && speed > c.speed * 0.5) { speed *= 0.42; c.hit = 1.2; combo = 0; shake.kick(9); sfx.explode(); skid(); parts.burst(W / 2 + (c.offset - playerX) * 60, H - 60, { color: c.color, count: 16, speed: 4, life: 0.6 }) }
        if (!c.scored && c.prevD > 0 && d <= 0 && c.hit <= 0) { c.scored = true; if (lat < 1.05) { combo++; comboT = 3; score += 50 * combo; boost = Math.min(1, boost + 0.16); showPop((combo > 1 ? combo + 'x ' : '') + 'NEAR MISS!'); sfx.score() } else { score += 10 } }
        if (d > SEG) c.scored = false
        c.prevD = d
      })
      fuels.forEach((f) => { if (f.taken) return; const d = wrapDelta(f.z, pos); if (d > -SEG && d < SEG * 1.6 && Math.abs(playerX - f.offset) < 0.7) { f.taken = true; fuel = Math.min(1, fuel + 0.45); sfx.powerup(); showPop('+FUEL'); parts.burst(W / 2, H - 70, { color: '#ffd400', count: 18, speed: 3.5, life: 0.6 }) } })
      bgX += seg.curve * spct * 0.02
    }

    function project(p: Pt, camX: number, camY: number, camZ: number) {
      p.camera.z = p.world.z - camZ
      const sc = depth / (p.camera.z || 0.0001)
      p.screen.scale = sc
      p.screen.x = Math.round(W / 2 + sc * ((p.world.x || 0) - camX) * W / 2)
      p.screen.y = Math.round(H / 2 - sc * (p.world.y - camY) * H / 2)
      p.screen.w = Math.round(sc * ROAD_W * W / 2)
    }
    const poly = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, col: string) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill() }

    function drawBg(night: number, st: typeof STAGES[number]) {
      const top = lerpC('#24405f', '#070b18', night), bot = lerpC(st.far, '#10182c', night)
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.62); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      if (night > 0.2) { for (const s of stars) { ctx.globalAlpha = night * s.z; ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, 1.4, 1.4) } ctx.globalAlpha = 1 }
      const sunX = W / 2 - (bgX * 0.3) % W, sunC = lerpC('#ffd27f', '#e8eefc', night)
      glow(ctx, sunC, night > 0.4 ? 16 : 34); ctx.fillStyle = sunC; ctx.beginPath(); ctx.arc(((sunX % W) + W) % W, H * 0.26, night > 0.4 ? 18 : 26, 0, 7); ctx.fill(); noGlow(ctx)
      const off = (bgX % W + W) % W
      for (let layer = 0; layer < 2; layer++) { ctx.fillStyle = mul(lerpC(st.far, '#10182c', night), layer ? 1 : 0.8); const by = H * 0.42 + layer * 14; for (let m = -1; m < 4; m++) { const mx = m * 130 - off * (layer ? 0.6 : 0.35); ctx.beginPath(); ctx.moveTo(mx, by); ctx.lineTo(mx + 65, by - 60 - layer * 10); ctx.lineTo(mx + 130, by); ctx.closePath(); ctx.fill() } }
    }
    function spr(seg: Seg, offset: number, draw: (x: number, y: number, s: number, side: number) => void) { const sc = seg.p1.screen.scale; if (sc <= 0) return; draw(seg.p1.screen.x + sc * offset * ROAD_W * W / 2, seg.p1.screen.y, sc, offset < 0 ? -1 : 1) }

    function render() {
      const a = accent(), st = stageAt(dist), night = (1 - Math.cos((dist / 300000) * Math.PI * 2)) / 2
      drawBg(night, st)
      const base = Math.floor(pos / SEG), baseSeg = segs[base % LEN], basePct = (pos % SEG) / SEG
      const camY = CAM_H + baseSeg.y
      let maxy = H, x = 0, dx = -(baseSeg.curve * basePct)
      const drawn: Seg[] = []
      const nf = 1 - night * 0.5 // night darken factor
      ctx.save(); ctx.translate(W / 2 + so.dx, H + so.dy); ctx.rotate(bank); ctx.translate(-W / 2, -H)
      for (let n = 0; n < DRAW; n++) {
        const i = (base + n) % LEN, seg = segs[i], looped = base + n >= LEN
        project(seg.p1, playerX * ROAD_W - x, camY, pos - (looped ? LZ : 0)); project(seg.p2, playerX * ROAD_W - x - dx, camY, pos - (looped ? LZ : 0))
        x += dx; dx += seg.curve
        const p1 = seg.p1.screen, p2 = seg.p2.screen
        if (seg.p1.camera.z <= depth || p2.y >= p1.y || p2.y >= maxy) continue
        const far = n > 58 // distant segments: flat colours (no rumble/lane alternation) to kill horizon shimmer
        const dark = Math.floor(i / RUMBLE) % 2 === 0
        const grass = mul(far ? st.grass : (dark ? st.grass : lerpC(st.grass, '#000', 0.08)), nf), road = mul(far ? '#494951' : (dark ? '#46464e' : '#4c4c54'), nf)
        poly(0, p1.y, 0, p2.y, W, p2.y, W, p1.y, grass)
        if (!far) { const rum = dark ? mul('#d4d4dc', nf) : '#b83b3b'; poly(p1.x - p1.w * 1.18, p1.y, p2.x - p2.w * 1.18, p2.y, p2.x - p2.w, p2.y, p1.x - p1.w, p1.y, rum); poly(p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w * 1.18, p2.y, p1.x + p1.w * 1.18, p1.y, rum) }
        poly(p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x + p2.w, p2.y, p1.x + p1.w, p1.y, road)
        if (!far && !dark) for (let l = 1; l < LANES; l++) { const o = l / LANES * 2 - 1; poly(p1.x + o * p1.w - p1.w * 0.02, p1.y, p2.x + o * p2.w - p2.w * 0.02, p2.y, p2.x + o * p2.w + p2.w * 0.02, p2.y, p1.x + o * p1.w + p1.w * 0.02, p1.y, 'rgba(230,230,240,0.4)') }
        if (seg.tunnel) { const t1 = p1.w * 2.1, t2 = p2.w * 2.1, wall = mul('#2a2a32', nf), ceil = mul('#1c1c22', nf); poly(p1.x - p1.w * 1.18, p1.y, p2.x - p2.w * 1.18, p2.y, p2.x - p2.w * 1.18, p2.y - t2, p1.x - p1.w * 1.18, p1.y - t1, wall); poly(p1.x + p1.w * 1.18, p1.y, p2.x + p2.w * 1.18, p2.y, p2.x + p2.w * 1.18, p2.y - t2, p1.x + p1.w * 1.18, p1.y - t1, wall); poly(p1.x - p1.w * 1.18, p1.y - t1, p2.x - p2.w * 1.18, p2.y - t2, p2.x + p2.w * 1.18, p2.y - t2, p1.x + p1.w * 1.18, p1.y - t1, ceil) }
        maxy = p2.y; drawn.push(seg)
      }
      // smooth distance haze (single gradient, not per-segment → no banding flicker)
      const hc = night > 0.5 ? '12,18,34' : '58,74,92'
      const hz = ctx.createLinearGradient(0, maxy, 0, maxy + 150); hz.addColorStop(0, `rgba(${hc},0.9)`); hz.addColorStop(1, `rgba(${hc},0)`)
      ctx.fillStyle = hz; ctx.fillRect(0, maxy, W, 150)
      // objects far -> near
      const carsBySeg: Record<number, Car[]> = {}; cars.forEach((c) => { const si = Math.floor(c.z / SEG) % LEN; (carsBySeg[si] ||= []).push(c) })
      const fuelBySeg: Record<number, Fuel[]> = {}; fuels.forEach((f) => { if (!f.taken) { const si = Math.floor(f.z / SEG) % LEN; (fuelBySeg[si] ||= []).push(f) } })
      for (let k = drawn.length - 1; k >= 0; k--) {
        const seg = drawn[k]
        const farT = drawn.length > 1 ? k / (drawn.length - 1) : 0
        ctx.globalAlpha = farT > 0.72 ? Math.max(0, 1 - (farT - 0.72) / 0.28) : 1 // fade scenery in near the horizon
        seg.sprites.forEach((sp) => spr(seg, sp.x, (X, Y, sc, side) => {
          if (sp.type === 'lamp') { const h = sc * 2600 * W / 2; ctx.strokeStyle = mul('#888', nf); ctx.lineWidth = Math.max(1, sc * 120 * W / 2); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y - h); ctx.lineTo(X - side * h * 0.18, Y - h); ctx.stroke(); const lc = lerpC('#555', '#ffe08a', night); glow(ctx, '#ffe08a', night > 0.3 ? 14 : 0); ctx.fillStyle = lc; ctx.beginPath(); ctx.arc(X - side * h * 0.18, Y - h, Math.max(1.5, sc * 160 * W / 2), 0, 7); ctx.fill(); noGlow(ctx); if (night > 0.3) { ctx.globalAlpha = night * 0.25; ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.ellipse(X - side * h * 0.1, Y, h * 0.5, h * 0.06, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1 } }
          else if (sp.type === 'sign') { const h = sc * 1700 * W / 2, w = h * 1.5; ctx.fillStyle = mul('#555', nf); ctx.fillRect(X - w * 0.04, Y - h, w * 0.08, h); const bx = side > 0 ? X : X - w; glow(ctx, a, 6); ctx.fillStyle = mul('#10160f', nf); ctx.fillRect(bx, Y - h * 1.7, w, h * 0.8); ctx.strokeStyle = a; ctx.lineWidth = 1.5; ctx.strokeRect(bx, Y - h * 1.7, w, h * 0.8); noGlow(ctx); ctx.fillStyle = a; ctx.font = `bold ${Math.max(5, h * 0.32)}px "JetBrains Mono",monospace`; ctx.textAlign = 'center'; ctx.fillText('pyGuru', bx + w / 2, Y - h * 1.18) }
          else { // scenery anchored by inner edge, grows outward
            if (st.scene === 'city') { const h = Math.min(sc * (4200 + sp.s * 3400) * W / 2, H * 1.7), w = h * (0.4 + sp.s * 0.18), bx = side > 0 ? X : X - w; const g = ctx.createLinearGradient(bx, 0, bx + w, 0); g.addColorStop(0, mul(['#2a3550', '#34304a', '#283a44', '#3a2f3f'][(sp.s * 4) | 0], nf)); g.addColorStop(1, mul('#141d2e', nf)); ctx.fillStyle = g; ctx.fillRect(bx, Y - h, w, h); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx, Y - h, w, Math.max(2, h * 0.04)); const cols = Math.max(2, Math.round(w / 9)), rows = Math.max(3, Math.round(h / 13)), cw = (w * 0.76) / cols, ch = Math.min(8, (h * 0.9) / rows); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const lit = hash(sp.s, r, c) > (0.62 - night * 0.25); ctx.fillStyle = lit ? `rgba(255,221,140,${0.5 + night * 0.4})` : 'rgba(35,45,66,0.55)'; ctx.fillRect(bx + w * 0.12 + c * cw + cw * 0.18, Y - h + h * 0.06 + r * (ch + 5), cw * 0.62, ch) } }
            else if (st.scene === 'desert') { const h = sc * (2000 + sp.s * 1200) * W / 2, w = h * 0.4; ctx.fillStyle = mul('#3a7a3a', nf); roundRect(ctx, X - w * 0.16, Y - h, w * 0.32, h, w * 0.16); ctx.fill(); roundRect(ctx, X - w * 0.16, Y - h * 0.6, w * 0.5, w * 0.18, 4); ctx.fill(); roundRect(ctx, X + w * 0.16, Y - h * 0.45, w * 0.18, h * 0.3, 4); ctx.fill() }
            else { const h = sc * (3000 + sp.s * 1500) * W / 2, w = h * 0.5; ctx.fillStyle = mul('#6b4a2a', nf); ctx.fillRect(X - w * 0.05, Y - h * 0.7, w * 0.1, h * 0.7); ctx.fillStyle = mul('#1f8a5a', nf); for (let f = 0; f < 5; f++) { const ang = -Math.PI / 2 + (f - 2) * 0.5; ctx.beginPath(); ctx.moveTo(X, Y - h * 0.7); ctx.lineTo(X + Math.cos(ang) * w * 0.7, Y - h * 0.7 + Math.sin(ang) * w * 0.7); ctx.lineTo(X + Math.cos(ang + 0.18) * w * 0.5, Y - h * 0.7 + Math.sin(ang + 0.18) * w * 0.5); ctx.closePath(); ctx.fill() } }
          }
        }))
        ctx.globalAlpha = 1
        const si = seg.index
        ;(fuelBySeg[si] || []).forEach((f) => spr(seg, f.offset, (X, Y, sc) => { const s = Math.min(sc * 1250 * W / 2, 40); if (s < 1) return; const bob = Math.sin(dist / 200 + f.z) * s * 0.12; glow(ctx, '#ffd400', 10); ctx.fillStyle = '#ffd400'; roundRect(ctx, X - s * 0.3, Y - s + bob, s * 0.6, s, 2); ctx.fill(); ctx.fillStyle = '#0a0a0a'; ctx.font = `bold ${Math.max(6, s * 0.5)}px monospace`; ctx.textAlign = 'center'; ctx.fillText('⛽', X, Y - s * 0.32 + bob); noGlow(ctx) }))
        ;(carsBySeg[si] || []).forEach((c) => spr(seg, c.offset, (X, Y, sc) => { const w = Math.min(sc * (c.big ? 1350 : 980) * W / 2, c.big ? 96 : 70); if (w < 1) return; const h = w * (c.big ? 0.95 : 0.72); glow(ctx, c.color, 6); ctx.fillStyle = c.color; roundRect(ctx, X - w / 2, Y - h, w, h, 3); ctx.fill(); ctx.fillStyle = 'rgba(10,10,12,0.7)'; ctx.fillRect(X - w * 0.36, Y - h * 0.8, w * 0.72, h * 0.4); ctx.fillStyle = '#ff5555'; ctx.fillRect(X - w / 2, Y - h * 0.2, w * 0.18, h * 0.16); ctx.fillRect(X + w * 0.32, Y - h * 0.2, w * 0.18, h * 0.16); noGlow(ctx) }))
      }
      // player car
      const pcw = 54, pch = 34, pcx = W / 2 + steer * 5, pcy = H - 24
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(pcx, pcy + 3, pcw * 0.62, 9, 0, 0, 7); ctx.fill()
      ctx.save(); ctx.translate(pcx, pcy); ctx.rotate(steer * 0.05)
      ctx.fillStyle = '#0a0a0a'; roundRect(ctx, -pcw / 2 - 3, -pch + 9, 6, pch * 0.5, 2); ctx.fill(); roundRect(ctx, pcw / 2 - 3, -pch + 9, 6, pch * 0.5, 2); ctx.fill()
      glow(ctx, boosting ? '#46b6ff' : a, boosting ? 18 : 12); ctx.fillStyle = a; roundRect(ctx, -pcw / 2, -pch, pcw, pch, 7); ctx.fill(); noGlow(ctx)
      ctx.fillStyle = 'rgba(10,14,10,0.85)'; roundRect(ctx, -pcw * 0.36, -pch * 0.86, pcw * 0.72, pch * 0.44, 3); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; roundRect(ctx, -pcw * 0.3, -pch * 0.8, pcw * 0.6, pch * 0.16, 2); ctx.fill()
      glow(ctx, '#ff3b3b', 6); ctx.fillStyle = '#ff4d4d'; ctx.fillRect(-pcw / 2 + 4, -7, 11, 6); ctx.fillRect(pcw / 2 - 15, -7, 11, 6); noGlow(ctx)
      if (boosting) { ctx.fillStyle = '#46b6ff'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, 14 + Math.random() * 10); ctx.closePath(); ctx.fill() }
      ctx.restore()
      if (boosting) { ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 2; for (const fx of [0.1, 0.26, 0.42, 0.58, 0.74, 0.9]) { const lx = fx * W; ctx.beginPath(); ctx.moveTo(lx, H * 0.44); ctx.lineTo(lx, H * 0.44 + 70); ctx.stroke() } ctx.lineWidth = 1 }
      parts.draw(ctx); ctx.restore()
      hud(a, st, night)
    }
    function hud(a: string, st: typeof STAGES[number], night: number) {
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = a; ctx.font = 'bold 13px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(Math.floor(dist / 100) + 'm', 12, 24)
      ctx.textAlign = 'right'; ctx.fillText(Math.round(speed / MAXBASE * 260) + ' km/h', W - 12, 24)
      // fuel
      const fw = 110, fx = (W - fw) / 2, fy = 13; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(fx, fy, fw, 7); ctx.fillStyle = fuel > 0.3 ? a : '#ff5555'; ctx.fillRect(fx, fy, fw * fuel, 7); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(fx, fy, fw, 7)
      ctx.fillStyle = '#cdd8cd'; ctx.font = '7px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('FUEL', W / 2, fy + 16)
      // stage + night chip
      ctx.fillStyle = a; ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(st.name + (night > 0.5 ? ' · NIGHT' : ''), W / 2, 40)
      // boost meter
      const bw = 90, bx = 12, by = H - 14; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, bw, 6); ctx.fillStyle = boosting ? '#46b6ff' : '#2b8fd0'; ctx.fillRect(bx, by, bw * boost, 6); ctx.fillStyle = '#9fc6e0'; ctx.font = '7px "JetBrains Mono",monospace'; ctx.textAlign = 'left'; ctx.fillText('NITRO (shift)', bx, by - 4)
      // gear + rpm
      const spct = speed / MAXBASE, gear = Math.min(6, Math.floor(spct * 6) + 1), rpm = (spct * 6) % 1
      ctx.textAlign = 'right'; ctx.fillStyle = a; ctx.font = 'bold 16px "JetBrains Mono",monospace'; ctx.fillText('G' + gear, W - 12, H - 12)
      const rw = 90, rx = W - 12 - rw, ry = H - 24; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(rx, ry, rw, 5); ctx.fillStyle = rpm > 0.85 ? '#ff5555' : a; ctx.fillRect(rx, ry, rw * rpm, 5)
      // combo
      if (combo > 1) { ctx.fillStyle = a; ctx.font = 'bold 14px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(combo + 'x COMBO', W / 2, 56) }
      if (pop.t > 0) { ctx.globalAlpha = Math.min(1, pop.t); ctx.fillStyle = '#ffd400'; ctx.font = 'bold 16px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(pop.text, W / 2, H / 2 - 30); ctx.globalAlpha = 1 }
      if (state === 'count') { const n = Math.ceil(countT - 0.6); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H); glow(ctx, a, 24); ctx.fillStyle = a; ctx.font = 'bold 80px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(n > 0 ? String(n) : 'GO!', W / 2, H / 2 + 20); noGlow(ctx) }
    }
    function panelScreen(title: string, sub: string, hint: string) { ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H); const a = accent(); ctx.textAlign = 'center'; glow(ctx, a, 18); ctx.fillStyle = a; ctx.font = 'bold 26px "JetBrains Mono",monospace'; ctx.fillText(title, W / 2, H / 2 - 8); noGlow(ctx); ctx.fillStyle = '#cdd8cd'; ctx.font = '13px "JetBrains Mono",monospace'; ctx.fillText(sub, W / 2, H / 2 + 16); ctx.fillStyle = '#7d8d7d'; ctx.font = '11px "JetBrains Mono",monospace'; ctx.fillText(hint, W / 2, H / 2 + 40) }

    let raf = 0, last = performance.now()
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts; update(dt); render()
      if (state === 'play' || state === 'count') { engineStart(); engineSet(speed / MAXBASE, boosting) } else engineStop()
      if (state === 'start') panelScreen('RACING', 'best ' + best + 'm', 'SPACE to start')
      else if (state === 'pause') panelScreen('PAUSED', '', 'press P to resume')
      else if (state === 'over') panelScreen('OUT OF FUEL', Math.floor(dist / 100) + 'm · best ' + best + 'm', 'press R to retry')
      raf = requestAnimationFrame(loop)
    }
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault()
      if (k === ' ') { if (state === 'start' || state === 'over') begin(); return }
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; return }
      if (k === 'r') { if (state !== 'start') begin(); return }
      keys[k] = true
    }
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
    const click = () => { if (state === 'start' || state === 'over') begin() }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); engineStop(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">↑ accel · ↓ brake · ←→ steer · SHIFT nitro · grab ⛽ · P pause · R retry · Esc</div>
    </>
  )
}
