import { useEffect, useMemo, useRef, useState } from 'react'
import { useOS } from '../store/os'
import { LINKS } from '../data/resume'
import { printResume } from '../os/print'
import { THEMES } from '../os/themes'

export default function CommandPalette() {
  const open = useOS((s) => s.cmdkOpen)
  const setCmdk = useOS((s) => s.setCmdk)
  const setView = useOS((s) => s.setView)
  const setActiveGame = useOS((s) => s.setActiveGame)
  const openWindow = useOS((s) => s.openWindow)
  const patchSettings = useOS((s) => s.patchSettings)
  const showToast = useOS((s) => s.showToast)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actions = useMemo(() => [
    { label: 'Go: Profile', icon: 'badge', run: () => setView('clearance') },
    { label: 'Go: Projects', icon: 'folder', run: () => setView('breach') },
    { label: 'Go: Dev Lab', icon: 'build', run: () => setView('scan') },
    { label: 'Go: Desktop', icon: 'desktop_windows', run: () => setView('root') },
    { label: 'Go: Terminal', icon: 'terminal', run: () => setView('terminal') },
    { label: 'Open: Settings', icon: 'settings', run: () => setView('settings') },
    { label: 'Open: Games folder', icon: 'sports_esports', run: () => { setView('root'); openWindow(['games']) } },
    { label: 'Open: Projects folder', icon: 'folder', run: () => { setView('root'); openWindow(['projects']) } },
    { label: 'Resume: download PDF', icon: 'download', run: () => printResume() },
    { label: 'Run: Snake', icon: 'sports_esports', run: () => setActiveGame('snake') },
    { label: 'Run: 2048', icon: 'grid_view', run: () => setActiveGame('2048') },
    { label: 'Run: Pong', icon: 'sports_tennis', run: () => setActiveGame('pong') },
    { label: 'Run: Tic-Tac-Toe', icon: 'grid_3x3', run: () => setActiveGame('tictactoe') },
    ...Object.entries(THEMES).filter(([k]) => k !== 'hacker').map(([k, t]) => ({ label: 'Theme: ' + t.label, icon: 'palette', run: () => { patchSettings({ theme: k, accent: null }); showToast('Theme: ' + t.label) } })),
    { label: 'Open: GitHub', icon: 'open_in_new', run: () => window.open(LINKS.github, '_blank') },
    { label: 'Open: LinkedIn', icon: 'open_in_new', run: () => window.open(LINKS.linkedin, '_blank') },
    { label: 'Email Prajjwal', icon: 'mail', run: () => window.open(LINKS.email) },
  ], [])

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase().trim()))
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])
  useEffect(() => { if (sel >= filtered.length) setSel(0) }, [q]) // eslint-disable-line

  if (!open) return null
  const runAt = (i: number) => { const a = filtered[i]; if (a) { setCmdk(false); a.run() } }
  return (
    <div id="cmdk" onMouseDown={(e) => { if (e.target === e.currentTarget) setCmdk(false) }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative max-w-xl mx-auto mt-24 bg-surface-container-lowest border border-primary-fixed-dim/40 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/30">
          <span className="material-symbols-outlined text-primary-fixed-dim">search</span>
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(filtered.length - 1, s + 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
              else if (e.key === 'Enter') { e.preventDefault(); runAt(sel) }
              else if (e.key === 'Escape') { setCmdk(false) }
            }}
            className="flex-1 bg-transparent border-none focus:ring-0 text-primary placeholder:text-outline/50 font-data-label" placeholder="Type a command or search…" autoComplete="off" spellCheck={false} />
          <span className="text-[9px] text-outline border border-outline-variant/40 px-1">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length ? filtered.map((a, i) => (
            <div key={a.label} onMouseEnter={() => setSel(i)} onClick={() => runAt(i)} className={'cmdk-item flex items-center gap-3 px-4 py-2 cursor-pointer ' + (i === sel ? 'sel' : '')}>
              <span className="material-symbols-outlined text-base text-primary-fixed-dim">{a.icon}</span>
              <span className="text-data-label text-on-surface">{a.label}</span>
            </div>
          )) : <div className="px-4 py-3 text-outline text-data-label">no matches</div>}
        </div>
      </div>
    </div>
  )
}
