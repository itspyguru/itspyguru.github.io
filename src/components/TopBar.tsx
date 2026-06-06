import { useOS } from '../store/os'
import { LINKS } from '../data/resume'

export default function TopBar() {
  const setView = useOS((s) => s.setView)
  const toggleSidebar = useOS((s) => s.toggleSidebar)
  const icon = 'material-symbols-outlined hover:bg-primary-fixed-dim/10 transition-all p-1 cursor-pointer rounded text-primary-fixed-dim'
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-page py-2 bg-background/80 backdrop-blur-md border-b border-outline-variant/30 shadow-[0_0_15px_rgb(var(--accent-rgb)_/_0.1)]">
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={toggleSidebar} title="Menu" className="lg:hidden material-symbols-outlined text-primary-fixed-dim p-1 -ml-1 cursor-pointer">menu</button>
        <span className="text-terminal-bold font-terminal-bold text-primary-fixed-dim tracking-tighter">ITSPYGURU_OS_V3.0</span>
        <div className="hidden md:block h-4 w-px bg-outline-variant/50" />
        <nav className="hidden md:flex gap-4">
          <button onClick={() => setView('root')} className="text-outline hover:text-primary-fixed transition-colors font-data-label text-data-label">SYSTEM</button>
          <button onClick={() => setView('scan')} className="text-outline hover:text-primary-fixed transition-colors font-data-label text-data-label">NETWORK</button>
          <button onClick={() => setView('breach')} className="text-outline hover:text-primary-fixed transition-colors font-data-label text-data-label">LOGS</button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-surface-container-high/60 border border-outline-variant/30 rounded px-2 py-1 w-48">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-data-label font-data-label ml-2 w-full text-primary placeholder:text-outline/50" placeholder="SEARCH_NODE..." />
        </div>
        <div className="flex gap-2 md:gap-3">
          <a href={LINKS.telegram} target="_blank" rel="noopener" title="Telegram" className={icon}>notifications_active</a>
          <button onClick={() => setView('terminal')} title="Terminal" className={icon}>terminal</button>
          <button onClick={() => setView('settings')} title="Settings" className={icon}>settings</button>
          <button onClick={() => setView('clearance')} title="Profile" className={icon}>account_circle</button>
        </div>
      </div>
    </header>
  )
}
