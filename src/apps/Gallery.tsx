import { useState } from 'react'
import { useOS } from '../store/os'
import { WALLPAPERS } from '../os/themes'

// gallery of the bundled wallpaper images — each maps to a WALLPAPERS key so "set wallpaper" persists
const ITEMS = Object.entries(WALLPAPERS).filter(([, w]) => w.kind === 'img' && (w.src || '').includes('/wallpapers/')) as [string, { label: string; src?: string }][]

export default function Gallery() {
  const patch = useOS((s) => s.patchSettings)
  const toast = useOS((s) => s.showToast)
  const [sel, setSel] = useState(0)
  const cur = ITEMS[sel]
  return (
    <div className="p-3 w-[380px]">
      <div className="relative border border-primary-fixed-dim/30 bg-black aspect-video overflow-hidden mb-2">
        <img src={cur[1].src} alt={cur[1].label} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 inset-x-0 bg-black/65 px-2 py-1.5 flex justify-between items-center">
          <span className="text-[10px] text-primary-fixed-dim font-data-label truncate">{cur[1].label}</span>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => { patch({ wallpaper: cur[0] }); toast('Wallpaper: ' + cur[1].label) }} className="text-[9px] font-data-label border border-primary-fixed-dim/40 px-2 py-0.5 text-primary-fixed-dim hover:bg-primary-fixed-dim/10">set wallpaper</button>
            <a href={cur[1].src} target="_blank" rel="noopener" className="text-[9px] font-data-label border border-outline-variant/40 px-2 py-0.5 text-outline hover:text-primary-fixed">open</a>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ITEMS.map(([key, w], i) => (
          <button key={key} onClick={() => setSel(i)} title={w.label}
            className={'aspect-video border bg-center ' + (i === sel ? 'border-primary-fixed-dim outline outline-1 outline-primary-fixed-dim' : 'border-outline-variant/30 hover:opacity-90')}
            style={{ backgroundImage: `url(${w.src})`, backgroundSize: 'cover' }} />
        ))}
      </div>
      <p className="text-[9px] text-outline/70 font-data-label mt-2">click a thumbnail to preview · set it as your wallpaper or open full size</p>
    </div>
  )
}
