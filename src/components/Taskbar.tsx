import { useEffect, useState } from 'react'
import { useOS } from '../store/os'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const p = (x: number) => x.toString().padStart(2, '0')
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return {
    time: `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
    date: `${p(now.getDate())}.${months[now.getMonth()]}.${now.getFullYear()}`,
  }
}

export default function Taskbar() {
  const setView = useOS((s) => s.setView)
  const termRunning = useOS((s) => s.termRunning)
  const { time, date } = useClock()
  const btn = 'task-btn flex flex-col items-center justify-center text-outline p-2 hover:text-primary-fixed hover:scale-105 transition-transform cursor-pointer'
  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 md:px-4 py-2 gap-2 bg-surface-dim/95 border-t border-primary-fixed-dim/20 shadow-[0_-4px_20px_rgb(var(--accent-rgb)_/_0.05)]">
      <button onClick={() => setView('root')} title="Home (desktop)" className="flex items-center gap-2 group cursor-pointer p-2 rounded-lg hover:bg-primary-fixed-dim/5 transition-all">
        <span className="material-symbols-outlined text-outline group-hover:text-primary-fixed text-xl">home</span>
        <span className="text-data-label font-data-label text-outline group-hover:text-primary-fixed hidden sm:block">HOME</span>
      </button>
      <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
      <button id="taskbar-terminal" onClick={() => setView('terminal')} className={'relative ' + btn + (termRunning ? ' task-running' : '')}>
        <span className="material-symbols-outlined">code</span><span className="text-[8px] font-data-label mt-0.5">TERMINAL</span>
      </button>
      <button onClick={() => setView('breach')} className={btn}>
        <span className="material-symbols-outlined">list_alt</span><span className="text-[8px] font-data-label mt-0.5">TASKS</span>
      </button>
      <button onClick={() => setView('clearance')} className={btn}>
        <span className="material-symbols-outlined">wifi_tethering</span><span className="text-[8px] font-data-label mt-0.5">STATUS</span>
      </button>
      <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
      <div className="flex flex-col items-center justify-center text-outline p-2 min-w-[70px] md:min-w-[80px]">
        <span className="text-terminal-bold font-terminal-bold text-primary-fixed-dim">{time}</span>
        <span className="text-[8px] font-data-label text-outline">{date}</span>
      </div>
    </footer>
  )
}
