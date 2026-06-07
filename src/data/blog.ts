// Blog posts — authored in Markdown (rendered by src/os/markdown.ts → md()).
// Add a post by appending an object; the Blog view, terminal `cat blog/<slug>` and VFS pick it up automatically.
export interface BlogPost {
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  tags: string[]
  excerpt: string
  body: string // markdown
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'building-a-browser-os',
    title: 'I built a desktop OS in the browser as my portfolio',
    date: '2026-06-02',
    tags: ['React', 'TypeScript', 'UI', 'meta'],
    excerpt: 'Why a portfolio that boots like an operating system — windows, a terminal, a filesystem, games — beats yet another scrolling landing page.',
    body: `Most dev portfolios are a hero section, a grid of cards, and a contact form. I wanted mine to be something you *use*, not just read. So **itspyguru OS** boots like a real machine: a window manager, a taskbar, a virtual filesystem, a terminal, and a tray of apps and games.

## The stack

Nothing exotic — the constraint was *zero heavy dependencies* so it stays fast and ships to GitHub Pages as static files:

- **Vite + React + TypeScript** for the app shell
- **Zustand** for OS state (windows, view, settings) — tiny and ergonomic
- **Tailwind** with a CSS-variable theme (\`--accent\`) so the whole OS re-themes instantly
- Plain \`<canvas>\` for every game — no engine

## Why a virtual filesystem?

The terminal is the fun part. There's a real node tree (\`~/profile\`, \`~/projects\`, \`~/games\`) you can \`cd\` and \`cat\` through:

\`\`\`bash
$ cd projects
$ ls
$ cat resume.pdf
\`\`\`

The same tree powers the desktop icons and the file manager — one data structure, three surfaces.

## What I learned

> Constraints make the project. "No engine, no big deps" forced simpler, more honest solutions — and the bundle is still under ~125KB gzipped with a dozen+ games.

The most fun feature is always the next one. Up next: this blog, an AI assistant, and an achievements system.`,
  },
  {
    slug: 'faking-doom-raycaster',
    title: 'Faking DOOM: a 2.5D raycaster in one React component',
    date: '2026-06-06',
    tags: ['Games', 'Canvas', 'Graphics', 'TypeScript'],
    excerpt: 'How Neon Descent renders a first-person 3D world with DDA wall casting, a z-buffer for sprites, and a neon floor grid — no WebGL, no engine.',
    body: `**Neon Descent** is a Wolfenstein-3D-style shooter that lives inside the portfolio. It renders a believable first-person 3D world on a plain 2D canvas, at 60fps, in a single component.

## The trick: cast one ray per column

For each of the ~480 screen columns, march a ray through a grid until it hits a wall (the **DDA** algorithm), take the fisheye-corrected distance, and draw a vertical slice whose height is \`screenHeight / distance\`. Closer wall → taller slice. That's the whole illusion.

\`\`\`ts
const perp = side === 0 ? sideX - deltaX : sideY - deltaY
const lineH = H / perp
// draw a 1px-wide vertical strip of the wall, centered on the horizon
\`\`\`

## Sprites need a z-buffer

Enemies and pickups are flat billboards. To stop them drawing *through* walls, I store each column's wall distance in a \`Float32Array\` z-buffer, then draw each sprite strip only where it's nearer than the wall behind it.

## Killing the "void" feeling

The first version felt like floating in black. The fix was a **world-locked neon floor + ceiling grid** (real floor-casting into an ImageData buffer) plus glowing edges on every wall. Suddenly you could feel yourself move.

- DDA walls + per-column z-buffer
- Billboarded sprite enemies with simple chase AI
- A directional damage indicator so hits are never "invisible"

The lesson: in fake-3D, *legibility* matters more than realism. Give the eye edges and a ground plane and it fills in the rest.`,
  },
  {
    slug: 'ai-agents-in-production',
    title: 'Shipping AI agents that don\'t fall over in production',
    date: '2026-05-20',
    tags: ['AI', 'CrewAI', 'LangChain', 'FastAPI', 'Backend'],
    excerpt: 'Notes from building multi-agent systems on FastAPI + CrewAI + LangChain — where they break, and the guardrails that keep them honest.',
    body: `Multi-agent demos look magical. Production is where they meet reality: flaky tools, runaway loops, and confidently-wrong answers. Here's what actually kept ours reliable.

## 1. Ground everything in retrieval

An agent that "knows" things from its weights will hallucinate. An agent that *looks up* facts and cites them won't (as much). Every answer path goes through retrieval over a real source of truth first.

## 2. Bound the loops

Give every agent a hard ceiling — max steps, max tokens, max wall-clock. Without it, one bad plan loops until your bill notices.

\`\`\`python
result = crew.kickoff(inputs=payload)  # with max_iter + timeouts wired per-agent
\`\`\`

## 3. Make failure loud, not silent

The worst bug is a swallowed exception that returns a plausible empty answer. Fail loudly, log the tool call, and surface *why*.

> A silent fallback is a lie the system tells you. If a tool failed, the user (and the next engineer) should be able to see exactly that.

## Stack

- **FastAPI** for the API surface (async, typed, fast)
- **CrewAI / LangChain** for orchestration
- **Redis** for memory + rate limiting

Agents are powerful, but the engineering around them — retrieval, bounds, observability — is what makes them shippable.`,
  },
]

export const postBySlug = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug)
