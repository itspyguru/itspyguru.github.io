import { useRef, useState } from 'react'
import { useOS, View } from '../store/os'
import { beep } from '../os/sound'

const AGENTS = [
  { icon: 'smart_toy', tag: 'CREWAI', title: 'Financial-Doc Engine', desc: 'Dynamic financial documents via AI agents + LangChain & Hugging Face.', w: 'w-[95%]', pulse: true },
  { icon: 'database', tag: 'PIPELINE', title: 'Company Data Pipeline', desc: 'Scrape → clean → store → analyze → realtime + cache for listed companies.', w: 'w-4/5' },
  { icon: 'policy', tag: 'PENTEST', title: 'Security Auditor', desc: 'Pentesting + vuln audits (Burp, nmap, sublist3r) on production web apps.', hl: true },
  { icon: 'smart_button', tag: 'AUTOMATION', title: 'Scraping & Bots', desc: '10,000+ data points/day via Selenium, BeautifulSoup & Apps Script.', w: 'w-[88%]' },
]
const KB: { k: string[]; a: string }[] = [
  { k: ['hardest', 'difficult', 'challenge', 'complex', 'proud', 'flagship'], a: 'The flagship build is the <span class="text-primary-fixed underline decoration-dotted">AI Financial-Doc Engine</span> at Leadzen.ai — dynamic financial documents for Indian listed companies using <span class="text-primary-fixed-dim">CrewAI</span> agents + LangChain & Hugging Face. Cut report-generation time <span class="text-primary-fixed-dim">50%</span> at <span class="text-primary-fixed-dim">95%+</span> accuracy, on a FastAPI backend.' },
  { k: ['stack', 'tech', 'technolog', 'language', 'tools', 'python'], a: 'Primary weapon: <span class="text-primary-fixed-dim">Python</span>. Stack: FastAPI, Flask, CrewAI, LangChain, Redis, MongoDB/MySQL, Generative AI. Automation: Selenium, BeautifulSoup, Apps Script, Telegram bots.' },
  { k: ['experience', 'work', 'job', 'leadzen', 'career', 'sde', 'role'], a: '1+ yr at <span class="text-primary-fixed-dim">Leadzen.ai</span> — Intern → SDE-1 → SDE-2. Shipped financial-doc automation, an end-to-end data pipeline, and a security audit. See the full timeline in <button data-view="clearance" class="text-primary-fixed-dim underline">PROFILE</button>.' },
  { k: ['who', 'about', 'yourself', 'name', 'prajjwal', 'pyguru', 'bio'], a: "I'm <span class=\"text-primary-fixed\">Prajjwal Pathak</span>, aka <span class=\"text-primary-fixed-dim\">pyGuru</span> — Software Engineer (SDE-2), backend + automation + AI agents, and a Python instructor with 20k+ on YouTube." },
  { k: ['contact', 'reach', 'email', 'hire', 'talk', 'connect', 'telegram'], a: 'Email <a href="mailto:prajjwalpathak35@gmail.com" class="text-primary-fixed-dim underline">prajjwalpathak35@gmail.com</a> or ping <a href="https://t.me/itspyguru" target="_blank" class="text-primary-fixed-dim underline">Telegram @itspyguru</a> (fastest). Details in <button data-view="clearance" class="text-primary-fixed-dim underline">PROFILE</button>.' },
  { k: ['project', 'build', 'portfolio', 'github', 'decrypto'], a: 'Projects: AI Financial-Doc Engine, Company Data Pipeline, Web-App Security Audit, Telegram Bot API, Decrypto (PyPI) & more. Open the <button data-view="breach" class="text-primary-fixed-dim underline">PROJECT INDEX</button>.' },
  { k: ['cybiqon', 'company', 'startup', 'venture', '2026', 'goal'], a: '2026 mission objective: scaling <a href="https://cybiqon.in" target="_blank" class="text-primary-fixed-dim underline">cybiqon.in</a> to great heights — security & automation, productized.' },
  { k: ['hobby', 'fun', 'anime', 'music', 'interest', 'otaku'], a: 'Fun fact: melomaniac + Otaku + a fan of Ruskin Bond stories. Into cryptography, design & photography. 🤣' },
]
const answerFor = (q: string) => {
  const s = q.toLowerCase()
  for (const e of KB) if (e.k.some((k) => s.includes(k))) return e.a
  return 'Query unrecognized in local cache. Try <em>"hardest project"</em>, <em>"stack"</em>, <em>"experience"</em> or <em>"contact"</em>. Or reach the human via <a href="mailto:prajjwalpathak35@gmail.com" class="text-primary-fixed-dim underline">email</a>.'
}
type Msg = { who: 'v' | 'ai' | 'typing'; html: string }
const SUGGEST = ['hardest project', 'your stack', 'experience', 'contact']

