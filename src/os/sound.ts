let ctx: AudioContext | null = null
const getCtx = () => (ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)())
// Sound is gated by a getter so callers don't need the settings object.
let enabled = false
export function setSoundEnabled(on: boolean) { enabled = on; if (!on) { engineStop(); musicStop() } }

// ---- continuous engine tone (pitch follows speed) ----
let eng: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode } | null = null
export function engineStart() {
  if (!enabled || eng) return
  try { const c = getCtx(), osc = c.createOscillator(), sub = c.createOscillator(), gain = c.createGain(); osc.type = 'sawtooth'; sub.type = 'square'; osc.frequency.value = 70; sub.frequency.value = 35; gain.gain.value = 0; osc.connect(gain); sub.connect(gain); gain.connect(c.destination); osc.start(); sub.start(); eng = { osc, sub, gain } } catch {}
}
export function engineSet(pct: number, boosting = false) {
  if (!eng || !ctx) return
  const f = 60 + pct * 230 * (boosting ? 1.35 : 1)
  eng.osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.06); eng.sub.frequency.setTargetAtTime(f / 2, ctx.currentTime, 0.06)
  eng.gain.gain.setTargetAtTime(enabled ? 0.015 + pct * 0.022 : 0, ctx.currentTime, 0.1)
}
export function engineStop() { if (eng) { try { eng.osc.stop(); eng.sub.stop() } catch {}; eng = null } }
export function skid() { if (!enabled) return; try { const c = getCtx(), o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(420, c.currentTime); o.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.25); g.gain.value = 0.04; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25); o.stop(c.currentTime + 0.25) } catch {} }
export function beep(freq = 440, dur = 0.04, type: OscillatorType = 'square', vol = 0.03) {
  if (!enabled) return
  try {
    ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type; o.frequency.value = freq; g.gain.value = vol
    o.connect(g); g.connect(ctx.destination); o.start()
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    o.stop(ctx.currentTime + dur)
  } catch {}
}

const seq = (notes: [number, number][], type: OscillatorType = 'square', vol = 0.04) => notes.forEach(([f], i) => setTimeout(() => beep(f, 0.06, type, vol), i * 55))

// named, varied game feedback (all gated by the sound setting via beep)
export const sfx = {
  eat: () => beep(740, 0.06, 'square', 0.045),
  hit: () => beep(300, 0.05, 'square', 0.04),
  bounce: () => beep(440, 0.03, 'triangle', 0.035),
  score: () => seq([[600, 0], [920, 0]], 'square', 0.045),
  explode: () => beep(90, 0.28, 'sawtooth', 0.05),
  flap: () => beep(520, 0.05, 'square', 0.035),
  clear: () => seq([[700, 0], [880, 0], [1100, 0]], 'triangle', 0.05),
  lose: () => beep(140, 0.32, 'sawtooth', 0.05),
  powerup: () => seq([[700, 0], [1040, 0]], 'triangle', 0.045),
  start: () => seq([[520, 0], [780, 0]], 'square', 0.04),
  jump: () => beep(420, 0.12, 'square', 0.04),
  stomp: () => beep(180, 0.08, 'square', 0.05),
  bump: () => beep(140, 0.05, 'square', 0.04),
  coin: () => seq([[990, 0], [1320, 0]], 'square', 0.04),
  oneup: () => seq([[660, 0], [880, 0], [1320, 0]], 'triangle', 0.05),
  pipe: () => beep(200, 0.18, 'sine', 0.05),
  spring: () => seq([[300, 0], [700, 0]], 'square', 0.04),
}

// ---- tiny procedural chiptune loop (varies per world) ----
let music: { id: ReturnType<typeof setInterval>; step: number } | null = null
const M_SCALES = [[0, 2, 4, 7, 9, 12], [0, 3, 5, 7, 10, 12], [0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 7, 8, 12], [0, 4, 7, 9, 11, 12]]
const M_PAT = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 4, 2, 1, 0]
function mtone(semi: number, dur: number, type: OscillatorType, vol: number) {
  if (!enabled || !ctx) return
  try { const c = ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = 220 * Math.pow(2, semi / 12); o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur) } catch {}
}
export function musicStart(world: number) {
  if (!enabled || music) return
  getCtx(); const scale = M_SCALES[world % M_SCALES.length], beatMs = Math.max(120, 168 - world * 8)
  const m = { id: 0 as any, step: 0 }
  m.id = setInterval(() => {
    if (!enabled) return musicStop()
    const i = m.step % M_PAT.length, deg = scale[M_PAT[i] % scale.length]
    mtone(deg + 12, (beatMs / 1000) * 0.85, 'square', 0.018)
    if (m.step % 4 === 0) mtone(scale[0] - 12, (beatMs / 1000) * 1.7, 'triangle', 0.022)
    if (m.step % 8 === 4) mtone(scale[Math.min(2, scale.length - 1)], (beatMs / 1000) * 0.5, 'square', 0.012)
    m.step++
  }, beatMs)
  music = m
}
export function musicStop() { if (music) { clearInterval(music.id); music = null } }
