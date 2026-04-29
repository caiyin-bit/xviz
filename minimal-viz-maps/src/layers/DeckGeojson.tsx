// DeckGL Geojson — GeoJsonLayer. Renders a GeoJSON FeatureCollection
// directly. Optional metric drives feature fill via property lookup.

import { useMemo } from 'react'
import { GeoJsonLayer } from '@deck.gl/layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import type { DeckGeojsonFormData } from '../types'

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const v = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
}

export function DeckGeojson(props: ChartProps<DeckGeojsonFormData>) {
  const { formData, queriesData, width, height } = props
  const {
    geojson,
    metric,
    colorRange,
    initialView,
    mapStyle,
    longitudeColumn,
    latitudeColumn,
  } = formData

  // Use queriesData rows to override per-feature metric values when present;
  // otherwise read directly from feature.properties.
  const rows = queriesData[0]?.data ?? []
  const valueByName = useMemo(() => {
    if (!metric || rows.length === 0) return null
    const map = new Map<string, number>()
    for (const r of rows) {
      const k = String(r['name'] ?? r['id'] ?? '')
      const v = Number(r[metric] ?? NaN)
      if (k && Number.isFinite(v)) map.set(k, v)
    }
    return map
  }, [rows, metric])

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
    let mn = Infinity
    let mx = -Infinity
    if (valueByName) {
      for (const v of valueByName.values()) {
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
    } else if (metric && Array.isArray(geojson.features)) {
      for (const f of geojson.features) {
        const v = Number((f as { properties?: Record<string, unknown> }).properties?.[metric] ?? NaN)
        if (Number.isFinite(v)) {
          if (v < mn) mn = v
          if (v > mx) mx = v
        }
      }
    }
    if (!Number.isFinite(mn)) return { minV: 0, maxV: 1 }
    if (mn === mx) return { minV: mn, maxV: mn + 1 }
    return { minV: mn, maxV: mx }
  }, [valueByName, geojson, metric])

  const view = useMemo(() => {
    if (initialView) return initialView
    // Centroid extent of features. For simplicity, scan feature[0]
    // coordinates flat list.
    const flat: { [k: string]: number }[] = []
    if (Array.isArray(geojson.features)) {
      for (const f of geojson.features) {
        const geom = (f as { geometry?: { type?: string; coordinates?: unknown } }).geometry
        const coords = geom?.coordinates
        // Walk arbitrarily-nested coords to collect [lon, lat] pairs.
        const visit = (x: unknown) => {
          if (!Array.isArray(x)) return
          if (typeof x[0] === 'number' && typeof x[1] === 'number') {
            flat.push({ [longitudeColumn]: x[0] as number, [latitudeColumn]: x[1] as number })
            return
          }
          for (const item of x) visit(item)
        }
        visit(coords)
      }
    }
    return computeViewport(flat, longitudeColumn, latitudeColumn, width, height)
  }, [initialView, geojson, longitudeColumn, latitudeColumn, width, height])

  const layers = useMemo(() => {
    const layer = new GeoJsonLayer({
      id: 'deck-geojson',
      data: geojson as never,
      stroked: true,
      filled: true,
      pointType: 'circle',
      getFillColor: metric
        ? (f: { properties?: Record<string, unknown> }) => {
            const name = String(f.properties?.['name'] ?? f.properties?.['id'] ?? '')
            const fromRows = valueByName?.get(name)
            const v = fromRows ?? Number(f.properties?.[metric] ?? minV)
            const t = (Number(v) - minV) / (maxV - minV)
            const [r, g, b] = [
              Math.round(low[0] + (high[0] - low[0]) * t),
              Math.round(low[1] + (high[1] - low[1]) * t),
              Math.round(low[2] + (high[2] - low[2]) * t),
            ]
            return [r, g, b, 180]
          }
        : ([low[0], low[1], low[2], 180] as [number, number, number, number]),
      getLineColor: [60, 60, 60, 200],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      pickable: false,
    })
    return [layer]
  }, [geojson, metric, valueByName, minV, maxV, low, high])

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
