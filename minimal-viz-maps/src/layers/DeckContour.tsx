// DeckGL Contour — ContourLayer. Generates iso-contours from point density.

import { useMemo } from 'react'
import { ContourLayer } from '@deck.gl/aggregation-layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { makePositionAccessor, makeWeightAccessor } from '../common/aggregation'
import type { DeckContourFormData } from '../types'

const DEFAULT_CONTOURS: { threshold: number; color: [number, number, number, number?] }[] = [
  { threshold: 1, color: [255, 255, 178, 200] },
  { threshold: 5, color: [254, 178, 76, 200] },
  { threshold: 10, color: [253, 141, 60, 200] },
  { threshold: 25, color: [240, 59, 32, 200] },
  { threshold: 100, color: [189, 0, 38, 200] },
]

export function DeckContour(props: ChartProps<DeckContourFormData>) {
  const { formData, queriesData, width, height } = props
  const { longitudeColumn, latitudeColumn, metric, cellSize = 5000, contours, initialView, mapStyle } = formData
  const rows = queriesData[0]?.data ?? []

  const view = useMemo(
    () => initialView ?? computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  const layers = useMemo(() => [
    new ContourLayer({
      id: 'deck-contour',
      data: rows,
      cellSize,
      contours: (contours ?? DEFAULT_CONTOURS) as never,
      getPosition: makePositionAccessor(longitudeColumn, latitudeColumn),
      getWeight: makeWeightAccessor(metric),
      gpuAggregation: false,
      pickable: false,
    }),
  ], [rows, longitudeColumn, latitudeColumn, metric, cellSize, contours])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
