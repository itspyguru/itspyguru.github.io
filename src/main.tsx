import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useOS } from './store/os'
import { applySettings } from './os/themes'
import { setSoundEnabled } from './os/sound'

// apply persisted theme/font/wallpaper/effects before first paint
const s = useOS.getState().settings
applySettings(s)
setSoundEnabled(s.sound)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
