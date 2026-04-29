// DeckGL Scatter — ScatterplotLayer.
// Reference implementation for the maps satellite package. Mirror this
// pattern for the other 12 chart types.

import { useMemo } from 'react'
import { ScatterplotLayer } from '@deck.gl/layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import type { DeckScatterFormData } from '../types'

const DEFAULT_PALETTE: [number, number, number][] = [
  [31, 168, 201],   // teal
  [69, 78, 124],    // navy
  [90, 193, 137],   // green
  [255, 127, 68],   // orange
  [102, 102, 102],  // gray
]

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const v = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
}

export function DeckScatter(props: ChartProps<DeckScatterFormData>) {
  const { formData, queriesData, width, height } = props
  const {
    longitudeColumn,
    latitudeColumn,
    metric,
    radiusColumn,
    colorColumn,
    radius = 50,
    opacity = 0.6,
    initialView,
    mapStyle,
    colorScheme,
  } = formData

  const rows = queriesData[0]?.data ?? []

  const palette: [number, number, number][] = useMemo(
    () => (colorScheme?.length ? colorScheme.map(hexToRgb) : DEFAULT_PALETTE),
    [colorScheme],
  )

  // Stable color-by-category mapping.
  const colorOf = useMemo(() => {
    const assigned = new Map<string, [number, number, number]>()
    let next = 0
    return (key: string): [number, number, number] => {
      const hit = assigned.get(key)
      if (hit) return hit
      const c = palette[next % palette.length]
      assigned.set(key, c)
      next += 1
      return c
    }
  }, [palette])

  const view = useMemo(
    () =>
      initialView ??
      computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  const layers = useMemo(() => {
    const scatter = new ScatterplotLayer({
      id: 'deck-scatter',
      data: rows,
      getPosition: (d: Record<string, unknown>) => [
        Number(d[longitudeColumn] ?? 0),
        Number(d[latitudeColumn] ?? 0),
      ],
      getRadius: radiusColumn
        ? (d: Record<string, unknown>) => Number(d[radiusColumn] ?? radius)
        : metric
          ? (d: Record<string, unknown>) => Number(d[metric] ?? radius)
          : radius,
      getFillColor: colorColumn
        ? (d: Record<string, unknown>) => {
            const [r, g, b] = colorOf(String(d[colorColumn] ?? ''))
            return [r, g, b, Math.round(opacity * 255)]
          }
        : ([palette[0][0], palette[0][1], palette[0][2], Math.round(opacity * 255)] as [number, number, number, number]),
      radiusUnits: 'meters',
      radiusMinPixels: 2,
      radiusMaxPixels: 200,
      pickable: false,
      stroked: false,
    })
    return [scatter]
  }, [rows, longitudeColumn, latitudeColumn, metric, radiusColumn, colorColumn, radius, opacity, colorOf, palette])

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
