// "Ask pyGuru" — a small retrieval/intent assistant grounded on the resume + projects.
// Honest about being rule-based; no API key ships in the static bundle. answer() returns Markdown
// (callers render it via md()). To wire a real LLM later, see the askLLM stub at the bottom.
import { RESUME, LINKS } from '../data/resume'

type Intent = { keys: string[]; reply: () => string }
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const INTENTS: Intent[] = [
  { keys: ['hi', 'hello', 'hey', 'yo', 'sup', 'hii', 'greetings'], reply: () =>
    `Hey — I'm **pyGuru**, ${RESUME.name}'s assistant. Ask about his **stack**, **experience**, **projects**, **AI/security work**, or **how to reach him**. Tap a suggestion to start.` },
  { keys: ['who', 'about', 'yourself', 'introduce', 'bio', 'tell me about'], reply: () =>
    `**${RESUME.name}** (${RESUME.alias}) — ${RESUME.title}.\n\n${RESUME.bioLong}` },
  { keys: ['stack', 'tech', 'technolog', 'skill', 'language', 'tool', 'framework', 'expert', 'good at', 'strongest'], reply: () =>
    `Core stack: ${RESUME.topSkills.join(' · ')}.\n\n` + Object.entries(RESUME.skills).map(([k, v]) => `**${k}:** ${v.join(', ')}`).join('\n\n') },
  { keys: ['experience', 'work', 'job', 'career', 'leadzen', 'sde', 'role'], reply: () =>
    `Currently **${RESUME.experience[0].role} @ ${RESUME.experience[0].org}** _(${RESUME.experience[0].period})_.\n\n` +
    RESUME.experience.slice(0, 3).map((e) => `**${e.role}** · ${e.org} _(${e.period})_\n${e.bullets.slice(0, 2).map((b) => '- ' + b).join('\n')}`).join('\n\n') },
  { keys: ['project', 'built', 'build', 'portfolio', 'made', 'ship'], reply: () =>
    `Highlights:\n\n` + RESUME.projects.slice(0, 5).map((p) => `- **${p.title}** [${p.type}] — ${p.desc}`).join('\n') + `\n\nRun \`ls projects\` or open the **Projects** section for all eight.` },
  { keys: ['ai', 'agent', 'crewai', 'langchain', 'llm', 'genai', 'generative', 'machine learning'], reply: () =>
    `He builds **production AI agents**: an AI Financial-Doc Engine (CrewAI + LangChain + Hugging Face) that generates dynamic documents for Indian listed companies — 50% faster at 95%+ accuracy. Stack: FastAPI · CrewAI · LangChain · Redis. See the blog post _"Shipping AI agents that don't fall over in production"_.` },
  { keys: ['security', 'hack', 'pentest', 'penetration', 'vulnerab', 'bug bounty', 'ethical', 'cyber'], reply: () =>
    `Security is a core focus: ran full **security audits & penetration tests** of production web apps (found and helped fix vulns), holds a **Cyber Security & Bug Bounty** cert from IIT Kanpur, and teaches an **Ethical Hacking** course (4,500+ enrollments). Tooling: Burp Suite, nmap, sublist3r, Kali.` },
  { keys: ['contact', 'hire', 'email', 'reach', 'connect', 'available', 'touch', 'message'], reply: () =>
    `Reach out:\n- **Email:** [${RESUME.email}](${LINKS.email})\n- **Telegram:** [@itspyguru](${LINKS.telegram}) _(fastest)_\n- **LinkedIn:** [in/itspyguru](${LINKS.linkedin})\n- **GitHub:** [github.com/itspyguru](${LINKS.github})\n\nOr open the **Contact** app to send a message right here.` },
  { keys: ['teach', 'youtube', 'udemy', 'course', 'instructor', 'content', 'educat', 'tutorial'], reply: () =>
    `He's a Python instructor: **20,000+ YouTube subscribers**, **10,000+ Telegram members**, and an **Ethical Hacking** course on Udemy (4,500+ enrollments, 4.7 rating).` },
  { keys: ['education', 'study', 'degree', 'college', 'university', 'msc', 'bsc'], reply: () =>
    RESUME.education.map((e) => `- **${e.degree}** — ${e.school} _(${e.period})_`).join('\n') },
  { keys: ['site', 'this os', 'how built', 'made this', 'website', 'built this', 'portfolio site'], reply: () =>
    `This portfolio **is a desktop OS in the browser** — React + TypeScript + Vite + Zustand + Tailwind, no heavy deps. Window manager, terminal, virtual filesystem, a dozen+ canvas games (including a Doom-like raycaster), and this assistant. There's a blog post on it: _"I built a desktop OS in the browser"_.` },
  { keys: ['game', 'neon descent', 'doom', 'mario', 'racing', 'play'], reply: () =>
    `There are 15 games in \`~/games\`. The featured ones are **Neon Descent** (a Doom-like raycaster), **Mario** (a platformer) and **Racing** (a 2.5D racer). Type a game's name in the terminal or open the Games folder.` },
  { keys: ['location', 'where', 'based', 'live', 'city', 'country', 'remote'], reply: () =>
    `Based in ${RESUME.location} — open to remote opportunities.` },
  { keys: ['resume', 'cv'], reply: () =>
    `Grab the resume with \`download resume\` in the terminal (saves a PDF), or read it inline via \`cat resume.pdf\`.` },
  { keys: ['cybiqon', 'venture', 'startup'], reply: () =>
    `**cybiqon.in** is his flagship 2026 venture — building & scaling across security & automation. [cybiqon.in](${LINKS.cybiqon}).` },
]

const FALLBACK = () =>
  `I'm grounded on ${RESUME.name}'s resume & projects, so I'm best with questions about his **stack**, **experience**, **projects**, **AI/security work**, **teaching**, or **how to reach him**. Try one of those — or tap a suggestion chip.`

export const SUGGESTIONS = ["What's your tech stack?", 'Tell me about your AI work', 'What have you built?', 'Is the security stuff real?', 'How do I contact you?', 'How was this site built?']

export function answer(qIn: string): string {
  const q = (qIn || '').toLowerCase().trim()
  if (!q) return FALLBACK()
  let best: Intent | null = null, bestScore = 0
  for (const it of INTENTS) {
    let score = 0
    for (const k of it.keys) {
      const hit = k.includes(' ') ? q.includes(k) : new RegExp('\\b' + escRe(k)).test(q)
      if (hit) score += k.length
    }
    if (score > bestScore) { bestScore = score; best = it }
  }
  return best ? best.reply() : FALLBACK()
}

// Optional real-LLM hook — point this at your own serverless endpoint and call it from AskAI instead of answer().
// Left off by default so no API key ships in a static site.
// export async function askLLM(q: string): Promise<string> {
//   const r = await fetch('https://your-endpoint.example/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q }) })
//   return (await r.json()).answer as string
// }
