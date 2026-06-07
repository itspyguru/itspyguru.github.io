import { useState } from 'react'
import { ROOT_VFS, nodeAt, VNode } from '../os/vfs'
import { openVNode } from '../os/openNode'

const typeTag = (t: string) => t === 'dir' ? 'folder' : t === 'game' ? 'game' : t === 'app' ? 'app' : t === 'link' ? 'link' : 'file'

export default function FileManager() {
  const [cwd, setCwd] = useState<string[]>([])
  const [grid, setGrid] = useState(true)
  const node = nodeAt(cwd) || ROOT_VFS
  const children = node.children || []
  const open = (c: VNode) => { if (c.type === 'dir') setCwd([...cwd, c.name]); else openVNode(c, cwd.concat(c.name)) }

  return (
    <div className="w-[460px] flex flex-col">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-outline-variant/20">
        <button onClick={() => setCwd([])} title="Home" className="material-symbols-outlined text-sm text-outline hover:text-primary-fixed">home</button>
        <button onClick={() => setCwd(cwd.slice(0, -1))} disabled={!cwd.length} title="Up" className="material-symbols-outlined text-sm text-outline hover:text-primary-fixed disabled:opacity-30">arrow_upward</button>
        <div className="flex-1 flex items-center gap-1 text-[10px] font-data-label text-outline truncate">
          <button onClick={() => setCwd([])} className="text-primary-fixed-dim hover:underline">~</button>
          {cwd.map((s, i) => (<span key={i} className="flex items-center gap-1 truncate"><span>/</span><button onClick={() => setCwd(cwd.slice(0, i + 1))} className="text-primary-fixed-dim hover:underline truncate">{s}</button></span>))}
        </div>
        <button onClick={() => setGrid((g) => !g)} title={grid ? 'List view' : 'Grid view'} className="material-symbols-outlined text-sm text-outline hover:text-primary-fixed">{grid ? 'view_list' : 'grid_view'}</button>
      </div>
      {/* body */}
      {!children.length ? <div className="p-6 text-center text-outline text-data-label">(empty)</div> : grid ? (
        <div className="p-3 grid grid-cols-4 gap-3">
          {children.map((c) => (
            <button key={c.name} onClick={() => open(c)} className="relative flex flex-col items-center gap-1 p-2 hover:bg-primary-fixed-dim/5 group">
              <span className={'material-symbols-outlined text-3xl group-hover:scale-110 transition-transform ' + (c.featured ? 'feat-ico' : 'text-primary-fixed-dim')}>{c.icon || 'description'}</span>
              {c.featured && <span className="material-symbols-outlined feat-badge" style={{ top: 0, right: '50%', marginRight: -22 }} title="featured game">star</span>}
              <span className={'text-[9px] font-data-label text-center truncate w-full ' + (c.featured ? 'text-primary-fixed' : 'text-outline group-hover:text-primary-fixed')}>{c.label || c.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-1">
          {children.map((c) => (
            <button key={c.name} onClick={() => open(c)} className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-primary-fixed-dim/5 text-left">
              <span className={'material-symbols-outlined text-base ' + (c.featured ? 'feat-ico' : 'text-primary-fixed-dim')}>{c.icon || 'description'}</span>
              <span className={'text-[11px] font-data-label flex-1 truncate ' + (c.featured ? 'text-primary-fixed' : 'text-on-surface')}>{c.label || c.name}</span>
              <span className="text-[9px] font-data-label flex items-center gap-1">{c.featured && <span className="material-symbols-outlined feat-ico" style={{ fontSize: 11 }}>star</span>}<span className="text-outline">{typeTag(c.type)}</span></span>
            </button>
          ))}
        </div>
      )}
      <div className="px-3 py-1.5 border-t border-outline-variant/20 text-[9px] text-outline font-data-label">{children.length} item{children.length === 1 ? '' : 's'}</div>
    </div>
  )
}
