import { useEffect, useState } from 'react'
import { fetchGitHub, getGitHub, GhData } from '../os/github'

export function useGitHub(): GhData | null {
  const [d, setD] = useState<GhData | null>(getGitHub())
  useEffect(() => { let m = true; fetchGitHub().then((x) => { if (m) setD(x) }); return () => { m = false } }, [])
  return d
}
