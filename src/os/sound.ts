let ctx: AudioContext | null = null
const getCtx = () => (ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)())
// Sound is gated by a getter so callers don't need the settings object.
let enabled = false
export function setSoundEnabled(on: boolean) { enabled = on; if (!on) engineStop() }

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
}
