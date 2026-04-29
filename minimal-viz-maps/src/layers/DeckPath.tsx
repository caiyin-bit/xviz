// DeckGL Path — PathLayer. Each row carries an array of [lon, lat] tuples
// (a polyline). Useful for routes, trajectories, GPS traces.

import { useMemo } from 'react'
import { PathLayer } from '@deck.gl/layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import type { DeckPathFormData } from '../types'

const DEFAULT_PALETTE: [number, number, number][] = [
  [31, 168, 201],
  [69, 78, 124],
  [90, 193, 137],
  [255, 127, 68],
  [102, 102, 102],
]

export function DeckPath(props: ChartProps<DeckPathFormData>) {
  const { formData, queriesData, width, height } = props
  const {
    longitudeColumn,
    latitudeColumn,
    pathColumn,
    metricColumn,
    colorColumn,
    lineWidth = 3,
    opacity = 0.7,
    initialView,
    mapStyle,
  } = formData

  const rows = queriesData[0]?.data ?? []

  const colorOf = useMemo(() => {
    const assigned = new Map<string, [number, number, number]>()
    let next = 0
    return (key: string): [number, number, number] => {
      const hit = assigned.get(key)
      if (hit) return hit
      const c = DEFAULT_PALETTE[next % DEFAULT_PALETTE.length]
      assigned.set(key, c)
      next += 1
      return c
    }
  }, [])

  // For viewport fit, flatten path coords. Falls back to the longitude/
  // latitude columns when present (some users carry a representative
  // single point alongside the path for indexing).
  const view = useMemo(() => {
    if (initialView) return initialView
    const flat: { [k: string]: number }[] = []
    for (const r of rows) {
      const path = r[pathColumn]
      if (Array.isArray(path)) {
        for (const pt of path) {
          if (Array.isArray(pt) && pt.length >= 2) {
            flat.push({ [longitudeColumn]: Number(pt[0]), [latitudeColumn]: Number(pt[1]) })
          }
        }
      }
    }
    return computeViewport(flat, longitudeColumn, latitudeColumn, width, height)
  }, [initialView, rows, pathColumn, longitudeColumn, latitudeColumn, width, height])

  const layers = useMemo(() => {
    const path = new PathLayer({
      id: 'deck-path',
      data: rows,
      getPath: (d: Record<string, unknown>) => d[pathColumn] as [number, number][],
      getColor: colorColumn
        ? (d: Record<string, unknown>) => {
            const [r, g, b] = colorOf(String(d[colorColumn] ?? ''))
            return [r, g, b, Math.round(opacity * 255)]
          }
        : ([DEFAULT_PALETTE[0][0], DEFAULT_PALETTE[0][1], DEFAULT_PALETTE[0][2], Math.round(opacity * 255)] as [number, number, number, number]),
      getWidth: metricColumn
        ? (d: Record<string, unknown>) => Number(d[metricColumn] ?? lineWidth)
        : lineWidth,
      widthUnits: 'pixels',
      widthMinPixels: 1,
      pickable: false,
    })
    return [path]
  }, [rows, pathColumn, metricColumn, colorColumn, lineWidth, opacity, colorOf])

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
