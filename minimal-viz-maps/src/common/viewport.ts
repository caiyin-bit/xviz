// Auto-fit viewport when the user doesn't supply `initialView`. We read
// the lon/lat columns from the data, find the bounds, and compute a
// (center, zoom) pair that fits with a small padding.

import type { ViewState } from '../types'

const FALLBACK_VIEW: ViewState = {
  longitude: 0,
  latitude: 20,
  zoom: 1,
}

export function computeViewport(
  rows: ReadonlyArray<Record<string, unknown>>,
  lonCol: string,
  latCol: string,
  width: number,
  // height retained for API symmetry with width / future aspect-ratio tweaks
  _height: number,
): ViewState {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  let n = 0
  for (const r of rows) {
    const lon = Number(r[lonCol] ?? NaN)
    const lat = Number(r[latCol] ?? NaN)
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    n += 1
  }
  if (n === 0) return FALLBACK_VIEW

  const centerLon = (minLon + maxLon) / 2
  const centerLat = (minLat + maxLat) / 2

  // Approximate zoom from longitudinal extent (Web Mercator-ish).
  // Each zoom level halves the visible degree range. Take the larger of
  // (lon range, lat range with cos-correction) and pick a zoom that
  // makes that range fit in 60% of the viewport for padding.
  const lonRange = Math.max(0.001, maxLon - minLon)
  const latRange = Math.max(0.001, (maxLat - minLat) * Math.cos((centerLat * Math.PI) / 180))
  const range = Math.max(lonRange, latRange)
  // 360 deg of longitude fits at zoom 0 in 256 px. Aim for 60% of width.
  const targetDeg = 360 / Math.pow(2, 1)
  const zoomForRange = Math.log2(targetDeg / range) + Math.log2((width || 800) / 512)

  return {
    longitude: centerLon,
    latitude: centerLat,
    zoom: Math.max(0, Math.min(18, zoomForRange)),
  }
}
