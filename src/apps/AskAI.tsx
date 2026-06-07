import { useEffect, useRef, useState } from 'react'
import { answer, SUGGESTIONS } from '../os/ask'
import { md } from '../os/markdown'
import { useOS } from '../store/os'

type Msg = { role: 'user' | 'ai'; html: string }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export default function AskAI() {
  const unlock = useOS((s) => s.unlock)
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'ai', html: md("Hi, I'm **pyGuru** — Prajjwal's assistant, grounded on his resume & projects. Ask me anything about his work, or tap a suggestion below.") }])
  const [val, setVal] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs, thinking])

  function send(qIn: string) {
    const q = qIn.trim()
    if (!q || thinking) return
    setVal(''); unlock?.('ask')
    setMsgs((m) => [...m, { role: 'user', html: esc(q) }])
    setThinking(true)
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', html: md(answer(q)) }])
      setThinking(false)
    }, 360 + Math.random() * 340)
  }

  return (
    <div className="w-[380px] flex flex-col h-[460px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-outline-variant/20 bg-surface-container-high">
        <span className="material-symbols-outlined text-primary-fixed-dim text-base" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
        <span className="text-data-label font-data-label text-primary-fixed-dim">ASK pyGuru</span>
        <span className="text-[9px] text-outline ml-auto">grounded on résumé · no cloud</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/30">
        {msgs.map((m, i) => (
          <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'ai'
              ? <div className="max-w-[88%] bg-surface-container-low border border-outline-variant/25 rounded px-3 py-2 text-[12px]" dangerouslySetInnerHTML={{ __html: m.html }} />
              : <div className="max-w-[88%] bg-primary-fixed-dim/15 border border-primary-fixed-dim/30 rounded px-3 py-2 text-[12px] text-primary-fixed">{m.html}</div>}
          </div>
        ))}
        {thinking && <div className="flex justify-start"><div className="bg-surface-container-low border border-outline-variant/25 rounded px-3 py-2 text-[12px] text-outline">pyGuru is thinking<span className="ask-dots">…</span></div></div>}
        <div ref={endRef} />
      </div>
      {msgs.length <= 2 && (
        <div className="px-3 pt-2 flex gap-1.5 flex-wrap bg-surface-container-lowest/60">
          {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="text-[9px] border border-primary-fixed-dim/30 px-2 py-1 text-primary hover:bg-primary-fixed-dim/10 font-data-label">{s}</button>)}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(val) }} className="flex items-center gap-2 p-2.5 border-t border-outline-variant/20 bg-surface-container-lowest">
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="ask about my work…" autoFocus className="flex-1 bg-transparent border-none focus:ring-0 text-[12px] text-primary placeholder:text-outline/60" />
        <button type="submit" disabled={!val.trim() || thinking} className="material-symbols-outlined text-primary-fixed-dim hover:text-primary disabled:opacity-30 text-xl leading-none">send</button>
      </form>
    </div>
  )
}
