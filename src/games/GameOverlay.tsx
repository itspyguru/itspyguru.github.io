import { useEffect } from 'react'
import { useOS } from '../store/os'
import Snake from './Snake'
import Game2048 from './Game2048'
import Pong from './Pong'
import TicTacToe from './TicTacToe'

const MAP: Record<string, React.FC> = { snake: Snake, '2048': Game2048, pong: Pong, tictactoe: TicTacToe }

export default function GameOverlay() {
  const id = useOS((s) => s.activeGame)
  const setActiveGame = useOS((s) => s.setActiveGame)
  useEffect(() => {
    if (!id) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveGame(null) }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [id])
  if (!id || !MAP[id]) return null
  const G = MAP[id]
  return (
    <div className="ov flex flex-col items-center justify-center gap-3" style={{ zIndex: 340 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveGame(null) }}>
      <G />
      <button onClick={() => setActiveGame(null)} className="text-[10px] border border-outline-variant/40 px-3 py-1 text-outline hover:text-primary-fixed font-data-label">✕ close (Esc)</button>
    </div>
  )
}
