import { useRef, useState } from 'react'
import { useOS, WinSpec } from '../../store/os'
import { openVNode } from '../../os/openNode'
import DeskIcon from '../DeskIcon'
import { APPS } from '../../apps/registry'

export default function Window({ win }: { win: WinSpec }) {
  const close = useOS((s) => s.closeWindow)
  const focus = useOS((s) => s.focusWindow)
  const [pos, setPos] = useState({ x: win.x, y: win.y })
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const app = win.type === 'app' ? APPS[win.appId!] : null
  const node = win.node
  const segs = win.segs || []
  const title = win.type === 'app' ? (win.title || '') : win.type === 'text' ? node!.name : '~/' + segs.join('/')
  const icon = win.type === 'app' ? (win.icon || 'apps') : (node?.icon || 'folder')
  const width = win.type === 'text' ? 'min(560px,92vw)' : win.type === 'app' ? (app?.w || 320) : 430

  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-wclose]')) return
    focus(win.id)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return
    const nx = Math.max(0, Math.min(window.innerWidth - 60, drag.current.ox + e.clientX - drag.current.sx))
    const ny = Math.max(56, Math.min(window.innerHeight - 40, drag.current.oy + e.clientY - drag.current.sy))
    setPos({ x: nx, y: ny })
  }
  const up = () => { drag.current = null }

  return (
    <div className="os-window" style={{ left: pos.x, top: pos.y, zIndex: win.z, width }} onMouseDown={() => focus(win.id)}>
      <div className="titlebar bg-surface-container-highest px-3 py-2 border-b border-outline-variant/50 flex justify-between items-center" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <span className="text-data-label font-data-label text-primary-fixed-dim flex items-center gap-2 truncate"><span className="material-symbols-outlined text-sm">{icon}</span>{title}</span>
        <button data-wclose onClick={() => close(win.id)} className="material-symbols-outlined text-outline hover:text-error text-[18px] leading-none">close</button>
      </div>
      {win.type === 'app' && app ? (
        <app.Component />
      ) : win.type === 'folder' ? (
        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {(node!.children || []).map((c) => <DeskIcon key={c.name} node={c} onOpen={() => openVNode(c, segs.concat(c.name))} />)}
          {(!node!.children || !node!.children.length) && <span className="text-outline text-data-label col-span-full">(empty)</span>}
        </div>
      ) : (
        <div className="win-body term-line p-4 font-terminal-code text-[12px] text-primary-fixed-dim/90 overflow-y-auto leading-relaxed" style={{ maxHeight: '62vh' }} dangerouslySetInnerHTML={{ __html: node!.render ? node!.render() : node!.name }} />
      )}
    </div>
  )
}
