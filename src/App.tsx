import { useEffect } from 'react'
import { useOS } from './store/os'
import Boot from './components/Boot'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Taskbar from './components/Taskbar'
import Toast from './components/Toast'
import WindowManager from './components/windows/WindowManager'
import GameOverlay from './games/GameOverlay'
import Screensaver from './components/Screensaver'
import CommandPalette from './components/CommandPalette'
import Cheatsheet from './components/Cheatsheet'
import { beep } from './os/sound'
import Desktop from './views/Desktop'
import DevLab from './views/DevLab'
import Projects from './views/Projects'
import Profile from './views/Profile'
import SettingsView from './views/SettingsView'
import Terminal from './terminal/Terminal'

export default function App() {
  const booted = useOS((s) => s.booted)
  const view = useOS((s) => s.view)

  // idle screensaver
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const reset = () => {
      clearTimeout(t)
      if (!useOS.getState().settings.screensaver) return
      t = setTimeout(() => {
        const st = useOS.getState()
        if (st.settings.screensaver && st.booted && !st.activeGame && !st.screensaverOn) st.setScreensaver(true)
      }, 60000)
    }
    const evs = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, reset)) }
  }, [])

  // global keyboard shortcuts + sound
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useOS.getState()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); s.setCmdk(!s.cmdkOpen); return }
      if (e.key === 'Escape') { if (s.cmdkOpen) { s.setCmdk(false); return } if (s.cheatOpen) { s.setCheat(false); return } return }
      const tag = (document.activeElement && document.activeElement.tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || s.activeGame || s.screensaverOn || s.cmdkOpen) return
      const map: Record<string, any> = { '1': 'root', '2': 'scan', '3': 'breach', '4': 'clearance', '5': 'terminal' }
      if (map[e.key]) s.setView(map[e.key])
      else if (e.key === ',') s.setView('settings')
      else if (e.key === '/') { e.preventDefault(); s.setView('terminal'); setTimeout(() => (document.querySelector('input[placeholder="type a command... (help)"]') as HTMLInputElement | null)?.focus(), 100) }
      else if (e.key === '?') s.setCheat(!s.cheatOpen)
    }
    const onSound = (e: KeyboardEvent) => { if (useOS.getState().settings.sound && e.key && e.key.length === 1) beep(220 + Math.random() * 60, 0.025, 'square', 0.02) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('keydown', onSound)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('keydown', onSound) }
  }, [])

  return (
    <>
      {/* global CRT FX */}
      <div className="fixed inset-0 z-[120] scanlines pointer-events-none opacity-25" />
      <div className="scan-line" />
      <div className="crt-overlay" />

      {!booted && <Boot />}

      <div className={'min-h-screen flex flex-col transition-opacity duration-700 ' + (booted ? 'opacity-100' : 'opacity-0')}>
        <TopBar />
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-16 pb-24 relative">
          <div id="desktop-bg" className="absolute inset-0 z-0 pointer-events-none">
            <img id="wallpaper-img" alt="" className="w-full h-full object-cover fixed inset-0 lg:left-64 lg:w-[calc(100%-16rem)]" src="/assets/os/bg-env.png" />
          </div>
          <div className="relative z-10 view-enter" key={view}>
            {view === 'root' && <Desktop />}
            {view === 'scan' && <DevLab />}
            {view === 'breach' && <Projects />}
            {view === 'clearance' && <Profile />}
            {view === 'settings' && <SettingsView />}
          </div>
          {/* Terminal stays mounted so its session survives minimize/restore */}
          <Terminal active={view === 'terminal'} />
        </main>
        <Taskbar />
      </div>

      <WindowManager />
      <GameOverlay />
      <Screensaver />
      <CommandPalette />
      <Cheatsheet />
      <Toast />
    </>
  )
}
