// Adapted from superset-frontend/plugins/legacy-plugin-chart-world-map
// World map choropleth — countries colored by metric value. Uses ECharts'
// native MapChart series + GeoComponent. xviz does NOT inline geojson
// (would balloon bundle); the user supplies the GeoJSON via formData.
//
// Registration: ECharts requires `echarts.registerMap(name, geojson)`
// before a `series.type: 'map'` can render. We do this at transform time
// using a stable map name based on the data shape, registering once and
// re-using.

import type { EChartsCoreOption } from 'echarts/core'
import { registerMap } from 'echarts/core'
import type { MapSeriesOption } from 'echarts/charts'
import type { ChartProps, WorldMapFormData, GeoJsonInput } from '../types'
import { getNumberFormatter } from '../utils'

export interface TransformedWorldMapProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

const WORLD_MAP_NAME = 'xviz-world'

// Cache: ensure each unique GeoJSON registers exactly once. Different inputs
// reuse different cached names (hashed by reference identity for now —
// callers passing fresh objects on every render will pay a re-register cost
// but otherwise this is cheap).
const registered = new WeakMap<GeoJsonInput, string>()
let nextId = 0
function ensureRegistered(geo: GeoJsonInput, baseName: string): string {
  const cached = registered.get(geo)
  if (cached) return cached
  nextId += 1
  const name = `${baseName}-${nextId}`
  // ECharts' registerMap accepts the GeoJSON object directly.
  registerMap(name, geo as Parameters<typeof registerMap>[1])
  registered.set(geo, name)
  return name
}

export function transformWorldMapProps(
  chartProps: ChartProps<WorldMapFormData>,
): TransformedWorldMapProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    countryColumn,
    metric,
    geojson,
    nameProperty = 'name',
    colorRange,
    showLabels = false,
    numberFormat = 'smart',
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const rawData = queriesData[0]?.data ?? []

  const mapName = ensureRegistered(geojson, WORLD_MAP_NAME)

  // Build series.data: [{ name, value }] entries — `name` must match a
  // feature's `properties[nameProperty]` for ECharts to colour the right
  // shape.
  const points: { name: string; value: number }[] = []
  let minV = Infinity
  let maxV = -Infinity
  for (const r of rawData) {
    const name = String(r[countryColumn] ?? '')
    const v = Number(r[metric] ?? NaN)
    if (!name || !Number.isFinite(v)) continue
    points.push({ name, value: v })
    if (v < minV) minV = v
    if (v > maxV) maxV = v
  }

  const palette = colorRange ?? ['#e8f5f5', chartProps.theme?.colorHighlight ?? '#1FA8C9']

  const series: MapSeriesOption = {
    type: 'map',
    map: mapName,
    name: metric,
    data: points,
    nameProperty,
    label: { show: showLabels, fontSize: 10 },
    emphasis: { label: { show: true } },
    itemStyle: {
      borderColor: chartProps.theme?.colorBorder ?? '#bbb',
      borderWidth: 0.5,
      areaColor: '#f7f7f7',
    },
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number }
        const v = x.value
        if (v == null || Number.isNaN(v)) return String(x.name ?? '')
        return `<b>${x.name ?? ''}</b><br/>${metric}: ${fmt(Number(v))}`
      },
    },
    visualMap: {
      min: Number.isFinite(minV) ? minV : 0,
      max: Number.isFinite(maxV) ? maxV : 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      inRange: { color: palette },
      textStyle: { color: chartProps.theme?.colorTextSecondary ?? '#888' },
    },
    series: [series],
  }

  return { echartOptions, width, height }
}
