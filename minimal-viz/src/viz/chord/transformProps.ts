// Adapted from superset-frontend/plugins/legacy-plugin-chart-chord
// Chord diagram — circular layout showing flows between categories.
// ECharts 6 has a native ChordChart series. Input is a flat edge list
// (source, target, optional metric weight); the transform builds the
// node + link arrays that ChordSeriesOption expects.

import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, ChordFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

export interface TransformedChordProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

interface ChordNode {
  name: string
  value: number
  itemStyle: { color: string }
}

interface ChordEdge {
  source: string
  target: string
  value: number
}

export function transformChordProps(
  chartProps: ChartProps<ChordFormData>,
): TransformedChordProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    source,
    target,
    metric,
    showLabels = true,
    numberFormat = 'smart',
    colorScheme,
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)
  const rawData = queriesData[0]?.data ?? []

  const nodeValueMap = new Map<string, number>()
  const edges: ChordEdge[] = []

  for (const row of rawData) {
    const s = String(row[source] ?? '')
    const t = String(row[target] ?? '')
    if (!s || !t) continue
    const w = metric ? Number(row[metric] ?? 1) : 1
    const weight = Number.isFinite(w) ? w : 1
    nodeValueMap.set(s, (nodeValueMap.get(s) ?? 0) + weight)
    nodeValueMap.set(t, (nodeValueMap.get(t) ?? 0) + weight)
    edges.push({ source: s, target: t, value: weight })
  }

  const nodes: ChordNode[] = Array.from(nodeValueMap.entries()).map(([name, v]) => ({
    name,
    value: v,
    itemStyle: { color: colorOf(name) },
  }))

  // Use a generic shape here because ECharts' ChordSeriesOption typings
  // are still in flux across versions; this option object is what
  // ChordChart consumes at runtime.
  const series = {
    type: 'chord',
    data: nodes,
    edges,
    label: { show: showLabels, position: 'outside', fontSize: 12 },
    lineStyle: {
      color: 'source',
      curveness: 0.3,
      opacity: 0.5,
    },
    emphasis: {
      focus: 'adjacency',
      lineStyle: { width: 2, opacity: 0.9 },
    },
  } as unknown as Record<string, unknown>

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as {
          dataType?: string
          name?: string
          value?: number
          data?: { source?: string; target?: string; value?: number }
        }
        if (x.dataType === 'edge') {
          const e = x.data ?? {}
          return `<b>${e.source ?? ''} → ${e.target ?? ''}</b><br/>weight: ${fmt(Number(e.value ?? 0))}`
        }
        return `<b>${x.name ?? ''}</b><br/>${fmt(Number(x.value ?? 0))}`
      },
    },
    series: [series],
  }

  return { echartOptions, width, height }
}
