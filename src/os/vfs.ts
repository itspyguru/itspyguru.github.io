import { RESUME, LINKS } from '../data/resume'
import { buildResume, catExperience, catSkills, catEducation, catCerts, catContact, projectDetail, blogPostDetail, README_TEXT } from './render'
import { BLOG_POSTS } from '../data/blog'

export type NodeType = 'dir' | 'file' | 'game' | 'link' | 'app'
export interface VNode {
  name: string; type: NodeType; icon: string
  children?: VNode[]; render?: () => string; url?: string; game?: string; label?: string; featured?: boolean
}

export interface GameMeta { id: string; label: string; icon: string; kind: 'canvas' | 'term'; featured?: boolean }
export const GAMES: GameMeta[] = [
  { id: 'snake', label: 'Snake', icon: 'restaurant', kind: 'canvas' },
  { id: '2048', label: '2048', icon: 'grid_view', kind: 'canvas' },
  { id: 'tetris', label: 'Tetris', icon: 'view_compact', kind: 'canvas' },
  { id: 'bubble', label: 'Bubble Shooter', icon: 'bubble_chart', kind: 'canvas' },
  { id: 'spaceimpact', label: 'Space Impact', icon: 'rocket_launch', kind: 'canvas' },
  { id: 'descent', label: 'Neon Descent', icon: 'gps_fixed', kind: 'canvas', featured: true },
  { id: 'platformer', label: 'Mario', icon: 'directions_run', kind: 'canvas', featured: true },
  { id: 'racing', label: 'Racing', icon: 'directions_car', kind: 'canvas', featured: true },
  { id: 'pong', label: 'Pong', icon: 'sports_tennis', kind: 'canvas' },
  { id: 'tictactoe', label: 'Tic-Tac-Toe', icon: 'grid_3x3', kind: 'canvas' },
  { id: 'minesweeper', label: 'Minesweeper', icon: 'flag', kind: 'canvas' },
  { id: 'breakout', label: 'Breakout', icon: 'gamepad', kind: 'canvas' },
  { id: 'flappy', label: 'Flappy', icon: 'flutter_dash', kind: 'canvas' },
  { id: 'typing', label: 'Typing Test', icon: 'keyboard', kind: 'term' },
  { id: 'guess', label: 'Number Guess', icon: 'casino', kind: 'term' },
]
export const GAME_BY_ID: Record<string, GameMeta> = Object.fromEntries(GAMES.map((g) => [g.id, g]))

const file = (name: string, icon: string, render: () => string): VNode => ({ name, type: 'file', icon, render })

export const ROOT_VFS: VNode = {
  name: '~', type: 'dir', icon: 'home', children: [
    { name: 'profile', type: 'dir', icon: 'badge', children: [
      file('about.txt', 'person', () => RESUME.bioLong),
      file('experience.log', 'work_history', catExperience),
      file('skills.txt', 'code', catSkills),
      file('education.txt', 'school', catEducation),
      file('certs.txt', 'verified', catCerts),
    ] },
    { name: 'projects', type: 'dir', icon: 'folder', children:
      RESUME.projects.map((p) => ({ name: p.slug, type: 'link', icon: 'deployed_code', url: p.link, label: p.title, render: () => projectDetail(p.slug) } as VNode)) },
    { name: 'games', type: 'dir', icon: 'sports_esports', children:
      GAMES.map((g) => ({ name: g.id, type: 'game', icon: g.icon, game: g.id, label: g.label, featured: g.featured } as VNode)) },
    { name: 'blog', type: 'dir', icon: 'article', children:
      BLOG_POSTS.map((p) => ({ name: p.slug, type: 'file', icon: 'description', label: p.title, render: () => blogPostDetail(p.slug) } as VNode)) },
    { name: 'apps', type: 'dir', icon: 'apps', children: [
      { name: 'calculator', type: 'app', icon: 'calculate', label: 'Calculator' },
      { name: 'calendar', type: 'app', icon: 'calendar_month', label: 'Calendar' },
      { name: 'camera', type: 'app', icon: 'photo_camera', label: 'Camera' },
      { name: 'gallery', type: 'app', icon: 'photo_library', label: 'Gallery' },
      { name: 'radio', type: 'app', icon: 'radio', label: 'Radio' },
      { name: 'files', type: 'app', icon: 'folder_open', label: 'Files' },
      { name: 'paint', type: 'app', icon: 'brush', label: 'Paint' },
      { name: 'weather', type: 'app', icon: 'partly_cloudy_day', label: 'Weather' },
      { name: 'maps', type: 'app', icon: 'map', label: 'Maps' },
      { name: 'ask', type: 'app', icon: 'neurology', label: 'Ask pyGuru' },
      { name: 'contact', type: 'app', icon: 'forward_to_inbox', label: 'Contact' },
      { name: 'achievements', type: 'app', icon: 'military_tech', label: 'Achievements' },
      { name: 'clock', type: 'app', icon: 'schedule', label: 'Clock' },
      { name: 'notes', type: 'app', icon: 'sticky_note_2', label: 'Notes' },
      { name: 'terminal', type: 'app', icon: 'terminal', label: 'Terminal' },
      { name: 'settings', type: 'app', icon: 'settings', label: 'Settings' },
    ] },
    file('resume.pdf', 'description', buildResume),
    file('contact.txt', 'mail', catContact),
    file('README.md', 'article', () => README_TEXT),
  ],
}

