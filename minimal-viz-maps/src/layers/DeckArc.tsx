// DeckGL Arc — ArcLayer. Each row defines an origin → destination arc.
// Useful for migration patterns, flight routes, money flows.

import { useMemo } from 'react'
import { ArcLayer } from '@deck.gl/layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import type { DeckArcFormData } from '../types'

export function DeckArc(props: ChartProps<DeckArcFormData>) {
  const { formData, queriesData, width, height } = props
  const {
    sourceLonColumn,
    sourceLatColumn,
    targetLonColumn,
    targetLatColumn,
    metricColumn,
    sourceColor = [31, 168, 201, 200],
    targetColor = [255, 127, 68, 200],
    initialView,
    mapStyle,
    longitudeColumn,
    latitudeColumn,
  } = formData

  const rows = queriesData[0]?.data ?? []

  const view = useMemo(() => {
    if (initialView) return initialView
    // Use both endpoints to bound the viewport.
    const flat: { [k: string]: number }[] = []
    for (const r of rows) {
      const sLon = Number(r[sourceLonColumn] ?? NaN)
      const sLat = Number(r[sourceLatColumn] ?? NaN)
      const tLon = Number(r[targetLonColumn] ?? NaN)
      const tLat = Number(r[targetLatColumn] ?? NaN)
      if (Number.isFinite(sLon) && Number.isFinite(sLat)) {
        flat.push({ [longitudeColumn]: sLon, [latitudeColumn]: sLat })
      }
      if (Number.isFinite(tLon) && Number.isFinite(tLat)) {
        flat.push({ [longitudeColumn]: tLon, [latitudeColumn]: tLat })
      }
    }
    return computeViewport(flat, longitudeColumn, latitudeColumn, width, height)
  }, [initialView, rows, sourceLonColumn, sourceLatColumn, targetLonColumn, targetLatColumn, longitudeColumn, latitudeColumn, width, height])

  const layers = useMemo(() => {
    const arc = new ArcLayer({
      id: 'deck-arc',
      data: rows,
      getSourcePosition: (d: Record<string, unknown>) => [Number(d[sourceLonColumn] ?? 0), Number(d[sourceLatColumn] ?? 0)],
      getTargetPosition: (d: Record<string, unknown>) => [Number(d[targetLonColumn] ?? 0), Number(d[targetLatColumn] ?? 0)],
      getSourceColor: sourceColor as [number, number, number, number],
      getTargetColor: targetColor as [number, number, number, number],
      getWidth: metricColumn
        ? (d: Record<string, unknown>) => Math.max(1, Number(d[metricColumn] ?? 1))
        : 2,
      widthUnits: 'pixels',
      widthMinPixels: 1,
      pickable: false,
    })
    return [arc]
  }, [rows, sourceLonColumn, sourceLatColumn, targetLonColumn, targetLatColumn, metricColumn, sourceColor, targetColor])

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