export default function DevLab() {
  const setView = useOS((s) => s.setView)
  const [msgs, setMsgs] = useState<Msg[]>([{ who: 'ai', html: 'Interview agent online. I am the digital counsel of <span class="text-primary-fixed">Prajjwal Pathak</span>. Ask me anything — try <em>"What was your hardest project?"</em> or <em>"What\'s your stack?"</em>' }])
  const [val, setVal] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const scroll = () => setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, 30)

  function ask(q: string) {
    if (!q.trim()) return
    setMsgs((m) => [...m, { who: 'v', html: q }, { who: 'typing', html: '' }]); scroll(); beep(330, 0.02)
    setTimeout(() => { setMsgs((m) => m.filter((x) => x.who !== 'typing').concat({ who: 'ai', html: answerFor(q) })); scroll() }, 600 + Math.random() * 400)
  }
  function onLogClick(e: React.MouseEvent) {
    const t = (e.target as HTMLElement).closest('[data-view]') as HTMLElement | null
    if (t) setView(t.dataset.view as View)
  }

  return (
    <section className="relative z-10 px-margin-page">
      <div className="flex justify-between items-end mb-8 border-l-2 border-primary-fixed-dim pl-4">
        <div>
          <h1 className="text-3xl md:text-display-lg font-display-lg text-primary-fixed-dim tracking-tighter">DEV LAB</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="bg-primary-fixed-dim/20 text-primary px-2 py-0.5 text-[10px] border border-primary-fixed-dim/30 font-data-label">ACCESS: GRANTED</span>
            <span className="bg-surface-container-high text-outline px-2 py-0.5 text-[10px] border border-outline-variant/30 font-data-label">CLEARANCE_LEVEL: 2</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-data-label font-data-label text-outline uppercase">Subsystem Status</p>
          <p className="text-primary-fixed-dim font-terminal-bold">BUILD_MODULE: ACTIVE</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* agents */}
        <div className="col-span-12 lg:col-span-5 space-y-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENTS.map((a) => (
              <button key={a.title} onClick={() => setView('breach')} className={'glass-panel p-panel-padding cursor-pointer text-left ' + (a.hl ? 'border-primary-fixed-dim shadow-[0_0_10px_rgb(var(--accent-rgb)_/_0.15)]' : '')}>
                <div className="flex justify-between items-start mb-2">
                  <span className="material-symbols-outlined text-primary text-xl">{a.icon}</span>
                  <span className="text-[8px] text-primary/40 font-data-label">{a.tag}</span>
                </div>
                <h3 className="text-data-label font-terminal-bold text-primary mb-1">{a.title}</h3>
                <p className="text-[10px] text-outline">{a.desc}</p>
                <div className="mt-3 h-1 bg-surface-container-highest w-full overflow-hidden"><div className={'h-full bg-primary-fixed-dim ' + (a.w || 'w-3/4') + (a.pulse ? ' animate-pulse' : '')} /></div>
              </button>
            ))}
          </div>
        </div>

        {/* interview */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <div className="glass-panel flex-1 flex flex-col overflow-hidden border-primary-fixed-dim min-h-[480px]">
            <div className="bg-primary-fixed-dim/10 px-4 py-2 flex justify-between items-center border-b border-primary-fixed-dim/30">
              <span className="text-data-label font-terminal-bold text-primary-fixed-dim flex items-center gap-2"><span className="material-symbols-outlined text-sm">terminal</span> interview_itspyguru.exe</span>
              <span className="text-[9px] text-outline font-data-label">PID: 7721 | SEC: HIGH</span>
            </div>
            <div ref={logRef} onClick={onLogClick} className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto bg-[#0a0a0a]/50 max-h-[420px]">
              {msgs.map((m, i) => m.who === 'v' ? (
                <div key={i} className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 shrink-0 bg-surface-container-highest flex items-center justify-center rounded"><span className="material-symbols-outlined text-outline text-lg">person</span></div>
                  <div className="bg-surface-container p-4 rounded-lg rounded-tl-none border border-outline-variant/30"><p className="text-body-sm text-on-surface">{m.html}</p></div>
                </div>
              ) : m.who === 'typing' ? (
                <div key={i} className="flex gap-4 max-w-[95%] ml-auto flex-row-reverse">
                  <div className="w-8 h-8 shrink-0 bg-primary-fixed-dim/20 flex items-center justify-center rounded border border-primary-fixed-dim/40 ai-core-glow"><span className="material-symbols-outlined text-primary text-lg">smart_toy</span></div>
                  <div className="bg-primary-container/5 p-4 rounded-lg rounded-tr-none border border-primary-fixed-dim/30"><span className="text-primary text-body-sm">analyzing<span className="terminal-cursor" /></span></div>
                </div>
              ) : (
                <div key={i} className="flex gap-4 max-w-[95%] ml-auto flex-row-reverse">
                  <div className="w-8 h-8 shrink-0 bg-primary-fixed-dim/20 flex items-center justify-center rounded border border-primary-fixed-dim/40 ai-core-glow"><span className="material-symbols-outlined text-primary text-lg">smart_toy</span></div>
                  <div className="bg-primary-container/5 p-4 rounded-lg rounded-tr-none border border-primary-fixed-dim/30"><p className="text-body-sm text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: m.html }} /></div>
                </div>
              ))}
            </div>
            <div className="px-4 pt-2 flex gap-2 flex-wrap bg-surface-container-lowest/60">
              {SUGGEST.map((s) => <button key={s} onClick={() => ask(s)} className="text-[9px] border border-primary-fixed-dim/30 px-2 py-1 text-primary hover:bg-primary-fixed-dim/10 font-data-label">{s}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const v = val; setVal(''); ask(v) }} className="p-4 bg-surface-container-lowest border-t border-primary-fixed-dim/20 flex items-center gap-3">
              <span className="text-primary-fixed-dim font-terminal-bold">&gt;</span>
              <input value={val} onChange={(e) => setVal(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-terminal-code text-primary placeholder:text-primary/20" placeholder="QUERY_AGENT..." autoComplete="off" />
              <button type="submit" className="bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 p-2 text-primary-fixed-dim hover:bg-primary-fixed-dim/20 transition-all"><span className="material-symbols-outlined">send</span></button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
