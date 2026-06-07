import { useState } from 'react'
import { useOS } from '../store/os'
import { LINKS } from '../data/resume'

// Paste your free public Web3Forms access key here to receive messages in your inbox.
// While blank, the form falls back to opening the visitor's mail app via mailto: — so it works immediately.
const WEB3FORMS_KEY = ''

export default function Contact() {
  const showToast = useOS((s) => s.showToast)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [hp, setHp] = useState('') // honeypot
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && msg.trim().length >= 5

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (hp) return // bot trap
    if (!valid) { showToast('add your name, a valid email & a message'); return }
    if (!WEB3FORMS_KEY) {
      const sub = encodeURIComponent(`Portfolio message from ${name}`)
      const body = encodeURIComponent(`${msg}\n\n— ${name} (${email})`)
      window.location.href = `${LINKS.email}?subject=${sub}&body=${body}`
      setSent(true); showToast('opening your mail app…'); return
    }
    setSending(true)
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, name, email, message: msg, subject: `Portfolio message from ${name}`, from_name: 'itspyguru OS' }),
      })
      const d = await r.json()
      if (d.success) { setSent(true); showToast('transmission sent ✓') } else { showToast('send failed — email me directly') }
    } catch { showToast('network error — email me directly') } finally { setSending(false) }
  }

  const field = 'w-full bg-black/30 border border-outline-variant/30 focus:border-primary-fixed-dim focus:ring-0 text-[12px] text-on-surface placeholder:text-outline/50 px-2.5 py-2 font-data-label outline-none transition-colors'

  if (sent) return (
    <div className="w-[360px] p-6 flex flex-col items-center text-center gap-3">
      <span className="material-symbols-outlined text-primary-fixed-dim text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
      <div className="text-primary-fixed font-headline-md">TRANSMISSION SENT</div>
      <div className="text-data-label text-outline">Thanks, {name.split(' ')[0] || 'friend'} — I'll get back to you soon.</div>
      <button onClick={() => { setSent(false); setName(''); setEmail(''); setMsg('') }} className="mt-2 text-data-label border border-outline-variant/40 px-3 py-1.5 text-outline hover:text-primary-fixed">send another</button>
    </div>
  )

  return (
    <form onSubmit={submit} className="w-[360px] p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary-fixed-dim text-base">forward_to_inbox</span>
        <span className="text-data-label font-data-label text-primary-fixed-dim">SEND TRANSMISSION</span>
      </div>
      <div className="space-y-1"><label className="text-[9px] font-data-label text-outline">FROM</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="your name" className={field} /></div>
      <div className="space-y-1"><label className="text-[9px] font-data-label text-outline">REPLY-TO</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" className={field} /></div>
      <div className="space-y-1"><label className="text-[9px] font-data-label text-outline">MESSAGE</label>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="say hi, pitch a project, ask a question…" rows={4} className={field + ' resize-none'} /></div>
      <input value={hp} onChange={(e) => setHp(e.target.value)} name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button type="submit" disabled={sending} className="w-full py-2 bg-primary-fixed-dim text-on-primary-fixed font-terminal-bold hover:bg-primary disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-base">{sending ? 'progress_activity' : 'send'}</span>{sending ? 'TRANSMITTING…' : 'TRANSMIT ▸'}
      </button>
      <div className="text-[9px] text-outline text-center">or reach me at <a href={LINKS.email} className="text-primary-fixed-dim underline">email</a> · <a href={LINKS.telegram} target="_blank" rel="noopener" className="text-primary-fixed-dim underline">telegram</a></div>
    </form>
  )
}
