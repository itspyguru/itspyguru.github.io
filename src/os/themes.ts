export interface Theme { label: string; accent: string; bright: string }
export const THEMES: Record<string, Theme> = {
  matrix:    { label:'Matrix',     accent:'#00e639', bright:'#00ff41' },
  amber:     { label:'Amber',      accent:'#ffb000', bright:'#ffd000' },
  cyber:     { label:'Cyber',      accent:'#00d8ff', bright:'#6df1ff' },
  synthwave: { label:'Synthwave',  accent:'#ff3caf', bright:'#ff77c8' },
  dracula:   { label:'Dracula',    accent:'#bd93f9', bright:'#d6b8ff' },
  hacker:    { label:'Hackerman',  accent:'#39ff14', bright:'#aaff80' },
}
export const FONTS: Record<string, { label: string; css: string }> = {
  jetbrains:{ label:'JetBrains Mono', css:"'JetBrains Mono'" },
  fira:     { label:'Fira Code',      css:"'Fira Code'" },
  ibm:      { label:'IBM Plex Mono',  css:"'IBM Plex Mono'" },
  vt323:    { label:'VT323',          css:"'VT323'" },
  system:   { label:'System Mono',    css:'ui-monospace,SFMono-Regular,Menlo,monospace' },
}
export const WALLPAPERS: Record<string, { label: string; kind: 'img'|'css'|'none'; src?: string; css?: string; size?: string; opacity?: number; filter?: string }> = {
  server:{ label:'Server', kind:'img', src:'/assets/os/bg-env.png', opacity:0.07, filter:'grayscale(1)' },
  grid:{ label:'Grid', kind:'css', css:'linear-gradient(rgb(var(--accent-rgb) / 0.06) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--accent-rgb) / 0.06) 1px,transparent 1px)', size:'42px 42px' },
  scan:{ label:'Scan', kind:'css', css:'repeating-linear-gradient(0deg, rgb(var(--accent-rgb) / 0.05) 0 2px, transparent 2px 5px)', size:'auto' },
  solid:{ label:'Solid', kind:'none' },
  anime1:{ label:'Dreamworld', kind:'img', src:'/assets/wallpapers/anime-1.jpg', opacity:0.55 },
  anime2:{ label:'Scenery', kind:'img', src:'/assets/wallpapers/anime-2.jpg', opacity:0.55 },
  anime3:{ label:'Vista', kind:'img', src:'/assets/wallpapers/anime-3.jpg', opacity:0.55 },
  anime4:{ label:'Night Sky', kind:'img', src:'/assets/wallpapers/anime-4.jpg', opacity:0.6 },
  anime5:{ label:'Galaxy', kind:'img', src:'/assets/wallpapers/anime-5.jpg', opacity:0.55 },
  anime6:{ label:'Aesthetic', kind:'img', src:'/assets/wallpapers/anime-6.jpg', opacity:0.5 },
}

export interface Settings {
  theme: string; accent: string | null; font: string;
  wallpaper: string | { url: string };
  scanlines: boolean; flicker: boolean; glow: boolean; motion: boolean; sound: boolean; screensaver: boolean;
}
export const defaultSettings: Settings = {
  theme:'matrix', accent:null, font:'jetbrains', wallpaper:'server',
  scanlines:true, flicker:true, glow:true, motion:true, sound:false, screensaver:true,
}
const KEY = 'itspyguru_os'
export function loadSettings(): Settings {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { ...defaultSettings, ...s } } catch {}
  return { ...defaultSettings }
}
export function saveSettings(s: Settings) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }

export function hexToRgb(hex: string): string {
  const m = hex.replace('#','').match(/.{1,2}/g) || ['0','0','0']
  return m.map(x => parseInt(x,16)).join(' ')
}
export function setAccent(hex: string) {
  const r = document.documentElement.style
  r.setProperty('--accent', hex); r.setProperty('--accent-rgb', hexToRgb(hex))
  r.setProperty('--accent-bright', hex); r.setProperty('--accent-bright-rgb', hexToRgb(hex))
}
export function applyTheme(name: string) {
  const t = THEMES[name]; if (!t) return
  const r = document.documentElement.style
  r.setProperty('--accent', t.accent); r.setProperty('--accent-rgb', hexToRgb(t.accent))
  r.setProperty('--accent-bright', t.bright); r.setProperty('--accent-bright-rgb', hexToRgb(t.bright))
}
export function applyFont(key: string) { const f = FONTS[key]; if (f) document.documentElement.style.setProperty('--mono', f.css) }
export function applyWallpaper(s: Settings) {
  const wrap = document.getElementById('desktop-bg') as HTMLElement | null
  const img = document.getElementById('wallpaper-img') as HTMLImageElement | null
  if (!wrap || !img) return
  const w = s.wallpaper
  wrap.style.background=''; wrap.style.backgroundSize=''; img.style.display='none'; img.style.opacity=''; img.style.filter=''
  if (typeof w === 'object' && w.url) { img.src=w.url; img.style.display='block'; img.style.opacity='0.5'; return }
  if (w === 'solid') return
  const def = WALLPAPERS[w as string]
  if (!def) return
  if (def.kind === 'img') { img.src=def.src!; img.style.display='block'; img.style.opacity=String(def.opacity ?? 0.5); img.style.filter=def.filter || 'none'; return }
  if (def.kind === 'css') { wrap.style.background = def.css!; wrap.style.backgroundSize = def.size! }
}
export function applySettings(s: Settings) {
  if (s.accent) setAccent(s.accent); else applyTheme(s.theme)
  applyFont(s.font)
  const b = document.body.classList
  b.toggle('fx-noscan', !s.scanlines)
  b.toggle('fx-noflicker', !s.flicker)
  b.toggle('fx-noglow', !s.glow)
  b.toggle('fx-reduced', !s.motion)
  applyWallpaper(s)
}
