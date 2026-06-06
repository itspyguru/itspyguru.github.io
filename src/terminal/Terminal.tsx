import { useEffect, useRef, useState } from 'react'
import { useOS } from '../store/os'
import { neofetch, esc } from '../os/render'
import { GAME_BY_ID } from '../os/vfs'
import { printResume } from '../os/print'
import { runCommand, autocomplete, TermCtx } from './commands'
import { APPS } from '../apps/registry'

const CHIPS =['help', 'ls', 'cd games', 'cat resume.pdf', 'tree', 'whoami', 'neofetch', 'cat contact']

export default function Terminal({ active }: { active: boolean }) {
  const os = useOS()
  const [lines, setLines] = useState<string[]>([])
  const [cwd, setCwd] = useState<string[]>([])
  const histRef = useRef<string[]>([])
  const histIdx = useRef(0)
  const ready = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)
  const [val, setVal] = useState('')

  const write = (html: string) => setLines((l) => [...l, html])
  useEffect(() => { if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight }, [lines])

  // one-time banner
  useEffect(() => {
    if (ready.current) return
    ready.current = true
    setLines([neofetch(), '', '<span class="text-outline">Welcome to itspyguru OS shell. Type </span><span class="text-primary-fixed-dim">help</span><span class="text-outline"> to list commands, or </span><span class="text-primary-fixed-dim">cat resume.pdf</span><span class="text-outline">.</span>'])
  }, [])

  // focus + clear running indicator when opened
  useEffect(() => { if (active) { os.setTermRunning(false); setTimeout(() => inputRef.current?.focus(), 60) } }, [active])

  function launchGame(id: string) {
    if (GAME_BY_ID[id]) { os.setActiveGame(id); inputRef.current?.blur() } // open in its own window; release keys to it
  }

  function makeCtx(): TermCtx {
    return {
      cwd, setCwd, history: histRef.current, write, clear: () => setLines([]),
      launchGame,
      openDir: (segs) => { os.openWindow(segs); os.setView('root') },
      openApp: (id) => { const a = APPS[id]; if (a) os.openAppWindow(id, a.label, a.icon) },
      startScreensaver: () => os.setScreensaver(true),
      printResume,
      os: { setView: os.setView, settings: os.settings, patchSettings: os.patchSettings, resetSettings: os.resetSettings, showToast: os.showToast },
    }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = val; setVal('')
    if (v.trim()) { histRef.current.push(v.trim()); histIdx.current = histRef.current.length }
    runCommand(makeCtx(), v)
  }
  function promptStr() { return `<span class="text-primary-fixed-dim">itspyguru@os</span><span class="text-outline">:</span><span class="text-tertiary-fixed-dim">~${cwd.length ? '/' + cwd.join('/') : ''}</span><span class="text-outline">$</span> ` }
  function minimize() { os.setTermRunning(true); os.setView(os.prevView && os.prevView !== 'terminal' ? os.prevView : 'clearance') }

  function onKey(e: React.KeyboardEvent) {
    // while a game overlay or screensaver is active, let those handle keys (don't minimize / grab arrows)
    if (useOS.getState().activeGame || useOS.getState().screensaverOn) return
    if (e.key === 'Escape') { minimize(); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (histRef.current.length) { histIdx.current = Math.max(0, histIdx.current - 1); setVal(histRef.current[histIdx.current] || '') } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (histRef.current.length) { histIdx.current = Math.min(histRef.current.length, histIdx.current + 1); setVal(histRef.current[histIdx.current] || '') } }
    else if (e.key === 'Tab') { e.preventDefault(); const r = autocomplete(makeCtx(), val); if (r.fill) setVal(r.fill); else if (r.list) { write(promptStr() + esc(val)); write(r.list) } }
  }

  return (
    <section className="relative z-10 px-margin-page" style={{ display: active ? 'block' : 'none' }}>
      <div className="flex justify-between items-end mb-6 border-l-2 border-primary-fixed-dim pl-4">
        <div>
          <h1 className="text-3xl md:text-display-lg font-display-lg text-primary-fixed-dim tracking-tighter">TERMINAL</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="bg-primary-fixed-dim/20 text-primary px-2 py-0.5 text-[10px] border border-primary-fixed-dim/30 font-data-label">SHELL: BASH</span>
            <span className="bg-surface-container-high text-outline px-2 py-0.5 text-[10px] border border-outline-variant/30 font-data-label">type 'help'</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-data-label font-data-label text-outline uppercase">tty</p>
          <p className="text-primary-fixed-dim font-terminal-bold">/dev/pts/0</p>
        </div>
      </div>

      <div className="glass-panel border-primary-fixed-dim shadow-[0_0_20px_rgb(var(--accent-bright-rgb)_/_0.05)] flex flex-col h-[62vh] min-h-[440px]">
        <div className="bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-error/50" />
              <button onClick={minimize} title="Minimize" className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim/50 hover:bg-tertiary-fixed-dim cursor-pointer p-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim/50" />
            </div>
            <span className="text-data-label font-data-label text-primary-fixed-dim">itspyguru@itspyguru-os: ~/dev — bash</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={minimize} title="Minimize (Esc)" className="material-symbols-outlined text-outline hover:text-primary-fixed text-[18px] leading-none">minimize</button>
            <button onClick={() => { setLines([]); inputRef.current?.focus() }} className="text-[9px] text-outline hover:text-primary-fixed font-data-label border border-outline-variant/40 px-2 py-0.5">CLEAR</button>
          </div>
        </div>
        <div ref={outRef} className="flex-1 overflow-y-auto p-4 font-terminal-code text-[12px] md:text-[13px] text-primary-fixed-dim/90 bg-[#0a0a0a]/60 leading-relaxed">
          {lines.map((l, i) => <div key={i} className="term-line" dangerouslySetInnerHTML={{ __html: l }} />)}
        </div>
        <div className="px-3 pt-2 flex gap-2 flex-wrap bg-surface-container-lowest/60">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => { runCommand(makeCtx(), c); inputRef.current?.focus() }} className="text-[9px] border border-primary-fixed-dim/30 px-2 py-1 text-primary hover:bg-primary-fixed-dim/10 font-data-label">{c}</button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 p-3 border-t border-primary-fixed-dim/20 bg-surface-container-lowest">
          <span className="text-primary-fixed-dim font-terminal-bold text-[12px] whitespace-nowrap">itspyguru@os:~{cwd.length ? '/' + cwd.join('/') : ''}$</span>
          <input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={onKey} className="flex-1 bg-transparent border-none focus:ring-0 text-terminal-code text-primary placeholder:text-primary/20" placeholder="type a command... (help)" autoComplete="off" spellCheck={false} />
        </form>
      </div>
    </section>
  )
}
