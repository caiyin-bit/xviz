// DeckGL Polygon — PolygonLayer. Each row carries a polygon ring (array
// of [lon, lat] tuples or array-of-rings). Color encodes a metric.

import { useMemo } from 'react'
import { PolygonLayer } from '@deck.gl/layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import type { DeckPolygonFormData } from '../types'

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const v = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const c = Math.max(0, Math.min(1, t))
  return [
    Math.round(a[0] + (b[0] - a[0]) * c),
    Math.round(a[1] + (b[1] - a[1]) * c),
    Math.round(a[2] + (b[2] - a[2]) * c),
  ]
}

export function DeckPolygon(props: ChartProps<DeckPolygonFormData>) {
  const { formData, queriesData, width, height } = props
  const {
    longitudeColumn,
    latitudeColumn,
    polygonColumn,
    metric,
    colorRange,
    stroked = true,
    filled = true,
    initialView,
    mapStyle,
  } = formData

  const rows = queriesData[0]?.data ?? []

  const [low, high] = useMemo<[
    [number, number, number],
    [number, number, number],
  ]>(
    () => [
      hexToRgb(colorRange?.[0] ?? '#e8f5f5'),
      hexToRgb(colorRange?.[1] ?? '#1FA8C9'),
    ],
    [colorRange],
  )

  const { minV, maxV } = useMemo(() => {
    if (!metric) return { minV: 0, maxV: 1 }
    let mn = Infinity
    let mx = -Infinity
    for (const r of rows) {
      const v = Number(r[metric] ?? NaN)
      if (Number.isFinite(v)) {
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
    }
    if (!Number.isFinite(mn)) return { minV: 0, maxV: 1 }
    if (mn === mx) return { minV: mn, maxV: mn + 1 }
    return { minV: mn, maxV: mx }
  }, [rows, metric])

  const view = useMemo(() => {
    if (initialView) return initialView
    // Flatten the polygon coords to feed computeViewport.
    const flat: { [k: string]: number }[] = []
    for (const r of rows) {
      const polys = r[polygonColumn]
      const rings: unknown[] = Array.isArray(polys) && Array.isArray(polys[0]) && Array.isArray(polys[0][0]) ? polys : [polys]
      for (const ring of rings) {
        if (!Array.isArray(ring)) continue
        for (const pt of ring) {
          if (Array.isArray(pt) && pt.length >= 2) {
            flat.push({ [longitudeColumn]: Number(pt[0]), [latitudeColumn]: Number(pt[1]) })
          }
        }
      }
    }
    return computeViewport(flat, longitudeColumn, latitudeColumn, width, height)
  }, [initialView, rows, polygonColumn, longitudeColumn, latitudeColumn, width, height])

  const layers = useMemo(() => {
    const polygon = new PolygonLayer({
      id: 'deck-polygon',
      data: rows,
      getPolygon: (d: Record<string, unknown>) => d[polygonColumn] as number[][],
      getFillColor: metric
        ? (d: Record<string, unknown>) => {
            const v = Number(d[metric] ?? minV)
            const t = (v - minV) / (maxV - minV)
            const [r, g, b] = lerpColor(low, high, t)
            return [r, g, b, 180]
          }
        : ([low[0], low[1], low[2], 180] as [number, number, number, number]),
      getLineColor: [60, 60, 60, 200],
      getLineWidth: 1,
      stroked,
      filled,
      lineWidthUnits: 'pixels',
      pickable: false,
    })
    return [polygon]
  }, [rows, polygonColumn, metric, minV, maxV, low, high, stroked, filled])

  return (
    <MapContainer
      width={width}
      height={height}
      layers={layers}
      initialView={view}
      mapStyle={mapStyle}
    />
  )
}
