// DeckGL Hex — HexagonLayer. Same idea as DeckGrid but with hexagonal cells.

import { useMemo } from 'react'
import { HexagonLayer } from '@deck.gl/aggregation-layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { hexToRgb, makePositionAccessor, makeWeightAccessor } from '../common/aggregation'
import type { DeckHexFormData } from '../types'

export function DeckHex(props: ChartProps<DeckHexFormData>) {
  const { formData, queriesData, width, height } = props
  const { longitudeColumn, latitudeColumn, metric, radius = 1000, elevationScale = 0, colorRange, initialView, mapStyle } = formData
  const rows = queriesData[0]?.data ?? []

  const ramp = useMemo<[number, number, number][]>(() => {
    if (colorRange) {
      const lo = hexToRgb(colorRange[0])
      const hi = hexToRgb(colorRange[1])
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
    new HexagonLayer({
      id: 'deck-hex',
      data: rows,
      radius,
      pickable: false,
      extruded: elevationScale > 0,
      elevationScale,
      colorRange: ramp,
      getPosition: makePositionAccessor(longitudeColumn, latitudeColumn),
      getColorWeight: makeWeightAccessor(metric),
      colorAggregation: 'SUM',
    }),
  ], [rows, longitudeColumn, latitudeColumn, metric, radius, elevationScale, ramp])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
