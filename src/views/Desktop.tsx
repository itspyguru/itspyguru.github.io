import { useRef, useState } from 'react'
import { RESUME } from '../data/resume'
import { ROOT_VFS } from '../os/vfs'
import { openVNode } from '../os/openNode'
import DeskIcon from '../components/DeskIcon'
import { useOS } from '../store/os'
import { useDrag } from '../hooks/useDrag'

const REPO = 'https://github.com/itspyguru/itspyguru.github.io'
const KEY = 'itspyguru_deskicons'
const items = ROOT_VFS.children || []
type Pos = Record<string, { x: number; y: number }>

function defaultPos(): Pos {
  const p: Pos = {}, perCol = 5
  items.forEach((n, i) => { p[n.name] = { x: 24 + Math.floor(i / perCol) * 104, y: 150 + (i % perCol) * 104 } })
  return p
}
function load(): Pos {
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); return { ...defaultPos(), ...saved } } catch { return defaultPos() }
}
const save = (p: Pos) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {} }

export default function Desktop() {
  const openContextMenu = useOS((s) => s.openContextMenu)
  const setView = useOS((s) => s.setView)
  const openApp = useOS((s) => s.openAppWindow)
  const showToast = useOS((s) => s.showToast)
  const [pos, setPos] = useState<Pos>(load)
  const begin = useDrag()
  const moved = useRef(false)

  function startDrag(e: React.PointerEvent, name: string) {
    const start = pos[name] || { x: 24, y: 150 }
    moved.current = false
    begin(e, {
      onMove: (dx, dy) => {
        if (!moved.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
        moved.current = true
        setPos((p) => ({ ...p, [name]: { x: Math.max(8, start.x + dx), y: Math.max(96, start.y + dy) } }))
      },
      onEnd: () => { if (moved.current) setPos((p) => { save(p); return p }) },
    })
  }
  function bgMenu(e: React.MouseEvent) {
    e.preventDefault()
    openContextMenu(e.clientX, e.clientY, [
      { label: 'Open Terminal', icon: 'terminal', run: () => setView('terminal') },
      { label: 'Change Wallpaper', icon: 'wallpaper', run: () => setView('settings') },
      { label: 'Clean up icons', icon: 'grid_view', run: () => { const d = defaultPos(); setPos(d); save(d) } },
      { label: 'About this OS', icon: 'info', run: () => openApp('about', 'About', 'info') },
      { label: 'View source', icon: 'code', run: () => window.open(REPO, '_blank') },
    ])
  }
  function iconMenu(e: React.MouseEvent, n: typeof items[number], name: string) {
    e.preventDefault(); e.stopPropagation()
    openContextMenu(e.clientX, e.clientY, [
      { label: 'Open', icon: 'open_in_new', run: () => openVNode(n, [name]) },
      { label: 'Properties', icon: 'info', run: () => showToast(`${n.label || n.name} · ${n.type} · ~/${name}`) },
    ])
  }

  return (
    <section className="relative min-h-[calc(100vh-10rem)]" onContextMenu={bgMenu}>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#3b4b37 1px,transparent 1px),linear-gradient(90deg,#3b4b37 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* VITALS */}
      <div className="relative z-20 px-4 md:px-8 pt-6">
        <div className="border border-primary-fixed-dim/20 bg-surface-container-lowest/70 backdrop-blur-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
          {RESUME.stats.map((s) => (
            <div key={s.label} className="p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl font-display-lg text-primary-fixed-dim matrix-glow">{s.value}{s.suffix}</div>
              <div className="text-[9px] font-data-label text-outline mt-1 tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* draggable desktop icons */}
      {items.map((n) => (
        <DeskIcon key={n.name} node={n} absolute style={{ left: (pos[n.name] || { x: 24 }).x, top: (pos[n.name] || { y: 150 }).y }}
          onPointerDown={(e) => startDrag(e, n.name)}
          onContextMenu={(e) => iconMenu(e, n, n.name)}
          onOpen={() => { if (moved.current) { moved.current = false; return } openVNode(n, [n.name]) }} />
      ))}
    </section>
  )
}
