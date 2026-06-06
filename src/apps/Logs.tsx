import { useOS } from '../store/os'

const CHANGELOG: [string, string][] = [
  ['v3.0', 'Rebuilt as a modular React + Vite + TS app'],
  ['v3.1', 'Terminal + virtual filesystem'],
  ['v3.2', 'Games + draggable window manager + screensaver'],
  ['v3.3', 'Dev Lab, live GitHub stats, command palette, shortcuts'],
  ['v3.4', 'Bundled wallpapers; typing/guess moved to windows'],
  ['v3.5', 'Apps: calculator, calendar, camera, clock, notes'],
  ['v3.6', '5 new games: tetris, bubble, space impact, platformer, racing'],
  ['v3.7', 'Gallery + Radio (internet stations + custom URL)'],
  ['v3.8', 'System / Network / Logs panels + live task & status bar'],
]

export default function Logs() {
  const events = useOS((s) => s.events)
  return (
    <div className="p-3 w-[384px]">
      <div className="text-[9px] text-outline font-data-label mb-1">SESSION ACTIVITY</div>
      <div className="font-terminal-code text-[11px] bg-black/40 border border-outline-variant/20 p-2 h-32 overflow-y-auto mb-3 leading-relaxed">
        {events.map((e, i) => <div key={i} className={i === 0 ? 'text-primary-fixed-dim' : 'text-primary-fixed-dim/70'}>{e}</div>)}
      </div>
      <div className="text-[9px] text-outline font-data-label mb-1">CHANGELOG</div>
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {CHANGELOG.slice().reverse().map(([v, d]) => (
          <div key={v} className="flex gap-2 text-[10px]"><span className="text-primary-fixed-dim font-data-label w-10 shrink-0">{v}</span><span className="text-outline">{d}</span></div>
        ))}
      </div>
    </div>
  )
}
