// URL routing. Section views stay on the hash (/#breach); blog posts get real
// shareable paths (/blog/<slug>/) that scripts/prerender.mjs emits as static HTML
// so link previews and crawlers work without running the app.
import type { View } from '../store/os'
import { BLOG_POSTS, postBySlug } from '../data/blog'

export const SITE_ORIGIN = 'https://itspyguru.github.io'
export const DEFAULT_SLUG = BLOG_POSTS[0]?.slug || ''
const VIEWS: string[] = ['root', 'scan', 'breach', 'clearance', 'blog', 'terminal', 'settings']

export const postUrl = (slug: string) => `${SITE_ORIGIN}/blog/${slug}/`
export const routePath = (view: View, slug: string) => (view === 'blog' ? `/blog/${slug}/` : '/#' + view)

export function parseRoute(): { view: View; slug: string } {
  const post = location.pathname.match(/^\/blog\/([^/]+)\/?$/)
  if (post) {
    const slug = decodeURIComponent(post[1])
    return { view: 'blog', slug: postBySlug(slug) ? slug : DEFAULT_SLUG }
  }
  if (/^\/blog\/?$/.test(location.pathname)) return { view: 'blog', slug: DEFAULT_SLUG }
  const h = location.hash.replace(/^#\/?/, '')
  return { view: (VIEWS.includes(h) ? h : 'clearance') as View, slug: DEFAULT_SLUG }
}

export function writeRoute(view: View, slug: string, push = false) {
  const next = routePath(view, slug)
  if (next === location.pathname + location.hash) return
  try { history[push ? 'pushState' : 'replaceState'](null, '', next) } catch {}
}
