import { ACHIEVEMENTS } from '../data/achievements'
import { useOS } from '../store/os'

export default function Achievements() {
  const unlocked = useOS((s) => s.unlocked)
  const have = new Set(unlocked)
  const n = ACHIEVEMENTS.filter((a) => have.has(a.id)).length
  const total = ACHIEVEMENTS.length
  const pct = Math.round((n / total) * 100)
  return (
    <div className="w-[380px] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary-fixed-dim text-base" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
        <span className="text-data-label font-data-label text-primary-fixed-dim">TROPHY CABINET</span>
        <span className="text-[10px] text-outline ml-auto tabular-nums">{n}/{total} · {pct}%</span>
      </div>
      <div className="h-1.5 bg-black/40 border border-outline-variant/20 mb-3">
        <div className="h-full bg-primary-fixed-dim transition-all" style={{ width: pct + '%', boxShadow: '0 0 8px rgb(var(--accent-rgb) / 0.6)' }} />
      </div>
      <div className="grid grid-cols-1 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
        {ACHIEVEMENTS.map((a) => {
          const got = have.has(a.id)
          return (
            <div key={a.id} className={'flex items-center gap-3 p-2 border transition-colors ' + (got ? 'border-primary-fixed-dim/40 bg-primary-fixed-dim/5' : 'border-outline-variant/20 opacity-55')}>
              <span className={'material-symbols-outlined text-xl ' + (got ? 'text-primary-fixed-dim' : 'text-outline')} style={got ? { fontVariationSettings: "'FILL' 1", textShadow: '0 0 8px rgb(var(--accent-rgb) / 0.5)' } : undefined}>{got ? a.icon : 'lock'}</span>
              <div className="min-w-0">
                <div className={'text-data-label leading-tight ' + (got ? 'text-primary-fixed' : 'text-outline')}>{a.title}</div>
                <div className="text-[9px] text-outline font-data-label truncate">{a.desc}</div>
              </div>
              {got && <span className="material-symbols-outlined text-primary-fixed-dim text-sm ml-auto">check_circle</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
