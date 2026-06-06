import { useRef, useState } from 'react'
import { useOS } from '../../store/os'
import { LINKS } from '../../data/resume'

export default function FeaturedWindow() {
  const setView = useOS((s) => s.setView)
  const [pos, setPos] = useState<{ x: number | null; y: number }>({ x: null, y: 172 })
  const [closed, setClosed] = useState(false)
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  if (closed) return null

  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-wclose]')) return
    const r = ref.current!.getBoundingClientRect()
    drag.current = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return
    const nx = Math.max(0, Math.min(window.innerWidth - 60, drag.current.ox + e.clientX - drag.current.sx))
    const ny = Math.max(56, Math.min(window.innerHeight - 40, drag.current.oy + e.clientY - drag.current.sy))
    setPos({ x: nx, y: ny })
  }
  const up = () => { drag.current = null }

  const style: React.CSSProperties = pos.x == null
    ? { right: 28, top: pos.y, width: 'min(600px,44vw)', maxHeight: '72vh' }
    : { left: pos.x, top: pos.y, width: 'min(600px,44vw)', maxHeight: '72vh' }

  return (
    <div ref={ref} className="os-window hidden lg:flex flex-col" style={style}>
      <div className="titlebar bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-primary-fixed-dim text-sm">troubleshoot</span>
          <span className="text-data-label font-data-label text-primary-fixed-dim truncate">~/dev/featured_build</span>
        </div>
        <button data-wclose onClick={() => setClosed(true)} title="Close" className="material-symbols-outlined text-outline hover:text-error text-[18px] leading-none shrink-0 cursor-pointer">close</button>
      </div>
      <div className="overflow-y-auto">
        <div className="p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-headline-md font-headline-md text-primary-fixed-dim">Build #001: AI Financial-Doc Engine</h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 border border-secondary-container bg-secondary-container/20 text-secondary text-[10px] font-data-label">IMPACT: CRITICAL</span>
                <span className="px-2 py-0.5 border border-outline-variant bg-surface-container-high text-on-surface-variant text-[10px] font-data-label">REF: LEADZEN-SDE2</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-data-label font-data-label text-outline block mb-1">IMPACT ANALYSIS</span>
                <p className="text-terminal-code font-terminal-code leading-relaxed">Automated system that generates dynamic financial documents for Indian public-listed companies using AI agents (CrewAI) and generative-AI tooling (LangChain, Hugging Face). Cut report-generation time by <span className="text-primary-fixed-dim">50%</span> and lifted accuracy to <span className="text-primary-fixed-dim">95%+</span>.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[['CORE', 'FastAPI'], ['AGENTS', 'CrewAI'], ['GEN-AI', 'LangChain']].map(([k, v]) => (
                  <div key={k} className="border border-outline-variant/30 p-2 bg-surface-container-low/50">
                    <span className="text-[9px] font-data-label text-outline block">{k}</span>
                    <span className="text-data-label font-data-label text-primary-fixed-dim">{v}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-outline-variant/30">
                <span className="text-data-label font-data-label text-outline block mb-3">LINKS</span>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setView('breach')} className="flex items-center gap-2 border border-primary-fixed-dim/30 px-3 py-1.5 hover:bg-primary-fixed-dim/10 transition-all text-primary text-[10px] font-data-label"><span className="material-symbols-outlined text-sm">list_alt</span> ALL_PROJECTS</button>
                  <a href={LINKS.github} target="_blank" rel="noopener" className="flex items-center gap-2 border border-primary-fixed-dim/30 px-3 py-1.5 hover:bg-primary-fixed-dim/10 transition-all text-primary text-[10px] font-data-label"><span className="material-symbols-outlined text-sm">code</span> GITHUB</a>
                  <button onClick={() => setView('terminal')} className="flex items-center gap-2 border border-primary-fixed-dim/30 px-3 py-1.5 hover:bg-primary-fixed-dim/10 transition-all text-primary text-[10px] font-data-label"><span className="material-symbols-outlined text-sm">terminal</span> RESUME</button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-48 space-y-4">
            <div className="bg-surface-container-low border border-outline-variant/30 p-3">
              <h4 className="text-[10px] font-data-label text-primary-fixed-dim mb-3 border-b border-primary-fixed-dim/20 pb-1">PROGRESS TRACKER</h4>
              <div className="space-y-3">
                {[['Architect', 'COMPLETED', '+20 XP'], ['Build & Test', 'COMPLETED', '+50 XP'], ['Deploy', 'SHIPPING', '']].map(([t, st, xp], i) => (
                  <div key={t} className={'relative pl-4 border-l ' + (i < 2 ? 'border-primary-fixed-dim' : 'border-outline-variant')}>
                    <div className={'absolute -left-1.5 top-0 w-3 h-3 rounded-full ' + (i < 2 ? 'bg-primary-fixed-dim shadow-[0_0_8px_rgb(var(--accent-rgb)_/_0.8)]' : 'bg-surface-container-high border border-outline-variant')} />
                    <span className={'text-[10px] font-data-label block ' + (i < 2 ? 'text-primary-fixed-dim' : 'text-outline')}>{t}</span>
                    <span className="text-[9px] font-data-label text-outline">{st} {xp && <span className="text-primary-fixed-dim ml-1">{xp}</span>}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
