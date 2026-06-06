import { RESUME, LINKS } from '../data/resume'

export const esc = (s: string) =>
  (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

const hdr = (t: string) =>
  `<span class="text-primary-fixed-dim font-bold">## ${t}</span>\n<span class="text-outline">${'─'.repeat(46)}</span>`

export function buildResume(): string {
  const r = RESUME
  const lines: string[] = []
  lines.push(`<span class="text-primary-fixed-dim font-bold">${r.name.toUpperCase()}  //  ${r.alias}</span>`)
  lines.push(`<span class="text-on-surface">${r.title}</span>`)
  lines.push(`<span class="text-outline">${r.email}  ·  ${r.location}</span>`)
  lines.push(`<span class="text-outline">github.com/itspyguru  ·  linkedin.com/in/itspyguru</span>`)
  lines.push('')
  lines.push(hdr('OBJECTIVE')); lines.push(r.objective); lines.push('')
  lines.push(hdr('EXPERIENCE'))
  r.experience.forEach((e) => {
    lines.push(`<span class="text-primary">${e.role}</span> <span class="text-outline">@</span> <span class="text-primary-fixed-dim">${e.org}</span>  <span class="text-outline">(${e.period})</span>`)
    e.bullets.forEach((b) => lines.push('  <span class="text-primary-fixed-dim">•</span> ' + b))
    lines.push('')
  })
  lines.push(hdr('SKILLS'))
  Object.entries(r.skills).forEach(([k, v]) => lines.push(`<span class="text-primary-fixed-dim">${(k + ':').padEnd(24)}</span>${v.join(', ')}`))
  lines.push('')
  lines.push(hdr('PROJECTS'))
  r.projects.forEach((p) => lines.push(`<span class="text-primary">${p.title}</span> <span class="text-outline">[${p.type}]</span> — ${p.desc}`))
  lines.push('')
  lines.push(hdr('EDUCATION'))
  r.education.forEach((e) => lines.push(`${e.degree} — ${e.school} <span class="text-outline">(${e.period})</span>`))
  lines.push('')
  lines.push(hdr('CERTIFICATIONS'))
  r.certs.forEach((c) => lines.push(`<span class="text-primary-fixed-dim">•</span> ${c.title} — <span class="text-outline">${c.body}</span>`))
  lines.push('')
  lines.push(hdr('EXTRA-CURRICULAR'))
  r.extras.forEach((x) => lines.push('  <span class="text-primary-fixed-dim">•</span> ' + x))
  lines.push('')
  lines.push(`<span class="text-outline">Tip: run </span><span class="text-primary-fixed-dim">download resume</span><span class="text-outline"> to save a PDF.</span>`)
  return lines.join('\n')
}
export const catExperience = () => RESUME.experience.map((e) =>
  `<span class="text-primary">${e.role}</span> <span class="text-outline">@ ${e.org} (${e.period})</span>\n` +
  e.bullets.map((b) => '  <span class="text-primary-fixed-dim">•</span> ' + b).join('\n')).join('\n\n')
export const catSkills = () => Object.entries(RESUME.skills).map(([k, v]) => `<span class="text-primary-fixed-dim">${(k + ':').padEnd(24)}</span>${v.join(', ')}`).join('\n')
export const catEducation = () => RESUME.education.map((e) => `${e.degree} — ${e.school} <span class="text-outline">(${e.period})</span>`).join('\n')
export const catCerts = () => RESUME.certs.map((c) => `<span class="text-primary-fixed-dim">•</span> <span class="text-primary">${c.title}</span>\n  <span class="text-outline">${c.body}</span>`).join('\n')
export const catContact = () => [
  `<span class="text-outline">email   :</span> <a href="${LINKS.email}" class="text-primary-fixed-dim underline">${RESUME.email}</a>`,
  `<span class="text-outline">telegram:</span> <a href="${LINKS.telegram}" target="_blank" class="text-primary-fixed-dim underline">@itspyguru</a> (fastest)`,
  `<span class="text-outline">linkedin:</span> <a href="${LINKS.linkedin}" target="_blank" class="text-primary-fixed-dim underline">in/itspyguru</a>`,
  `<span class="text-outline">github  :</span> <a href="${LINKS.github}" target="_blank" class="text-primary-fixed-dim underline">github.com/itspyguru</a>`,
  `<span class="text-outline">location:</span> ${RESUME.location}`,
].join('\n')
export const catSocials = () => {
  const m: [string, string][] = [['github', LINKS.github], ['linkedin', LINKS.linkedin], ['youtube', LINKS.youtube], ['telegram', LINKS.telegram], ['instagram', LINKS.instagram], ['pinterest', LINKS.pinterest], ['cybiqon', LINKS.cybiqon]]
  return m.map(([k, u]) => `<span class="text-tertiary-fixed-dim">${k.padEnd(11)}</span><a href="${u}" target="_blank" class="text-primary-fixed-dim underline">${u}</a>`).join('\n') + `\n\n<span class="text-outline">Use: open &lt;name&gt;  (e.g. open github)</span>`
}
export function projectDetail(slug: string): string {
  const p = RESUME.projects.find((x) => x.slug === slug || x.title.toLowerCase() === slug.toLowerCase())
  if (!p) return `<span class="text-error">cat: projects/${esc(slug)}: No such project</span>\nRun <span class="text-primary-fixed-dim">ls projects</span>.`
  return [
    `<span class="text-primary font-bold">${p.title}</span>  <span class="text-outline">[${p.type}]</span>`,
    `<span class="text-outline">ref:</span> ${p.ref}`, '', p.desc, '',
    `<span class="text-outline">tech:</span> ${p.tech.join(', ')}`,
    `<span class="text-outline">link:</span> <a href="${p.link}" target="_blank" class="text-primary-fixed-dim underline">${p.link}</a>`,
  ].join('\n')
}
export function neofetch(): string {
  return [
    "   <span class=\"text-primary-fixed-dim\">_ __  _   _ </span>",
    "  <span class=\"text-primary-fixed-dim\">| '_ \\| | | |</span>   <span class=\"text-primary\">itspyguru@itspyguru-os</span>",
    "  <span class=\"text-primary-fixed-dim\">| |_) | |_| |</span>   <span class=\"text-outline\">----------------------</span>",
    "  <span class=\"text-primary-fixed-dim\">| .__/ \\__, |</span>   OS:       itspyguru OS v3.0",
    "  <span class=\"text-primary-fixed-dim\">|_|    |___/ </span>   Role:     SDE-2 @ Leadzen.ai",
    "               Shell:    bash",
    "               Stack:    FastAPI · CrewAI · LangChain · Redis",
    "               Langs:    Python · JavaScript · C#",
    "               Projects: " + RESUME.projects.length + " deployed",
    "               Teaching: 20k+ YouTube · 4.5k+ Udemy",
    "               Contact:  prajjwalpathak35@gmail.com",
  ].join('\n')
}
export const gitLog = () => RESUME.experience.map((e, i) => {
  const hash = (0x9f0 + i * 0x37).toString(16).padStart(7, '0')
  return `<span class="text-tertiary-fixed-dim">commit ${hash}</span>\n<span class="text-outline">Author:</span> Prajjwal Pathak\n<span class="text-outline">Date:</span>   ${e.period}\n\n    <span class="text-primary">${e.role} @ ${e.org}</span>\n` + e.bullets.map((b) => '    ' + b).join('\n')
}).join('\n\n')
const FORTUNES = ['Talk is cheap. Show me the code. — Linus', 'First, solve the problem. Then, write the code.', 'Premature optimization is the root of all evil. — Knuth', 'Code never lies; comments sometimes do.', 'Weeks of coding can save you hours of planning.', 'It works on my machine. ¯\\_(ツ)_/¯', 'Ship it. 🚀']
export const fortune = () => FORTUNES[(Math.random() * FORTUNES.length) | 0]
export function cowsay(t: string): string {
  t = (t || 'moo').slice(0, 60); const line = '-'.repeat(t.length + 2)
  return ` _${line}_\n&lt; ${esc(t)} &gt;\n -${line}-\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`
}
const MAN: Record<string, string> = {
  ls: 'ls — list a section. usage: ls [projects|skills|experience|education|certs|socials]',
  cat: 'cat — print a section/file. usage: cat &lt;dir&gt; | cat projects/&lt;name&gt; | cat resume.pdf',
  cd: 'cd — change directory. usage: cd &lt;dir&gt; | cd .. | cd / | cd ~',
  theme: 'theme — change accent. usage: theme &lt;matrix|amber|cyber|synthwave|dracula|#hex&gt;',
  font: 'font — change typeface. usage: font &lt;jetbrains|fira|ibm|vt323|system&gt;',
  gh: 'gh — GitHub stats. usage: gh [stats|repos]',
}
export const man = (a: string) => { a = (a || '').trim().toLowerCase(); return MAN[a] || (a ? `No manual entry for ${esc(a)}` : 'usage: man &lt;command&gt;  (try: man theme)') }
export const README_TEXT = '<span class="text-primary">itspyguru OS v3.0</span>\nA terminal-themed portfolio by Prajjwal Pathak (pyGuru).\n\nTry: <span class="text-primary-fixed-dim">ls</span> · <span class="text-primary-fixed-dim">cd games</span> · <span class="text-primary-fixed-dim">cat resume.pdf</span> · <span class="text-primary-fixed-dim">help</span>\nDesktop: open folders to see icons.'
