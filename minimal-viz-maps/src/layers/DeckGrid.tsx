// DeckGL Grid — GridLayer (CPU aggregation). Bins points into a regular
// grid and shades cells by aggregated metric.

import { useMemo } from 'react'
import { GridLayer } from '@deck.gl/aggregation-layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { hexToRgb, makePositionAccessor, makeWeightAccessor } from '../common/aggregation'
import type { DeckGridFormData } from '../types'

export function DeckGrid(props: ChartProps<DeckGridFormData>) {
  const { formData, queriesData, width, height } = props
  const { longitudeColumn, latitudeColumn, metric, cellSize = 1000, colorRange, initialView, mapStyle } = formData
  const rows = queriesData[0]?.data ?? []

  const ramp = useMemo<[number, number, number][]>(() => {
    if (colorRange) {
      const lo = hexToRgb(colorRange[0])
      const hi = hexToRgb(colorRange[1])
      // 6 evenly-spaced steps between low and high.
      return Array.from({ length: 6 }, (_, i) => {
        const t = i / 5
        return [
          Math.round(lo[0] + (hi[0] - lo[0]) * t),
          Math.round(lo[1] + (hi[1] - lo[1]) * t),
          Math.round(lo[2] + (hi[2] - lo[2]) * t),
        ]
      })
    }
    return [
      [255, 255, 178], [254, 217, 118], [254, 178, 76],
      [253, 141, 60], [240, 59, 32], [189, 0, 38],
    ]
  }, [colorRange])

  const view = useMemo(
    () => initialView ?? computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  const layers = useMemo(() => [
    new GridLayer({
      id: 'deck-grid',
      data: rows,
      cellSize,
      pickable: false,
      extruded: false,
      colorRange: ramp,
      getPosition: makePositionAccessor(longitudeColumn, latitudeColumn),
      getColorWeight: makeWeightAccessor(metric),
      colorAggregation: 'SUM',
    }),
  ], [rows, longitudeColumn, latitudeColumn, metric, cellSize, ramp])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
