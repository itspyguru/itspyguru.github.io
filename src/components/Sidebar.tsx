import { useOS, View } from '../store/os'

const NAV: { view: View; icon: string; label: string }[] = [
  { view: 'root', icon: 'shield', label: 'ROOT' },
  { view: 'scan', icon: 'build', label: 'BUILD' },
  { view: 'breach', icon: 'folder', label: 'PROJECTS' },
  { view: 'clearance', icon: 'badge', label: 'PROFILE' },
  { view: 'blog', icon: 'article', label: 'BLOG' },
]

export default function Sidebar() {
  const view = useOS((s) => s.view)
  const setView = useOS((s) => s.setView)
  const sidebarOpen = useOS((s) => s.sidebarOpen)
  return (
    <aside className={'fixed left-0 top-0 h-full z-40 flex flex-col pt-16 pb-24 bg-surface-container-lowest/95 backdrop-blur-xl border-r border-outline-variant/30 shadow-[5px_0_15px_rgba(0,0,0,0.5)] w-64 transition-transform duration-300 lg:translate-x-0 ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary-container/20 border border-primary-fixed-dim flex items-center justify-center overflow-hidden">
            <img alt="DEV_ITSPYGURU" className="w-full h-full object-cover grayscale contrast-125" src="/assets/os/avatar.png" />
          </div>
          <div>
            <div className="text-primary font-headline-md text-sm leading-none">DEV_ITSPYGURU</div>
            <div className="text-outline font-data-label text-[9px] mt-1">ACCESS: ROOT</div>
          </div>
        </div>
        <div className="mt-4 bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 p-2 text-center">
          <span className="text-data-label font-data-label text-primary-fixed-dim">CLEARANCE LEVEL: 1</span>
        </div>
      </div>
      <nav className="flex-1">
        {NAV.map((n) => (
          <button key={n.view} onClick={() => setView(n.view)} className={'nav-item w-full text-outline py-3 px-6 transition-all flex items-center gap-3 hover:bg-surface-container-high ' + (view === n.view ? 'active-nav' : '')}>
            <span className="material-symbols-outlined">{n.icon}</span><span className="font-data-label text-data-label">{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-6 space-y-4">
        <button onClick={() => setView('clearance')} className="w-full py-2 bg-primary-fixed-dim text-on-primary-fixed font-terminal-bold hover:bg-primary transition-all active:scale-95 shadow-[0_0_10px_rgb(var(--accent-rgb)_/_0.3)]">EXECUTE_TASK</button>
        <div className="flex justify-between text-outline pt-1">
          <button onClick={() => setView('settings')} title="Settings" className="material-symbols-outlined cursor-pointer hover:text-primary">settings</button>
          <button onClick={() => { if (confirm('REBOOT ITSPYGURU_OS? This will replay the boot sequence.')) location.reload() }} title="Reboot" className="material-symbols-outlined cursor-pointer hover:text-error">power_settings_new</button>
        </div>
      </div>
    </aside>
  )
}
