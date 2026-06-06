import { VNode } from '../os/vfs'

export default function DeskIcon({ node, onOpen }: { node: VNode; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="desk-icon flex flex-col items-center group cursor-pointer">
      <div className="ic border border-primary-fixed-dim/20 bg-surface-container-low flex items-center justify-center group-hover:bg-primary-fixed-dim/10 group-hover:border-primary-fixed-dim transition-all">
        <span className="material-symbols-outlined text-primary-fixed-dim text-3xl">{node.icon || 'description'}</span>
      </div>
      <span className="mt-2 text-[10px] font-data-label text-outline group-hover:text-primary-fixed text-center bg-background/50 px-1 truncate max-w-[84px]">{node.label || node.name}</span>
    </button>
  )
}
