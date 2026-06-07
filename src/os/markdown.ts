// Tiny dependency-free Markdown → themed HTML renderer. Renders owner-authored content only, but still
// escapes all text and emits a fixed tag set (no raw HTML pass-through) and drops javascript: URLs.
// Output is wrapped in .md-prose (styled in index.css) and reused by Blog, case-studies and Ask answers.
const esc = (s: string) => (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const safeUrl = (u: string) => (/^\s*javascript:/i.test(u) ? '#' : u.trim())
const MARK = String.fromCharCode(0) // NUL sentinel for protected inline code; never appears in authored text

function inline(src: string): string {
  // protect inline code spans first so * _ [ ] inside them aren't reinterpreted
  const codes: string[] = []
  let s = src.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return MARK + (codes.length - 1) + MARK })
  s = esc(s)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img alt="${esc(a)}" src="${safeUrl(u)}" class="md-img" loading="lazy"/>`)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener" class="md-a">${t}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^\w])_([^_\s][^_]*)_/g, '$1<em>$2</em>')
  s = s.replace(new RegExp(MARK + '(\\d+)' + MARK, 'g'), (_, n) => `<code class="md-code">${esc(codes[+n])}</code>`)
  return s
}

const SPECIAL = /^(#{1,6})\s|^```|^>\s?|^\s*[-*+]\s+|^\s*\d+\.\s+|^(?:---|\*\*\*|___)\s*$/

export function md(src: string): string {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^```/.test(line)) { // fenced code block
      const buf: string[] = []; i++
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++ }
      i++ // skip closing fence
      out.push(`<pre class="md-pre"><code>${esc(buf.join('\n'))}</code></pre>`); continue
    }
    if (/^(?:---|\*\*\*|___)\s*$/.test(line)) { out.push('<hr class="md-hr"/>'); i++; continue }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) { const n = h[1].length; out.push(`<h${n} class="md-h md-h${n}">${inline(h[2])}</h${n}>`); i++; continue }
    if (/^>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++ }
      out.push(`<blockquote class="md-quote">${inline(buf.join(' '))}</blockquote>`); continue
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`); i++ }
      out.push(`<ul class="md-ul">${items.join('')}</ul>`); continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`); i++ }
      out.push(`<ol class="md-ol">${items.join('')}</ol>`); continue
    }
    if (/^\s*$/.test(line)) { i++; continue }
    const buf: string[] = []
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !SPECIAL.test(lines[i])) { buf.push(lines[i]); i++ }
    out.push(`<p class="md-p">${inline(buf.join(' '))}</p>`)
  }
  return `<div class="md-prose">${out.join('')}</div>`
}
