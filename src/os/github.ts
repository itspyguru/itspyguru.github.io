export interface GhRepo { name: string; desc: string; stars: number; lang: string | null; url: string }
export interface GhData { followers: number; public_repos: number; stars: number; topLangs: string[]; repos: GhRepo[] }

const USER = 'itspyguru', KEY = 'itspyguru_gh', TTL = 6 * 3600 * 1000
let cache: GhData | null = null

export function getGitHub(): GhData | null { return cache }

export async function fetchGitHub(): Promise<GhData | null> {
  if (cache) return cache
  try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && Date.now() - c.t < TTL) { cache = c.d; return cache } } catch {}
  try {
    const [u, r] = await Promise.all([
      fetch(`https://api.github.com/users/${USER}`).then((x) => { if (!x.ok) throw 0; return x.json() }),
      fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=100`).then((x) => { if (!x.ok) throw 0; return x.json() }),
    ])
    const repos = (Array.isArray(r) ? r : []).filter((x: any) => !x.fork)
    const stars = repos.reduce((a: number, x: any) => a + (x.stargazers_count || 0), 0)
    const langs: Record<string, number> = {}
    repos.forEach((x: any) => { if (x.language) langs[x.language] = (langs[x.language] || 0) + 1 })
    cache = {
      followers: u.followers, public_repos: u.public_repos, stars,
      topLangs: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]),
      repos: repos.sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 6)
        .map((x: any) => ({ name: x.name, desc: x.description, stars: x.stargazers_count, lang: x.language, url: x.html_url })),
    }
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: cache })) } catch {}
    return cache
  } catch { console.log('[gh] live stats unavailable — static fallback in use'); return null }
}
