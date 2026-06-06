import { useRef, useState } from 'react'
import { useOS, WinSpec, SnapZone, workspaceRect, snapRect } from '../../store/os'
import { openVNode } from '../../os/openNode'
import DeskIcon from '../DeskIcon'
import { APPS } from '../../apps/registry'
import { useDrag } from '../../hooks/useDrag'

const defW = (w: WinSpec) => w.type === 'app' ? (APPS[w.appId!]?.w || 320) : w.type === 'text' ? 560 : 430

function zoneFromPointer(x: number, y: number): SnapZone | null {
  const ws = workspaceRect(), edge = 12, third = window.innerHeight / 3
  if (y <= ws.y + edge) return 'max'
  if (x <= edge) return y < third ? 'tl' : y > third * 2 ? 'bl' : 'left'
  if (x >= window.innerWidth - edge) return y < third ? 'tr' : y > third * 2 ? 'br' : 'right'
  return null
}

export default function Window({ win }: { win: WinSpec }) {
  const closeWindow = useOS((s) => s.closeWindow)
  const focusWindow = useOS((s) => s.focusWindow)
  const setWinRect = useOS((s) => s.setWinRect)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMax = useOS((s) => s.toggleMax)
  const snapWindow = useOS((s) => s.snapWindow)
  const begin = useDrag()
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const snapRef = useRef<SnapZone | null>(null)
  const sizeRef = useRef<{ w: number; h: number } | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [snap, setSnap] = useState<SnapZone | null>(null)

  if (win.min) return null

  const base = win.max ? workspaceRect() : { x: win.x, y: win.y, w: win.w ?? defW(win), h: win.h }
  const x = drag ? drag.x : base.x
  const y = drag ? drag.y : base.y
  const w = size ? size.w : base.w
  const h = size ? size.h : base.h

  const app = win.type === 'app' ? APPS[win.appId!] : null
  const node = win.node
  const segs = win.segs || []
  const title = win.type === 'app' ? (win.title || '') : win.type === 'text' ? node!.name : '~/' + segs.join('/')
  const icon = win.type === 'app' ? (win.icon || 'web_asset') : (node?.icon || 'folder')

  function startMove(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('[data-wctl]')) return
    focusWindow(win.id)
    const ox = base.x, oy = base.y
    begin(e, {
      onMove: (dx, dy, ev) => {
        const nx = Math.max(0, Math.min(window.innerWidth - 60, ox + dx))
        const ny = Math.max(52, Math.min(window.innerHeight - 40, oy + dy))
        dragRef.current = { x: nx, y: ny }; setDrag({ x: nx, y: ny })
        const z = zoneFromPointer(ev.clientX, ev.clientY); snapRef.current = z; setSnap(z)
      },
      onEnd: () => {
        if (snapRef.current) snapWindow(win.id, snapRef.current)
        else if (dragRef.current) setWinRect(win.id, { x: dragRef.current.x, y: dragRef.current.y, w, h })
        dragRef.current = null; snapRef.current = null; setDrag(null); setSnap(null)
      },
    })
  }
  function startResize(e: React.PointerEvent) {
    e.stopPropagation(); focusWindow(win.id)
    const r = ref.current!.getBoundingClientRect(), ow = r.width, oh = r.height, ox = base.x, oy = base.y
    begin(e, {
      onMove: (dx, dy) => { const nw = Math.max(220, ow + dx), nh = Math.max(140, oh + dy); sizeRef.current = { w: nw, h: nh }; setSize({ w: nw, h: nh }) },
      onEnd: () => { if (sizeRef.current) setWinRect(win.id, { x: ox, y: oy, w: sizeRef.current.w, h: sizeRef.current.h }); sizeRef.current = null; setSize(null) },
    })
  }

  const ctlBtn = 'material-symbols-outlined text-[18px] leading-none cursor-pointer'
  return (
    <>
      {snap && (() => { const r = snapRect(snap); return <div className="fixed pointer-events-none border-2 border-primary-fixed-dim bg-primary-fixed-dim/10" style={{ left: r.x, top: r.y, width: r.w, height: r.h, zIndex: win.z - 1 }} /> })()}
      <div ref={ref} className="os-window flex flex-col" style={{ left: x, top: y, width: w, height: h, maxHeight: h ? undefined : '82vh', zIndex: win.z }} onMouseDown={() => focusWindow(win.id)}>
        <div className="titlebar bg-surface-container-highest px-3 py-2 border-b border-outline-variant/50 flex justify-between items-center shrink-0" onPointerDown={startMove} onDoubleClick={() => toggleMax(win.id)}>
          <span className="text-data-label font-data-label text-primary-fixed-dim flex items-center gap-2 truncate"><span className="material-symbols-outlined text-sm">{icon}</span>{title}</span>
          <span data-wctl className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => minimizeWindow(win.id)} title="Minimize" className={ctlBtn + ' text-outline hover:text-primary-fixed'}>remove</button>
            <button onClick={() => toggleMax(win.id)} title={win.max ? 'Restore' : 'Maximize'} className={ctlBtn + ' text-outline hover:text-primary-fixed'}>{win.max ? 'fullscreen_exit' : 'crop_square'}</button>
            <button onClick={() => closeWindow(win.id)} title="Close" className={ctlBtn + ' text-outline hover:text-error'}>close</button>
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {win.type === 'app' && app ? (
            <app.Component />
          ) : win.type === 'folder' ? (
            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
              {(node!.children || []).map((c) => <DeskIcon key={c.name} node={c} onOpen={() => openVNode(c, segs.concat(c.name))} />)}
              {(!node!.children || !node!.children.length) && <span className="text-outline text-data-label col-span-full">(empty)</span>}
            </div>
          ) : (
            <div className="win-body term-line p-4 font-terminal-code text-[12px] text-primary-fixed-dim/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: node!.render ? node!.render() : node!.name }} />
          )}
        </div>
        <div onPointerDown={startResize} title="Resize" className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" style={{ background: 'linear-gradient(135deg, transparent 50%, rgb(var(--accent-rgb) / 0.5) 50%)' }} />
      </div>
    </>
  )
}
