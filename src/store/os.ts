import { create } from 'zustand'
import { Settings, defaultSettings, loadSettings, saveSettings, applySettings } from '../os/themes'
import { setSoundEnabled } from '../os/sound'
import { nodeAt, VNode } from '../os/vfs'

export type View = 'root' | 'scan' | 'breach' | 'clearance' | 'terminal' | 'settings'
export interface WinSpec { id: number; type: 'folder' | 'text' | 'app'; segs?: string[]; node?: VNode; appId?: string; title?: string; icon?: string; x: number; y: number; z: number }
let winSeq = 0, winZ = 200

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
  screensaverOn: boolean
  setScreensaver: (b: boolean) => void
  cmdkOpen: boolean
  setCmdk: (b: boolean) => void
  cheatOpen: boolean
  setCheat: (b: boolean) => void
}

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
  },
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  settings: loadSettings(),
  patchSettings: (p) => {
    const next = { ...get().settings, ...p }
    set({ settings: next }); saveSettings(next); applySettings(next); setSoundEnabled(next.sound)
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
  setActiveGame: (id) => set({ activeGame: id }),
  windows: [],
  openWindow: (segs) => {
    const node = nodeAt(segs)
    if (!node || node.type !== 'dir') return
    const off = (get().windows.length % 5) * 26
    set((s) => ({ windows: [...s.windows, { id: ++winSeq, type: 'folder', segs, node, x: 120 + off, y: 96 + off, z: ++winZ }] }))
  },
  openTextWindow: (node) => set((s) => ({ windows: [...s.windows, { id: ++winSeq, type: 'text', node, x: 160, y: 110, z: ++winZ }] })),
  openAppWindow: (appId, title, icon) => set((s) => {
    const existing = s.windows.find((w) => w.type === 'app' && w.appId === appId)
    if (existing) return { windows: s.windows.map((w) => (w === existing ? { ...w, z: ++winZ } : w)) } // focus if already open
    const off = (s.windows.length % 5) * 26
    return { windows: [...s.windows, { id: ++winSeq, type: 'app', appId, title, icon, x: 180 + off, y: 100 + off, z: ++winZ }] }
  }),
  closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
  focusWindow: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, z: ++winZ } : w)) })),
  screensaverOn: false,
  setScreensaver: (b) => set({ screensaverOn: b }),
  cmdkOpen: false,
  setCmdk: (b) => set({ cmdkOpen: b }),
  cheatOpen: false,
  setCheat: (b) => set({ cheatOpen: b }),
}))
