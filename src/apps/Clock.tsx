import { useEffect, useRef, useState } from 'react'

export default function Clock() {
  const [now, setNow] = useState(new Date())
  const [sw, setSw] = useState(0)
  const [running, setRunning] = useState(false)
  const swRef = useRef<ReturnType<typeof setInterval>>()
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (running) { const start = Date.now() - sw; swRef.current = setInterval(() => setSw(Date.now() - start), 50) }
    return () => clearInterval(swRef.current)
  }, [running])
  const p = (x: number) => x.toString().padStart(2, '0')
  const cs = Math.floor((sw % 1000) / 10)
  return (
    <div className="p-5 w-[280px] text-center">
      <div className="text-4xl font-display-lg text-primary-fixed-dim matrix-glow">{p(now.getHours())}:{p(now.getMinutes())}:{p(now.getSeconds())}</div>
      <div className="text-[10px] text-outline font-data-label mt-1">{now.toDateString()}</div>
      <div className="mt-5 border-t border-outline-variant/30 pt-4">
        <div className="text-[9px] text-outline font-data-label mb-1">STOPWATCH</div>
        <div className="text-2xl font-terminal-bold text-primary">{p(Math.floor(sw / 60000))}:{p(Math.floor(sw / 1000) % 60)}.{p(cs)}</div>
        <div className="flex gap-2 mt-3 justify-center">
          <button onClick={() => setRunning((r) => !r)} className="border border-primary-fixed-dim/40 px-4 py-1.5 text-[11px] font-data-label text-primary-fixed-dim hover:bg-primary-fixed-dim/10">{running ? 'STOP' : 'START'}</button>
          <button onClick={() => { setRunning(false); setSw(0) }} className="border border-outline-variant/30 px-4 py-1.5 text-[11px] font-data-label text-outline hover:text-primary-fixed">RESET</button>
        </div>
      </div>
    </div>
  )
}
