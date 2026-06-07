// Achievements — unlocked as visitors explore the OS. IDs are stable (used as localStorage keys);
// never rename an id once shipped. Triggers live in the store (src/store/os.ts) + a few call sites.
export interface Achievement { id: string; title: string; desc: string; icon: string }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'boot', title: 'System Online', desc: 'Boot the OS', icon: 'power_settings_new' },
  { id: 'terminal', title: 'Shell Access', desc: 'Open the terminal', icon: 'terminal' },
  { id: 'commands10', title: 'Script Kiddie', desc: 'Run 10 terminal commands', icon: 'keyboard' },
  { id: 'windows', title: 'Multitasker', desc: 'Open an app window', icon: 'web_asset' },
  { id: 'gamer', title: 'Player One', desc: 'Launch a game', icon: 'sports_esports' },
  { id: 'featured', title: 'High Roller', desc: 'Play a featured game', icon: 'stars' },
  { id: 'reader', title: 'Bookworm', desc: 'Open the blog', icon: 'article' },
  { id: 'ask', title: 'Curious', desc: 'Ask pyGuru a question', icon: 'neurology' },
  { id: 'contact', title: 'Transmission Sent', desc: 'Open the contact form', icon: 'forward_to_inbox' },
  { id: 'theme', title: 'Redecorator', desc: 'Change the accent theme', icon: 'palette' },
  { id: 'explorer', title: 'Sightseer', desc: 'Visit every section', icon: 'explore' },
  { id: 'matrix', title: 'Down the Rabbit Hole', desc: 'Enter the matrix', icon: 'grid_on' },
  { id: 'sudo', title: 'Nice Try', desc: 'Attempt sudo', icon: 'admin_panel_settings' },
  { id: 'trophies', title: 'Completionist', desc: 'Open the trophy cabinet', icon: 'military_tech' },
]
export const ACH_BY_ID: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
