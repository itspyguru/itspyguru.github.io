import { create } from 'zustand'
import { Settings, defaultSettings, loadSettings, saveSettings, applySettings } from '../os/themes'
import { setSoundEnabled } from '../os/sound'
import { nodeAt, VNode } from '../os/vfs'

export type View = 'root' | 'scan' | 'breach' | 'clearance' | 'terminal' | 'settings'
export type SnapZone = 'left' | 'right' | 'tl' | 'tr' | 'bl' | 'br' | 'max'
export interface Rect { x: number; y: number; w?: number; h?: number }
export interface WinSpec { id: number; type: 'folder' | 'text' | 'app'; segs?: string[]; node?: VNode; appId?: string; title?: string; icon?: string; x: number; y: number; z: number; w?: number; h?: number; min?: boolean; max?: boolean; prev?: Rect }
let winSeq = 0, winZ = 200
export const SESSION_START = Date.now()
const ts = () => { const d = new Date(), p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }

const TOPBAR = 56, TASKBAR = 64, WIN_KEY = 'itspyguru_windows'
export function workspaceRect(): Required<Rect> { return { x: 0, y: TOPBAR, w: window.innerWidth, h: window.innerHeight - TOPBAR - TASKBAR } }
export function snapRect(zone: SnapZone): Required<Rect> {
  const ws = workspaceRect(), hw = Math.round(ws.w / 2), hh = Math.round(ws.h / 2)
  switch (zone) {
    case 'left': return { x: 0, y: ws.y, w: hw, h: ws.h }
    case 'right': return { x: ws.w - hw, y: ws.y, w: hw, h: ws.h }
    case 'tl': return { x: 0, y: ws.y, w: hw, h: hh }
    case 'tr': return { x: ws.w - hw, y: ws.y, w: hw, h: hh }
    case 'bl': return { x: 0, y: ws.y + hh, w: hw, h: ws.h - hh }
    case 'br': return { x: ws.w - hw, y: ws.y + hh, w: hw, h: ws.h - hh }
    default: return { x: 0, y: ws.y, w: ws.w, h: ws.h }
  }
}
function saveWins(wins: WinSpec[]) {
  try { localStorage.setItem(WIN_KEY, JSON.stringify(wins.filter((w) => w.type !== 'text').map(({ node, ...r }) => r))) } catch {}
}
function loadWins(): WinSpec[] {
  try {
    const arr = JSON.parse(localStorage.getItem(WIN_KEY) || '[]') as WinSpec[]
    const out: WinSpec[] = []
    for (const w of arr) {
      if (w.z > winZ) winZ = w.z
      if (w.type === 'app') out.push({ ...w, id: ++winSeq })
      else if (w.type === 'folder' && w.segs) { const node = nodeAt(w.segs); if (node) out.push({ ...w, node, id: ++winSeq }) }
    }
    return out
  } catch { return [] }
}

interface OSState {
  booted: boolean
  setBooted: (b: boolean) => void
  view: View
  prevView: View
  setView: (v: View) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  settings: Settings
  patchSettings: (p: Partial<Settings>) => void
  resetSettings: () => void
  toast: string | null
  showToast: (msg: string) => void
  termRunning: boolean
  setTermRunning: (b: boolean) => void
  activeGame: string | null
  setActiveGame: (id: string | null) => void
  windows: WinSpec[]
  openWindow: (segs: string[]) => void
  openTextWindow: (node: VNode) => void
  openAppWindow: (appId: string, title: string, icon: string) => void
  closeWindow: (id: number) => void
  focusWindow: (id: number) => void
  setWinRect: (id: number, rect: Rect) => void
  minimizeWindow: (id: number) => void
  restoreWindow: (id: number) => void
  toggleMax: (id: number) => void
  snapWindow: (id: number, zone: SnapZone) => void
  screensaverOn: boolean
  setScreensaver: (b: boolean) => void
  cmdkOpen: boolean
  setCmdk: (b: boolean) => void
  cheatOpen: boolean
  setCheat: (b: boolean) => void
  events: string[]
  logEvent: (msg: string) => void
  ctxMenu: { x: number; y: number; items: CtxItem[] } | null
  openContextMenu: (x: number, y: number, items: CtxItem[]) => void
  closeContextMenu: () => void
}

