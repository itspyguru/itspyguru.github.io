import { useState } from 'react'
import { useOS } from '../store/os'
import { THEMES, FONTS, WALLPAPERS } from '../os/themes'

const TOGGLES: [keyof ReturnType<typeof useOS.getState>['settings'], string][] = [
  ['scanlines', 'Scanlines'], ['flicker', 'CRT flicker'], ['glow', 'Neon glow'],
  ['motion', 'Animations'], ['sound', 'Sound FX'], ['screensaver', 'Idle screensaver'],
]

export default function SettingsView() {
  const settings = useOS((s) => s.settings)
  const patch = useOS((s) => s.patchSettings)
  const reset = useOS((s) => s.resetSettings)
  const setView = useOS((s) => s.setView)
  const prevView = useOS((s) => s.prevView)
  const showToast = useOS((s) => s.showToast)
  const [url, setUrl] = useState(typeof settings.wallpaper === 'object' ? settings.wallpaper.url : '')

  const curW = typeof settings.wallpaper === 'object' ? 'custom' : settings.wallpaper
  const accentVal = settings.accent || (THEMES[settings.theme] || THEMES.matrix).accent
  const close = () => setView(prevView && prevView !== 'settings' ? prevView : 'clearance')

  return (
    <section className="relative z-10 px-margin-page">
      <div className="flex justify-between items-end mb-8 border-l-2 border-primary-fixed-dim pl-4">
        <div>
          <h1 className="text-3xl md:text-display-lg font-display-lg text-primary-fixed-dim tracking-tighter">SETTINGS</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="bg-primary-fixed-dim/20 text-primary px-2 py-0.5 text-[10px] border border-primary-fixed-dim/30 font-data-label">~/etc/itspyguru.conf</span>
            <span className="bg-surface-container-high text-outline px-2 py-0.5 text-[10px] border border-outline-variant/30 font-data-label">saved on this device</span>
          </div>
        </div>
        <button onClick={close} className="flex items-center gap-2 border border-outline-variant/40 px-3 py-1.5 text-outline hover:text-primary-fixed hover:border-primary-fixed-dim/40 transition-all text-data-label font-data-label shrink-0">
          <span className="material-symbols-outlined text-sm">close</span> CLOSE <span className="text-[9px] text-outline/60">ESC</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter max-w-4xl">
        {/* ACCENT */}
        <div className="glass-panel p-5">
          <h3 className="text-terminal-bold text-primary-fixed-dim mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-base">palette</span> ACCENT</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).filter(([k]) => k !== 'hacker').map(([k, t]) => (
              <button key={k} title={t.label} onClick={() => { patch({ theme: k, accent: null }); showToast('Theme: ' + t.label) }}
                className={'swatch ' + (!settings.accent && settings.theme === k ? 'sel' : '')}
                style={{ background: `linear-gradient(135deg,${t.accent},${t.bright})` }} />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="text-data-label text-outline">CUSTOM</label>
            <input type="color" value={accentVal} onChange={(e) => patch({ accent: e.target.value, theme: 'custom' })}
              className="w-10 h-8 bg-transparent border border-outline-variant/40 cursor-pointer p-0" />
            <span className="text-[10px] text-outline font-data-label">{accentVal}</span>
          </div>
        </div>

        {/* FONT */}
        <div className="glass-panel p-5">
          <h3 className="text-terminal-bold text-primary-fixed-dim mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-base">text_fields</span> FONT</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(FONTS).map(([k, f]) => (
              <button key={k} onClick={() => patch({ font: k })} style={{ fontFamily: f.css }}
                className={'text-left px-3 py-2 border hover:bg-primary-fixed-dim/5 transition-all text-data-label ' + (settings.font === k ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-outline-variant/30 text-outline')}>
                {f.label} — abcd 0123 {'{}'}
              </button>
            ))}
          </div>
        </div>

        {/* WALLPAPER */}
        <div className="glass-panel p-5 lg:col-span-2">
          <h3 className="text-terminal-bold text-primary-fixed-dim mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-base">wallpaper</span> WALLPAPER</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(WALLPAPERS).map(([k, w]) => (
              <button key={k} onClick={() => patch({ wallpaper: k })}
                className={'px-3 py-1.5 border text-[11px] font-data-label hover:bg-primary-fixed-dim/5 ' + (curW === k ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-outline-variant/30 text-outline')}>{w.label}</button>
            ))}
            <span className={'px-3 py-1.5 border text-[11px] font-data-label ' + (curW === 'custom' ? 'border-primary-fixed-dim text-primary-fixed-dim' : 'border-outline-variant/30 text-outline/50')}>Custom URL ↓</span>
          </div>
          <div className="flex items-center gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} type="text" placeholder="paste image URL…"
              className="flex-1 bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 text-data-label text-primary placeholder:text-outline/50 focus:ring-0 focus:border-primary-fixed-dim/40" />
            <button onClick={() => { if (url.trim()) { patch({ wallpaper: { url: url.trim() } }); showToast('Wallpaper set') } }}
              className="border border-primary-fixed-dim/40 text-primary-fixed-dim px-3 py-1.5 text-[11px] font-data-label hover:bg-primary-fixed-dim/10">SET</button>
          </div>
        </div>

        {/* EFFECTS */}
        <div className="glass-panel p-5 lg:col-span-2">
          <h3 className="text-terminal-bold text-primary-fixed-dim mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-base">tune</span> EFFECTS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {TOGGLES.map(([k, label]) => (
              <button key={k as string} onClick={() => patch({ [k]: !settings[k] } as any)} className="flex items-center justify-between gap-4 text-left w-full">
                <span className="text-data-label text-on-surface-variant">{label}</span>
                <span className={'toggle-pill ' + (settings[k] ? 'on' : '')} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-wrap gap-3 justify-between items-center">
          <span className="text-[10px] text-outline font-data-label">Tip: from the terminal too — <span className="text-primary-fixed-dim">theme amber</span> · <span className="text-primary-fixed-dim">font vt323</span> · <span className="text-primary-fixed-dim">reset</span></span>
          <button onClick={() => { reset(); showToast('Settings reset') }} className="border border-error/40 text-error px-4 py-2 text-[11px] font-data-label hover:bg-error/10 transition-all">RESET TO DEFAULTS</button>
        </div>
      </div>
    </section>
  )
}
