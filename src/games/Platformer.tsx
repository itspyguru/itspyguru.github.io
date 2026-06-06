import { useEffect, useRef } from 'react'
import { sfx, musicStart, musicStop } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, rgba, makeStars, drawStars, panel } from './engine'
import { LEVELS } from './platformerLevels'

const TILE = 22, COLS = 22, ROWS = 14, W = COLS * TILE, H = ROWS * TILE
const SOLID = new Set(['X', 'B', '?', 'M', 'S', 'p', '=', 'u', 's', 'W'])
const isSolidChar = (c: string | undefined) => !!c && SOLID.has(c)

type Box = { x: number; y: number; w: number; h: number; vx: number; vy: number }
type Enemy = Box & { kind: 'goomba' | 'koopa'; dir: number; dead: boolean; squash: number; shell: boolean; ground: boolean }
type Item = Box & { kind: 'mush' | 'fire' | 'star'; emerge: number; dir: number; ground: boolean }
type Fire = Box & { life: number }
type Coin = { x: number; y: number; got: boolean }
type Mover = { x: number; y: number; w: number; h: number; kind: 'h' | 'v' | 'fall'; base: number; a: number; spd: number; ph: number; vy: number; fell: boolean; rideT: number; dx: number; dy: number }
type Cloud = { x: number; y: number; s: number }

