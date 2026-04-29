// DeckGL Heatmap — HeatmapLayer (GPU gaussian).

import { useMemo } from 'react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { DEFAULT_HEAT_RAMP, makePositionAccessor, makeWeightAccessor, rampFromHexes } from '../common/aggregation'
import type { DeckHeatmapFormData } from '../types'

export function DeckHeatmap(props: ChartProps<DeckHeatmapFormData>) {
  const { formData, queriesData, width, height } = props
  const { longitudeColumn, latitudeColumn, metric, radiusPixels = 30, intensity = 1, colorRange, initialView, mapStyle } = formData
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
    new HeatmapLayer({
      id: 'deck-heatmap',
      data: rows,
      radiusPixels,
      intensity,
      colorRange: ramp,
      getPosition: makePositionAccessor(longitudeColumn, latitudeColumn),
      getWeight: makeWeightAccessor(metric),
      pickable: false,
    }),
  ], [rows, longitudeColumn, latitudeColumn, metric, radiusPixels, intensity, ramp])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
