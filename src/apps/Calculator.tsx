import { useRef, useState } from 'react'

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
function evalExpr(expr: string): number {
  const out: number[] = [], ops: string[] = []
  const toks = expr.replace(/×/g, '*').replace(/÷/g, '/').match(/(\d+\.?\d*|[-+*/()])/g) || []
  const apply = (op: string) => { const b = out.pop()!, a = out.pop()!; out.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b) }
  for (const t of toks) {
    if (/\d/.test(t)) out.push(parseFloat(t))
    else if (t === '(') ops.push(t)
    else if (t === ')') { while (ops.length && ops[ops.length - 1] !== '(') apply(ops.pop()!); ops.pop() }
    else { while (ops.length && PREC[ops[ops.length - 1]] >= PREC[t]) apply(ops.pop()!); ops.push(t) }
  }
  while (ops.length) apply(ops.pop()!)
  return out.length ? out[0] : 0
}

const KEYS = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=']

export default function Calculator() {
  const [expr, setExpr] = useState('')
  const [out, setOut] = useState('0')
  const rootRef = useRef<HTMLDivElement>(null)
  function press(k: string) {
    if (k === 'C') { setExpr(''); setOut('0'); return }
    if (k === '=') { try { const r = evalExpr(expr); setOut(Number.isFinite(r) ? String(+r.toFixed(8)) : 'Error'); setExpr(String(+r.toFixed(8))) } catch { setOut('Error') } return }
    setExpr((e) => e + k)
  }
  // keyboard scoped to this window only (focus the panel) — never hijacks the rest of the OS
  function onKey(e: React.KeyboardEvent) {
    const k = e.key
    if (/[0-9+\-*/().]/.test(k)) { setExpr((x) => x + k.replace('*', '×').replace('/', '÷')); e.preventDefault() }
    else if (k === 'Enter' || k === '=') { press('='); e.preventDefault() }
    else if (k === 'Backspace') { setExpr((x) => x.slice(0, -1)); e.preventDefault() }
  }
  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKey} className="p-3 w-[260px] outline-none" onMouseEnter={() => rootRef.current?.focus()}>
      <div className="bg-black/40 border border-primary-fixed-dim/20 p-3 mb-3 text-right">
        <div className="text-[11px] text-outline font-data-label h-4 truncate">{expr || ' '}</div>
        <div className="text-2xl text-primary-fixed-dim font-terminal-bold truncate">{out}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {KEYS.map((k) => (
          <button key={k} onClick={() => press(k)} className={'py-2 text-sm font-data-label border transition-all ' + (k === '=' ? 'col-span-1 bg-primary-fixed-dim text-on-primary-fixed border-primary-fixed-dim' : 'border-outline-variant/30 text-primary hover:bg-primary-fixed-dim/10') + (k === 'C' ? ' text-error border-error/40' : '')}>{k}</button>
        ))}
      </div>
    </div>
  )
}
