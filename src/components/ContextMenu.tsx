import { useEffect } from 'react'
import { useOS } from '../store/os'

export default function ContextMenu() {
  const ctx = useOS((s) => s.ctxMenu)
  const close = useOS((s) => s.closeContextMenu)
  useEffect(() => {
    if (!ctx) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', close, true) }
  }, [ctx])
  if (!ctx) return null
  const x = Math.min(ctx.x, window.innerWidth - 200)
  const y = Math.min(ctx.y, window.innerHeight - (ctx.items.length * 34 + 16))
  return (
    <div className="fixed inset-0 z-[500]" onMouseDown={close} onContextMenu={(e) => { e.preventDefault(); close() }}>
      <div className="absolute min-w-[180px] bg-surface-container-lowest border border-primary-fixed-dim/40 shadow-[0_0_30px_rgba(0,0,0,0.7)] py-1" style={{ left: x, top: y }} onMouseDown={(e) => e.stopPropagation()}>
        {ctx.items.map((it, i) => (
          <button key={i} onClick={() => { close(); it.run() }} className={'w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-data-label font-data-label hover:bg-primary-fixed-dim/10 ' + (it.danger ? 'text-error' : 'text-on-surface')}>
            <span className={'material-symbols-outlined text-base ' + (it.danger ? 'text-error' : 'text-primary-fixed-dim')}>{it.icon || 'chevron_right'}</span>
            {it.label}
          </button>
        ))}
      </div>
    </div>
  )
}
