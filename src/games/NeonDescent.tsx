import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, accentRGB, panel } from './engine'
import { LEVELS } from './doomLevels'

// Wolf3D-style raycaster: DDA wall casting + per-column z-buffer + billboarded sprite enemies.
type EType = 'g' | 'i' | 'b'
type Enemy = { x: number; y: number; type: EType; hp: number; maxhp: number; state: 'idle' | 'chase'; cd: number; flash: number; dead: boolean; deadT: number }
type Item = { x: number; y: number; kind: 'a' | 'H' | 'A' | 'S' | 'P' | 'K' }
type Ball = { x: number; y: number; vx: number; vy: number; dmg: number; t: number }
type GState = 'start' | 'play' | 'pause' | 'dead' | 'won' | 'victory'

const ESTAT: Record<EType, { hp: number; spd: number; dmg: number; rng: number; cd: number; wf: number; hf: number }> = {
  g: { hp: 30, spd: 1.7, dmg: 9, rng: 0.95, cd: 0.8, wf: 0.55, hf: 0.92 },
  i: { hp: 24, spd: 1.2, dmg: 12, rng: 7, cd: 1.5, wf: 0.52, hf: 0.86 },
  b: { hp: 95, spd: 0.95, dmg: 22, rng: 1.2, cd: 1.2, wf: 0.82, hf: 1.04 },
}
const ECOL: Record<EType, string> = { g: '#ff4db8', i: '#ff9a3c', b: '#ff3a3a' }
const EPTS: Record<EType, number> = { g: 100, i: 150, b: 300 }
const WALLCOL: Record<number, [string, string]> = { 1: ['#39406b', '#262b4d'], 2: ['#4a2f5e', '#341f44'], 3: ['#1f5e57', '#143f3a'] }
// weapons: pistol (infinite), shotgun (shells = ammo[0]), plasma (cells = ammo[1])
const WEAPONS = [
  { name: 'PISTOL', cd: 0.30, dmg: 24, pellets: 1, spread: 0, ammoKey: -1 },
  { name: 'SHOTGUN', cd: 0.72, dmg: 11, pellets: 7, spread: 0.17, ammoKey: 0 },
  { name: 'PLASMA', cd: 0.10, dmg: 15, pellets: 1, spread: 0.025, ammoKey: 1 },
]

