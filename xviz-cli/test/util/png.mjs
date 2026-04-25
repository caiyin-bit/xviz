// PNG IHDR parser. Zero deps — reads width/height from the IHDR chunk.
// Reference: https://www.w3.org/TR/PNG/#11IHDR
//   bytes  0..7  = signature  (89 50 4E 47 0D 0A 1A 0A)
//   bytes  8..11 = IHDR length (always 13)
//   bytes 12..15 = "IHDR"
//   bytes 16..19 = width  (uint32 BE)
//   bytes 20..23 = height (uint32 BE)

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export function readPngSize(buf) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('readPngSize: expected Buffer')
  if (buf.length < 24) throw new Error(`readPngSize: too short (${buf.length} bytes)`)
  if (buf.compare(PNG_SIGNATURE, 0, 8, 0, 8) !== 0) {
    throw new Error('readPngSize: not a PNG (signature mismatch)')
  }
  if (buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('readPngSize: IHDR chunk not first')
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  }
}
