import { RESUME } from '../data/resume'
import { hasCaseStudy } from '../data/caseStudies'
import { caseStudyDetail } from '../os/render'
import { useOS } from '../store/os'

export default function Projects() {
  const openTextWindow = useOS((s) => s.openTextWindow)
  return (
    <section className="relative z-10 px-margin-page">
      <div className="flex justify-between items-end mb-8 border-l-2 border-primary-fixed-dim pl-4">
        <div>
          <h1 className="text-3xl md:text-display-lg font-display-lg text-primary-fixed-dim tracking-tighter">PROJECT INDEX</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="bg-primary-fixed-dim/20 text-primary px-2 py-0.5 text-[10px] border border-primary-fixed-dim/30 font-data-label">{RESUME.projects.length} PROJECTS DEPLOYED</span>
            <span className="bg-surface-container-high text-outline px-2 py-0.5 text-[10px] border border-outline-variant/30 font-data-label">~/projects</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-data-label font-data-label text-outline uppercase">Database</p>
          <p className="text-primary-fixed-dim font-terminal-bold">PROJECT_VAULT: OPEN</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {RESUME.projects.map((p) => (
          <div key={p.id} className="glass-panel flex flex-col">
            <div className="bg-surface-container-highest px-4 py-2 border-b border-outline-variant/50 flex justify-between items-center">
              <span className="text-data-label font-data-label text-primary-fixed-dim truncate">~/projects/{p.slug}</span>
              <div className="flex gap-2 shrink-0"><div className="w-2.5 h-2.5 border border-outline" /><div className="w-2.5 h-2.5 border border-outline" /><div className="w-2.5 h-2.5 border border-error" /></div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-headline-md font-headline-md text-primary-fixed-dim text-lg leading-tight">Finding #{p.id}: {p.title}</h3>
              <div className="flex gap-2 mt-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 border text-[10px] font-data-label" style={{ color: p.tone, borderColor: p.tone + '66' }}>{p.type}</span>
                <span className="px-2 py-0.5 border border-outline-variant bg-surface-container-high text-on-surface-variant text-[10px] font-data-label">REF: {p.ref}</span>
              </div>
              <p className="text-terminal-code font-terminal-code text-on-surface-variant leading-relaxed flex-1">{p.desc}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.tech.map((t) => <span key={t} className="text-[9px] border border-outline-variant px-1.5 py-0.5 text-outline font-data-label">{t}</span>)}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <a href={p.link} target="_blank" rel="noopener" className="inline-flex items-center gap-2 border border-primary-fixed-dim/30 px-3 py-1.5 hover:bg-primary-fixed-dim/10 transition-all text-primary text-[10px] font-data-label">
                  <span className="material-symbols-outlined text-sm">open_in_new</span> OPEN_PROJECT
                </a>
                {hasCaseStudy(p.slug) && (
                  <button onClick={() => openTextWindow({ name: p.title + ' — case study', type: 'file', icon: 'article', render: () => caseStudyDetail(p.slug) })}
                    className="inline-flex items-center gap-2 border border-primary-fixed-dim/30 px-3 py-1.5 hover:bg-primary-fixed-dim/10 transition-all text-primary-fixed-dim text-[10px] font-data-label">
                    <span className="material-symbols-outlined text-sm">article</span> CASE_STUDY
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
