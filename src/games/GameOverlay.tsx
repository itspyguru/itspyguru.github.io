import { useEffect } from 'react'
import { useOS } from '../store/os'
import Snake from './Snake'
import Game2048 from './Game2048'
import Pong from './Pong'
import TicTacToe from './TicTacToe'
import Typing from './Typing'
import Guess from './Guess'
import Tetris from './Tetris'
import BubbleShooter from './BubbleShooter'
import SpaceImpact from './SpaceImpact'
import Platformer from './Platformer'
import Racing from './Racing'
import Minesweeper from './Minesweeper'
import Breakout from './Breakout'
import Flappy from './Flappy'

const MAP: Record<string, React.FC> = {
  snake: Snake, '2048': Game2048, pong: Pong, tictactoe: TicTacToe, typing: Typing, guess: Guess,
  tetris: Tetris, bubble: BubbleShooter, spaceimpact: SpaceImpact, platformer: Platformer, racing: Racing,
  minesweeper: Minesweeper, breakout: Breakout, flappy: Flappy,
}

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
