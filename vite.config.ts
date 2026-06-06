import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// User-site repo (served at root) → base '/'. Build to /docs so GitHub Pages
// can serve it via Settings → Pages → Deploy from branch: main /docs.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: { outDir: 'docs', emptyOutDir: true },
})
