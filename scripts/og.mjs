// Social share cards, rendered with zero dependencies.
//
// Link previews need a raster image (X/LinkedIn/WhatsApp won't render SVG), so
// this draws into a raw RGB buffer and encodes a PNG with Node's built-in zlib.
// Text uses the 5x7 pixel font in og-font.mjs, which suits the CRT theme better
// than a smoothed webfont would — and keeps the build free of native deps.
import { deflateSync } from 'node:zlib'
import { GLYPH_H, GLYPH_W, foldText, glyph } from './og-font.mjs'

export const W = 1200
export const H = 630

const BG = [0x0a, 0x0e, 0x0a]
const GRID = [0x13, 0x22, 0x16]
const ACCENT = [0x00, 0xff, 0x41]
const DIM = [0x2f, 0x7d, 0x45]
const TEXT = [0xe4, 0xff, 0xe8]

// ---------- canvas ----------
const canvas = () => ({ w: W, h: H, px: Buffer.alloc(W * H * 3) })

function fill(c, x0, y0, w, h, rgb) {
  const x1 = Math.min(c.w, x0 + w), y1 = Math.min(c.h, y0 + h)
  for (let y = Math.max(0, y0); y < y1; y++) {
    for (let x = Math.max(0, x0); x < x1; x++) {
      const i = (y * c.w + x) * 3
      c.px[i] = rgb[0]; c.px[i + 1] = rgb[1]; c.px[i + 2] = rgb[2]
    }
  }
}

// Darken whatever is already there — used for scanlines so they ride over art.
function shade(c, y0, h, factor) {
  for (let y = Math.max(0, y0); y < Math.min(c.h, y0 + h); y++) {
    for (let x = 0; x < c.w; x++) {
      const i = (y * c.w + x) * 3
      c.px[i] *= factor; c.px[i + 1] *= factor; c.px[i + 2] *= factor
    }
  }
}

const advance = (scale) => (GLYPH_W + 1) * scale
export const textWidth = (s, scale) => (s.length ? s.length * advance(scale) - scale : 0)

function drawText(c, text, x, y, scale, rgb) {
  let cx = x
  for (const ch of foldText(text)) {
    const rows = glyph(ch)
    for (let ry = 0; ry < GLYPH_H; ry++) {
      for (let rx = 0; rx < GLYPH_W; rx++) {
        if (rows[ry][rx] === '#') fill(c, cx + rx * scale, y + ry * scale, scale, scale, rgb)
      }
    }
    cx += advance(scale)
  }
}

// Greedy wrap; a single word longer than the line gets hard-split rather than overflow.
function wrap(text, scale, maxWidth) {
  const max = Math.max(1, Math.floor((maxWidth + scale) / advance(scale)))
  const lines = []
  let line = ''
  for (const word of foldText(text).split(/\s+/).filter(Boolean)) {
    let w = word
    while (w.length > max) {
      if (line) { lines.push(line); line = '' }
      lines.push(w.slice(0, max)); w = w.slice(max)
    }
    if (!line) line = w
    else if (line.length + 1 + w.length <= max) line += ' ' + w
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  return lines
}

// ---------- PNG ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(c) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(c.w, 0); ihdr.writeUInt32BE(c.h, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // colour type: truecolour RGB
  // 10-12: deflate / adaptive filtering / no interlace, all zero
  const stride = c.w * 3
  const raw = Buffer.alloc((stride + 1) * c.h)
  for (let y = 0; y < c.h; y++) {
    raw[y * (stride + 1)] = 0 // filter type: none
    c.px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- card ----------
export function renderCard({ title, meta, kicker = 'ITSPYGURU.GITHUB.IO', footer = 'PRAJJWAL PATHAK' }) {
  const c = canvas()
  fill(c, 0, 0, W, H, BG)

  for (let x = 0; x < W; x += 40) fill(c, x, 0, 1, H, GRID)
  for (let y = 0; y < H; y += 40) fill(c, 0, y, W, 1, GRID)

  // frame
  fill(c, 0, 0, W, 6, ACCENT)
  fill(c, 0, H - 6, W, 6, ACCENT)
  fill(c, 0, 0, 6, H, ACCENT)
  fill(c, W - 6, 0, 6, H, ACCENT)

  drawText(c, kicker, 64, 62, 3, DIM)

  // title block, with the accent bar sized to the wrapped text
  const scale = 6
  const lineH = GLYPH_H * scale + 22
  const lines = wrap(title, scale, W - 200)
  const blockH = lines.length * lineH - 22
  const top = Math.max(150, Math.round((H - blockH) / 2) - 10)
  fill(c, 64, top, 8, blockH, ACCENT)
  lines.forEach((line, i) => drawText(c, line, 104, top + i * lineH, scale, TEXT))

  if (meta) drawText(c, meta, 64, H - 108, 3, ACCENT)
  drawText(c, footer, W - 64 - textWidth(foldText(footer), 3), H - 108, 3, DIM)

  // CRT scanlines last so they sit over everything
  for (let y = 0; y < H; y += 3) shade(c, y, 1, 0.78)

  return encodePng(c)
}
