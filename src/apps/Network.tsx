import { useEffect, useState } from 'react'
import { LINKS } from '../data/resume'
import { SESSION_START } from '../store/os'
import { useGitHub } from '../hooks/useGitHub'

const NODES: [string, string, string | undefined][] = [
  ['GitHub', 'code', LINKS.github],
  ['LinkedIn', 'work', LINKS.linkedin],
  ['YouTube', 'smart_display', LINKS.youtube],
  ['Telegram', 'send', LINKS.telegram],
  ['Instagram', 'photo_camera', LINKS.instagram],
  ['Pinterest', 'push_pin', LINKS.pinterest],
  ['Cybiqon', 'rocket_launch', LINKS.cybiqon],
  ['Email', 'mail', LINKS.email],
]

export default function Network() {
  const gh = useGitHub()
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  useEffect(() => {
    const f = () => setOnline(navigator.onLine)
    window.addEventListener('online', f); window.addEventListener('offline', f)
    return () => { window.removeEventListener('online', f); window.removeEventListener('offline', f) }
  }, [])
  const conn = (navigator as any).connection?.effectiveType as string | undefined
  const ping = 18 + (SESSION_START % 25)
  return (
    <div className="p-4 w-[360px]">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-data-label font-data-label">
          <span className={'w-2 h-2 rounded-full ' + (online ? 'bg-primary-fixed-dim status-pulse' : 'bg-error')} />
          <span className={online ? 'text-primary-fixed-dim' : 'text-error'}>{online ? 'ONLINE' : 'OFFLINE'}</span>
        </span>
        <span className="text-[9px] text-outline font-data-label">node: itspyguru.github.io</span>
      </div>
      <div className="font-terminal-code text-[10px] text-outline space-y-1 mb-4 border-b border-outline-variant/20 pb-3">
        <div>link: {conn ? conn.toUpperCase() : 'broadband'} · latency ~{ping}ms</div>
        {gh ? <div>github: <span className="text-primary-fixed-dim">{gh.public_repos}</span> repos · <span className="text-primary-fixed-dim">{gh.stars}</span>★ · <span className="text-primary-fixed-dim">{gh.followers}</span> followers</div> : <div>github: fetching live stats…</div>}
      </div>
      <div className="text-[9px] text-outline font-data-label mb-2">CONNECTED NODES</div>
      <div className="grid grid-cols-2 gap-2">
        {NODES.filter((n) => n[2]).map(([label, icon, url]) => (
          <a key={label} href={url} target="_blank" rel="noopener" className="flex items-center gap-2 border border-outline-variant/30 px-2 py-2 hover:border-primary-fixed-dim hover:bg-primary-fixed-dim/5 transition-all">
            <span className="material-symbols-outlined text-primary-fixed-dim text-sm">{icon}</span>
            <span className="text-[10px] text-on-surface font-data-label truncate">{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
