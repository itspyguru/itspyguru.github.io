const KEY = 'itspyguru_scores'
type Scores = Record<string, number>

function all(): Scores { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
export function getBest(id: string): number { return all()[id] || 0 }
// records score if it beats the stored best; returns the current best
export function setBest(id: string, score: number): number {
  const s = all(), best = Math.max(s[id] || 0, score)
  s[id] = best
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
  return best
}
