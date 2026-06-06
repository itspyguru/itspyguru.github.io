import { useEffect, useState } from 'react'
import { useOS, SESSION_START } from '../store/os'
import { LINKS } from '../data/resume'
import { APPS } from './registry'
import { GAMES, nodeAt } from '../os/vfs'

const REPO = 'https://github.com/itspyguru/itspyguru.github.io'
function uptime() {
  const s = Math.floor((Date.now() - SESSION_START) / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return (h ? h + 'h ' : '') + String(m).padStart(2, '0') + 'm ' + String(sec).padStart(2, '0') + 's'
}
export default function About() {
  const openText = useOS((s) => s.openTextWindow)
  const [up, setUp] = useState(uptime())
  useEffect(() => { const t = setInterval(() => setUp(uptime()), 1000); return () => clearInterval(t) }, [])
  // built at render (not module load) — APPS/About form a circular import
  const SPECS: [string, string][] = [
    ['OS', 'itspyguru_OS v3.0'],
    ['Kernel', 'React 18'],
    ['Shell', 'bash-emu (custom)'],
    ['WM', 'glassbox · draggable'],
    ['Build', 'Vite + TypeScript'],
    ['UI', 'Tailwind + Zustand'],
    ['Host', 'GitHub Pages (static)'],
    ['Apps', String(Object.keys(APPS).length)],
    ['Games', String(GAMES.length)],
  ]
  const readme = () => { const n = nodeAt(['README.md']); if (n) openText(n) }
  return (
    <div className="p-4 w-[360px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 border border-primary-fixed-dim/40 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-primary-fixed-dim text-3xl">terminal</span></div>
        <div>
          <h3 className="text-xl font-display-lg text-primary-fixed-dim leading-none">itspyguru OS</h3>
          <div className="text-[10px] text-outline font-data-label mt-1">v3.0 · developer workspace</div>
        </div>
      </div>
      <div className="font-terminal-code text-[11px] space-y-1 mb-4">
        {SPECS.map(([k, v]) => <div key={k} className="flex"><span className="text-outline w-20 shrink-0">{k}</span><span className="text-primary-fixed-dim">{v}</span></div>)}
        <div className="flex"><span className="text-outline w-20 shrink-0">Uptime</span><span className="text-primary-fixed-dim">{up}</span></div>
      </div>
      <p className="text-[11px] text-on-surface/80 leading-relaxed mb-4">A hand-built, single-page "operating system" portfolio — modular React components, a virtual filesystem, draggable windows, mini-games and apps. No backend; deployed as static files to GitHub Pages.</p>
      <div className="flex gap-2 mb-3">
        <a href={REPO} target="_blank" rel="noopener" className="flex-1 text-center border border-primary-fixed-dim/40 py-1.5 text-[10px] font-data-label text-primary-fixed-dim hover:bg-primary-fixed-dim/10">VIEW SOURCE</a>
        <button onClick={readme} className="flex-1 border border-outline-variant/40 py-1.5 text-[10px] font-data-label text-outline hover:text-primary-fixed">README</button>
      </div>
      <div className="text-[9px] text-outline/70 font-data-label">crafted by Prajjwal "pyGuru" Pathak · <a href={LINKS.github} target="_blank" rel="noopener" className="text-primary-fixed-dim hover:underline">@itspyguru</a></div>
    </div>
  )
}
