import { useOS } from '../store/os'

const SHORTCUTS: [string, string][] = [
  ['1', 'Desktop'], ['2', 'Dev Lab'], ['3', 'Projects'], ['4', 'Profile'], ['5', 'Blog'], ['6', 'Terminal'],
  [',', 'Settings'], ['/', 'Focus terminal'], ['Ctrl/⌘ K', 'Command palette'], ['?', 'This help'], ['Esc', 'Close overlay'],
]

export default function Cheatsheet() {
  const open = useOS((s) => s.cheatOpen)
  const setCheat = useOS((s) => s.setCheat)
  if (!open) return null
  return (
    <div className="ov flex items-center justify-center p-4" style={{ zIndex: 360 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setCheat(false) }}>
      <div className="bg-surface-container-lowest border border-primary-fixed-dim/40 max-w-md w-full p-6">
        <h3 className="text-terminal-bold text-primary-fixed-dim mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-base">keyboard</span> KEYBOARD SHORTCUTS</h3>
        <div className="space-y-2 text-data-label">
          {SHORTCUTS.map(([k, d]) => (
            <div key={k} className="flex justify-between"><span className="text-outline">{d}</span><span className="text-primary-fixed-dim border border-outline-variant/40 px-2">{k}</span></div>
          ))}
        </div>
        <button onClick={() => setCheat(false)} className="mt-5 w-full border border-outline-variant/40 py-2 text-outline hover:text-primary-fixed text-data-label">CLOSE (Esc)</button>
      </div>
    </div>
  )
}
