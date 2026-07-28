import { BLOG_POSTS } from '../data/blog'
import { md } from '../os/markdown'
import { useOS } from '../store/os'
import { postUrl } from '../os/router'

export default function Blog() {
  const slug = useOS((s) => s.blogSlug)
  const setSlug = useOS((s) => s.setBlogSlug)
  const showToast = useOS((s) => s.showToast)
  const post = BLOG_POSTS.find((p) => p.slug === slug) || BLOG_POSTS[0]

  // Each post is a real prerendered page, so the canonical link is always shareable.
  const copyLink = async () => {
    const url = postUrl(post.slug)
    try { await navigator.clipboard.writeText(url); showToast('link copied — ' + url) }
    catch { showToast(url) }
  }

  return (
    <section className="relative">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="bg-surface-container-lowest/90 backdrop-blur-2xl border-2 border-primary-fixed-dim/30 relative">
          <div className="h-8 bg-surface-container-high flex items-center justify-between px-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-error/50" /><div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim/50" /><div className="w-2 h-2 rounded-full bg-primary-fixed-dim/50" /></div>
              <span className="text-data-label text-outline ml-4 hidden sm:inline">/blog/{post?.slug}/</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={copyLink} title="Copy link to this post"
                className="flex items-center gap-1 text-data-label text-outline hover:text-primary-fixed-dim transition-colors">
                <span className="material-symbols-outlined text-[13px] leading-none">link</span>
                <span className="hidden sm:inline">COPY LINK</span>
              </button>
              <span className="text-data-label text-primary-fixed-dim font-bold">DEV_LOG</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* post list */}
            <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/20 p-3 space-y-2">
              <div className="text-[9px] font-data-label text-outline px-1 mb-1">ARCHIVE · {BLOG_POSTS.length} POSTS</div>
              {BLOG_POSTS.map((p) => (
                <button key={p.slug} onClick={() => setSlug(p.slug)}
                  className={'w-full text-left p-2.5 border transition-all ' + (p.slug === post?.slug ? 'border-primary-fixed-dim bg-primary-fixed-dim/10' : 'border-outline-variant/30 hover:border-primary-fixed-dim/50 hover:bg-primary-fixed-dim/5')}>
                  <div className={'text-data-label leading-snug ' + (p.slug === post?.slug ? 'text-primary-fixed' : 'text-on-surface')}>{p.title}</div>
                  <div className="text-[9px] text-outline mt-1 font-data-label">{p.date}</div>
                </button>
              ))}
            </aside>

            {/* article */}
            <article className="flex-1 min-w-0 p-5 md:p-8">
              {post && (
                <>
                  <h1 className="text-primary-fixed font-headline-md text-xl md:text-2xl leading-tight">{post.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] text-outline font-data-label">{post.date}</span>
                    {post.tags.map((t) => <span key={t} className="text-[9px] border border-outline-variant/50 px-2 py-0.5 text-outline font-data-label">{t}</span>)}
                  </div>
                  <div className="mt-6 border-t border-outline-variant/20 pt-6" dangerouslySetInnerHTML={{ __html: md(post.body) }} />
                </>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
