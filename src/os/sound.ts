let ctx: AudioContext | null = null
// Sound is gated by a getter so callers don't need the settings object.
let enabled = false
export function setSoundEnabled(on: boolean) { enabled = on }
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
