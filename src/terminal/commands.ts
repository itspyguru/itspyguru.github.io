import { Settings, THEMES, FONTS } from '../os/themes'
import { RESUME, LINKS } from '../data/resume'
import {
  esc, buildResume, catSocials, neofetch, gitLog, fortune, cowsay, man,
} from '../os/render'
import {
  ROOT_VFS, nodeAt, resolveSegs, resolveWithAlias, lsNode, nodeLine, treeStr,
  fullPath, GAME_BY_ID, GAMES, VNode,
} from '../os/vfs'
import { getGitHub } from '../os/github'
import { answer } from '../os/ask'
import { md } from '../os/markdown'
import { useOS } from '../store/os'

function cmdGh(arg: string): string {
  const d = getGitHub()
  if (!d) return '<span class="text-outline">fetching GitHub… try again in a moment, or see <a href="' + LINKS.github + '" target="_blank" class="text-primary-fixed-dim underline">github.com/itspyguru</a></span>'
  if (arg === 'repos') return d.repos.map((r) => `<span class="text-tertiary-fixed-dim">${r.name}</span> ${r.stars ? '★' + r.stars : ''} <span class="text-outline">${r.lang || ''}</span>\n  <span class="text-outline">${esc(r.desc || '')}</span>`).join('\n')
  return `<span class="text-primary">@itspyguru</span> · ${d.public_repos} repos · ${d.stars}★ · ${d.followers} followers\ntop langs: ${d.topLangs.join(', ')}`
}

export interface TermCtx {
  cwd: string[]
  setCwd: (s: string[]) => void
  history: string[]
  write: (html: string) => void
  clear: () => void
  launchGame: (id: string) => void
  openDir: (segs: string[]) => void
  openApp: (id: string) => void
  startScreensaver: () => void
  printResume: () => void
  os: {
    setView: (v: 'root' | 'scan' | 'breach' | 'clearance' | 'blog' | 'terminal' | 'settings') => void
    settings: Settings
    patchSettings: (p: Partial<Settings>) => void
    resetSettings: () => void
    showToast: (m: string) => void
  }
}

