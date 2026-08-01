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
import { H as OG_H, W as OG_W, renderCard } from './og.mjs'

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

// Tags this function re-supplies per page. The shell carries the home page's own
// copies, and a scraper reads whichever comes first — so strip them before
// injecting, or every post would advertise the site-wide card.
const OWNED = ['og:type', 'og:url', 'og:site_name', 'og:image', 'og:image:width', 'og:image:height',
  'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']

const stripOwned = (html) => OWNED.reduce((acc, key) =>
  acc.replace(new RegExp(`\\s*<meta (?:property|name)="${key}" content="[^"]*"/>`, 'g'), ''), html)
  .replace(/\s*<link rel="canonical"[^>]*>/g, '')

function page({ title, description, canonical, image, imageAlt, head = '', body }) {
  return stripOwned(shell)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[\s\S]*?"\/>/, `<meta name="description" content="${esc(description)}"/>`)
    .replace(/<meta property="og:title" content="[\s\S]*?"\/>/, `<meta property="og:title" content="${esc(title)}"/>`)
    .replace(/<meta property="og:description" content="[\s\S]*?"\/>/, `<meta property="og:description" content="${esc(description)}"/>`)
    .replace('</head>', `<link rel="canonical" href="${canonical}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:site_name" content="itspyguru OS"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:width" content="${OG_W}"/>
<meta property="og:image:height" content="${OG_H}"/>
<meta property="og:image:alt" content="${esc(imageAlt || title)}"/>
<meta name="twitter:image" content="${image}"/>
${head}</head>`)
    .replace('<div id="root"></div>', `<div id="prerender">${body}</div>\n<div id="root"></div>`)
}

const written = []
async function emit(relPath, contents) {
  const full = join(OUT, relPath)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, contents)
  written.push(relPath)
}

// One share card per post, plus a site-wide fallback used by / and /blog/.
async function card(name, spec) {
  const rel = `assets/og/${name}.png`
  await emit(rel, renderCard(spec))
  return `${SITE}/${rel}`
}

// ---- one page per post ----
for (const post of BLOG_POSTS) {
  // A post that moved keeps its page here but points every ranking signal at its new
  // home — canonical, og:url and the JSON-LD @id all follow post.canonical. Serving a
  // stub under our own canonical would compete with the full article on cybiqon.in for
  // the same query, which is the one outcome the move was meant to avoid.
  const url = post.canonical ?? `${SITE}/blog/${post.slug}/`
  const description = clip(post.excerpt)
  const tags = post.tags.map((t) => `<span>${esc(t)}</span>`).join(' · ')
  const image = await card(post.slug, {
    title: post.title,
    meta: `${post.date} · ${post.tags.slice(0, 3).join(' · ')}`,
  })
  await emit(`blog/${post.slug}/index.html`, page({
    title: `${post.title} — ${AUTHOR}`,
    description,
    canonical: url,
    image,
    imageAlt: post.title,
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
const defaultCard = await card('default', {
  title: 'itspyguru OS',
  meta: 'BACKEND · AI · SECURITY',
  footer: 'A DEVELOPER PORTFOLIO',
})
await emit('blog/index.html', page({
  title: `Blog — ${AUTHOR}`,
  description: `Writing by ${AUTHOR} on AI, backend engineering and technology policy.`,
  canonical: `${SITE}/blog/`,
  image: defaultCard,
  imageAlt: `Blog by ${AUTHOR}`,
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
// Moved posts are left out: a sitemap entry asks Google to index a URL, and these ones
// carry a canonical pointing at cybiqon.in. Listing them would be asking for indexing
// and disclaiming it in the same breath. They stay reachable and linked, just unlisted.
const urls = [{ loc: SITE + '/', date: byNewest[0]?.date }, { loc: `${SITE}/blog/`, date: byNewest[0]?.date },
  ...byNewest.filter((p) => !p.canonical).map((p) => ({ loc: `${SITE}/blog/${p.slug}/`, date: p.date }))]
await emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.date ? `<lastmod>${u.date}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`)
await emit('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`prerendered ${BLOG_POSTS.length} post(s):\n` + written.map((f) => '  docs/' + f).join('\n'))