export default function NeonDescent() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!, W = 480, H = 300, HUDH = 40
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const zbuf = new Float32Array(W)
    const keys: Record<string, boolean> = {}

    let state: GState = 'start'
    let level = 0, score = 0, best = getBest('descent')
    // map
    let grid: number[][] = [], mapW = 0, mapH = 0
    const openDoors = new Set<number>()
    let enemies: Enemy[] = [], items: Item[] = [], balls: Ball[] = [], exits: { x: number; y: number }[] = []
    // player
    let px = 1.5, py = 1.5, a = 0
    let health = 100, armor = 0, hasKey = false
    const owned = [true, false, false]
    const ammo = [0, 0]
    let weapon = 0, fireCd = 0
    // fx / timers
    let walkBob = 0, recoil = 0, fireFlash = 0, dmgFlash = 0, pickFlash = 0, introT = 0, levelT = 0, tmr = 0
    let hitInd = 0, hitRel = 0 // directional damage indicator (relative angle to source)
    let showMap = false
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

    // ---- map helpers ----
    const cellAt = (ix: number, iy: number) => (iy < 0 || ix < 0 || iy >= mapH || ix >= mapW ? 1 : grid[iy][ix])
    // solid for collision/LOS/hitscan (closed door & exit count solid)
    const solidCell = (ix: number, iy: number) => {
      const v = cellAt(ix, iy)
      if (v === 0) return false
      if (v === 7) return !openDoors.has(iy * mapW + ix)
      return true
    }
    // type for wall rendering (0 = see-through)
    const renderCell = (ix: number, iy: number) => {
      const v = cellAt(ix, iy)
      if (v === 7 && openDoors.has(iy * mapW + ix)) return 0
      return v
    }
    const cellSolidPt = (x: number, y: number, r: number) =>
      solidCell(Math.floor(x - r), Math.floor(y - r)) || solidCell(Math.floor(x + r), Math.floor(y - r)) ||
      solidCell(Math.floor(x - r), Math.floor(y + r)) || solidCell(Math.floor(x + r), Math.floor(y + r))

    function loadLevel() {
      const map = LEVELS[level]
      mapH = map.length; mapW = Math.max(...map.map((r) => r.length))
      grid = []; enemies = []; items = []; balls = []; exits = []; openDoors.clear()
      for (let y = 0; y < mapH; y++) {
        const row: number[] = []
        for (let x = 0; x < mapW; x++) {
          const ch = map[y][x] || ' '
          let cell = 0
          if (ch === '#' || ch === '1') cell = 1
          else if (ch === '2') cell = 2
          else if (ch === '3') cell = 3
          else if (ch === 'D') cell = 7
          else if (ch === 'X') { cell = 9; exits.push({ x: x + 0.5, y: y + 0.5 }) }
          else if (ch === '@') { px = x + 0.5; py = y + 0.5 }
          else if (ch === 'g' || ch === 'i' || ch === 'b') enemies.push(mkEnemy(ch, x, y))
          else if (ch === 'a' || ch === 'H' || ch === 'A' || ch === 'S' || ch === 'P' || ch === 'K') items.push({ x: x + 0.5, y: y + 0.5, kind: ch })
          row.push(cell)
        }
        grid.push(row)
      }
      // seal the outer border (turn any edge floor into wall) so you can never see/walk into the void
      for (let x = 0; x < mapW; x++) { if (grid[0][x] === 0) grid[0][x] = 1; if (grid[mapH - 1][x] === 0) grid[mapH - 1][x] = 1 }
      for (let y = 0; y < mapH; y++) { if (grid[y][0] === 0) grid[y][0] = 1; if (grid[y][mapW - 1] === 0) grid[y][mapW - 1] = 1 }
      // face the first open cardinal direction
      const dirs = [[1, 0, 0], [0, -1, -Math.PI / 2], [-1, 0, Math.PI], [0, 1, Math.PI / 2]]
      a = 0
      for (const [dx, dy, ang] of dirs) if (!solidCell(Math.floor(px + dx), Math.floor(py + dy))) { a = ang; break }
      health = 100; hasKey = false; levelT = 0; introT = 2.4
      parts.ps = []
    }
    function mkEnemy(type: EType, x: number, y: number): Enemy {
      const s = ESTAT[type]
      return { x: x + 0.5, y: y + 0.5, type, hp: s.hp, maxhp: s.hp, state: 'idle', cd: 0, flash: 0, dead: false, deadT: 0 }
    }
    const resetGame = () => { score = 0; level = 0; owned[1] = owned[2] = false; ammo[0] = ammo[1] = 0; weapon = 0; armor = 0; loadLevel() }

    // ---- ray helpers ----
    // distance to first solid wall along a normalized ray (DDA)
    function castDist(ox: number, oy: number, rdx: number, rdy: number) {
      if (rdx === 0) rdx = 1e-9; if (rdy === 0) rdy = 1e-9
      let mapX = Math.floor(ox), mapY = Math.floor(oy)
      const dDX = Math.abs(1 / rdx), dDY = Math.abs(1 / rdy)
      let stepX: number, stepY: number, sX: number, sY: number
      if (rdx < 0) { stepX = -1; sX = (ox - mapX) * dDX } else { stepX = 1; sX = (mapX + 1 - ox) * dDX }
      if (rdy < 0) { stepY = -1; sY = (oy - mapY) * dDY } else { stepY = 1; sY = (mapY + 1 - oy) * dDY }
      for (let i = 0; i < 80; i++) {
        if (sX < sY) { sX += dDX; mapX += stepX; if (solidCell(mapX, mapY)) return sX - dDX } else { sY += dDY; mapY += stepY; if (solidCell(mapX, mapY)) return sY - dDY }
      }
      return 80
    }
    const los = (x0: number, y0: number, x1: number, y1: number) => {
      const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1e-6
      return castDist(x0, y0, dx / d, dy / d) >= d - 0.06
    }

    // ---- combat ----
    function hurtPlayer(dmg: number, srcX?: number, srcY?: number) {
      if (armor > 0) { const ab = Math.min(armor, dmg * 0.5); armor -= ab; dmg -= ab }
      health -= dmg; dmgFlash = 1; shake.kick(7); sfx.hurt()
      if (srcX !== undefined && srcY !== undefined) { hitInd = 1; let r = Math.atan2(srcY - py, srcX - px) - a; while (r > Math.PI) r -= Math.PI * 2; while (r < -Math.PI) r += Math.PI * 2; hitRel = r }
      if (health <= 0) { health = 0; state = 'dead'; best = setBest('descent', score) }
    }
    function spawnBall(x: number, y: number, ndx: number, ndy: number, dmg: number) {
      balls.push({ x: x + ndx * 0.4, y: y + ndy * 0.4, vx: ndx * 3.3, vy: ndy * 3.3, dmg, t: 0 })
    }
    function doFire() {
      const w = WEAPONS[weapon]
      if (w.ammoKey >= 0 && ammo[w.ammoKey] <= 0) { sfx.bump(); fireCd = 0.22; return }
      if (w.ammoKey >= 0) ammo[w.ammoKey]--
      fireCd = w.cd; recoil = 1; fireFlash = 1
      weapon === 1 ? sfx.shotgun() : weapon === 2 ? sfx.plasma() : sfx.shoot()
      shake.kick(weapon === 1 ? 6 : 3)
      for (let p = 0; p < w.pellets; p++) {
        const ang = a + (w.spread ? (Math.random() - 0.5) * w.spread * 2 : 0)
        const rdx = Math.cos(ang), rdy = Math.sin(ang)
        const wall = castDist(px, py, rdx, rdy)
        let bestT = wall, tgt: Enemy | null = null
        for (const e of enemies) {
          if (e.dead) continue
          const ex = e.x - px, ey = e.y - py
          const t = ex * rdx + ey * rdy
          if (t <= 0 || t > bestT) continue
          const perp = Math.abs(ex * -rdy + ey * rdx)
          if (perp < (e.type === 'b' ? 0.55 : 0.42)) { bestT = t; tgt = e }
        }
        if (tgt) {
          tgt.hp -= w.dmg; tgt.flash = 0.12; tgt.state = 'chase'
          const hx = px + rdx * bestT, hy = py + rdy * bestT
          parts.burst(W / 2 + (Math.random() - 0.5) * 8, H / 2 + (Math.random() - 0.5) * 8, { color: ECOL[tgt.type], count: 4, speed: 2, life: 0.3 })
          if (tgt.hp <= 0) { tgt.dead = true; tgt.deadT = 0; score += EPTS[tgt.type]; sfx.explode() }
          void hx; void hy
        }
      }
      // gunfire wakes nearby enemies
      for (const e of enemies) if (!e.dead && e.state === 'idle' && Math.hypot(px - e.x, py - e.y) < 9) e.state = 'chase'
    }

    function pickups() {
      items = items.filter((it) => {
        if (Math.hypot(px - it.x, py - it.y) > 0.5) return true
        if (it.kind === 'a') { ammo[0] += 4; ammo[1] += 12; score += 20; sfx.coin() }
        else if (it.kind === 'H') { health = Math.min(100, health + 25); score += 15; sfx.powerup() }
        else if (it.kind === 'A') { armor = Math.min(100, armor + 30); score += 15; sfx.powerup() }
        else if (it.kind === 'S') { owned[1] = true; ammo[0] += 6; weapon = 1; score += 40; sfx.oneup() }
        else if (it.kind === 'P') { owned[2] = true; ammo[1] += 20; weapon = 2; score += 40; sfx.oneup() }
        else if (it.kind === 'K') { hasKey = true; score += 50; sfx.oneup() }
        pickFlash = 1
        return false
      })
    }

    function moveEnt(e: Enemy, ndx: number, ndy: number, spd: number, dt: number) {
      const r = 0.3, nx = e.x + ndx * spd * dt
      if (!cellSolidPt(nx, e.y, r)) e.x = nx
      const ny = e.y + ndy * spd * dt
      if (!cellSolidPt(e.x, ny, r)) e.y = ny
    }

    function openDoorAt(x: number, y: number, r: number) {
      const corners = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]
      for (const [cx, cy] of corners) {
        const ix = Math.floor(cx), iy = Math.floor(cy)
        if (cellAt(ix, iy) === 7 && !openDoors.has(iy * mapW + ix)) { openDoors.add(iy * mapW + ix); sfx.pipe() }
      }
    }
    function movePlayer(dx: number, dy: number) {
      const r = 0.22
      const nx = px + dx; openDoorAt(nx, py, r); if (!cellSolidPt(nx, py, r)) px = nx
      const ny = py + dy; openDoorAt(px, ny, r); if (!cellSolidPt(px, ny, r)) py = ny
    }

    // ---- step ----
    function step(dt: number) {
      tmr += dt; parts.update(dt)
      if (recoil > 0) recoil -= dt * 4; if (fireFlash > 0) fireFlash -= dt * 6
      if (dmgFlash > 0) dmgFlash -= dt * 2.4; if (pickFlash > 0) pickFlash -= dt * 3
      if (hitInd > 0) hitInd -= dt * 0.9
      if (introT > 0) introT -= dt
      if (state !== 'play') return
      levelT += dt; fireCd -= dt
      // input: move
      const dirX = Math.cos(a), dirY = Math.sin(a), rgtX = -dirY, rgtY = dirX
      let mvx = 0, mvy = 0
      if (keys['w'] || keys['arrowup']) { mvx += dirX; mvy += dirY }
      if (keys['s'] || keys['arrowdown']) { mvx -= dirX; mvy -= dirY }
      if (keys['e']) { mvx += rgtX; mvy += rgtY }
      if (keys['q']) { mvx -= rgtX; mvy -= rgtY }
      const ml = Math.hypot(mvx, mvy)
      if (ml > 0) { movePlayer((mvx / ml) * 3.1 * dt, (mvy / ml) * 3.1 * dt); walkBob += dt * 9 }
      if (keys['a'] || keys['arrowleft']) a -= 2.7 * dt
      if (keys['d'] || keys['arrowright']) a += 2.7 * dt
      if (keys[' '] && fireCd <= 0) doFire()
      pickups()
      // exit
      for (const ex of exits) if (Math.hypot(px - ex.x, py - ex.y) < 1.0 && hasKey) {
        score += 500 + Math.max(0, Math.round((90 - levelT) * 3))
        sfx.clear()
        if (level >= LEVELS.length - 1) { state = 'victory' } else { state = 'won' }
        best = setBest('descent', score)
        break
      }
      // enemies
      for (const e of enemies) {
        if (e.flash > 0) e.flash -= dt
        if (e.dead) { e.deadT += dt; continue }
        e.cd -= dt
        const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1e-4, s = ESTAT[e.type]
        if (e.state === 'idle') { if (d < 13 && los(e.x, e.y, px, py)) e.state = 'chase'; else continue }
        if (e.type === 'i') {
          if (d > 4.5) moveEnt(e, dx / d, dy / d, s.spd, dt)
          else if (d < 2.4) moveEnt(e, -dx / d, -dy / d, s.spd * 0.8, dt)
          if (d < s.rng && e.cd <= 0 && los(e.x, e.y, px, py)) { spawnBall(e.x, e.y, dx / d, dy / d, s.dmg); e.cd = s.cd }
        } else {
          if (d > s.rng) moveEnt(e, dx / d, dy / d, s.spd, dt)
          else if (e.cd <= 0 && los(e.x, e.y, px, py)) { hurtPlayer(s.dmg, e.x, e.y); e.cd = s.cd }
        }
      }
      // fireballs
      balls = balls.filter((b) => {
        b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt
        if (solidCell(Math.floor(b.x), Math.floor(b.y))) return false
        if (Math.hypot(px - b.x, py - b.y) < 0.45) { hurtPlayer(b.dmg, b.x, b.y); return false }
        return b.t < 5
      })
    }

    // ---- render ----
    // offscreen buffer for world-locked floor/ceiling grid (floor-casting); blitted then scaled by ctx DPR transform
    const fcv = document.createElement('canvas'); fcv.width = W; fcv.height = H
    const fctx = fcv.getContext('2d')!
    const fimg = fctx.createImageData(W, H), fbuf = new Uint32Array(fimg.data.buffer)
    const pack = (c: number[]) => (255 << 24) | ((c[2] | 0) << 16) | ((c[1] | 0) << 8) | (c[0] | 0)
    const mixA = (c1: number[], c2: number[], t: number) => [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]
    const FLOORB = [20, 16, 14], CEILB = [12, 15, 30], HORIZON = [9, 11, 20]

    function castFloor(dirX: number, dirY: number, planeX: number, planeY: number) {
      const argb = accentRGB().split(',').map(Number)
      const gFloor = [Math.min(255, argb[0] * 0.9 + 20), Math.min(255, argb[1] * 0.9 + 20), Math.min(255, argb[2] * 0.9 + 20)]
      const gCeil = [90, 120, 200]
      const halfH = H / 2
      fbuf.fill(pack(HORIZON))
      const rdx0 = dirX - planeX, rdy0 = dirY - planeY, rdx1 = dirX + planeX, rdy1 = dirY + planeY
      for (let y = Math.floor(halfH) + 1; y < H; y++) {
        const p = y - halfH, rowDist = (0.5 * H) / p
        if (rowDist > 22) continue
        const fade = clamp(1 - rowDist / 18, 0, 1)
        const baseFa = mixA(HORIZON, FLOORB, fade), baseCa = mixA(HORIZON, CEILB, fade)
        const baseF = pack(baseFa), baseC = pack(baseCa)
        const gridF = pack(mixA(baseFa, gFloor, 0.55 * fade + 0.1)), gridC = pack(mixA(baseCa, gCeil, 0.4 * fade))
        let fx = px + rowDist * rdx0, fy = py + rowDist * rdy0
        const sx = (rowDist * (rdx1 - rdx0)) / W, sy = (rowDist * (rdy1 - rdy0)) / W
        const thr = 0.04 * (0.5 + fade), rowF = y * W, rowC = (H - 1 - y) * W
        for (let x = 0; x < W; x++) {
          const gx = Math.abs(fx - Math.round(fx)), gy = Math.abs(fy - Math.round(fy)), line = gx < thr || gy < thr
          fbuf[rowF + x] = line ? gridF : baseF
          fbuf[rowC + x] = line ? gridC : baseC
          fx += sx; fy += sy
        }
      }
      fctx.putImageData(fimg, 0, 0)
      ctx.drawImage(fcv, 0, 0, W, H)
    }

    function castWalls(dirX: number, dirY: number, planeX: number, planeY: number) {
      const ac = accent()
      for (let x = 0; x < W; x++) {
        const camX = (2 * x) / W - 1
        let rdx = dirX + planeX * camX, rdy = dirY + planeY * camX
        if (rdx === 0) rdx = 1e-9; if (rdy === 0) rdy = 1e-9
        let mapX = Math.floor(px), mapY = Math.floor(py)
        const dDX = Math.abs(1 / rdx), dDY = Math.abs(1 / rdy)
        let stepX: number, stepY: number, sX: number, sY: number
        if (rdx < 0) { stepX = -1; sX = (px - mapX) * dDX } else { stepX = 1; sX = (mapX + 1 - px) * dDX }
        if (rdy < 0) { stepY = -1; sY = (py - mapY) * dDY } else { stepY = 1; sY = (mapY + 1 - py) * dDY }
        let side = 0, cellType = 1
        for (let i = 0; i < 80; i++) {
          if (sX < sY) { sX += dDX; mapX += stepX; side = 0 } else { sY += dDY; mapY += stepY; side = 1 }
          const c = renderCell(mapX, mapY); if (c > 0) { cellType = c; break }
        }
        const perp = Math.max(0.02, side === 0 ? sX - dDX : sY - dDY)
        zbuf[x] = perp
        const lineH = H / perp, y0 = H / 2 - lineH / 2, y1 = y0 + lineH
        // wallX = where along the cell the ray hit (for vertical cell seams)
        let wallX = side === 0 ? py + perp * rdy : px + perp * rdx; wallX -= Math.floor(wallX)
        let col: string, fogK = 1
        if (cellType === 9) { col = hasKey ? '#3df08a' : '#e0445a'; fogK = 0.3 }
        else if (cellType === 7) { col = side ? '#4a3b14' : '#6a5520' }
        else { const pr = WALLCOL[cellType] || WALLCOL[1]; col = side ? pr[1] : pr[0] }
        ctx.fillStyle = col; ctx.fillRect(x, y0, 1, lineH)
        // vertical cell seam (darker at cell boundaries) + faint paneling
        const seam = wallX < 0.03 || wallX > 0.97
        if (seam) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y0, 1, lineH) }
        // distance fog toward horizon colour so walls meet the floor grid
        const fog = clamp((perp - 1.0) / 13, 0, 0.82) * fogK
        if (fog > 0.01) { ctx.fillStyle = `rgba(9,11,20,${fog})`; ctx.fillRect(x, y0, 1, lineH) }
        // neon rim along the top edge of every wall — defines silhouettes against the ceiling
        const rim = clamp(1 - perp / 9, 0, 1)
        if (rim > 0.04) {
          ctx.fillStyle = cellType === 9 ? (hasKey ? `rgba(60,240,138,${rim})` : `rgba(224,68,90,${rim})`) : `rgba(${accentRGB()},${rim * 0.5})`
          ctx.fillRect(x, y0, 1, Math.max(1, lineH * 0.012))
          ctx.fillStyle = `rgba(0,0,0,${rim * 0.25})`; ctx.fillRect(x, y1 - 1, 1, 1)
        }
        if (cellType === 9) { ctx.fillStyle = `rgba(${hasKey ? '60,240,138' : '224,68,90'},0.3)`; ctx.fillRect(x, y0, 1, lineH) }
        void ac
      }
    }

    function drawSprites() {
      const dirX = Math.cos(a), dirY = Math.sin(a), planeX = -Math.sin(a) * 0.66, planeY = Math.cos(a) * 0.66
      const invDet = 1 / (planeX * dirY - dirX * planeY)
      type S = { x: number; y: number; e?: Enemy; it?: Item; b?: Ball; d: number }
      const list: S[] = []
      for (const e of enemies) list.push({ x: e.x, y: e.y, e, d: (e.x - px) ** 2 + (e.y - py) ** 2 })
      for (const it of items) list.push({ x: it.x, y: it.y, it, d: (it.x - px) ** 2 + (it.y - py) ** 2 })
      for (const b of balls) list.push({ x: b.x, y: b.y, b, d: (b.x - px) ** 2 + (b.y - py) ** 2 })
      list.sort((m, n) => n.d - m.d)
      for (const sp of list) {
        const rx = sp.x - px, ry = sp.y - py
        const tY = invDet * (-planeY * rx + planeX * ry)
        if (tY <= 0.12) continue
        const tX = invDet * (dirY * rx - dirX * ry)
        const screenX = (W / 2) * (1 + tX / tY)
        const sh = H / tY
        const wf = sp.e ? ESTAT[sp.e.type].wf : sp.b ? 0.42 : 0.46
        const hf = sp.e ? ESTAT[sp.e.type].hf : sp.b ? 0.42 : 0.5
        const yoff = sp.it ? Math.sin(tmr * 3 + sp.x) * 0.04 : 0
        const w = sh * wf, dh = sh * hf
        const top = H / 2 - dh / 2 + sh * (sp.e ? (1 - hf) / 2 : 0.18 + yoff)
        const sx0 = screenX - w / 2
        // per-column occlusion clip
        const c0 = Math.max(0, Math.floor(sx0)), c1 = Math.min(W - 1, Math.ceil(sx0 + w))
        let any = false; ctx.save(); ctx.beginPath()
        let run = -1
        for (let cx = c0; cx <= c1 + 1; cx++) {
          const vis = cx <= c1 && tY < zbuf[cx]
          if (vis && run < 0) run = cx
          else if (!vis && run >= 0) { ctx.rect(run, top - 4, cx - run, dh + 8); any = true; run = -1 }
        }
        if (!any) { ctx.restore(); continue }
        ctx.clip()
        const fog = clamp((tY - 1.2) / 12, 0, 0.78)
        if (sp.e) drawCreature(sx0, top, w, dh, sp.e, fog)
        else if (sp.it) drawPickup(sx0, top, w, dh, sp.it.kind, fog)
        else if (sp.b) drawBall(sx0 + w / 2, top + dh / 2, w, fog)
        ctx.restore()
      }
    }
    function drawCreature(sx0: number, top: number, w: number, dh: number, e: Enemy, fog: number) {
      const cx = sx0 + w / 2, base = ECOL[e.type]
      if (e.dead) {
        ctx.globalAlpha = Math.max(0.18, 1 - e.deadT * 0.35) * (1 - fog * 0.6)
        glow(ctx, base, 6); ctx.fillStyle = base
        ctx.beginPath(); ctx.ellipse(cx, top + dh * 0.86, w * 0.5, dh * 0.13, 0, 0, 7); ctx.fill(); noGlow(ctx)
        ctx.globalAlpha = 1; return
      }
      ctx.globalAlpha = 1 - fog * 0.7
      glow(ctx, base, 8); ctx.fillStyle = base
      roundRect(ctx, cx - w * 0.32, top + dh * 0.34, w * 0.64, dh * 0.62, w * 0.16); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, top + dh * 0.27, w * 0.26, 0, 7); ctx.fill(); noGlow(ctx)
      if (e.type === 'b') { ctx.fillStyle = base; ctx.fillRect(cx - w * 0.48, top + dh * 0.4, w * 0.14, dh * 0.42); ctx.fillRect(cx + w * 0.34, top + dh * 0.4, w * 0.14, dh * 0.42) }
      const eye = accent(); glow(ctx, eye, 6); ctx.fillStyle = eye
      ctx.fillRect(cx - w * 0.15, top + dh * 0.23, w * 0.09, dh * 0.05); ctx.fillRect(cx + w * 0.06, top + dh * 0.23, w * 0.09, dh * 0.05); noGlow(ctx)
      if (e.flash > 0) { ctx.globalAlpha = Math.min(1, e.flash * 6); ctx.fillStyle = '#fff'; roundRect(ctx, cx - w * 0.34, top + dh * 0.2, w * 0.68, dh * 0.78, w * 0.16); ctx.fill() }
      ctx.globalAlpha = 1
      if (e.hp < e.maxhp) { const bw = w * 0.62; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(cx - bw / 2, top + dh * 0.08, bw, 3); ctx.fillStyle = e.hp / e.maxhp > 0.4 ? '#3df08a' : '#e0445a'; ctx.fillRect(cx - bw / 2, top + dh * 0.08, (bw * e.hp) / e.maxhp, 3) }
    }
    const PCOL: Record<string, string> = { a: '#7fb0ff', H: '#3df08a', A: '#39d6e0', S: '#ff9a3c', P: accent(), K: '#ffd23c' }
    function drawPickup(sx0: number, top: number, w: number, dh: number, kind: string, fog: number) {
      const cx = sx0 + w / 2, cy = top + dh / 2, c = kind === 'P' ? accent() : PCOL[kind] || '#fff'
      ctx.globalAlpha = 1 - fog * 0.6; glow(ctx, c, 10); ctx.fillStyle = c
      ctx.beginPath(); ctx.moveTo(cx, cy - dh * 0.42); ctx.lineTo(cx + w * 0.42, cy); ctx.lineTo(cx, cy + dh * 0.42); ctx.lineTo(cx - w * 0.42, cy); ctx.closePath(); ctx.fill(); noGlow(ctx)
      ctx.fillStyle = '#0a0a12'; ctx.font = `bold ${Math.max(8, dh * 0.36)}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(kind === 'a' ? '•' : kind, cx, cy + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1
    }
    function drawBall(cx: number, cy: number, w: number, fog: number) {
      ctx.globalAlpha = 1 - fog * 0.4; const r = Math.max(4, w * 0.42)
      glow(ctx, '#ff5a1c', 18); ctx.fillStyle = 'rgba(255,120,40,0.5)'; ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, 7); ctx.fill()
      ctx.fillStyle = '#ffd28a'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); noGlow(ctx); ctx.globalAlpha = 1
    }

    function drawWeapon() {
      const ac = accent(), bob = Math.sin(walkBob) * 4, rk = recoil * 14
      const bx = W / 2 + Math.cos(walkBob * 0.5) * 3, by = H - HUDH - 46 + rk + bob
      ctx.save()
      if (weapon === 2) { glow(ctx, ac, 10); ctx.fillStyle = ac; roundRect(ctx, bx - 16, by, 32, 46, 5); ctx.fill(); noGlow(ctx); ctx.fillStyle = '#0c1116'; ctx.fillRect(bx - 6, by - 14, 12, 18) }
      else if (weapon === 1) { ctx.fillStyle = '#6b6f7a'; roundRect(ctx, bx - 22, by, 44, 40, 4); ctx.fill(); ctx.fillStyle = '#3a3d45'; ctx.fillRect(bx - 16, by - 18, 11, 22); ctx.fillRect(bx + 5, by - 18, 11, 22) }
      else { ctx.fillStyle = '#7a7e88'; roundRect(ctx, bx - 12, by, 24, 38, 4); ctx.fill(); ctx.fillStyle = '#42454d'; ctx.fillRect(bx - 5, by - 16, 10, 20) }
      if (fireFlash > 0) { ctx.globalAlpha = fireFlash; glow(ctx, '#fff6c0', 18); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(bx, by - (weapon === 2 ? 14 : 16), 9 + fireFlash * 6, 0, 7); ctx.fill(); noGlow(ctx); ctx.globalAlpha = 1 }
      ctx.restore()
    }
    function drawCrosshair() {
      const ac = accent(); ctx.strokeStyle = ac; ctx.globalAlpha = 0.8; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(W / 2 - 7, H / 2); ctx.lineTo(W / 2 - 2, H / 2); ctx.moveTo(W / 2 + 2, H / 2); ctx.lineTo(W / 2 + 7, H / 2)
      ctx.moveTo(W / 2, H / 2 - 7); ctx.lineTo(W / 2, H / 2 - 2); ctx.moveTo(W / 2, H / 2 + 2); ctx.lineTo(W / 2, H / 2 + 7); ctx.stroke(); ctx.globalAlpha = 1
    }
    function drawHUD() {
      const ac = accent(), alive = enemies.filter((e) => !e.dead).length
      ctx.fillStyle = 'rgba(8,10,18,0.86)'; ctx.fillRect(0, H - HUDH, W, HUDH)
      ctx.fillStyle = ac; ctx.globalAlpha = 0.5; ctx.fillRect(0, H - HUDH, W, 1.5); ctx.globalAlpha = 1
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 14px "JetBrains Mono", monospace'
      ctx.fillStyle = health > 40 ? '#3df08a' : '#e0445a'; ctx.fillText('♥ ' + Math.ceil(health), 12, H - HUDH / 2 - 1)
      ctx.fillStyle = '#39d6e0'; ctx.fillText('🛡 ' + armor, 96, H - HUDH / 2 - 1)
      const w = WEAPONS[weapon], am = w.ammoKey < 0 ? '∞' : String(ammo[w.ammoKey])
      ctx.textAlign = 'center'; ctx.fillStyle = ac; ctx.fillText(w.name + '  ' + am, W / 2, H - HUDH / 2 - 1)
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = '#8a93a8'
      ctx.fillText(owned.map((o, i) => (o ? (i === weapon ? '[' + (i + 1) + ']' : i + 1) : '·')).join(' '), W / 2, H - 8)
      ctx.textAlign = 'right'; ctx.font = 'bold 13px "JetBrains Mono", monospace'
      ctx.fillStyle = hasKey ? '#ffd23c' : '#555c6e'; ctx.fillText(hasKey ? '🔑' : '🔒', W - 130, H - HUDH / 2 - 1)
      ctx.fillStyle = '#cdd8e6'; ctx.fillText('SECTOR ' + (level + 1), W - 64, H - HUDH / 2 - 1)
      ctx.fillStyle = '#ff7a8c'; ctx.fillText('☠ ' + alive, W - 10, H - HUDH / 2 - 1)
      ctx.textBaseline = 'alphabetic'
      // objective banner (fades in on level entry)
      if (introT > 0) {
        ctx.globalAlpha = Math.min(1, introT); ctx.textAlign = 'center'
        glow(ctx, ac, 14); ctx.fillStyle = ac; ctx.font = 'bold 20px "JetBrains Mono", monospace'; ctx.fillText('SECTOR ' + (level + 1), W / 2, 40); noGlow(ctx)
        ctx.fillStyle = '#cdd8e6'; ctx.font = '12px "JetBrains Mono", monospace'
        ctx.fillText(hasKey ? 'reach the exit' : 'find the keycard, then the exit', W / 2, 60); ctx.globalAlpha = 1
      } else {
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(205,216,230,0.55)'; ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText(hasKey ? '→ reach the exit 🚪' : '→ find the keycard 🔑', W / 2, 18)
      }
      ctx.textAlign = 'left'
    }
    function drawMinimap() {
      const s = 4, ox = 8, oy = 8
      ctx.save(); ctx.globalAlpha = 0.8
      for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
        const v = renderCell(x, y); if (v === 0) continue
        ctx.fillStyle = v === 9 ? (hasKey ? '#3df08a' : '#e0445a') : v === 7 ? '#6a5520' : 'rgba(120,140,200,0.7)'
        ctx.fillRect(ox + x * s, oy + y * s, s - 1, s - 1)
      }
      for (const it of items) if (it.kind === 'K') { ctx.fillStyle = '#ffd23c'; ctx.fillRect(ox + it.x * s - 1, oy + it.y * s - 1, s, s) }
      for (const e of enemies) if (!e.dead) { ctx.fillStyle = ECOL[e.type]; ctx.fillRect(ox + e.x * s - 1, oy + e.y * s - 1, 2, 2) }
      ctx.fillStyle = accent(); ctx.fillRect(ox + px * s - 1.5, oy + py * s - 1.5, 3, 3)
      ctx.strokeStyle = accent(); ctx.beginPath(); ctx.moveTo(ox + px * s, oy + py * s); ctx.lineTo(ox + px * s + Math.cos(a) * 6, oy + py * s + Math.sin(a) * 6); ctx.stroke()
      ctx.restore()
    }

    function drawHitIndicator() {
      if (hitInd <= 0) return
      // chevron on a ring pointing toward the damage source: rel 0 = ahead (top), ±90 = sides, 180 = behind
      const ix = W / 2 + Math.sin(hitRel) * W * 0.4, iy = H / 2 - Math.cos(hitRel) * (H / 2 - HUDH) * 0.78
      ctx.save(); ctx.translate(ix, iy); ctx.rotate(hitRel)
      ctx.globalAlpha = Math.min(1, hitInd); glow(ctx, '#ff2e44', 14); ctx.fillStyle = '#ff5566'
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(11, 7); ctx.lineTo(0, 1); ctx.lineTo(-11, 7); ctx.closePath(); ctx.fill()
      noGlow(ctx); ctx.restore(); ctx.globalAlpha = 1
    }
    function render() {
      ctx.fillStyle = '#090b14'; ctx.fillRect(0, 0, W, H)
      const so = shake.frame(0.016)
      const dirX = Math.cos(a), dirY = Math.sin(a), planeX = -Math.sin(a) * 0.66, planeY = Math.cos(a) * 0.66
      ctx.save(); ctx.translate(so.dx, so.dy)
      castFloor(dirX, dirY, planeX, planeY); castWalls(dirX, dirY, planeX, planeY); drawSprites(); parts.draw(ctx)
      ctx.restore()
      if (dmgFlash > 0) { const v = dmgFlash * 0.5; ctx.fillStyle = `rgba(200,30,46,${v})`; ctx.fillRect(0, 0, W, 26); ctx.fillRect(0, H - 26, W, 26); ctx.fillRect(0, 0, 26, H); ctx.fillRect(W - 26, 0, 26, H) }
      drawHitIndicator()
      drawCrosshair(); drawWeapon()
      if (showMap) drawMinimap()
      drawHUD()
      if (pickFlash > 0) { ctx.fillStyle = `rgba(${accent() === '#00e639' ? '0,230,57' : '255,255,255'},${pickFlash * 0.12})`; ctx.fillRect(0, 0, W, H) }
      if (pickFlash > 0) { ctx.fillStyle = `rgba(${accent() === '#00e639' ? '0,230,57' : '255,255,255'},${pickFlash * 0.12})`; ctx.fillRect(0, 0, W, H) }
      if (state === 'start') panel(ctx, W, H, 'NEON DESCENT', 'find the keycard · reach the exit · best ' + best, 'press SPACE to descend')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', undefined, 'press P to resume')
      else if (state === 'dead') panel(ctx, W, H, 'YOU DIED', 'sector ' + (level + 1) + ' · score ' + score, 'press R to retry sector')
      else if (state === 'won') panel(ctx, W, H, 'SECTOR CLEAR', 'score ' + score, 'press SPACE for next sector')
      else if (state === 'victory') panel(ctx, W, H, 'YOU ESCAPED', 'final score ' + score + ' · best ' + best, 'press R to descend again')
    }

    // ---- loop + input ----
    let raf = 0, last = performance.now()
    const loop = (ts: number) => { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; step(dt); render(); raf = requestAnimationFrame(loop) }
    function advance() {
      if (state === 'start') { resetGame(); state = 'play' }
      else if (state === 'won') { level++; loadLevel(); state = 'play' }
    }
    const MOVE = ['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']
    const kd = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase()
      if (MOVE.includes(k)) ev.preventDefault()
      if (k === ' ') { if (state === 'start' || state === 'won') { advance(); return } keys[' '] = true; return }
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; return }
      if (k === 'r') { if (state === 'dead' || state === 'play') loadLevel(), (state = 'play'); else if (state === 'victory') resetGame(), (state = 'play'); return }
      if (state === 'play') {
        if (k === '1' && owned[0]) weapon = 0
        else if (k === '2' && owned[1]) weapon = 1
        else if (k === '3' && owned[2]) weapon = 2
        else if (k === 'm') showMap = !showMap
        else if (k === 'n') { if (level >= LEVELS.length - 1) { best = setBest('descent', score); state = 'victory' } else { level++; loadLevel() } }
        else if (k === 'k') hasKey = true
      }
      keys[k] = true
    }
    const ku = (ev: KeyboardEvent) => { keys[ev.key.toLowerCase()] = false }
    const click = () => { if (state === 'start' || state === 'won') advance() }

    loadLevel() // preload sector 1 as the start-screen backdrop
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); cv.addEventListener('click', click)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">W/↑ fwd · S/↓ back · A/D turn · Q/E strafe · SPACE fire · 1/2/3 weapon · M map · P pause · R retry · Esc quit <span className="opacity-50">· cheat: N skip · K key</span></div>
    </>
  )
}
