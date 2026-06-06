import { useEffect, useRef, useState } from 'react'

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [shot, setShot] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) { setErr('Camera API not available in this browser.'); return }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => { if (cancelled) { s.getTracks().forEach((t) => t.stop()); return } streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}) } })
      .catch(() => setErr('Camera permission denied or unavailable.'))
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])

  function snap() {
    const v = videoRef.current; if (!v) return
    const c = document.createElement('canvas'); c.width = v.videoWidth || 320; c.height = v.videoHeight || 240
    const ctx = c.getContext('2d')!; ctx.drawImage(v, 0, 0, c.width, c.height)
    // subtle CRT scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < c.height; y += 3) ctx.fillRect(0, y, c.width, 1)
    setShot(c.toDataURL('image/png'))
  }

  return (
    <div className="p-3 w-[340px]">
      <div className="relative bg-black border border-primary-fixed-dim/30 aspect-video overflow-hidden flex items-center justify-center">
        {err ? <div className="text-data-label text-error p-4 text-center">{err}</div>
          : shot ? <img src={shot} alt="snap" className="w-full h-full object-cover" />
            : <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-30" />
      </div>
      <div className="flex gap-2 mt-3">
        {!err && !shot && <button onClick={snap} className="flex-1 bg-primary-fixed-dim text-on-primary-fixed py-2 text-[11px] font-data-label flex items-center justify-center gap-1"><span className="material-symbols-outlined text-sm">photo_camera</span> SNAP</button>}
        {shot && <>
          <a href={shot} download="itspyguru-os-photo.png" className="flex-1 bg-primary-fixed-dim text-on-primary-fixed py-2 text-[11px] font-data-label text-center flex items-center justify-center gap-1"><span className="material-symbols-outlined text-sm">download</span> SAVE</a>
          <button onClick={() => setShot(null)} className="flex-1 border border-outline-variant/30 py-2 text-[11px] font-data-label text-outline hover:text-primary-fixed">RETAKE</button>
        </>}
      </div>
      <p className="text-[9px] text-outline/70 font-data-label mt-2">Runs entirely in your browser — nothing is uploaded.</p>
    </div>
  )
}
