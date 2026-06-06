import { useEffect, useState } from 'react'
import { useOS, SESSION_START, WinSpec } from '../store/os'
import { THEMES, WALLPAPERS } from '../os/themes'
import { GAME_BY_ID } from '../os/vfs'
import { useGitHub } from '../hooks/useGitHub'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const p = (x: number) => x.toString().padStart(2, '0')
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return {
    time: `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
    date: `${p(now.getDate())}.${months[now.getMonth()]}.${now.getFullYear()}`,
  }
}
const uptime = () => {
  const s = Math.floor((Date.now() - SESSION_START) / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return (h ? h + 'h ' : '') + String(m).padStart(2, '0') + 'm ' + String(s % 60).padStart(2, '0') + 's'
}
const winTitle = (w: WinSpec) => w.type === 'app' ? (w.title || 'app') : w.type === 'text' ? (w.node?.name || 'file') : '~/' + (w.segs || []).join('/')

function TasksPanel({ close }: { close: () => void }) {
  const windows = useOS((s) => s.windows)
  const focus = useOS((s) => s.focusWindow)
  const restore = useOS((s) => s.restoreWindow)
  const closeWin = useOS((s) => s.closeWindow)
  const activeGame = useOS((s) => s.activeGame)
  const setActiveGame = useOS((s) => s.setActiveGame)
  const termRunning = useOS((s) => s.termRunning)
  const setView = useOS((s) => s.setView)
  const empty = !windows.length && !activeGame && !termRunning
  return (
    <div className="space-y-1">
      <div className="text-[9px] text-outline font-data-label mb-1">RUNNING TASKS</div>
      {empty && <div className="text-[11px] text-outline/60 font-data-label py-3 text-center">no running tasks</div>}
      {termRunning && (
        <button onClick={() => { setView('terminal'); close() }} className="w-full flex items-center gap-2 px-2 py-1.5 border border-outline-variant/20 hover:bg-primary-fixed-dim/5 text-left">
          <span className="material-symbols-outlined text-primary-fixed-dim text-sm">code</span>
          <span className="text-[11px] text-on-surface font-data-label flex-1">Terminal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim status-pulse" />
        </button>
      )}
      {activeGame && (
        <div className="w-full flex items-center gap-2 px-2 py-1.5 border border-outline-variant/20">
          <span className="material-symbols-outlined text-primary-fixed-dim text-sm">sports_esports</span>
          <span className="text-[11px] text-on-surface font-data-label flex-1 truncate">{GAME_BY_ID[activeGame]?.label || activeGame}</span>
          <button onClick={() => setActiveGame(null)} title="stop" className="material-symbols-outlined text-outline hover:text-error text-sm">stop_circle</button>
        </div>
      )}
      {windows.map((w) => (
        <div key={w.id} className={'w-full flex items-center gap-2 px-2 py-1.5 border border-outline-variant/20 hover:bg-primary-fixed-dim/5 ' + (w.min ? 'opacity-60' : '')}>
          <button onClick={() => { restore(w.id); focus(w.id); setView('root'); close() }} className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <span className="material-symbols-outlined text-primary-fixed-dim text-sm">{w.type === 'app' ? (w.icon || 'web_asset') : w.type === 'text' ? 'description' : 'folder'}</span>
            <span className="text-[11px] text-on-surface font-data-label truncate">{winTitle(w)}</span>
            {w.min && <span className="material-symbols-outlined text-outline text-[13px]">minimize</span>}
          </button>
          <button onClick={() => closeWin(w.id)} title="close" className="material-symbols-outlined text-outline hover:text-error text-sm">close</button>
        </div>
      ))}
      <button onClick={() => { setView('root'); close() }} className="w-full mt-2 border border-outline-variant/30 py-1.5 text-[10px] font-data-label text-outline hover:text-primary-fixed">SHOW DESKTOP</button>
    </div>
  )
}

function StatusPanel({ close }: { close: () => void }) {
  const settings = useOS((s) => s.settings)
  const setView = useOS((s) => s.setView)
  const gh = useGitHub()
  const [up, setUp] = useState(uptime())
  const [load, setLoad] = useState([42, 61])
  useEffect(() => {
    const t = setInterval(() => { setUp(uptime()); setLoad([30 + ((Date.now() / 700 | 0) % 45), 55 + ((Date.now() / 1100 | 0) % 30)]) }, 1000)
    return () => clearInterval(t)
  }, [])
  const theme = THEMES[settings.theme]?.label || settings.theme
  const wp = typeof settings.wallpaper === 'string' ? (WALLPAPERS[settings.wallpaper]?.label || settings.wallpaper) : 'custom'
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between text-[11px]"><span className="text-outline font-data-label">{k}</span><span className="text-on-surface font-data-label">{v}</span></div>
  const bar = (label: string, v: number) => (
    <div><div className="flex justify-between text-[9px] text-outline font-data-label mb-0.5"><span>{label}</span><span>{v}%</span></div>
      <div className="h-1.5 bg-surface-container-highest"><div className="h-full bg-primary-fixed-dim transition-all" style={{ width: v + '%' }} /></div></div>
  )
  return (
    <div className="space-y-2">
      <div className="text-[9px] text-outline font-data-label mb-1">SYSTEM STATUS</div>
      {row('Uptime', up)}
      {row('Theme', <span className="flex items-center gap-1.5">{theme}<span className="w-3 h-3 inline-block border border-white/20" style={{ background: 'var(--accent)' }} /></span>)}
      {row('Wallpaper', wp)}
      {row('Sound', settings.sound ? 'on' : 'off')}
      {row('Network', <span className="text-primary-fixed-dim">online</span>)}
      {row('GitHub', gh ? `${gh.public_repos} repos · ${gh.stars}★` : '…')}
      <div className="pt-2 space-y-2">{bar('CPU', load[0])}{bar('MEM', load[1])}</div>
      <button onClick={() => { setView('settings'); close() }} className="w-full mt-1 border border-outline-variant/30 py-1.5 text-[10px] font-data-label text-outline hover:text-primary-fixed">OPEN SETTINGS</button>
    </div>
  )
}

export default function Taskbar() {
  const setView = useOS((s) => s.setView)
  const termRunning = useOS((s) => s.termRunning)
  const { time, date } = useClock()
  const [panel, setPanel] = useState<'tasks' | 'status' | null>(null)
  const toggle = (p: 'tasks' | 'status') => setPanel((cur) => (cur === p ? null : p))
  useEffect(() => {
    if (!panel) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanel(null) }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [panel])
  const btn = 'task-btn flex flex-col items-center justify-center text-outline p-2 hover:text-primary-fixed hover:scale-105 transition-transform cursor-pointer'
  const activeCls = ' text-primary-fixed'
  return (
    <>
      {panel && <div className="fixed inset-0 z-40" onClick={() => setPanel(null)} />}
      {panel && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-50 w-[300px] max-w-[92vw] bg-surface-container-lowest border border-primary-fixed-dim/40 shadow-[0_0_30px_rgba(0,0,0,0.7)] p-3">
          {panel === 'tasks' ? <TasksPanel close={() => setPanel(null)} /> : <StatusPanel close={() => setPanel(null)} />}
        </div>
      )}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 md:px-4 py-2 gap-2 bg-surface-dim/95 border-t border-primary-fixed-dim/20 shadow-[0_-4px_20px_rgb(var(--accent-rgb)_/_0.05)]">
        <button onClick={() => setView('root')} title="Home (desktop)" className="flex items-center gap-2 group cursor-pointer p-2 rounded-lg hover:bg-primary-fixed-dim/5 transition-all">
          <span className="material-symbols-outlined text-outline group-hover:text-primary-fixed text-xl">home</span>
          <span className="text-data-label font-data-label text-outline group-hover:text-primary-fixed hidden sm:block">HOME</span>
        </button>
        <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
        <button id="taskbar-terminal" onClick={() => setView('terminal')} className={'relative ' + btn + (termRunning ? ' task-running' : '')}>
          <span className="material-symbols-outlined">code</span><span className="text-[8px] font-data-label mt-0.5">TERMINAL</span>
        </button>
        <button onClick={() => toggle('tasks')} className={btn + (panel === 'tasks' ? activeCls : '')}>
          <span className="material-symbols-outlined">list_alt</span><span className="text-[8px] font-data-label mt-0.5">TASKS</span>
        </button>
        <button onClick={() => toggle('status')} className={btn + (panel === 'status' ? activeCls : '')}>
          <span className="material-symbols-outlined">monitor_heart</span><span className="text-[8px] font-data-label mt-0.5">STATUS</span>
        </button>
        <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
        <div className="flex flex-col items-center justify-center text-outline p-2 min-w-[70px] md:min-w-[80px]">
          <span className="text-terminal-bold font-terminal-bold text-primary-fixed-dim">{time}</span>
          <span className="text-[8px] font-data-label text-outline">{date}</span>
        </div>
      </footer>
    </>
  )
}
