import { RESUME } from '../data/resume'

// Builds a clean monochrome resume into #resume-print and triggers the browser print dialog.
export function printResume() {
  let el = document.getElementById('resume-print')
  if (!el) {
    el = document.createElement('div')
    el.id = 'resume-print'
    const r = RESUME
    const sec = (t: string) => `<h2 style="font-size:12px;border-bottom:1px solid #000;margin:13px 0 4px;padding-bottom:2px;text-transform:uppercase;letter-spacing:1px;">${t}</h2>`
    const h: string[] = []
    h.push(`<h1 style="margin:0;font-size:21px;letter-spacing:1px;">${r.name.toUpperCase()}</h1>`)
    h.push(`<div style="font-size:11px;margin:2px 0 1px;font-weight:bold;">${r.title}</div>`)
    h.push(`<div style="font-size:10px;color:#333;">${r.email} &nbsp;&middot;&nbsp; ${r.location} &nbsp;&middot;&nbsp; github.com/itspyguru &nbsp;&middot;&nbsp; linkedin.com/in/itspyguru</div>`)
    h.push(sec('Objective')); h.push(`<p style="margin:0;">${r.objective}</p>`)
    h.push(sec('Experience'))
    r.experience.forEach((e) => { h.push(`<div style="margin-top:7px;"><strong>${e.role}</strong> &mdash; ${e.org} <span style="float:right;color:#444;">${e.period}</span></div>`); h.push('<ul style="margin:2px 0 0;padding-left:16px;">' + e.bullets.map((b) => `<li>${b}</li>`).join('') + '</ul>') })
    h.push(sec('Skills')); h.push('<ul style="margin:0;padding-left:16px;">' + Object.entries(r.skills).map(([k, v]) => `<li><strong>${k}:</strong> ${v.join(', ')}</li>`).join('') + '</ul>')
    h.push(sec('Projects')); h.push('<ul style="margin:0;padding-left:16px;">' + r.projects.map((p) => `<li><strong>${p.title}</strong> &mdash; ${p.desc}</li>`).join('') + '</ul>')
    h.push(sec('Education')); h.push('<ul style="margin:0;padding-left:16px;">' + r.education.map((e) => `<li>${e.degree} &mdash; ${e.school} (${e.period})</li>`).join('') + '</ul>')
    h.push(sec('Certifications')); h.push('<ul style="margin:0;padding-left:16px;">' + r.certs.map((c) => `<li><strong>${c.title}</strong> &mdash; ${c.body}</li>`).join('') + '</ul>')
    h.push(sec('Extra-Curricular')); h.push('<ul style="margin:0;padding-left:16px;">' + r.extras.map((x) => `<li>${x}</li>`).join('') + '</ul>')
    el.innerHTML = h.join('')
    document.body.appendChild(el)
  }
  window.print()
}
