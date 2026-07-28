import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useOS } from './store/os'
import { applySettings } from './os/themes'
import { setSoundEnabled } from './os/sound'

// Static article markup emitted by scripts/prerender.mjs for crawlers and no-JS
// readers — drop it now that the real app is about to take over.
document.getElementById('prerender')?.remove()

// apply persisted theme/font/wallpaper/effects before first paint
const s = useOS.getState().settings
applySettings(s)
setSoundEnabled(s.sound)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