export function nodeAt(segs: string[]): VNode | null {
  let n: VNode = ROOT_VFS
  for (const s of segs) {
    if (n.type !== 'dir') return null
    const c = (n.children || []).find((x) => x.name.toLowerCase() === s.toLowerCase())
    if (!c) return null
    n = c
  }
  return n
}
export function resolveSegs(pathIn: string, cwd: string[]): string[] {
  const p = (pathIn || '').trim()
  if (p === '' || p === '~' || p === '/') return []
  const segs = (p[0] === '/' || p.startsWith('~/')) ? p.replace(/^~?\//, '').split('/') : cwd.concat(p.split('/'))
  const out: string[] = []
  for (const s of segs) { if (s === '' || s === '.') continue; if (s === '..') out.pop(); else out.push(s) }
  return out
}
export const pathLabel = (segs: string[]) => '~' + (segs.length ? '/' + segs.join('/') : '')
export const fullPath = (segs: string[]) => '/home/itspyguru' + (segs.length ? '/' + segs.join('/') : '')

const ALIAS: Record<string, string[]> = {
  skills: ['profile', 'skills.txt'], 'skills.txt': ['profile', 'skills.txt'],
  experience: ['profile', 'experience.log'], 'experience.log': ['profile', 'experience.log'],
  education: ['profile', 'education.txt'], certs: ['profile', 'certs.txt'], certifications: ['profile', 'certs.txt'],
  about: ['profile', 'about.txt'], contact: ['apps', 'contact'], 'contact.txt': ['contact.txt'], contactinfo: ['contact.txt'],
  resume: ['resume.pdf'], 'resume.pdf': ['resume.pdf'], readme: ['README.md'],
  projects: ['projects'], games: ['games'], profile: ['profile'], apps: ['apps'], blog: ['blog'],
  calculator: ['apps', 'calculator'], calendar: ['apps', 'calendar'], camera: ['apps', 'camera'], clock: ['apps', 'clock'], notes: ['apps', 'notes'],
  gallery: ['apps', 'gallery'], photos: ['apps', 'gallery'],
  radio: ['apps', 'radio'], music: ['apps', 'radio'],
  files: ['apps', 'files'], explorer: ['apps', 'files'], paint: ['apps', 'paint'], weather: ['apps', 'weather'],
  maps: ['apps', 'maps'], map: ['apps', 'maps'],
  ask: ['apps', 'ask'], pyguru: ['apps', 'ask'], assistant: ['apps', 'ask'],
  hello: ['apps', 'contact'], message: ['apps', 'contact'],
  achievements: ['apps', 'achievements'], trophies: ['apps', 'achievements'], trophy: ['apps', 'achievements'],
}
export function resolveWithAlias(arg: string, cwd: string[]): { segs?: string[]; n?: VNode; special?: 'socials' } | null {
  const segs = resolveSegs(arg, cwd); const n = nodeAt(segs)
  if (n) return { segs, n }
  const a = (arg || '').trim().toLowerCase().replace(/\/$/, '')
  if (a === 'socials' || a === 'links') return { special: 'socials' }
  if (ALIAS[a]) { const s = ALIAS[a], nn = nodeAt(s); if (nn) return { segs: s, n: nn } }
  return null
}
export function nodeLine(c: VNode): string {
  if (c.type === 'dir') return `<span class="text-primary-fixed-dim">${c.name}/</span>`
  if (c.type === 'game') return `<span class="text-tertiary-fixed-dim">${c.name}</span>  <span class="text-outline">[game]</span>`
  if (c.type === 'link') return `<span class="text-primary underline decoration-dotted">${c.name}</span>`
  if (c.type === 'app') return `<span class="text-tertiary-fixed-dim">${c.name}</span>  <span class="text-outline">[app]</span>`
  return `<span class="text-on-surface">${c.name}</span>`
}
export const lsNode = (n: VNode) => (!n.children || !n.children.length) ? '<span class="text-outline">(empty)</span>' : n.children.map(nodeLine).join('\n')
export function treeStr(): string {
  const lines = ['<span class="text-primary-fixed-dim">~</span>']
  const walk = (node: VNode, prefix: string) => {
    const ch = node.children || []
    ch.forEach((c, i) => {
      const last = i === ch.length - 1
      lines.push('<span class="text-outline">' + prefix + (last ? '└── ' : '├── ') + '</span>' + (c.type === 'dir' ? '<span class="text-primary-fixed-dim">' + c.name + '/</span>' : c.name))
      if (c.type === 'dir') walk(c, prefix + (last ? '    ' : '│   '))
    })
  }
  walk(ROOT_VFS, '')
  return lines.join('\n')
}
