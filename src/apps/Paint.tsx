import { useEffect, useRef, useState } from 'react'

const COLORS = ['#00e639', '#00d8ff', '#ff5599', '#ffd400', '#ff6b6b', '#b080ff', '#ffffff', '#888888']

export default function Paint() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#00e639')
  const [size, setSize] = useState(4)
  const [erase, setErase] = useState(false)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => { const cv = cvRef.current!, ctx = cv.getContext('2d')!; ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, cv.width, cv.height) }, [])

  const pos = (e: React.PointerEvent) => { const cv = cvRef.current!, r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) } }
  const ctxOf = () => { const ctx = cvRef.current!.getContext('2d')!; const c = erase ? '#0a0a0a' : color; const lw = erase ? size * 3 : size; ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; return { ctx, r: lw / 2 } }
  function down(e: React.PointerEvent) { (e.target as HTMLElement).setPointerCapture(e.pointerId); drawing.current = true; const p = pos(e); last.current = p; const { ctx, r } = ctxOf(); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill() }
  function move(e: React.PointerEvent) { if (!drawing.current) return; const p = pos(e); const { ctx } = ctxOf(); ctx.beginPath(); ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p }
  const up = () => { drawing.current = false; last.current = null }
  const clear = () => { const cv = cvRef.current!, ctx = cv.getContext('2d')!; ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, cv.width, cv.height) }
  const download = () => { const a = document.createElement('a'); a.href = cvRef.current!.toDataURL('image/png'); a.download = 'itspyguru-paint.png'; a.click() }

  return (
    <div className="p-3 w-[360px]">
      <canvas ref={cvRef} width={336} height={250} onPointerDown={down} onPointerMove={move} onPointerUp={up} className="border border-primary-fixed-dim/40 w-full bg-[#0a0a0a] cursor-crosshair touch-none" />
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {COLORS.map((c) => <button key={c} onClick={() => { setColor(c); setErase(false) }} className={'w-6 h-6 border ' + (color === c && !erase ? 'border-primary-fixed scale-110' : 'border-outline-variant/30')} style={{ background: c }} />)}
        <button onClick={() => setErase((e) => !e)} title="Eraser" className={'material-symbols-outlined text-base p-1 border ' + (erase ? 'border-primary-fixed text-primary-fixed' : 'border-outline-variant/30 text-outline')}>ink_eraser</button>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="material-symbols-outlined text-sm text-outline">line_weight</span>
        <input type="range" min={1} max={28} value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1 accent-primary-fixed-dim" />
        <button onClick={clear} className="text-[10px] font-data-label border border-outline-variant/40 px-2 py-1 text-outline hover:text-error">CLEAR</button>
        <button onClick={download} className="text-[10px] font-data-label border border-primary-fixed-dim/40 px-2 py-1 text-primary-fixed-dim hover:bg-primary-fixed-dim/10">SAVE</button>
      </div>
    </div>
  )
}