export default function Platformer() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = cvRef.current!
    const ctx = fitCanvas(cv, W, H)
    const parts = new Particles(), shake = new Shake()
    const stars = makeStars(46, W, H)

    // ---- level state ----
    let tiles: string[][] = [], lw = 0, lh = ROWS
    let coins: Coin[] = [], enemies: Enemy[] = [], items: Item[] = [], fires: Fire[] = []
    let flagX = 0, startX = 0, startY = 0, bumps = new Map<string, number>()
    let movers: Mover[] = [], checkpoints: { x: number; y: number; activated: boolean }[] = [], cpX = -1, cpY = -1, fade = 0
    const clouds: Cloud[] = Array.from({ length: 6 }, (_, i) => ({ x: (i * 92) % W, y: 16 + (i * 41) % 92, s: 0.4 + (i % 3) * 0.22 }))
    let level = 0, lives = 3, score = 0, coinCount = 0, best = getBest('platformer'), musicWorld = -1
    // player
    let px = 0, py = 0, pvx = 0, pvy = 0, onGround = false, face = 1, big = false, fire = false
    let coyote = 0, jbuf = 0, jumping = false, invuln = 0, starT = 0, fireCd = 0, anim = 0
    let camX = 0, camTarget = 0, introT = 0, deadT = 0, clearT = 0, timeLeft = 0, so = { dx: 0, dy: 0 }
    let landSq = 0, skidT = 0, skid = false, duck = false, combo = 0
    let popups: { x: number; y: number; t: number; txt: string }[] = []
    const addPopup = (x: number, y: number, txt: string) => popups.push({ x, y, t: 0.85, txt })
    let state: 'start' | 'play' | 'pause' | 'gameover' | 'win' = 'start'
    const keys: Record<string, boolean> = {}
    const PW = () => 15, PH = () => (big ? 28 : 16)

    function loadLevel(idx: number) {
      const map = LEVELS[idx]; lh = map.length; lw = Math.max(...map.map((r) => r.length))
      tiles = map.map((r) => r.padEnd(lw, ' ').split(''))
      coins = []; enemies = []; items = []; fires = []; bumps = new Map(); movers = []; checkpoints = []; cpX = -1; cpY = -1; fade = 1
      for (let r = 0; r < lh; r++) for (let c = 0; c < lw; c++) {
        const ch = tiles[r][c]
        if (ch === 'o') { coins.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, got: false }); tiles[r][c] = ' ' }
        else if (ch === 'g' || ch === 'k') { enemies.push({ x: c * TILE + 3, y: r * TILE + (ch === 'g' ? 6 : 0), w: 16, h: ch === 'g' ? 16 : 22, vx: 0, vy: 0, kind: ch === 'g' ? 'goomba' : 'koopa', dir: -1, dead: false, squash: 0, shell: false, ground: false }); tiles[r][c] = ' ' }
        else if (ch === 'H' || ch === 'V') { movers.push({ x: c * TILE, y: r * TILE + 5, w: TILE * 2, h: 12, kind: ch === 'H' ? 'h' : 'v', base: ch === 'H' ? c * TILE : r * TILE + 5, a: ch === 'H' ? 58 : 50, spd: 1.5, ph: r + c, vy: 0, fell: false, rideT: 0, dx: 0, dy: 0 }); tiles[r][c] = ' ' }
        else if (ch === 'D') { movers.push({ x: c * TILE, y: r * TILE + 5, w: TILE * 2, h: 12, kind: 'fall', base: 0, a: 0, spd: 0, ph: 0, vy: 0, fell: false, rideT: 0, dx: 0, dy: 0 }); tiles[r][c] = ' ' }
        else if (ch === 'C') { checkpoints.push({ x: c * TILE, y: r * TILE, activated: false }); tiles[r][c] = ' ' }
        else if (ch === '@') { startX = c * TILE + 3; startY = r * TILE; tiles[r][c] = ' ' }
        else if (ch === 'F') { flagX = c * TILE; tiles[r][c] = ' ' }
      }
      if (!checkpoints.length) checkpoints.push({ x: Math.floor(lw * 0.55) * TILE, y: TILE, activated: false })
      if (startX === 0 && startY === 0) { startX = TILE; for (let r = 0; r < lh; r++) if (isSolidChar(tiles[r][1])) { startY = (r - 1) * TILE; break } }
      px = startX; py = startY; pvx = pvy = 0; onGround = false; camX = 0
      timeLeft = 260; introT = 1.5; deadT = 0; clearT = 0
    }
    const SAVE = 'itspyguru_plat'
    const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE) || 'null') as { level: number; lives: number; score: number; coinCount: number } | null } catch { return null } }
    const saveProg = () => { try { localStorage.setItem(SAVE, JSON.stringify({ level, lives, score, coinCount })) } catch {} }
    const clearSave = () => { try { localStorage.removeItem(SAVE) } catch {} }
    const begin = () => { const s = loadSave(); if (s && s.lives > 0) { level = s.level; lives = s.lives; score = s.score; coinCount = s.coinCount } else { level = 0; lives = 3; score = 0; coinCount = 0 } big = false; fire = false; starT = 0; loadLevel(level); saveProg(); state = 'play'; sfx.start() }

    const cellSolid = (c: number, r: number) => { if (c < 0) return true; if (c >= lw || r < 0 || r >= lh) return false; return isSolidChar(tiles[r][c]) }
    const resolveX = (e: Box) => {
      const r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 0.01) / TILE)
      if (e.vx > 0) { const c = Math.floor((e.x + e.w) / TILE); for (let r = r0; r <= r1; r++) if (cellSolid(c, r)) { e.x = c * TILE - e.w; e.vx = 0; return true } }
      else if (e.vx < 0) { const c = Math.floor(e.x / TILE); for (let r = r0; r <= r1; r++) if (cellSolid(c, r)) { e.x = (c + 1) * TILE; e.vx = 0; return true } }
      return false
    }
    const resolveY = (e: Box, oneway = false) => {
      const c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.01) / TILE); let ground = false; let head: [number, number] | null = null
      if (e.vy > 0) { const r = Math.floor((e.y + e.h) / TILE); for (let c = c0; c <= c1; c++) if (cellSolid(c, r) || (oneway && tiles[r]?.[c] === 't' && (e.y + e.h) - r * TILE <= 11)) { e.y = r * TILE - e.h; e.vy = 0; ground = true; break } }
      else if (e.vy < 0) { const r = Math.floor(e.y / TILE); for (let c = c0; c <= c1; c++) if (cellSolid(c, r)) { e.y = (r + 1) * TILE; e.vy = 0; head = [c, r]; break } }
      return { ground, head }
    }

    function bumpBlock(c: number, r: number) {
      const ch = tiles[r][c]; bumps.set(c + ',' + r, 0.18)
      if (ch === '?') { tiles[r][c] = 'u'; coinCount++; score += 200; sfx.coin(); parts.burst(c * TILE + TILE / 2, r * TILE, { color: '#ffd400', count: 8, speed: 2.5, life: 0.5 }) }
      else if (ch === 'M') { tiles[r][c] = 'u'; spawnItem(c, r, big ? 'fire' : 'mush'); sfx.powerup() }
      else if (ch === 'S') { tiles[r][c] = 'u'; spawnItem(c, r, 'star'); sfx.powerup() }
      else if (ch === 'B') { if (big || fire) { tiles[r][c] = ' '; score += 50; sfx.bump(); parts.burst(c * TILE + TILE / 2, r * TILE + TILE / 2, { color: '#c08a5a', count: 12, speed: 3, life: 0.5, gravity: 0.05 }) } else sfx.bump() }
    }
    const spawnItem = (c: number, r: number, kind: Item['kind']) => items.push({ x: c * TILE + 3, y: r * TILE, w: 16, h: 16, vx: kind === 'fire' ? 0 : 40, vy: 0, kind, emerge: TILE, dir: 1, ground: false })

    function hurt() {
      if (invuln > 0 || starT > 0) return
      if (fire) { fire = false; invuln = 1.4; sfx.hit() }
      else if (big) { big = false; invuln = 1.4; py += 12; sfx.hit() }
      else die()
    }
    function die() { if (deadT > 0) return; deadT = 1.3; pvy = -360; pvx = 0; sfx.lose(); shake.kick(7) }

    // ---- simulation (fixed sub-step) ----
    function sim(dt: number) {
      if (fade > 0) fade -= dt * 2.4
      if (introT > 0) { introT -= dt; anim += dt; return }
      if (deadT > 0) { deadT -= dt; pvy += 1500 * dt; py += pvy * dt; if (deadT <= 0) { lives--; if (lives <= 0) { state = 'gameover'; best = setBest('platformer', score); clearSave() } else { const sx = cpX, sy = cpY; loadLevel(level); if (sx >= 0) { px = sx; py = sy; cpX = sx; cpY = sy } saveProg() } }; return }
      if (clearT > 0) { clearT -= dt; px += 60 * dt; pvy += 1500 * dt; py += pvy * dt; resolveY({ x: px, y: py, w: PW(), h: PH(), vx: 0, vy: pvy } as Box); if (clearT <= 0) { if (level >= LEVELS.length - 1) { state = 'win'; best = setBest('platformer', score); clearSave() } else { level++; const L = lives, S = score, C = coinCount; loadLevel(level); lives = L; score = S; coinCount = C; saveProg() } }; return }
      anim += dt
      timeLeft -= dt; if (timeLeft <= 0) return die()
      if (invuln > 0) invuln -= dt; if (starT > 0) starT -= dt; if (fireCd > 0) fireCd -= dt; if (landSq > 0) landSq -= dt
      popups.forEach((p) => { p.t -= dt; p.y -= 20 * dt }); popups = popups.filter((p) => p.t > 0)
      if (Math.random() < dt * 2.5) parts.burst(camX + Math.random() * W, H, { count: 1, color: rgba(0.4), speed: 0.4, life: 2.2, gravity: -0.015, size: 2 })
      updateMovers(dt)
      // input
      const run = !!keys['shift'], down = !!(keys['arrowdown'] || keys['s'])
      duck = down && onGround && big
      const maxs = run ? 235 : 120, acc = (onGround ? (run ? 1150 : 880) : 560) * (duck ? 0.25 : 1)
      const ix = duck ? 0 : (keys['arrowleft'] || keys['a']) ? -1 : (keys['arrowright'] || keys['d']) ? 1 : 0
      skid = onGround && ix !== 0 && Math.sign(ix) === -Math.sign(pvx) && Math.abs(pvx) > 70
      if (ix) { pvx += ix * acc * dt; face = ix; pvx = Math.max(-maxs, Math.min(maxs, pvx)) }
      else { const f = 1400 * dt; if (pvx > 0) pvx = Math.max(0, pvx - f); else pvx = Math.min(0, pvx + f) }
      if (skid) { pvx -= Math.sign(pvx) * 1500 * dt; skidT -= dt; if (skidT <= 0) { skidT = 0.07; parts.burst(px + PW() / 2, py + PH(), { count: 2, color: '#cdd8cd', speed: 1.6, life: 0.3 }) } }
      if (run && onGround && Math.abs(pvx) > 200 && Math.random() < dt * 22) parts.burst(px + (face > 0 ? 0 : PW()), py + PH() - 3, { count: 1, color: rgba(0.5), speed: 1.2, life: 0.3 }) // sprint dust
      // jump (coyote + buffer + variable height + apex hang + fast-fall)
      if (onGround) coyote = 0.08; else coyote -= dt
      if (jbuf > 0) jbuf -= dt
      if (jbuf > 0 && coyote > 0) { pvy = -430; jumping = true; onGround = false; coyote = 0; jbuf = 0; sfx.jump(); parts.burst(px + PW() / 2, py + PH(), { count: 6, color: rgba(0.7), speed: 1.5, life: 0.3 }) }
      const jumpHeld = keys['arrowup'] || keys['w'] || keys[' ']
      let g = (jumping && jumpHeld && pvy < 0) ? 760 : 1550
      if (jumping && Math.abs(pvy) < 70) g *= 0.62 // apex hang
      if (down && !onGround) g *= 1.7 // fast-fall
      if (!jumpHeld && pvy < -120) pvy = -120 // cut jump when released early
      pvy = Math.min(down && !onGround ? 760 : 540, pvy + g * dt)
      // integrate + collide
      const wasG = onGround
      px += pvx * dt; { const e: Box = { x: px, y: py, w: PW(), h: PH(), vx: pvx, vy: 0 }; resolveX(e); px = e.x; pvx = e.vx }
      py += pvy * dt
      const yr = resolveYPlayer()
      onGround = yr.ground; if (onGround) jumping = false
      if (yr.head) { const [c, r] = yr.head; if (['?', 'M', 'S', 'B'].includes(tiles[r]?.[c])) bumpBlock(c, r) }
      if (onGround && !wasG) { parts.burst(px + PW() / 2, py + PH(), { count: 5, color: '#cdd8cd', speed: 1.6, life: 0.25 }); landSq = 0.14; combo = 0 }
      if (px < 0) px = 0
      if (py > H + 40) return die()
      // moving platforms (land + carry)
      let ride: Mover | null = null
      for (const m of movers) { const feet = py + PH(); if (pvy >= 0 && feet >= m.y - 3 && feet <= m.y + 13 && px + PW() > m.x + 2 && px < m.x + m.w - 2) { py = m.y - PH(); pvy = 0; onGround = true; jumping = false; ride = m; m.rideT = 0.12 } }
      if (ride) { px += ride.dx; py += ride.dy }
      // spring
      if (onGround) { const fr = Math.floor((py + PH()) / TILE), fc = Math.floor((px + PW() / 2) / TILE); if (tiles[fr]?.[fc] === 's') { pvy = -740; onGround = false; jumping = true; sfx.spring(); parts.burst(px + PW() / 2, py + PH(), { count: 9, color: rgba(0.8), speed: 3, life: 0.4 }) } }
      // hazards (spikes hurt, lava kills)
      { const hc0 = Math.floor((px + 2) / TILE), hc1 = Math.floor((px + PW() - 2) / TILE), hr0 = Math.floor((py + 2) / TILE), hr1 = Math.floor((py + PH() - 2) / TILE); for (let r = hr0; r <= hr1; r++) for (let c = hc0; c <= hc1; c++) { const t = tiles[r]?.[c]; if (t === 'L') return die(); if (t === '^') { hurt(); r = hr1 + 1; break } } }
      // checkpoint
      for (const cp of checkpoints) if (!cp.activated && px + PW() > cp.x) { cp.activated = true; cpX = px; cpY = py; addPopup(cp.x + 6, cp.y, 'CHECKPOINT'); sfx.coin() }
      // warp pipe (press Down while on a W pipe → coin bonus)
      if ((keys['arrowdown'] || keys['s']) && onGround) { const fr = Math.floor((py + PH()) / TILE), fc = Math.floor((px + PW() / 2) / TILE); if (tiles[fr]?.[fc] === 'W') { tiles[fr][fc] = 'p'; coinCount += 8; score += 800; addPopup(px + PW() / 2, py - 6, '+BONUS'); sfx.pipe(); fade = 0.55; for (let i = 0; i < 14; i++) parts.burst(px + PW() / 2, py, { count: 1, color: '#ffd400', speed: 3, life: 0.8, gravity: -0.02 }) } }
      // fire
      if (fire && keys['shift'] && fireCd <= 0 && fires.length < 2) { fires.push({ x: px + PW() / 2, y: py + 6, w: 7, h: 7, vx: face * 320, vy: 60, life: 1.4 }); fireCd = 0.35; sfx.hit() }
      updateEnemies(dt); updateItems(dt); updateFires(dt); collectCoins()
      // flag (+ height bonus)
      if (px + PW() > flagX && px < flagX + TILE && clearT <= 0) { clearT = 1.9; px = flagX - 2; pvx = 0; pvy = 0; sfx.clear(); const hb = Math.max(0, Math.round((H - TILE - py) / TILE)) * 200; score += 500 + hb; addPopup(flagX, py, '+' + (500 + hb)) }
      // camera (deadzone-ish smoothing + look-ahead)
      camTarget = Math.max(0, Math.min(lw * TILE - W, px + PW() / 2 - W * 0.42 + face * 45))
      camX += (camTarget - camX) * Math.min(1, dt * 7)
      for (const [k, v] of bumps) { const nv = v - dt; if (nv <= 0) bumps.delete(k); else bumps.set(k, nv) }
      so = shake.frame(dt); parts.update(dt)
    }
    function resolveYPlayer() { const e = { x: px, y: py, w: PW(), h: PH(), vx: 0, vy: pvy } as Box; const r = resolveY(e, true); py = e.y; pvy = e.vy; return r }

    function aabb(a: Box, b: Box) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y }
    const pbox = (): Box => ({ x: px, y: py, w: PW(), h: PH(), vx: 0, vy: 0 })

    function updateMovers(dt: number) {
      for (const m of movers) {
        const ox = m.x, oy = m.y
        if (m.kind === 'h') { m.ph += dt * m.spd; m.x = m.base + Math.sin(m.ph) * m.a }
        else if (m.kind === 'v') { m.ph += dt * m.spd; m.y = m.base + Math.sin(m.ph) * m.a }
        else { if (m.rideT > 0) m.fell = true; if (m.fell) { m.vy = Math.min(360, m.vy + 800 * dt); m.y += m.vy * dt } }
        m.dx = m.x - ox; m.dy = m.y - oy; m.rideT = Math.max(0, m.rideT - dt)
      }
      movers = movers.filter((m) => m.y < H + 80)
    }
    function updateEnemies(dt: number) {
      for (const e of enemies) {
        if (e.dead) { e.squash -= dt; continue }
        const spd = e.shell ? (e.vx !== 0 ? 220 : 0) : 36
        if (!e.shell) e.vx = e.dir * spd
        e.x += e.vx * dt; if (resolveX(e)) { e.dir *= -1; e.vx = e.shell ? -e.vx : e.vx }
        e.vy = Math.min(420, e.vy + 1200 * dt); e.y += e.vy * dt; const yr = resolveY(e); e.ground = yr.ground
        // ledge turn (walkers only)
        if (!e.shell && e.ground) { const ahead = Math.floor((e.x + (e.dir > 0 ? e.w + 2 : -2)) / TILE), below = Math.floor((e.y + e.h + 2) / TILE); if (!cellSolid(ahead, below)) e.dir *= -1 }
        // shell breaks bricks / kills others
        if (e.shell && e.vx !== 0) {
          for (const o of enemies) if (o !== e && !o.dead && aabb(e, o)) { o.dead = true; o.squash = 0.4; score += 100; sfx.hit(); parts.burst(o.x + 8, o.y + 8, { color: '#ff5599', count: 8, speed: 3 }) }
        }
        // player interaction
        if (deadT <= 0 && clearT <= 0 && aabb(pbox(), e)) {
          const falling = pvy > 60 && (py + PH()) - e.y < 16
          if (starT > 0) { e.dead = true; e.squash = 0.4; score += 100; sfx.hit() }
          else if (e.kind === 'koopa' && e.shell && e.vx === 0) { e.vx = (px < e.x ? 1 : -1) * 220; e.dir = Math.sign(e.vx); sfx.stomp() }
          else if (falling) {
            if (e.kind === 'koopa' && !e.shell) { e.shell = true; e.vx = 0; e.h = 16; e.y += 6 } else { e.dead = true; e.squash = 0.4 }
            combo = Math.min(combo + 1, 7); const tbl = [100, 200, 400, 800, 1000, 2000, 4000, 8000], val = tbl[combo - 1]; score += val
            addPopup(e.x + 8, e.y, combo >= 5 ? '1UP' : '+' + val); if (combo >= 5) lives++
            pvy = -260; jumping = true; sfx.stomp(); parts.burst(e.x + 8, e.y + 8, { color: '#ff5599', count: 8, speed: 2.5 })
          } else hurt()
        }
      }
      enemies = enemies.filter((e) => !(e.dead && e.squash <= 0))
    }
    function updateItems(dt: number) {
      for (const it of items) {
        if (it.emerge > 0) { const d = Math.min(it.emerge, 30 * dt); it.y -= d; it.emerge -= d; continue }
        if (it.kind !== 'fire') { it.x += it.vx * dt; if (resolveX(it)) it.vx *= -1 }
        it.vy = Math.min(360, it.vy + 1100 * dt); it.y += it.vy * dt; const yr = resolveY(it)
        if (it.kind === 'star' && yr.ground) it.vy = -300
        if (aabb(pbox(), it)) { it.emerge = -999; if (it.kind === 'mush') { big = true; score += 1000 } else if (it.kind === 'fire') { big = true; fire = true; score += 1000 } else { starT = 8; score += 1000 } addPopup(it.x + 8, it.y, it.kind === 'fire' ? 'FIRE! ⇧' : it.kind === 'star' ? 'STAR!' : '+1000'); sfx.powerup(); parts.burst(it.x + 8, it.y + 8, { color: it.kind === 'fire' ? '#ff9040' : '#ffd400', count: 14, speed: 3 }) }
      }
      items = items.filter((it) => it.emerge !== -999)
    }
    function updateFires(dt: number) {
      for (const f of fires) {
        f.life -= dt; f.x += f.vx * dt; if (resolveX(f)) f.life = 0
        f.vy = Math.min(300, f.vy + 900 * dt); f.y += f.vy * dt; const yr = resolveY(f); if (yr.ground) f.vy = -200
        for (const e of enemies) if (!e.dead && aabb(f, e)) { e.dead = true; e.squash = 0.4; score += 100; f.life = 0; sfx.hit(); parts.burst(e.x + 8, e.y + 8, { color: '#ff9040', count: 10, speed: 3 }) }
      }
      fires = fires.filter((f) => f.life > 0)
    }
    function collectCoins() {
      const b = pbox()
      for (const c of coins) if (!c.got && c.x > b.x - 4 && c.x < b.x + b.w + 4 && c.y > b.y - 4 && c.y < b.y + b.h + 4) {
        c.got = true; coinCount++; score += 200; sfx.coin(); parts.burst(c.x, c.y, { color: '#ffd400', count: 8, speed: 2.4, life: 0.4 })
      }
      if (coinCount >= 100) { coinCount -= 100; lives++; sfx.oneup() }
    }

    // ---- render ----
    function drawTile(ch: string, x: number, y: number, a: string, c: number, r: number) {
      if (ch === 'X') {
        const top = !isSolidChar(tiles[r - 1]?.[c])
        ctx.fillStyle = '#141a26'; ctx.fillRect(x, y, TILE, TILE)
        ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 3 + ((c * 7 + i * 9) % (TILE - 6)), y + 5 + ((r * 5 + i * 7) % (TILE - 8)), 2, 2)
        if (top) { ctx.fillStyle = rgba(0.55); ctx.fillRect(x, y, TILE, 4); glow(ctx, a, 5); ctx.fillStyle = a; ctx.fillRect(x, y, TILE, 1.5); noGlow(ctx) }
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1)
      }
      else if (ch === 'B') { ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = '#4a3626'; ctx.fillRect(x + 1, y + 1, TILE - 2, TILE / 2 - 2); ctx.fillRect(x + 1, y + TILE / 2 + 1, TILE - 2, TILE / 2 - 2); ctx.strokeStyle = '#1c130c'; ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1) }
      else if (ch === '?' || ch === 'M' || ch === 'S') { const pulse = 6 + Math.sin(anim * 6 + c) * 4; glow(ctx, ch === 'S' ? '#ffd400' : a, pulse); ctx.fillStyle = ch === 'S' ? '#caa033' : rgba(0.24); roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 4); ctx.fill(); noGlow(ctx); ctx.fillStyle = ch === 'S' ? '#ffd400' : a; ctx.font = 'bold 15px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch === 'S' ? '★' : '?', x + TILE / 2, y + TILE / 2 + 1); ctx.textBaseline = 'alphabetic' }
      else if (ch === 'u') { ctx.fillStyle = '#20262e'; roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 4); ctx.fill() }
      else if (ch === 'p' || ch === 'W') { const top = tiles[r - 1]?.[c] !== ch; ctx.fillStyle = '#127a4a'; ctx.fillRect(x + 1, y, TILE - 2, TILE); ctx.fillStyle = '#1aa866'; ctx.fillRect(x + 1, y, 4, TILE); ctx.strokeStyle = '#0a3a24'; ctx.strokeRect(x + 1.5, y + 0.5, TILE - 3, TILE - 1); if (top) { ctx.fillStyle = '#16935a'; ctx.fillRect(x - 1, y, TILE + 2, 5) } if (ch === 'W') { glow(ctx, a, 6); ctx.fillStyle = a; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▼', x + TILE / 2, y + TILE / 2); ctx.textBaseline = 'alphabetic'; noGlow(ctx) } }
      else if (ch === '=') { glow(ctx, a, 6); ctx.fillStyle = rgba(0.3); roundRect(ctx, x, y + 3, TILE, TILE - 9, 3); ctx.fill(); ctx.fillStyle = a; ctx.fillRect(x, y + 3, TILE, 2); noGlow(ctx) }
      else if (ch === 't') { glow(ctx, a, 5); ctx.fillStyle = rgba(0.45); roundRect(ctx, x, y + 2, TILE, 5, 2); ctx.fill(); noGlow(ctx) }
      else if (ch === 's') { ctx.fillStyle = '#444'; ctx.fillRect(x + 4, y + TILE - 6, TILE - 8, 6); glow(ctx, a, 6); ctx.strokeStyle = a; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(x + 4, y + 6 + i * 4); ctx.lineTo(x + TILE - 4, y + 8 + i * 4) } ctx.stroke(); ctx.lineWidth = 1; noGlow(ctx) }
      else if (ch === '^') { ctx.fillStyle = '#9aa6b2'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 2 + i * 7, y + TILE); ctx.lineTo(x + 5.5 + i * 7, y + TILE - 12); ctx.lineTo(x + 9 + i * 7, y + TILE); ctx.fill() } }
      else if (ch === 'L') { const w = Math.sin(anim * 4 + c) * 2; ctx.fillStyle = '#ff5530'; ctx.fillRect(x, y + 4 + w, TILE, TILE - 4 - w); glow(ctx, '#ff8040', 10); ctx.fillStyle = '#ff9a50'; ctx.fillRect(x, y + 4 + w, TILE, 3); noGlow(ctx) }
    }
    function render() {
      const a = accent()
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, starT > 0 ? '#241a3a' : '#0a1426'); bg.addColorStop(1, '#070a12')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      drawStars(ctx, stars, W, 0.02)
      // clouds
      for (const cl of clouds) { cl.x -= cl.s * 0.25; if (cl.x < -44) cl.x = W + 44; ctx.fillStyle = `rgba(120,150,190,${0.06 + cl.s * 0.05})`; roundRect(ctx, cl.x, cl.y, 34, 12, 6); ctx.fill(); roundRect(ctx, cl.x + 14, cl.y - 6, 24, 12, 6); ctx.fill() }
      // far / mid / near parallax
      let off = (camX * 0.2) % 90; ctx.fillStyle = 'rgba(38,58,88,0.16)'
      for (let i = -1; i < W / 90 + 2; i++) { const bx = i * 90 - off, bh = 40 + ((i * 53) % 60); ctx.fillRect(bx, H - 84 - bh, 60, bh + 84) }
      off = (camX * 0.4) % 64; ctx.fillStyle = 'rgba(48,72,108,0.2)'
      for (let i = -1; i < W / 64 + 2; i++) { const bx = i * 64 - off, bh = 26 + ((i * 71) % 44); ctx.fillRect(bx, H - 60 - bh, 44, bh + 60) }
      off = (camX * 0.7) % 52; ctx.fillStyle = 'rgba(18,48,34,0.55)'
      for (let i = -1; i < W / 52 + 2; i++) { const bx = i * 52 - off; ctx.beginPath(); ctx.arc(bx, H - 26, 24, Math.PI, 0); ctx.fill() }
      ctx.save(); ctx.translate(so.dx, so.dy)
      const c0 = Math.max(0, Math.floor(camX / TILE)), c1 = Math.min(lw - 1, Math.ceil((camX + W) / TILE))
      // flag
      const fx = flagX - camX + TILE / 2
      if (fx > -20 && fx < W + 20) { glow(ctx, a, 10); ctx.strokeStyle = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, TILE); ctx.lineTo(fx, H - TILE); ctx.stroke(); ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(fx, TILE + 4); ctx.lineTo(fx + 26, TILE + 12); ctx.lineTo(fx, TILE + 20); ctx.fill(); noGlow(ctx); ctx.lineWidth = 1 }
      // tiles
      for (let r = 0; r < lh; r++) for (let c = c0; c <= c1; c++) { const ch = tiles[r]?.[c]; if (!ch || ch === ' ') continue; const key = c + ',' + r; const by = bumps.has(key) ? -Math.sin((1 - (bumps.get(key)! / 0.18)) * Math.PI) * 6 : 0; drawTile(ch, c * TILE - camX, r * TILE + by, a, c, r) }
      // moving platforms
      for (const m of movers) { const mx = m.x - camX; if (mx < -m.w || mx > W) continue; glow(ctx, a, 6); ctx.fillStyle = rgba(0.3); roundRect(ctx, mx, m.y, m.w, m.h, 3); ctx.fill(); ctx.fillStyle = a; ctx.fillRect(mx, m.y, m.w, 2); noGlow(ctx) }
      // coins
      for (const c of coins) { if (c.got) continue; const sx = Math.abs(Math.cos(anim * 5)); glow(ctx, '#ffd400', 7); ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.ellipse(c.x - camX, c.y, 4 * sx + 0.7, 5, 0, 0, 7); ctx.fill(); noGlow(ctx) }
      // items
      for (const it of items) { const ix = it.x - camX, iy = it.y; if (it.kind === 'mush') { ctx.fillStyle = '#ff5566'; roundRect(ctx, ix, iy, 16, 9, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(ix + 3, iy + 3, 3, 3); ctx.fillRect(ix + 10, iy + 3, 3, 3); ctx.fillStyle = '#eee'; ctx.fillRect(ix + 3, iy + 9, 10, 7) } else if (it.kind === 'fire') { glow(ctx, '#ff9040', 8); ctx.fillStyle = '#ff9040'; roundRect(ctx, ix, iy, 16, 16, 4); ctx.fill(); ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(ix + 8, iy + 8, 4, 0, 7); ctx.fill(); noGlow(ctx) } else { glow(ctx, '#ffd400', 10); ctx.fillStyle = '#ffd400'; star(ctx, ix + 8, iy + 8, 8); noGlow(ctx) } }
      // enemies
      for (const e of enemies) { const ex = e.x - camX; if (e.dead) { ctx.fillStyle = '#7a3a5a'; ctx.fillRect(ex, e.y + e.h - 5, e.w, 5); continue } if (e.kind === 'goomba') { glow(ctx, '#ff5599', 5); ctx.fillStyle = '#ff5599'; roundRect(ctx, ex, e.y + 2, e.w, e.h - 2, 6); ctx.fill(); noGlow(ctx); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex + 3, e.y + 6, 3, 4); ctx.fillRect(ex + e.w - 6, e.y + 6, 3, 4); ctx.fillStyle = '#2a1020'; ctx.fillRect(ex + 1, e.y + e.h - 3, 5, 3); ctx.fillRect(ex + e.w - 6, e.y + e.h - 3, 5, 3) } else { glow(ctx, e.shell ? '#22d0c0' : '#22c0e0', 5); ctx.fillStyle = e.shell ? '#1aa898' : '#22c0e0'; roundRect(ctx, ex, e.y + (e.shell ? 0 : -4), e.w, e.h, e.shell ? 7 : 5); ctx.fill(); noGlow(ctx); if (!e.shell) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex + 3, e.y, 3, 4); ctx.fillRect(ex + e.w - 6, e.y, 3, 4) } } }
      // fireballs
      for (const f of fires) { glow(ctx, '#ff9040', 8); ctx.fillStyle = '#ffc060'; ctx.beginPath(); ctx.arc(f.x - camX + 3, f.y + 3, 4.5, 0, 7); ctx.fill(); noGlow(ctx) }
      // player
      drawPlayer(a)
      // score popups
      ctx.textAlign = 'center'; ctx.font = 'bold 10px "JetBrains Mono",monospace'
      for (const p of popups) { ctx.globalAlpha = Math.min(1, p.t * 2.2); ctx.fillStyle = p.txt === '1UP' ? '#5dff8f' : '#ffe27a'; ctx.fillText(p.txt, p.x - camX, p.y) }
      ctx.globalAlpha = 1
      ctx.translate(-camX, 0); parts.draw(ctx); ctx.restore()
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.82); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)
      hud(a)
      if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; ctx.fillRect(0, 0, W, H) }
    }
    function star(c: CanvasRenderingContext2D, x: number, y: number, r: number) { c.beginPath(); for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * rad, y + Math.sin(ang) * rad) } c.closePath(); c.fill() }
    function drawPlayer(a: string) {
      if (invuln > 0 && Math.floor(anim * 16) % 2) return
      const w = PW(), h = PH()
      // squash & stretch
      let sx = 1, sy = 1
      if (!onGround) { if (pvy < 0) { sy = 1.12; sx = 0.9 } else { sy = 0.94; sx = 1.08 } }
      if (landSq > 0) { const k = landSq / 0.14; sy = 1 - 0.28 * k; sx = 1 + 0.28 * k }
      if (duck) { sy = 0.58; sx = 1.22 }
      const dw = w * sx, dh = h * sy, x = px - camX + (w - dw) / 2, y = py + (h - dh)
      const col = starT > 0 ? `hsl(${(anim * 360) % 360},90%,60%)` : a
      glow(ctx, col, starT > 0 ? 14 : 8); ctx.fillStyle = col
      // legs
      const moving = Math.abs(pvx) > 20 && onGround && !duck
      if (onGround && !duck) { const lp = moving ? Math.sin(anim * 20) * 3 : 0; ctx.fillRect(x + 2, y + dh - 5 + lp, 4, 5); ctx.fillRect(x + dw - 6, y + dh - 5 - lp, 4, 5) }
      else if (!onGround) { ctx.fillRect(x + 2, y + dh - 4, 4, 4); ctx.fillRect(x + dw - 6, y + dh - 4, 4, 4) }
      // body
      roundRect(ctx, x + 1, y + (big ? 4 : 0), dw - 2, dh - (big ? 9 : 5), 4); ctx.fill(); noGlow(ctx)
      // skid puff
      if (skid) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + (face > 0 ? -3 : dw - 1), y + dh - 4, 4, 4) }
      // eye (facing)
      ctx.fillStyle = '#0a0f0a'; const ex = face > 0 ? x + dw - 7 : x + 3; ctx.fillRect(ex, y + (big ? 8 : 3) * sy, 3, 3)
      if (fire) { ctx.fillStyle = '#ff9040'; ctx.fillRect(x + 1, y + (big ? 4 : 0), dw - 2, 3) }
    }
    function hud(a: string) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 22)
      ctx.fillStyle = a; ctx.font = 'bold 11px "JetBrains Mono",monospace'; ctx.textAlign = 'left'
      ctx.fillText('pyGuru x' + lives, 8, 15)
      ctx.fillText('● ' + coinCount, 110, 15)
      ctx.textAlign = 'center'; ctx.fillText('WORLD 1-' + (level + 1), W / 2, 15)
      ctx.textAlign = 'right'; ctx.fillText(score + '  ⏱' + Math.ceil(Math.max(0, timeLeft)), W - 8, 15)
      if (starT > 0) { ctx.fillStyle = '#ffd400'; ctx.textAlign = 'left'; ctx.fillText('★', 92, 15) }
      if (fire) { ctx.fillStyle = '#ff9040'; ctx.font = 'bold 9px "JetBrains Mono",monospace'; ctx.textAlign = 'left'; ctx.fillText('🔥 SHIFT', 150, 15); ctx.font = 'bold 11px "JetBrains Mono",monospace' }
      if (introT > 0 && state === 'play') panel(ctx, W, H, 'WORLD 1-' + (level + 1), level === 0 ? 'reach the flag →' : '', '← → run · SHIFT dash/fire · ↑ jump')
      else if (state === 'start') { const s = loadSave(); panel(ctx, W, H, 'SUPER pyGURU', s && s.lives > 0 ? `continue · WORLD 1-${s.level + 1} · ♥${s.lives}` : 'best ' + best, '← → move · SHIFT run/fire · ↑ jump · SPACE') }
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', '', 'press P to resume')
      else if (state === 'gameover') panel(ctx, W, H, 'GAME OVER', 'score ' + score + ' · best ' + best, 'press R to retry')
      else if (state === 'win') panel(ctx, W, H, 'YOU WIN! 🏆', 'all 5 worlds · score ' + score, 'press R to play again')
    }

    let raf = 0, last = performance.now(), accT = 0
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts
      if (state === 'play') { accT += dt; let n = 0; while (accT >= 1 / 120 && n++ < 8) { sim(1 / 120); accT -= 1 / 120 } }
      else { parts.update(dt); so = shake.frame(dt); anim += dt }
      if (state === 'play') { if (musicWorld !== level) { musicStop(); musicStart(level); musicWorld = level } } else if (musicWorld >= 0) { musicStop(); musicWorld = -1 }
      render(); raf = requestAnimationFrame(loop)
    }
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', ' '].includes(k)) e.preventDefault()
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; return }
      if (k === 'r') { if (state !== 'start') begin(); return }
      // cheat: jump between levels
      if (state === 'play' && k >= '1' && k <= '5') { level = Math.min(LEVELS.length - 1, +k - 1); loadLevel(level); saveProg(); return }
      if (state === 'play' && (k === 'n' || k === 'b')) { level = Math.max(0, Math.min(LEVELS.length - 1, level + (k === 'n' ? 1 : -1))); loadLevel(level); saveProg(); return }
      if (k === ' ' && (state === 'start' || state === 'gameover' || state === 'win')) { begin(); return }
      if ((k === 'arrowup' || k === 'w' || k === ' ') && !keys[k]) jbuf = 0.1
      keys[k] = true
    }
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
    const click = () => { if (state === 'start' || state === 'gameover' || state === 'win') begin() }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); musicStop(); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">←→ run · SHIFT dash/fire · ↑/SPACE jump · stomp enemies · P pause · R retry · Esc <span className="opacity-50">· cheat: 1-5 / N = level</span></div>
    </>
  )
}
