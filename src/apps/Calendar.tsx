import { useState } from 'react'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Calendar() {
  const today = new Date()
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const y = cur.getFullYear(), m = cur.getMonth()
  const first = new Date(y, m, 1).getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const isToday = (d: number) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
  return (
    <div className="p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCur(new Date(y, m - 1, 1))} className="material-symbols-outlined text-outline hover:text-primary-fixed">chevron_left</button>
        <span className="text-terminal-bold text-primary-fixed-dim text-sm">{MONTHS[m]} {y}</span>
        <button onClick={() => setCur(new Date(y, m + 1, 1))} className="material-symbols-outlined text-outline hover:text-primary-fixed">chevron_right</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d, i) => <div key={i} className="text-[9px] text-outline font-data-label py-1">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={'text-[11px] font-data-label py-1.5 ' + (d == null ? '' : isToday(d) ? 'bg-primary-fixed-dim text-on-primary-fixed font-bold' : 'text-on-surface hover:bg-primary-fixed-dim/10')}>{d || ''}</div>
        ))}
      </div>
      <button onClick={() => setCur(new Date(today.getFullYear(), today.getMonth(), 1))} className="mt-3 w-full border border-outline-variant/30 py-1.5 text-[10px] font-data-label text-outline hover:text-primary-fixed">TODAY</button>
    </div>
  )
}
