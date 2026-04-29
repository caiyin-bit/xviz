// Cartodiagram — pin a small chart per geographic point. Phase-2 ships
// a simplified version: each row becomes a sized donut (pie) marker
// driven by a single `metric` (or all numeric `valueColumns`). Full
// per-point ECharts integration is deferred — the marker is rendered
// directly by deck.gl's IconLayer + a runtime canvas atlas.
//
// The IconLayer route avoids paying the cost of mounting N React/ECharts
// trees and works inside the headless puppeteer renderer that the rest
// of xviz uses.

import { useMemo } from 'react'
import { IconLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import type { CartodiagramFormData } from '../types'

interface CartoMarker {
  position: [number, number]
  values: number[]
  total: number
}

const DEFAULT_PALETTE: string[] = [
  '#1FA8C9', '#454E7C', '#5AC189', '#FF7F44', '#666666',
  '#E04355', '#FCC700', '#A868B7', '#3CCCCB', '#A38F79',
]

function donutDataUrl(values: number[], palette: string[], size: number): string {
  // Build a canvas-rendered donut PNG and return as a data URL. deck.gl's
  // IconLayer accepts a `getIcon` function that returns descriptors with
  // `url` — so each marker can have its own slice composition.
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) {
    // SSR / test fallback: 1×1 transparent png.
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
  }
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL()
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 2
  const total = values.reduce((a, b) => a + b, 0) || 1
  let start = -Math.PI / 2
  values.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, start, start + slice)
    ctx.closePath()
    ctx.fillStyle = palette[i % palette.length]
    ctx.fill()
    start += slice
  })
  // White inner hole — donut, not pie. Improves visibility against tiles.
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()
  return canvas.toDataURL()
}

export function Cartodiagram(props: ChartProps<CartodiagramFormData>) {
  const { formData, queriesData, width, height } = props
  const { longitudeColumn, latitudeColumn, sublayer, initialView, mapStyle } = formData
  const rows = queriesData[0]?.data ?? []

  // Sublayer config. Pull `valueColumns` if provided, otherwise fall back
  // to a single `metric` field. Both come through as untyped formData,
  // so be defensive about shapes.
  const { valueColumns, palette, baseSize } = useMemo(() => {
    const cols = (sublayer.valueColumns as string[] | undefined) ?? (
      sublayer.metric ? [String(sublayer.metric)] : []
    )
    const pal = (sublayer.colorScheme as string[] | undefined) ?? DEFAULT_PALETTE
    const size = Number(sublayer.size ?? 48)
    return { valueColumns: cols, palette: pal, baseSize: size }
  }, [sublayer])

  const markers = useMemo<CartoMarker[]>(() => {
    const out: CartoMarker[] = []
    for (const r of rows) {
      const lon = Number(r[longitudeColumn] ?? NaN)
      const lat = Number(r[latitudeColumn] ?? NaN)
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      const values = valueColumns.map((c) => {
        const v = Number(r[c] ?? 0)
        return Number.isFinite(v) ? v : 0
      })
      const total = values.reduce((a, b) => a + b, 0)
      if (values.length === 0 || total === 0) {
        // Still emit a placeholder dot so the row is visible.
        out.push({ position: [lon, lat], values: [1], total: 1 })
      } else {
        out.push({ position: [lon, lat], values, total })
      }
    }
    return out
  }, [rows, longitudeColumn, latitudeColumn, valueColumns])

  const view = useMemo(
    () => initialView ?? computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  // Pre-render each marker's donut PNG. Markers with identical value
  // composition share the same data URL via a key cache.
  const iconCache = useMemo(() => {
    const cache = new Map<string, string>()
    for (const m of markers) {
      const key = m.values.join(',')
      if (!cache.has(key)) cache.set(key, donutDataUrl(m.values, palette, 64))
    }
    return cache
  }, [markers, palette])

  const layers = useMemo<Layer[]>(() => {
    const sizeFor = (m: CartoMarker) => {
      // Size by total magnitude relative to dataset max. Floor at 50%.
      let max = 0
      for (const x of markers) if (x.total > max) max = x.total
      const t = max > 0 ? m.total / max : 1
      return baseSize * (0.5 + 0.5 * t)
    }

    const icons = new IconLayer<CartoMarker>({
      id: 'cartodiagram-icons',
      data: markers,
      getPosition: (m) => m.position,
      getIcon: (m) => ({
        url: iconCache.get(m.values.join(',')) ?? '',
        width: 64,
        height: 64,
        anchorX: 32,
        anchorY: 32,
        mask: false,
      }),
      getSize: sizeFor,
      sizeUnits: 'pixels',
      pickable: false,
    })

    // Tiny dot at the geographic anchor so the position is unambiguous
    // when the donut is small.
    const anchors = new ScatterplotLayer<CartoMarker>({
      id: 'cartodiagram-anchors',
      data: markers,
      getPosition: (m) => m.position,
      getFillColor: [40, 40, 40, 220],
      getRadius: 2,
      radiusUnits: 'pixels',
      pickable: false,
    })

    return [anchors, icons]
  }, [markers, iconCache, baseSize])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
