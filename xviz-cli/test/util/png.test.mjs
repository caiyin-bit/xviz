import { describe, it, expect } from 'vitest'
import { readPngSize } from './png.mjs'

// Hand-crafted minimal PNG header: signature + IHDR chunk header + 4x3 size.
function fakePng(width, height) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrLen = Buffer.alloc(4)
  ihdrLen.writeUInt32BE(13)
  const ihdrType = Buffer.from('IHDR', 'ascii')
  const w = Buffer.alloc(4); w.writeUInt32BE(width)
  const h = Buffer.alloc(4); h.writeUInt32BE(height)
  // Remaining 5 bytes of IHDR data + 4 bytes CRC — values don't matter for our parser.
  const tail = Buffer.alloc(9)
  return Buffer.concat([sig, ihdrLen, ihdrType, w, h, tail])
}

describe('readPngSize', () => {
  it('reads width and height from a valid PNG header', () => {
    expect(readPngSize(fakePng(800, 500))).toEqual({ width: 800, height: 500 })
    expect(readPngSize(fakePng(1, 1))).toEqual({ width: 1, height: 1 })
  })

  it('rejects non-Buffer input', () => {
    expect(() => readPngSize('not a buffer')).toThrow(/expected Buffer/)
  })

  it('rejects buffers that are too short', () => {
    expect(() => readPngSize(Buffer.alloc(10))).toThrow(/too short/)
  })

  it('rejects buffers without PNG signature', () => {
    const bad = Buffer.alloc(30)
    expect(() => readPngSize(bad)).toThrow(/signature mismatch/)
  })
})
