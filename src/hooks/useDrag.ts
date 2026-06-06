import { useRef } from 'react'

type DragOpts = { onMove: (dx: number, dy: number, e: PointerEvent) => void; onEnd?: () => void }

// Small reusable pointer-drag helper: call begin() from an onPointerDown; it tracks
// movement on window listeners (deltas from the start point) until pointerup.
export function useDrag() {
  const active = useRef(false)
  return (e: React.PointerEvent, opts: DragOpts) => {
    e.preventDefault()
    if (active.current) return
    active.current = true
    const sx = e.clientX, sy = e.clientY
    const move = (ev: PointerEvent) => opts.onMove(ev.clientX - sx, ev.clientY - sy, ev)
    const up = () => {
      active.current = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      opts.onEnd?.()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
}
