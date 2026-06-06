import { useEffect, useState } from 'react'
const KEY = 'itspyguru_notes'

export default function Notes() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(true)
  useEffect(() => { try { setText(localStorage.getItem(KEY) || '') } catch {} }, [])
  useEffect(() => {
    if (saved) return
    const t = setTimeout(() => { try { localStorage.setItem(KEY, text); setSaved(true) } catch {} }, 400)
    return () => clearTimeout(t)
  }, [text, saved])
  return (
    <div className="p-3 w-[320px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-outline font-data-label flex items-center gap-1"><span className="material-symbols-outlined text-xs">sticky_note_2</span> NOTES</span>
        <span className="text-[9px] font-data-label text-outline">{saved ? 'saved' : 'saving…'}</span>
      </div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(false) }} placeholder="jot something down… (saved to this device)"
        className="w-full h-48 bg-black/40 border border-primary-fixed-dim/20 p-3 text-terminal-code text-[12px] text-primary placeholder:text-outline/40 focus:ring-0 focus:border-primary-fixed-dim/40 resize-none" spellCheck={false} />
    </div>
  )
}
