import { VNode } from '../os/vfs'

export default function DeskIcon({ node, onOpen, onContextMenu, onPointerDown, style, absolute }: {
  node: VNode
  onOpen: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  onPointerDown?: (e: React.PointerEvent) => void
  style?: React.CSSProperties
  absolute?: boolean
}) {
  const feat = !!node.featured
  return (
    <button onClick={onOpen} onContextMenu={onContextMenu} onPointerDown={onPointerDown} style={style}
      className={(absolute ? 'absolute w-20 select-none ' : 'relative ') + 'desk-icon flex flex-col items-center group cursor-pointer'}>
      <div className={'ic border flex items-center justify-center transition-all ' + (feat ? 'feat group-hover:brightness-110' : 'border-primary-fixed-dim/20 bg-surface-container-low group-hover:bg-primary-fixed-dim/10 group-hover:border-primary-fixed-dim')}>
        <span className="material-symbols-outlined text-primary-fixed-dim text-3xl">{node.icon || 'description'}</span>
      </div>
      {feat && <span className="material-symbols-outlined feat-badge" title="featured game">star</span>}
      <span className={'mt-2 text-[10px] font-data-label text-center bg-background/50 px-1 truncate max-w-[84px] ' + (feat ? 'text-primary-fixed' : 'text-outline group-hover:text-primary-fixed')}>{node.label || node.name}</span>
    </button>
  )
}
