// DeckGL Multi — composes multiple deck.gl layers into a single map
// based on `formData.sublayers`. Each sublayer is dispatched by its
// `vizType` to the matching deck.gl Layer constructor. Useful for
// overlaying e.g. a choropleth + scatter + arc on one canvas.

import { useMemo } from 'react'
import { ScatterplotLayer, PathLayer, PolygonLayer, ArcLayer, GeoJsonLayer } from '@deck.gl/layers'
import { GridLayer, HexagonLayer, HeatmapLayer, ScreenGridLayer, ContourLayer } from '@deck.gl/aggregation-layers'
import type { Layer } from '@deck.gl/core'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { DEFAULT_HEAT_RAMP, hexToRgb, makePositionAccessor, makeWeightAccessor } from '../common/aggregation'
import type { DeckMultiFormData } from '../types'

type SubFD = { vizType: string; data?: unknown[] } & Record<string, unknown>

function buildSubLayer(sub: SubFD, idx: number, fallbackRows: Record<string, unknown>[]): Layer | null {
  const data = (Array.isArray(sub.data) ? sub.data : fallbackRows) as Record<string, unknown>[]
  const lon = String(sub.longitudeColumn ?? 'longitude')
  const lat = String(sub.latitudeColumn ?? 'latitude')
  const id = `multi-${sub.vizType}-${idx}`
  const getPosition = makePositionAccessor(lon, lat)
  const metric = sub.metric as string | undefined
  const getWeight = makeWeightAccessor(metric)

  switch (sub.vizType) {
    case 'deck-scatter':
      return new ScatterplotLayer({
        id,
        data,
        getPosition,
        getRadius: Number(sub.radius ?? 50),
        getFillColor: [31, 168, 201, 180],
        radiusUnits: 'meters',
        radiusMinPixels: 2,
        pickable: false,
      })
    case 'deck-path':
      return new PathLayer({
        id,
        data,
        getPath: (d: Record<string, unknown>) => d[String(sub.pathColumn ?? 'path')] as [number, number][],
        getColor: [31, 168, 201, 200],
        getWidth: Number(sub.lineWidth ?? 3),
        widthUnits: 'pixels',
        pickable: false,
      })
    case 'deck-polygon':
      return new PolygonLayer({
        id,
        data,
        getPolygon: (d: Record<string, unknown>) =>
          d[String(sub.polygonColumn ?? 'polygon')] as [number, number][],
        getFillColor: [31, 168, 201, 140],
        getLineColor: [60, 60, 60, 200],
        stroked: true,
        filled: true,
        pickable: false,
      })
    case 'deck-arc':
      return new ArcLayer({
        id,
        data,
        getSourcePosition: (d: Record<string, unknown>) => [
          Number(d[String(sub.sourceLonColumn)] ?? 0),
          Number(d[String(sub.sourceLatColumn)] ?? 0),
        ],
        getTargetPosition: (d: Record<string, unknown>) => [
          Number(d[String(sub.targetLonColumn)] ?? 0),
          Number(d[String(sub.targetLatColumn)] ?? 0),
        ],
        getSourceColor: [31, 168, 201, 200],
        getTargetColor: [255, 127, 68, 200],
        getWidth: 2,
        pickable: false,
      })
    case 'deck-geojson':
      return new GeoJsonLayer({
        id,
        data: sub.geojson as never,
        stroked: true,
        filled: true,
        getFillColor: [31, 168, 201, 140],
        getLineColor: [60, 60, 60, 200],
        lineWidthUnits: 'pixels',
        getLineWidth: 1,
        pickable: false,
      })
    case 'deck-grid':
      return new GridLayer({
        id,
        data,
        cellSize: Number(sub.cellSize ?? 1000),
        getPosition,
        getColorWeight: getWeight,
        colorAggregation: 'SUM',
        colorRange: parseRamp6(sub.colorRange),
        pickable: false,
        extruded: false,
      })
    case 'deck-hex':
      return new HexagonLayer({
        id,
        data,
        radius: Number(sub.radius ?? 1000),
        getPosition,
        getColorWeight: getWeight,
        colorAggregation: 'SUM',
        colorRange: parseRamp6(sub.colorRange),
        pickable: false,
        extruded: Number(sub.elevationScale ?? 0) > 0,
        elevationScale: Number(sub.elevationScale ?? 0),
      })
    case 'deck-heatmap':
      return new HeatmapLayer({
        id,
        data,
        radiusPixels: Number(sub.radiusPixels ?? 30),
        intensity: Number(sub.intensity ?? 1),
        colorRange: parseRampN(sub.colorRange),
        getPosition,
        getWeight,
        pickable: false,
      })
    case 'deck-screengrid':
      return new ScreenGridLayer({
        id,
        data,
        cellSizePixels: Number(sub.cellSizePixels ?? 50),
        colorRange: parseRampN(sub.colorRange),
        getPosition,
        getWeight,
        gpuAggregation: false,
        pickable: false,
      })
    case 'deck-contour':
      return new ContourLayer({
        id,
        data,
        cellSize: Number(sub.cellSize ?? 5000),
        contours: (sub.contours as never) ?? [
          { threshold: 1, color: [255, 255, 178, 200] },
          { threshold: 10, color: [253, 141, 60, 200] },
          { threshold: 100, color: [189, 0, 38, 200] },
        ],
        getPosition,
        getWeight,
        gpuAggregation: false,
        pickable: false,
      })
    default:
      return null
  }
}

function parseRamp6(input: unknown): [number, number, number][] {
  if (!Array.isArray(input) || input.length < 2) return DEFAULT_HEAT_RAMP
  const lo = hexToRgb(String(input[0]))
  const hi = hexToRgb(String(input[1]))
  return Array.from({ length: 6 }, (_, i) => {
    const t = i / 5
    return [
      Math.round(lo[0] + (hi[0] - lo[0]) * t),
      Math.round(lo[1] + (hi[1] - lo[1]) * t),
      Math.round(lo[2] + (hi[2] - lo[2]) * t),
    ] as [number, number, number]
  })
}

function parseRampN(input: unknown): [number, number, number][] {
  if (Array.isArray(input) && input.length > 0) {
    return input.map((h) => hexToRgb(String(h)))
  }
  return DEFAULT_HEAT_RAMP
}

export function DeckMulti(props: ChartProps<DeckMultiFormData>) {
  const { formData, queriesData, width, height } = props
  const { sublayers, longitudeColumn, latitudeColumn, initialView, mapStyle } = formData
  const rows = queriesData[0]?.data ?? []

  const view = useMemo(
    () => initialView ?? computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  const layers = useMemo(() => {
    const out: Layer[] = []
    sublayers.forEach((sub, i) => {
      const layer = buildSubLayer(sub as SubFD, i, rows)
      if (layer) out.push(layer)
    })
    return out
  }, [sublayers, rows])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
