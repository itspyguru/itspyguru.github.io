// Blog posts — authored in Markdown (rendered by src/os/markdown.ts → md()).
// Add a post by appending an object; the Blog view, terminal `cat blog/<slug>` and VFS pick it up automatically.
//
// Long-form writing moved to Cybiqon Lab (https://cybiqon.in/lab) on 1 Aug 2026.
// Both posts below now stand as stubs pointing at their canonical home there.
//
// Why the move: publishing here meant editing this array, running the full
// `vite build && node scripts/prerender.mjs`, and committing ~20 regenerated files in
// docs/ — a build per post. On cybiqon.in the posts are rows in Cloudflare D1 and go
// live on write, with no deploy at all. cybiqon.in also accrues domain authority,
// which itspyguru.github.io cannot: github.io is on the Public Suffix List.
//
// The entries stay so the Blog view, the VFS at ~/blog and `cat blog/<slug>` keep
// working, and so anyone holding an old link lands somewhere that says where the piece
// went. `canonical` sends the ranking signal to cybiqon.in and keeps these URLs out of
// this site's sitemap.
export interface BlogPost {
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  tags: string[]
  excerpt: string
  body: string // markdown
  /** Set when the post lives elsewhere. Drives <link rel=canonical> and og:url, and
   *  excludes the URL from sitemap.xml. */
  canonical?: string
}

const LAB = 'https://cybiqon.in/lab'

const moved = (slug: string, title: string) => `**This post now lives on Cybiqon Lab.**

Read it in full: [${title}](${LAB}/${slug})

I moved my long-form engineering writing to [Cybiqon Lab](${LAB}) — notes on what I am
building, what broke, and what the numbers said. This page stays so old links keep
working.`

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'we-built-a-wiki-our-ai-agents-ignored-it',
    title: 'We built our AI agents a wiki. They went straight to grep.',
    date: '2026-07-31',
    tags: ['AI', 'Documentation', 'OKF', 'Engineering', 'Research'],
    excerpt: '27 days after adopting the Open Knowledge Format across our monorepo, I went looking for evidence it was working and found the opposite. What a preregistered study, 3,000 GitHub projects and one wrong document say about writing docs for machines.',
    canonical: `${LAB}/we-built-a-wiki-our-ai-agents-ignored-it`,
    body: moved(
      'we-built-a-wiki-our-ai-agents-ignored-it',
      'We built our AI agents a wiki. They went straight to grep.',
    ),
  },
  {
    slug: 'openai-anthropic-open-weights-crybabies',
    title: 'Are OpenAI and Anthropic crybabies? A hard look at the open-weights fight',
    date: '2026-07-28',
    tags: ['AI', 'Policy', 'Open Source', 'Analysis', 'Research'],
    excerpt: 'In July 2026 the two biggest US AI labs went to Washington to warn about Chinese open-weight models. Critics called it regulatory capture. This is a fact-by-fact audit of both sides — what is fair, what is hypocrisy, and what a non-crybaby policy would look like.',
    canonical: `${LAB}/openai-anthropic-open-weights-crybabies`,
    body: moved(
      'openai-anthropic-open-weights-crybabies',
      'Are OpenAI and Anthropic crybabies? A hard look at the open-weights fight',
    ),
  },
]

export const postBySlug = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug)