function cmdLs(ctx: TermCtx, arg: string): string {
  if (['', '.', '~', '-la', '-a', '-l', '-al'].includes((arg || '').trim())) return lsNode(nodeAt(ctx.cwd) || ROOT_VFS)
  const r = resolveWithAlias(arg, ctx.cwd)
  if (r && r.special === 'socials') return catSocials()
  if (!r || !r.n) return `<span class="text-error">ls: ${esc(arg)}: no such file or directory</span> — try <span class="text-primary-fixed-dim">ls</span>`
  if (r.n.type === 'dir') return lsNode(r.n)
  if (r.n.type === 'file' && r.n.render) return r.n.render()
  return nodeLine(r.n)
}
function cmdCat(ctx: TermCtx, arg: string): string {
  if (!(arg || '').trim()) return '<span class="text-error">usage: cat &lt;file&gt;</span>  (try: cat resume.pdf)'
  const r = resolveWithAlias(arg, ctx.cwd)
  if (r && r.special === 'socials') return catSocials()
  if (!r || !r.n) return `<span class="text-error">cat: ${esc(arg)}: No such file</span>  (try: ls)`
  const n = r.n
  if (n.type === 'dir') return `<span class="text-error">cat: ${esc(n.name)}: Is a directory</span>`
  if (n.type === 'game') return `<span class="text-outline">${n.name} is a game — run </span><span class="text-primary-fixed-dim">${n.name}</span><span class="text-outline"> to play.</span>`
  if (n.render) return n.render()
  if (n.type === 'link') return `${n.name} → <a href="${n.url}" target="_blank" class="text-primary-fixed-dim underline">${n.url}</a>`
  return n.name
}
function cmdCd(ctx: TermCtx, arg: string): string | null {
  const target = resolveSegs(arg, ctx.cwd); const n = nodeAt(target)
  if (!n) return `<span class="text-error">cd: ${esc(arg)}: no such directory</span>`
  if (n.type !== 'dir') return `<span class="text-error">cd: ${esc(arg)}: not a directory</span>`
  ctx.setCwd(target); return null
}
function cmdOpen(ctx: TermCtx, arg: string): string {
  const k = (arg || '').trim().toLowerCase()
  const map: Record<string, string> = { github: LINKS.github, linkedin: LINKS.linkedin, youtube: LINKS.youtube, yt: LINKS.youtube, telegram: LINKS.telegram, tg: LINKS.telegram, instagram: LINKS.instagram, ig: LINKS.instagram, pinterest: LINKS.pinterest, cybiqon: LINKS.cybiqon, udemy: LINKS.udemy, pypi: LINKS.pypi, decrypto: LINKS.pypi, email: LINKS.email }
  if (k === 'resume' || k === 'resume.pdf') { ctx.printResume(); return '<span class="text-primary-fixed-dim">Opening print dialog…</span>' }
  if (k in map) { window.open(map[k], '_blank'); return `<span class="text-primary-fixed-dim">Opening ${k}…</span>` }
  const r = resolveWithAlias(arg, ctx.cwd)
  if (r && r.n) {
    const n = r.n as VNode
    if (n.type === 'link') { window.open(n.url, '_blank'); return `<span class="text-primary-fixed-dim">Opening ${n.name}…</span>` }
    if (n.type === 'game') { ctx.launchGame(n.game || n.name); return `<span class="text-outline">launching ${n.label || n.name}…</span>` }
    if (n.type === 'app') { if (n.name === 'settings' || n.name === 'terminal') ctx.os.setView(n.name as any); else ctx.openApp(n.name); return `<span class="text-primary-fixed-dim">opening ${n.name}…</span>` }
    if (n.type === 'file' && n.render) return n.render()
    if (n.type === 'dir' && r.segs) { ctx.openDir(r.segs); return `<span class="text-outline">opening ${n.name}/ on desktop…</span>` }
  }
  return `<span class="text-error">open: unknown target '${esc(arg)}'</span>  (try: open github)`
}
function cmdTheme(ctx: TermCtx, arg: string): string {
  arg = (arg || '').trim().toLowerCase()
  const names = Object.keys(THEMES).filter((k) => k !== 'hacker')
  if (!arg) return `usage: theme &lt;${names.join('|')}|#hex&gt;  · current: ${ctx.os.settings.accent || ctx.os.settings.theme}`
  if (/^#?[0-9a-f]{6}$/.test(arg)) { const hex = arg[0] === '#' ? arg : '#' + arg; ctx.os.patchSettings({ accent: hex, theme: 'custom' }); return 'accent set to ' + hex }
  if (THEMES[arg]) { ctx.os.patchSettings({ theme: arg, accent: null }); ctx.os.showToast('Theme: ' + THEMES[arg].label); return 'theme → ' + THEMES[arg].label }
  return `<span class="text-error">unknown theme: ${esc(arg)}</span> (try: ${names.join(', ')})`
}
function cmdFont(ctx: TermCtx, arg: string): string {
  arg = (arg || '').trim().toLowerCase()
  const alias: Record<string, string> = { jetbrains: 'jetbrains', jb: 'jetbrains', fira: 'fira', 'fira-code': 'fira', firacode: 'fira', ibm: 'ibm', plex: 'ibm', vt323: 'vt323', vt: 'vt323', retro: 'vt323', system: 'system', mono: 'system' }
  const k = alias[arg]
  if (!k) return `usage: font &lt;jetbrains|fira|ibm|vt323|system&gt;  · current: ${ctx.os.settings.font}`
  ctx.os.patchSettings({ font: k }); return 'font → ' + FONTS[k].label
}
function cmdHelp(): string {
  return [
    '<span class="text-primary-fixed-dim font-bold">AVAILABLE COMMANDS</span>',
    '<span class="text-tertiary-fixed-dim">cd &lt;dir&gt;</span> · <span class="text-tertiary-fixed-dim">ls</span> · <span class="text-tertiary-fixed-dim">pwd</span> · <span class="text-tertiary-fixed-dim">tree</span>   navigate the filesystem',
    '<span class="text-tertiary-fixed-dim">cat &lt;file&gt;</span>          read a file (cat resume.pdf, cat skills)',
    '<span class="text-tertiary-fixed-dim">cd games</span> then <span class="text-tertiary-fixed-dim">ls</span>      browse &amp; play games (snake, 2048, pong…)',
    '<span class="text-tertiary-fixed-dim">whoami</span> / <span class="text-tertiary-fixed-dim">whois</span>      short / long bio',
    '<span class="text-tertiary-fixed-dim">cat contact</span>         how to reach me',
    '<span class="text-tertiary-fixed-dim">open &lt;name&gt;</span>         open a link (github, linkedin...)',
    '<span class="text-tertiary-fixed-dim">theme</span> / <span class="text-tertiary-fixed-dim">font</span> / <span class="text-tertiary-fixed-dim">settings</span>   customize the OS',
    '<span class="text-tertiary-fixed-dim">neofetch</span> · <span class="text-tertiary-fixed-dim">git log</span> · <span class="text-tertiary-fixed-dim">fortune</span> · <span class="text-tertiary-fixed-dim">cowsay</span>',
    '<span class="text-tertiary-fixed-dim">download resume</span>     save resume as PDF',
    '<span class="text-tertiary-fixed-dim">clear</span> · <span class="text-tertiary-fixed-dim">date</span> · <span class="text-tertiary-fixed-dim">echo</span> · <span class="text-tertiary-fixed-dim">history</span> · <span class="text-tertiary-fixed-dim">man &lt;cmd&gt;</span>',
  ].join('\n')
}
function cmdSudo(arg: string): string {
  const a = (arg || '').trim().toLowerCase()
  if (a.startsWith('hire')) return [
    '<span class="text-primary-fixed-dim font-bold">[ RECRUITMENT PROTOCOL INITIATED ]</span>',
    'Subject flagged: <span class="text-primary">EXCEPTIONAL BUILDER</span> — immediate recruitment advised.',
    `→ email: <a href="${LINKS.email}" class="text-primary-fixed-dim underline">prajjwalpathak35@gmail.com</a>`,
    `→ telegram: <a href="${LINKS.telegram}" target="_blank" class="text-primary-fixed-dim underline">@itspyguru</a>`,
    '<span class="text-tertiary-fixed-dim">access granted. ☺</span>',
  ].join('\n')
  if (a.includes('rm') && a.includes('-rf')) return '<span class="text-error">nope. nice try — this OS protects its operator. 🛡</span>'
  return `<span class="text-error">[sudo] permission denied:</span> ${esc(arg || '(nothing)')}`
}

export function runCommand(ctx: TermCtx, raw: string, echo = true) {
  const input = (raw || '').trim()
  if (echo) ctx.write(promptEcho(ctx, input))
  if (input === '') return
  try { useOS.getState().bumpCmd() } catch {}
  const parts = input.split(/\s+/); const cmd = parts[0].toLowerCase(); const arg = parts.slice(1).join(' ')
  let out: string | null | undefined
  switch (cmd) {
    case 'help': case '?': out = cmdHelp(); break
    case 'man': out = man(arg); break
    case 'cat': out = cmdCat(ctx, arg); break
    case 'resume': out = arg === '--pdf' ? (ctx.printResume(), '<span class="text-primary-fixed-dim">Opening print dialog…</span>') : buildResume(); break
    case 'ls': case 'dir': out = cmdLs(ctx, arg); break
    case 'cd': out = cmdCd(ctx, arg); break
    case 'pwd': out = fullPath(ctx.cwd); break
    case 'whoami': out = '<span class="text-primary">' + RESUME.bioShort + '</span>'; break
    case 'whois': out = RESUME.bioLong; break
    case 'open': out = cmdOpen(ctx, arg); break
    case 'download': out = (arg.toLowerCase().includes('resume') || arg === '') ? (ctx.printResume(), '<span class="text-primary-fixed-dim">Opening print dialog… choose “Save as PDF”.</span>') : 'usage: download resume'; break
    case 'neofetch': case 'screenfetch': out = neofetch(); break
    case 'date': out = new Date().toString(); break
    case 'echo': out = esc(arg); break
    case 'history': out = ctx.history.map((h, i) => `  ${(i + 1).toString().padStart(3)}  ${esc(h)}`).join('\n') || '(empty)'; break
    case 'clear': case 'cls': ctx.clear(); return
    case 'sudo': useOS.getState().unlock('sudo'); out = cmdSudo(arg); break
    case 'ask': useOS.getState().unlock('ask'); out = arg.trim() ? md(answer(arg)) : '<span class="text-outline">usage: ask &lt;question&gt; — e.g. <span class="text-primary-fixed-dim">ask what is your stack</span></span>'; break
    case 'hire': case 'hire-me': out = cmdSudo('hire-me'); break
    case 'theme': out = cmdTheme(ctx, arg); break
    case 'font': out = cmdFont(ctx, arg); break
    case 'settings': case 'config': ctx.os.setView('settings'); out = '<span class="text-primary-fixed-dim">opening settings…</span>'; break
    case 'blog': ctx.os.setView('blog'); out = '<span class="text-primary-fixed-dim">opening blog… (or <span class="text-tertiary-fixed-dim">ls blog</span> · <span class="text-tertiary-fixed-dim">cat blog/&lt;slug&gt;</span>)</span>'; break
    case 'reset': ctx.os.resetSettings(); out = '<span class="text-primary-fixed-dim">settings reset to defaults.</span>'; break
    case 'tree': out = treeStr(); break
    case 'git': out = arg.trim().toLowerCase().startsWith('log') ? gitLog() : 'usage: git log'; break
    case 'fortune': out = fortune(); break
    case 'cowsay': out = cowsay(arg); break
    case 'gh': case 'github': out = cmdGh(arg.trim().toLowerCase()); break
    case 'cmatrix': ctx.startScreensaver(); out = '<span class="text-outline">entering the matrix… Esc / click to exit.</span>'; break
    case 'hack': case 'matrix': out = '<span class="text-primary-fixed-dim">breaching… ' + '10'.repeat(18) + ' ACCESS GRANTED. (kidding 😀) — try <span class="text-tertiary-fixed-dim">cmatrix</span></span>'; break
    case 'exit': case 'logout': out = '<span class="text-outline">There is no escape from itspyguru OS. Try the START menu instead.</span>'; break
    default: {
      const gid = cmd === 'ttt' ? 'tictactoe' : cmd === 'mario' ? 'platformer' : cmd
      if (GAME_BY_ID[gid]) { ctx.launchGame(gid); out = '<span class="text-outline">launching ' + GAME_BY_ID[gid].label + '…</span>' }
      else out = `<span class="text-error">command not found: ${esc(cmd)}</span> — type <span class="text-primary-fixed-dim">help</span>`
    }
  }
  if (out != null) ctx.write(out)
}

function promptEcho(ctx: TermCtx, input: string): string {
  return `<span class="text-primary-fixed-dim">itspyguru@os</span><span class="text-outline">:</span><span class="text-tertiary-fixed-dim">${'~' + (ctx.cwd.length ? '/' + ctx.cwd.join('/') : '')}</span><span class="text-outline">$</span> <span class="text-on-surface">${esc(input)}</span>`
}

export function autocomplete(ctx: TermCtx, value: string): { fill?: string; list?: string } {
  const t = value
  const m = t.match(/^(cd|cat|ls|open)\s+(.*)$/i)
  if (m) {
    const c = m[1]; const frag = m[2]
    let dir = '', leaf = frag
    if (frag.includes('/')) { dir = frag.slice(0, frag.lastIndexOf('/') + 1); leaf = frag.slice(frag.lastIndexOf('/') + 1) }
    const dn = nodeAt(resolveSegs(dir || '.', ctx.cwd)) || nodeAt(ctx.cwd) || ROOT_VFS
    let kids = dn.children || []
    if (c.toLowerCase() === 'cd') kids = kids.filter((x) => x.type === 'dir')
    const names = kids.map((x) => x.name + (x.type === 'dir' ? '/' : '')).filter((n) => n.toLowerCase().startsWith(leaf.toLowerCase()))
    if (names.length === 1) return { fill: c + ' ' + dir + names[0] }
    if (names.length > 1) return { list: names.join('   ') }
    return {}
  }
  const cmds = ['help', 'cd ', 'ls', 'cat ', 'open ', 'pwd', 'tree', 'whoami', 'whois', 'neofetch', 'theme ', 'font ', 'settings', 'reset', 'git log', 'fortune', 'cowsay ', 'gh', 'download resume', 'clear', 'history', 'man ', ...GAMES.map((g) => g.id)]
  const matches = cmds.filter((c) => c.startsWith(t.trim().toLowerCase()))
  if (matches.length === 1) return { fill: matches[0] }
  if (matches.length > 1) return { list: matches.join('   ') }
  return {}
}
