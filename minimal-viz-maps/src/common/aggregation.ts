// Shared helpers for the aggregation-layer charts (Grid, Hex, Heatmap,
// Screengrid, Contour). All five share the lon/lat/optional-weight data
// shape and benefit from the same hex-color → RGB ramp and weight accessor.

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const v = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
}

/** A 6-stop teal → red ramp, suitable for Heatmap/Screengrid colorRange. */
export const DEFAULT_HEAT_RAMP: [number, number, number][] = [
  [255, 255, 178],
  [254, 217, 118],
  [254, 178, 76],
  [253, 141, 60],
  [240, 59, 32],
  [189, 0, 38],
]

export function rampFromHexes(hexes: string[]): [number, number, number][] {
  return hexes.map(hexToRgb)
}

/** Weight accessor: looks up a per-point metric or returns 1. */
export function makeWeightAccessor(metric: string | undefined): (d: Record<string, unknown>) => number {
  if (!metric) return () => 1
  return (d: Record<string, unknown>) => {
    const v = Number(d[metric] ?? 1)
    return Number.isFinite(v) ? v : 1
  }
}

export function makePositionAccessor(
  lonCol: string,
  latCol: string,
): (d: Record<string, unknown>) => [number, number] {
  return (d) => [Number(d[lonCol] ?? 0), Number(d[latCol] ?? 0)]
}
