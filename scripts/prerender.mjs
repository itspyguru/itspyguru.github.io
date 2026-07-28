// Emits a real static HTML page per blog post so links are shareable:
//   docs/blog/<slug>/index.html  — per-post meta (OG/Twitter/JSON-LD) + article text
//   docs/blog/index.html         — post listing
//   docs/404.html, sitemap.xml, robots.txt
//
// Chat apps and crawlers (Slack, WhatsApp, X, LinkedIn) never run JS, so the
// meta tags must exist in the served HTML — an SPA route alone gets a blank card.
// The article body is inlined too, then main.tsx removes it as React mounts.
// Runs after `vite build` because emptyOutDir wipes docs/.
import { build } from 'esbuild'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs')
const SITE = 'https://itspyguru.github.io'
const AUTHOR = 'Prajjwal Pathak'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const clip = (s, n = 200) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')
// </ inside a <script> would close the tag early
const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c')

// Pull the post data and the markdown renderer straight out of the TS sources so
// the site and the static pages can never drift apart.
const bundle = await build({
  stdin: {
    contents: "export { BLOG_POSTS } from './src/data/blog'\nexport { md } from './src/os/markdown'",
    resolveDir: ROOT,
    loader: 'ts',
  },
  bundle: true, format: 'esm', write: false, platform: 'node',
})
const { BLOG_POSTS, md } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text, 'utf8').toString('base64')
)

const shell = await readFile(join(OUT, 'index.html'), 'utf8')

function page({ title, description, canonical, head = '', body }) {
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[\s\S]*?"\/>/, `<meta name="description" content="${esc(description)}"/>`)
    .replace(/<meta property="og:title" content="[\s\S]*?"\/>/, `<meta property="og:title" content="${esc(title)}"/>`)
    .replace(/<meta property="og:description" content="[\s\S]*?"\/>/, `<meta property="og:description" content="${esc(description)}"/>`)
    // drop the shell's og:type so `head` is the only one — two would be ambiguous to scrapers
    .replace(/<meta property="og:type" content="[\s\S]*?"\/>\n?/, '')
    .replace('</head>', `<link rel="canonical" href="${canonical}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:site_name" content="itspyguru OS"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
${head}</head>`)
    .replace('<div id="root"></div>', `<div id="prerender">${body}</div>\n<div id="root"></div>`)
}

const written = []
async function emit(relPath, html) {
  const full = join(OUT, relPath)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, html, 'utf8')
  written.push(relPath)
}

// ---- one page per post ----
for (const post of BLOG_POSTS) {
  const url = `${SITE}/blog/${post.slug}/`
  const description = clip(post.excerpt)
  const tags = post.tags.map((t) => `<span>${esc(t)}</span>`).join(' · ')
  await emit(`blog/${post.slug}/index.html`, page({
    title: `${post.title} — ${AUTHOR}`,
    description,
    canonical: url,
    head: `<meta property="og:type" content="article"/>
<meta property="article:published_time" content="${post.date}"/>
<meta property="article:author" content="${esc(AUTHOR)}"/>
<meta name="keywords" content="${esc(post.tags.join(', '))}"/>
<script type="application/ld+json">${jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      datePublished: post.date,
      dateModified: post.date,
      keywords: post.tags.join(', '),
      author: { '@type': 'Person', name: AUTHOR, url: SITE },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    })}</script>`,
    body: `<article>
<h1>${esc(post.title)}</h1>
<p><time datetime="${post.date}">${post.date}</time> · ${tags} · by ${esc(AUTHOR)}</p>
${md(post.body)}
<p><a href="/#blog">← all posts</a> · <a href="/">itspyguru OS</a></p>
</article>`,
  }))
}

// ---- blog index ----
const byNewest = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))
await emit('blog/index.html', page({
  title: `Blog — ${AUTHOR}`,
  description: `Writing by ${AUTHOR} on AI, backend engineering and technology policy.`,
  canonical: `${SITE}/blog/`,
  head: '<meta property="og:type" content="website"/>',
  body: `<h1>Blog</h1>\n<ul>${byNewest.map((p) =>
    `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a> — <time datetime="${p.date}">${p.date}</time><br/>${esc(p.excerpt)}</li>`
  ).join('\n')}</ul>\n<p><a href="/">itspyguru OS</a></p>`,
}))

// ---- unknown paths bounce to the OS (GitHub Pages has no rewrite rules) ----
await emit('404.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<title>404 — itspyguru OS</title><meta name="robots" content="noindex"/>
<script>location.replace('/')</script></head>
<body><p>Not found. <a href="/">Return to itspyguru OS</a>.</p></body></html>`)

// ---- sitemap + robots ----
const urls = [{ loc: SITE + '/', date: byNewest[0]?.date }, { loc: `${SITE}/blog/`, date: byNewest[0]?.date },
  ...byNewest.map((p) => ({ loc: `${SITE}/blog/${p.slug}/`, date: p.date }))]
await emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.date ? `<lastmod>${u.date}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`)
await emit('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`prerendered ${BLOG_POSTS.length} post(s):\n` + written.map((f) => '  docs/' + f).join('\n'))
