import { RESUME, LINKS } from '../data/resume'
import { printResume } from '../os/print'
import { useGitHub } from '../hooks/useGitHub'

const socials = [
  { href: LINKS.github, icon: 'code', t: 'GitHub' },
  { href: LINKS.linkedin, icon: 'work', t: 'LinkedIn' },
  { href: LINKS.youtube, icon: 'smart_display', t: 'YouTube' },
  { href: LINKS.telegram, icon: 'send', t: 'Telegram' },
  { href: LINKS.instagram, icon: 'photo_camera', t: 'Instagram' },
  { href: LINKS.cybiqon, icon: 'public', t: 'cybiqon.in' },
]

export default function Profile() {
  const gh = useGitHub()
  return (
    <section className="relative">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="bg-surface-container-lowest/90 backdrop-blur-2xl border-2 border-primary-fixed-dim/30 p-gutter md:p-8 relative status-pulse">
          <div className="absolute top-0 left-0 w-full h-8 bg-surface-container-high flex items-center justify-between px-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-error/50" /><div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim/50" /><div className="w-2 h-2 rounded-full bg-primary-fixed-dim/50" /></div>
              <span className="text-data-label text-outline ml-4 hidden sm:inline">~/about/profile.json</span>
            </div>
            <span className="text-data-label text-primary-fixed-dim font-bold">OPEN_TO_OPPORTUNITIES</span>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-8">
            {/* left */}
            <div className="w-full md:w-1/3 space-y-6">
              <div className="aspect-square bg-black border border-primary-fixed-dim/20 relative group overflow-hidden">
                <img alt="portrait" className="w-full h-full object-cover grayscale brightness-75 contrast-125 group-hover:scale-105 transition-transform duration-700" src="/assets/os/portrait.png" />
                <div className="absolute bottom-2 left-2 bg-primary-fixed-dim/20 px-2 py-1 text-[8px] text-primary-fixed-dim backdrop-blur-sm">ID: 0x9F_PATHAK_P</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-data-label"><span className="text-outline">COLLAB_MODE:</span><span className="text-primary-fixed-dim">OPEN</span></div>
                <div className="h-1 w-full bg-surface-container-highest overflow-hidden"><div className="h-full bg-primary-fixed-dim w-[90%]" /></div>
                <div className="flex justify-between text-data-label"><span className="text-outline">BUILD_RATING:</span><span className="text-primary-fixed-dim">S-RANK</span></div>
                <div className="h-1 w-full bg-surface-container-highest overflow-hidden"><div className="h-full bg-primary-fixed-dim w-[95%]" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {socials.map((s) => (
                  <a key={s.t} href={s.href} target="_blank" rel="noopener" title={s.t} className="flex items-center justify-center border border-primary-fixed-dim/30 py-2 hover:bg-primary-fixed-dim/10 text-primary-fixed-dim transition-all"><span className="material-symbols-outlined text-base">{s.icon}</span></a>
                ))}
              </div>
              <div className="border border-outline-variant/30 bg-surface-container-low p-3 space-y-2 text-[10px] font-data-label">
                <div className="flex items-center gap-2 text-outline"><span className="material-symbols-outlined text-sm text-primary-fixed-dim">mail</span><a href={LINKS.email} className="text-primary-fixed-dim hover:underline break-all">{RESUME.email}</a></div>
                <div className="flex items-center gap-2 text-outline"><span className="material-symbols-outlined text-sm text-primary-fixed-dim">location_on</span><span>{RESUME.location}</span></div>
                <div className="flex items-center gap-2 text-outline"><span className="material-symbols-outlined text-sm text-primary-fixed-dim">send</span><a href={LINKS.telegram} target="_blank" rel="noopener" className="text-primary-fixed-dim hover:underline">@itspyguru (fastest)</a></div>
              </div>
              {/* live github */}
              <div className="border border-outline-variant/30 bg-surface-container-low p-3">
                <div className="text-[9px] text-outline font-data-label mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-xs">hub</span> GITHUB · LIVE</div>
                {gh ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center"><div className="text-lg font-display-lg text-primary-fixed-dim">{gh.public_repos}</div><div className="text-[8px] text-outline">REPOS</div></div>
                      <div className="text-center"><div className="text-lg font-display-lg text-primary-fixed-dim">{gh.stars}</div><div className="text-[8px] text-outline">STARS</div></div>
                      <div className="text-center"><div className="text-lg font-display-lg text-primary-fixed-dim">{gh.followers}</div><div className="text-[8px] text-outline">FOLLOWERS</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1">{gh.topLangs.map((l) => <span key={l} className="text-[8px] border border-outline-variant px-1 text-outline">{l}</span>)}</div>
                  </>
                ) : (
                  <span className="text-data-label text-outline">stats unavailable — see <a href={LINKS.github} target="_blank" rel="noopener" className="text-primary-fixed-dim underline">github.com/itspyguru</a></span>
                )}
              </div>
            </div>

            {/* right */}
            <div className="flex-1 space-y-6">
              <header>
                <h1 className="text-3xl md:text-display-lg text-primary-fixed-dim mb-1 tracking-tighter leading-none">DEVELOPER PROFILE</h1>
                <p className="text-data-label text-outline uppercase tracking-[0.2em]">Developer: {RESUME.name} ({RESUME.alias}) · Node: ALPHA-7</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary-fixed-dim"><span className="material-symbols-outlined text-[18px]">analytics</span><span className="text-terminal-bold">SUMMARY</span></div>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">Software Engineer (SDE-2) with 1+ yr building backend systems, automation &amp; AI agents at <span className="text-primary-fixed-dim">Leadzen.ai</span>. Achieved <span className="text-primary-fixed-dim">90%</span> reduction in manual workloads and <span className="text-primary-fixed-dim">30%</span> performance gains. Flagged as an <span className="text-primary-fixed-dim font-bold">EXCEPTIONAL BUILDER</span> — ships fast, automates everything, cares about clean architecture. Currently scaling <span className="text-primary-fixed-dim">cybiqon.in</span>.</p>
                </div>
                <div className="p-4 bg-surface-container border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary-fixed-dim"><span className="material-symbols-outlined text-[18px]">psychology</span><span className="text-terminal-bold">PRIMARY SKILLS</span></div>
                  <div className="flex flex-wrap gap-2">
                    {RESUME.topSkills.map((s) => <span key={s} className="px-2 py-0.5 border border-primary-fixed-dim/40 text-[10px] text-primary-fixed-dim bg-primary-fixed-dim/5 uppercase">{s}</span>)}
                  </div>
                </div>
              </div>
              <div className="text-center py-5 border-y border-outline-variant/20">
                <p className="text-data-label text-outline mb-2">CURRENT STATUS:</p>
                <h2 className="text-headline-md flash-text font-bold tracking-widest uppercase">AVAILABLE FOR HIRE</h2>
              </div>
              <div className="flex flex-col items-center gap-4">
                <a href={LINKS.email} className="group relative px-8 md:px-12 py-4 md:py-5 bg-primary-fixed-dim text-on-primary-fixed font-terminal-bold text-base md:text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgb(var(--accent-rgb)_/_0.27)]">
                  <span className="relative z-10">[ESTABLISH COMMUNICATION]</span>
                </a>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button onClick={printResume} className="flex items-center gap-2 border border-primary-fixed-dim/40 px-4 py-2 text-primary-fixed-dim text-[11px] font-data-label hover:bg-primary-fixed-dim/10 transition-all"><span className="material-symbols-outlined text-sm">download</span> DOWNLOAD_RESUME</button>
                  <a href={LINKS.telegram} target="_blank" rel="noopener" className="flex items-center gap-2 border border-primary-fixed-dim/40 px-4 py-2 text-primary-fixed-dim text-[11px] font-data-label hover:bg-primary-fixed-dim/10 transition-all"><span className="material-symbols-outlined text-sm">send</span> TELEGRAM</a>
                </div>
              </div>
            </div>
          </div>

          {/* experience */}
          <div className="mt-10 pt-6 border-t border-outline-variant/30">
            <div className="flex items-center gap-2 text-primary-fixed-dim mb-5"><span className="material-symbols-outlined text-[18px]">work_history</span><span className="text-terminal-bold tracking-widest">~/career/uptime.log</span></div>
            <div className="space-y-4">
              {RESUME.experience.map((e) => (
                <div key={e.role} className="relative pl-5 border-l border-primary-fixed-dim/40">
                  <div className="absolute -left-1.5 top-1 w-3 h-3 bg-primary-fixed-dim rounded-full shadow-[0_0_8px_rgb(var(--accent-rgb)_/_0.8)]" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-terminal-bold font-terminal-bold text-primary">{e.role}</span>
                    <span className="text-[9px] font-data-label text-outline">{e.period}</span>
                  </div>
                  <div className="text-[10px] font-data-label text-primary-fixed-dim/80 mb-2">{e.org}</div>
                  <ul className="space-y-1">{e.bullets.map((b, i) => <li key={i} className="text-[11px] text-on-surface-variant flex gap-2"><span className="text-primary-fixed-dim shrink-0">›</span><span>{b}</span></li>)}</ul>
                </div>
              ))}
            </div>
          </div>

          {/* education + certs */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary-fixed-dim mb-3"><span className="material-symbols-outlined text-[18px]">school</span><span className="text-terminal-bold tracking-widest">EDUCATION</span></div>
              <div className="space-y-3">
                {RESUME.education.map((ed) => (
                  <div key={ed.degree} className="border border-outline-variant/30 bg-surface-container-low p-3">
                    <div className="text-terminal-bold font-terminal-bold text-primary text-sm">{ed.degree}</div>
                    <div className="text-[10px] font-data-label text-outline mt-0.5">{ed.school} · {ed.period}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-primary-fixed-dim mb-3"><span className="material-symbols-outlined text-[18px]">verified</span><span className="text-terminal-bold tracking-widest">CERTIFICATIONS</span></div>
              <div className="space-y-2">
                {RESUME.certs.map((c) => (
                  <div key={c.title} className="border border-outline-variant/30 bg-surface-container-low p-2.5">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary-fixed-dim">verified</span><span className="text-[11px] font-terminal-bold text-primary">{c.title}</span></div>
                    <div className="text-[10px] text-outline mt-1 pl-6">{c.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-4 border-t border-outline-variant/30 flex flex-wrap justify-between items-center gap-2 text-[9px] text-outline/50 font-terminal-code uppercase">
            <div className="flex gap-4 flex-wrap"><span>LATENCY: 12ms</span><span>BITRATE: 4.8 GB/S</span><span>PACKET_LOSS: 0.00%</span></div>
            <div>© ITSPYGURU_OS_2026</div>
          </div>
        </div>
      </div>
    </section>
  )
}
