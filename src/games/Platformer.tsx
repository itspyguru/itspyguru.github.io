import { useEffect, useRef } from 'react'
import { sfx } from '../os/sound'
import { getBest, setBest } from './scores'
import { fitCanvas, Particles, Shake, glow, noGlow, roundRect, accent, rgba, makeStars, drawStars, panel } from './engine'
import { LEVELS } from './platformerLevels'

const TILE = 22, COLS = 22, ROWS = 14, W = COLS * TILE, H = ROWS * TILE
const SOLID = new Set(['X', 'B', '?', 'M', 'S', 'p', '=', 'u'])
const isSolidChar = (c: string | undefined) => !!c && SOLID.has(c)

type Box = { x: number; y: number; w: number; h: number; vx: number; vy: number }
type Enemy = Box & { kind: 'goomba' | 'koopa'; dir: number; dead: boolean; squash: number; shell: boolean; ground: boolean }
type Item = Box & { kind: 'mush' | 'fire' | 'star'; emerge: number; dir: number; ground: boolean }
type Fire = Box & { life: number }
type Coin = { x: number; y: number; got: boolean }

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
    let level = 0, lives = 3, score = 0, coinCount = 0, best = getBest('platformer')
    // player
    let px = 0, py = 0, pvx = 0, pvy = 0, onGround = false, face = 1, big = false, fire = false
    let coyote = 0, jbuf = 0, jumping = false, invuln = 0, starT = 0, fireCd = 0, anim = 0
    let camX = 0, introT = 0, deadT = 0, clearT = 0, timeLeft = 0, so = { dx: 0, dy: 0 }
    let state: 'start' | 'play' | 'pause' | 'gameover' | 'win' = 'start'
    const keys: Record<string, boolean> = {}
    const PW = () => 15, PH = () => (big ? 28 : 16)

    function loadLevel(idx: number) {
      const map = LEVELS[idx]; lh = map.length; lw = Math.max(...map.map((r) => r.length))
      tiles = map.map((r) => r.padEnd(lw, ' ').split(''))
      coins = []; enemies = []; items = []; fires = []; bumps = new Map()
      for (let r = 0; r < lh; r++) for (let c = 0; c < lw; c++) {
        const ch = tiles[r][c]
        if (ch === 'o') { coins.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, got: false }); tiles[r][c] = ' ' }
        else if (ch === 'g' || ch === 'k') { enemies.push({ x: c * TILE + 3, y: r * TILE + (ch === 'g' ? 6 : 0), w: 16, h: ch === 'g' ? 16 : 22, vx: 0, vy: 0, kind: ch === 'g' ? 'goomba' : 'koopa', dir: -1, dead: false, squash: 0, shell: false, ground: false }); tiles[r][c] = ' ' }
        else if (ch === '@') { startX = c * TILE + 3; startY = r * TILE; tiles[r][c] = ' ' }
        else if (ch === 'F') { flagX = c * TILE; tiles[r][c] = ' ' }
      }
      if (startX === 0 && startY === 0) { startX = TILE; for (let r = 0; r < lh; r++) if (isSolidChar(tiles[r][1])) { startY = (r - 1) * TILE; break } }
      px = startX; py = startY; pvx = pvy = 0; onGround = false; camX = 0
      timeLeft = 260; introT = 1.5; deadT = 0; clearT = 0
    }
    const begin = () => { level = 0; lives = 3; score = 0; coinCount = 0; big = false; fire = false; starT = 0; loadLevel(0); state = 'play'; sfx.start() }

    const cellSolid = (c: number, r: number) => { if (c < 0) return true; if (c >= lw || r < 0 || r >= lh) return false; return isSolidChar(tiles[r][c]) }
    const resolveX = (e: Box) => {
      const r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 0.01) / TILE)
      if (e.vx > 0) { const c = Math.floor((e.x + e.w) / TILE); for (let r = r0; r <= r1; r++) if (cellSolid(c, r)) { e.x = c * TILE - e.w; e.vx = 0; return true } }
      else if (e.vx < 0) { const c = Math.floor(e.x / TILE); for (let r = r0; r <= r1; r++) if (cellSolid(c, r)) { e.x = (c + 1) * TILE; e.vx = 0; return true } }
      return false
    }
    const resolveY = (e: Box) => {
      const c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.01) / TILE); let ground = false; let head: [number, number] | null = null
      if (e.vy > 0) { const r = Math.floor((e.y + e.h) / TILE); for (let c = c0; c <= c1; c++) if (cellSolid(c, r)) { e.y = r * TILE - e.h; e.vy = 0; ground = true; break } }
      else if (e.vy < 0) { const r = Math.floor(e.y / TILE); for (let c = c0; c <= c1; c++) if (cellSolid(c, r)) { e.y = (r + 1) * TILE; e.vy = 0; head = [c, r]; break } }
      return { ground, head }
    }

    function bumpBlock(c: number, r: number) {
      const ch = tiles[r][c]; bumps.set(c + ',' + r, 0.18)
      if (ch === '?') { tiles[r][c] = 'u'; coinCount++; score += 200; sfx.score(); parts.burst(c * TILE + TILE / 2, r * TILE, { color: '#ffd400', count: 8, speed: 2.5, life: 0.5 }) }
      else if (ch === 'M') { tiles[r][c] = 'u'; spawnItem(c, r, big ? 'fire' : 'mush'); sfx.powerup() }
      else if (ch === 'S') { tiles[r][c] = 'u'; spawnItem(c, r, 'star'); sfx.powerup() }
      else if (ch === 'B') { if (big || fire) { tiles[r][c] = ' '; score += 50; sfx.bounce(); parts.burst(c * TILE + TILE / 2, r * TILE + TILE / 2, { color: '#c08a5a', count: 12, speed: 3, life: 0.5, gravity: 0.05 }) } else sfx.bounce() }
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
      if (introT > 0) { introT -= dt; anim += dt; return }
      if (deadT > 0) { deadT -= dt; pvy += 1500 * dt; py += pvy * dt; if (deadT <= 0) { lives--; if (lives <= 0) { state = 'gameover'; best = setBest('platformer', score) } else loadLevel(level) }; return }
      if (clearT > 0) { clearT -= dt; px += 60 * dt; pvy += 1500 * dt; py += pvy * dt; resolveY({ x: px, y: py, w: PW(), h: PH(), vx: 0, vy: pvy } as Box); if (clearT <= 0) { if (level >= LEVELS.length - 1) { state = 'win'; best = setBest('platformer', score) } else { level++; const L = lives, S = score, C = coinCount; loadLevel(level); lives = L; score = S; coinCount = C } }; return }
      anim += dt
      timeLeft -= dt; if (timeLeft <= 0) return die()
      if (invuln > 0) invuln -= dt; if (starT > 0) starT -= dt; if (fireCd > 0) fireCd -= dt
      // input
      const run = !!keys['shift'], maxs = run ? 190 : 120, acc = onGround ? 900 : 560
      let ix = (keys['arrowleft'] || keys['a']) ? -1 : (keys['arrowright'] || keys['d']) ? 1 : 0
      if (ix) { pvx += ix * acc * dt; face = ix; pvx = Math.max(-maxs, Math.min(maxs, pvx)) }
      else { const f = 1400 * dt; if (pvx > 0) pvx = Math.max(0, pvx - f); else pvx = Math.min(0, pvx + f) }
      // jump (coyote + buffer + variable height)
      if (onGround) coyote = 0.08; else coyote -= dt
      if (jbuf > 0) jbuf -= dt
      if (jbuf > 0 && coyote > 0) { pvy = -430; jumping = true; onGround = false; coyote = 0; jbuf = 0; sfx.flap(); parts.burst(px + PW() / 2, py + PH(), { count: 6, color: rgba(0.7), speed: 1.5, life: 0.3 }) }
      const jumpHeld = keys['arrowup'] || keys['w'] || keys[' ']
      const grav = (jumping && jumpHeld && pvy < 0) ? 760 : 1550
      if (!jumpHeld && pvy < -120) pvy = -120 // cut jump when released early
      pvy = Math.min(540, pvy + grav * dt)
      // integrate + collide
      const wasG = onGround
      px += pvx * dt; { const e: Box = { x: px, y: py, w: PW(), h: PH(), vx: pvx, vy: 0 }; resolveX(e); px = e.x; pvx = e.vx }
      py += pvy * dt
      const yr = resolveYPlayer()
      onGround = yr.ground; if (onGround) jumping = false
      if (yr.head) { const [c, r] = yr.head; if (['?', 'M', 'S', 'B'].includes(tiles[r]?.[c])) bumpBlock(c, r) }
      if (onGround && !wasG) parts.burst(px + PW() / 2, py + PH(), { count: 5, color: '#cdd8cd', speed: 1.6, life: 0.25 })
      if (px < 0) px = 0
      if (py > H + 40) return die()
      // fire
      if (fire && keys['shift'] && fireCd <= 0 && fires.length < 2) { fires.push({ x: px + PW() / 2, y: py + 6, w: 7, h: 7, vx: face * 320, vy: 60, life: 1.4 }); fireCd = 0.35; sfx.hit() }
      updateEnemies(dt); updateItems(dt); updateFires(dt); collectCoins()
      // flag
      if (px + PW() > flagX && px < flagX + TILE && clearT <= 0) { clearT = 1.9; pvx = 0; pvy = 0; sfx.clear(); score += 500 }
      // camera
      camX = Math.max(0, Math.min(lw * TILE - W, px + PW() / 2 - W * 0.42))
      for (const [k, v] of bumps) { const nv = v - dt; if (nv <= 0) bumps.delete(k); else bumps.set(k, nv) }
      so = shake.frame(dt); parts.update(dt)
    }
    function resolveYPlayer() { const e = { x: px, y: py, w: PW(), h: PH(), vx: 0, vy: pvy } as Box; const r = resolveY(e); py = e.y; pvy = e.vy; return r }

    function aabb(a: Box, b: Box) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y }
    const pbox = (): Box => ({ x: px, y: py, w: PW(), h: PH(), vx: 0, vy: 0 })

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
          else if (e.kind === 'koopa' && e.shell && e.vx === 0) { e.vx = (px < e.x ? 1 : -1) * 220; e.dir = Math.sign(e.vx); sfx.hit() }
          else if (falling) {
            if (e.kind === 'koopa' && !e.shell) { e.shell = true; e.vx = 0; e.h = 16; e.y += 6 } else { e.dead = true; e.squash = 0.4 }
            pvy = -260; jumping = true; score += 100; sfx.hit(); parts.burst(e.x + 8, e.y + 8, { color: '#ff5599', count: 8, speed: 2.5 })
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
        if (aabb(pbox(), it)) { it.emerge = -999; if (it.kind === 'mush') { big = true; score += 1000 } else if (it.kind === 'fire') { big = true; fire = true; score += 1000 } else { starT = 8; score += 1000 } sfx.powerup(); parts.burst(it.x + 8, it.y + 8, { color: '#ffd400', count: 14, speed: 3 }) }
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
        c.got = true; coinCount++; score += 200; sfx.score(); parts.burst(c.x, c.y, { color: '#ffd400', count: 8, speed: 2.4, life: 0.4 })
      }
      if (coinCount >= 100) { coinCount -= 100; lives++; sfx.powerup() }
    }

    // ---- render ----
    function drawTile(ch: string, x: number, y: number, a: string) {
      if (ch === 'X') { ctx.fillStyle = '#161c28'; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = rgba(0.5); ctx.fillRect(x, y, TILE, 3); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1) }
      else if (ch === 'B') { ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x, y, TILE, TILE); ctx.strokeStyle = '#1c130c'; ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE / 2 - 1); ctx.strokeRect(x + 1, y + TILE / 2, TILE - 2, TILE / 2 - 1) }
      else if (ch === '?' || ch === 'M' || ch === 'S') { glow(ctx, ch === 'S' ? '#ffd400' : a, 8); ctx.fillStyle = ch === 'S' ? '#caa033' : rgba(0.22); roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 4); ctx.fill(); noGlow(ctx); ctx.fillStyle = ch === 'S' ? '#ffd400' : a; ctx.font = 'bold 15px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch === 'S' ? '★' : '?', x + TILE / 2, y + TILE / 2 + 1); ctx.textBaseline = 'alphabetic' }
      else if (ch === 'u') { ctx.fillStyle = '#20262e'; roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 4); ctx.fill() }
      else if (ch === 'p') { ctx.fillStyle = '#127a4a'; ctx.fillRect(x + 1, y, TILE - 2, TILE); ctx.fillStyle = '#1aa866'; ctx.fillRect(x + 1, y, 4, TILE); ctx.strokeStyle = '#0a3a24'; ctx.strokeRect(x + 1.5, y + 0.5, TILE - 3, TILE - 1) }
      else if (ch === '=') { glow(ctx, a, 6); ctx.fillStyle = rgba(0.3); roundRect(ctx, x, y + 3, TILE, TILE - 9, 3); ctx.fill(); ctx.fillStyle = a; ctx.fillRect(x, y + 3, TILE, 2); noGlow(ctx) }
    }
    function render() {
      const a = accent()
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, starT > 0 ? '#241a3a' : '#0a1426'); bg.addColorStop(1, '#070a12')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      drawStars(ctx, stars, W, 0.02)
      // distant neon skyline (parallax)
      ctx.fillStyle = 'rgba(40,60,90,0.18)'; const off = (camX * 0.3) % 80
      for (let i = -1; i < W / 80 + 2; i++) { const bx = i * 80 - off, bh = 30 + ((i * 53) % 50); ctx.fillRect(bx, H - 70 - bh, 54, bh + 70) }
      ctx.save(); ctx.translate(so.dx, so.dy)
      const c0 = Math.max(0, Math.floor(camX / TILE)), c1 = Math.min(lw - 1, Math.ceil((camX + W) / TILE))
      // flag
      const fx = flagX - camX + TILE / 2
      if (fx > -20 && fx < W + 20) { glow(ctx, a, 10); ctx.strokeStyle = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, TILE); ctx.lineTo(fx, H - TILE); ctx.stroke(); ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(fx, TILE + 4); ctx.lineTo(fx + 26, TILE + 12); ctx.lineTo(fx, TILE + 20); ctx.fill(); noGlow(ctx); ctx.lineWidth = 1 }
      // tiles
      for (let r = 0; r < lh; r++) for (let c = c0; c <= c1; c++) { const ch = tiles[r]?.[c]; if (!ch || ch === ' ') continue; const key = c + ',' + r; const by = bumps.has(key) ? -Math.sin((1 - (bumps.get(key)! / 0.18)) * Math.PI) * 6 : 0; drawTile(ch, c * TILE - camX, r * TILE + by, a) }
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
      parts.draw(ctx); ctx.restore()
      hud(a)
    }
    function star(c: CanvasRenderingContext2D, x: number, y: number, r: number) { c.beginPath(); for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * rad, y + Math.sin(ang) * rad) } c.closePath(); c.fill() }
    function drawPlayer(a: string) {
      if (invuln > 0 && Math.floor(anim * 16) % 2) return
      const x = px - camX, y = py, w = PW(), h = PH()
      const col = starT > 0 ? `hsl(${(anim * 360) % 360},90%,60%)` : a
      const moving = Math.abs(pvx) > 20 && onGround, legp = moving ? Math.sin(anim * 18) : 0
      glow(ctx, col, 8); ctx.fillStyle = col
      // legs
      ctx.fillRect(x + 2, y + h - 5 + legp * 2, 4, 5); ctx.fillRect(x + w - 6, y + h - 5 - legp * 2, 4, 5)
      // body
      roundRect(ctx, x + 1, y + (big ? 4 : 0), w - 2, h - (big ? 9 : 5), 4); ctx.fill(); noGlow(ctx)
      // face dir
      ctx.fillStyle = '#0a0f0a'; const ex = face > 0 ? x + w - 7 : x + 3; ctx.fillRect(ex, y + (big ? 8 : 3), 3, 3)
      if (fire) { ctx.fillStyle = '#ff9040'; ctx.fillRect(x + 1, y + (big ? 4 : 0), w - 2, 3) }
    }
    function hud(a: string) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 22)
      ctx.fillStyle = a; ctx.font = 'bold 11px "JetBrains Mono",monospace'; ctx.textAlign = 'left'
      ctx.fillText('pyGuru x' + lives, 8, 15)
      ctx.fillText('● ' + coinCount, 110, 15)
      ctx.textAlign = 'center'; ctx.fillText('WORLD 1-' + (level + 1), W / 2, 15)
      ctx.textAlign = 'right'; ctx.fillText(score + '  ⏱' + Math.ceil(Math.max(0, timeLeft)), W - 8, 15)
      if (starT > 0) { ctx.fillStyle = '#ffd400'; ctx.textAlign = 'left'; ctx.fillText('★', 92, 15) }
      if (introT > 0 && state === 'play') panel(ctx, W, H, 'WORLD 1-' + (level + 1), level === 0 ? 'reach the flag →' : '', '← → run · SHIFT dash/fire · ↑ jump')
      else if (state === 'start') panel(ctx, W, H, 'SUPER pyGURU', 'best ' + best, '← → move · SHIFT run/fire · ↑ jump · SPACE')
      else if (state === 'pause') panel(ctx, W, H, 'PAUSED', '', 'press P to resume')
      else if (state === 'gameover') panel(ctx, W, H, 'GAME OVER', 'score ' + score + ' · best ' + best, 'press R to retry')
      else if (state === 'win') panel(ctx, W, H, 'YOU WIN! 🏆', 'all 5 worlds · score ' + score, 'press R to play again')
    }

    let raf = 0, last = performance.now(), accT = 0
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts
      if (state === 'play') { accT += dt; let n = 0; while (accT >= 1 / 120 && n++ < 8) { sim(1 / 120); accT -= 1 / 120 } }
      else { parts.update(dt); so = shake.frame(dt); anim += dt }
      render(); raf = requestAnimationFrame(loop)
    }
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', ' '].includes(k)) e.preventDefault()
      if (k === 'p') { if (state === 'play') state = 'pause'; else if (state === 'pause') state = 'play'; return }
      if (k === 'r') { if (state !== 'start') begin(); return }
      if (k === ' ' && (state === 'start' || state === 'gameover' || state === 'win')) { begin(); return }
      if ((k === 'arrowup' || k === 'w' || k === ' ') && !keys[k]) jbuf = 0.1
      keys[k] = true
    }
    const ku = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
    const click = () => { if (state === 'start' || state === 'gameover' || state === 'win') begin() }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); cv.addEventListener('click', click); raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cv.removeEventListener('click', click) }
  }, [])
  return (
    <>
      <canvas ref={cvRef} className="border border-primary-fixed-dim/40 rounded cursor-pointer" />
      <div className="text-data-label text-outline">←→ run · SHIFT dash/fire · ↑/SPACE jump · stomp enemies · P pause · R retry · Esc</div>
    </>
  )
}