export interface CtxItem { label: string; icon?: string; danger?: boolean; run: () => void }

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useOS = create<OSState>((set, get) => ({
  booted: false,
  setBooted: (b) => set({ booted: b }),
  view: (location.hash.replace('#', '') as View) || 'clearance',
  prevView: 'clearance',
  setView: (v) => {
    const cur = get().view
    set({ view: v, prevView: cur !== v ? cur : get().prevView, sidebarOpen: false })
    history.replaceState(null, '', '#' + v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (cur !== v) get().logEvent('view: ' + v)
  },
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  settings: loadSettings(),
  patchSettings: (p) => {
    const next = { ...get().settings, ...p }
    set({ settings: next }); saveSettings(next); applySettings(next); setSoundEnabled(next.sound)
    if (p.theme) get().logEvent('theme → ' + p.theme)
    if (p.wallpaper) get().logEvent('wallpaper → ' + (typeof p.wallpaper === 'string' ? p.wallpaper : 'custom'))
  },
  resetSettings: () => {
    const next = { ...defaultSettings }
    set({ settings: next }); saveSettings(next); applySettings(next); setSoundEnabled(next.sound)
  },
  toast: null,
  showToast: (msg) => {
    set({ toast: msg }); clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 2200)
  },
  termRunning: false,
  setTermRunning: (b) => set({ termRunning: b }),
  activeGame: null,
  setActiveGame: (id) => { set({ activeGame: id }); if (id) get().logEvent('played ' + id) },
  windows: loadWins(),
  openWindow: (segs) => {
    const node = nodeAt(segs)
    if (!node || node.type !== 'dir') return
    const off = (get().windows.length % 5) * 26
    set((s) => ({ windows: [...s.windows, { id: ++winSeq, type: 'folder', segs, node, x: 120 + off, y: 96 + off, z: ++winZ }] }))
    get().logEvent('opened ' + node.name + '/'); saveWins(get().windows)
  },
  openTextWindow: (node) => { set((s) => ({ windows: [...s.windows, { id: ++winSeq, type: 'text', node, x: 160, y: 110, z: ++winZ }] })); get().logEvent('viewed ' + node.name) },
  openAppWindow: (appId, title, icon) => {
    const existing = get().windows.find((w) => w.type === 'app' && w.appId === appId)
    if (existing) { set((s) => ({ windows: s.windows.map((w) => (w === existing ? { ...w, min: false, z: ++winZ } : w)) })); saveWins(get().windows); return } // focus/restore if already open
    const off = (get().windows.length % 5) * 26
    set((s) => ({ windows: [...s.windows, { id: ++winSeq, type: 'app', appId, title, icon, x: 180 + off, y: 100 + off, z: ++winZ }] }))
    get().logEvent('launched ' + title); saveWins(get().windows)
  },
  closeWindow: (id) => { set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })); saveWins(get().windows) },
  focusWindow: (id) => { set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, z: ++winZ } : w)) })); saveWins(get().windows) },
  setWinRect: (id, rect) => { set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...rect, max: false } : w)) })); saveWins(get().windows) },
  minimizeWindow: (id) => { set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, min: true } : w)) })); saveWins(get().windows) },
  restoreWindow: (id) => { set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, min: false, z: ++winZ } : w)) })); saveWins(get().windows) },
  toggleMax: (id) => {
    set((s) => ({ windows: s.windows.map((w) => {
      if (w.id !== id) return w
      if (w.max) { const p = w.prev; return { ...w, max: false, x: p?.x ?? w.x, y: p?.y ?? w.y, w: p?.w, h: p?.h, z: ++winZ } }
      return { ...w, max: true, prev: { x: w.x, y: w.y, w: w.w, h: w.h }, z: ++winZ }
    }) }))
    saveWins(get().windows)
  },
  snapWindow: (id, zone) => {
    if (zone === 'max') return get().toggleMax(id)
    const r = snapRect(zone)
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...r, max: false, min: false, z: ++winZ } : w)) }))
    saveWins(get().windows)
  },
  screensaverOn: false,
  setScreensaver: (b) => set({ screensaverOn: b }),
  cmdkOpen: false,
  setCmdk: (b) => set({ cmdkOpen: b }),
  cheatOpen: false,
  setCheat: (b) => set({ cheatOpen: b }),
  events: ['[boot] kernel loaded · itspyguru_OS v3.0', '[boot] mounting /home/itspyguru … ok', '[boot] session started'],
  logEvent: (msg) => set((s) => ({ events: [`[${ts()}] ${msg}`, ...s.events].slice(0, 40) })),
  ctxMenu: null,
  openContextMenu: (x, y, items) => set({ ctxMenu: { x, y, items } }),
  closeContextMenu: () => set({ ctxMenu: null }),
}))
