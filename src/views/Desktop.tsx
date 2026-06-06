import { RESUME } from '../data/resume'
import { ROOT_VFS } from '../os/vfs'
import { openVNode } from '../os/openNode'
import DeskIcon from '../components/DeskIcon'
import FeaturedWindow from '../components/windows/FeaturedWindow'

export default function Desktop() {
  const items = ROOT_VFS.children || []
  return (
    <section className="relative min-h-[calc(100vh-10rem)]">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#3b4b37 1px,transparent 1px),linear-gradient(90deg,#3b4b37 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* VITALS */}
      <div className="relative z-20 px-4 md:px-8 pt-6">
        <div className="border border-primary-fixed-dim/20 bg-surface-container-lowest/70 backdrop-blur-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
          {RESUME.stats.map((s) => (
            <div key={s.label} className="p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl font-display-lg text-primary-fixed-dim matrix-glow">{s.value}{s.suffix}</div>
              <div className="text-[9px] font-data-label text-outline mt-1 tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* desktop icons from the VFS root */}
      <div className="p-6 md:p-8 grid grid-cols-3 sm:grid-cols-4 gap-5 md:gap-7 w-fit relative z-10">
        {items.map((n) => <DeskIcon key={n.name} node={n} onOpen={() => openVNode(n, [n.name])} />)}
      </div>

      <FeaturedWindow />
    </section>
  )
}
