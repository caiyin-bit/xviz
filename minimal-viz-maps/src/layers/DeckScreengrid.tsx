// DeckGL Screengrid — ScreenGridLayer. Pixel-grid aggregation that
// stays at fixed resolution regardless of zoom.

import { useMemo } from 'react'
import { ScreenGridLayer } from '@deck.gl/aggregation-layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { DEFAULT_HEAT_RAMP, makePositionAccessor, makeWeightAccessor, rampFromHexes } from '../common/aggregation'
import type { DeckScreengridFormData } from '../types'

export function DeckScreengrid(props: ChartProps<DeckScreengridFormData>) {
  const { formData, queriesData, width, height } = props
  const { longitudeColumn, latitudeColumn, metric, cellSizePixels = 50, colorRange, initialView, mapStyle } = formData
  const rows = queriesData[0]?.data ?? []

  const ramp = useMemo<[number, number, number][]>(
    () => (colorRange?.length ? rampFromHexes(colorRange) : DEFAULT_HEAT_RAMP),
    [colorRange],
  )

  const view = useMemo(
    () => initialView ?? computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  const layers = useMemo(() => [
    new ScreenGridLayer({
      id: 'deck-screengrid',
      data: rows,
      cellSizePixels,
      colorRange: ramp,
      getPosition: makePositionAccessor(longitudeColumn, latitudeColumn),
      getWeight: makeWeightAccessor(metric),
      gpuAggregation: false,
      pickable: false,
    }),
  ], [rows, longitudeColumn, latitudeColumn, metric, cellSizePixels, ramp])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
