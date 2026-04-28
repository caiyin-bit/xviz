// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Graph/transformProps.ts
// Network graph from a flat edge list. Nodes are auto-inferred as
// (unique source ∪ unique target). Node value = sum of incident edge weights
// (or 1 per edge when no metric is provided), driving symbolSize when scaled.

import type { EChartsCoreOption } from 'echarts/core'
import type { GraphSeriesOption } from 'echarts/charts'
import type { ChartProps, GraphFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

export interface TransformedGraphProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

interface GraphNode {
  name: string
  value: number
  symbolSize: number
  itemStyle: { color: string }
}

interface GraphEdge {
  source: string
  target: string
  value: number
  lineStyle: { width: number }
}

export function transformGraphProps(
  chartProps: ChartProps<GraphFormData>,
): TransformedGraphProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    source,
    target,
    metric,
    layout = 'force',
    symbolSize = 12,
    showLabels = true,
    showEdgeLabels = false,
    repulsion = 200,
    edgeLength = 80,
    numberFormat = 'smart',
    colorScheme,
  } = formData

  const rawData = queriesData[0]?.data ?? []
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  const nodeValueMap = new Map<string, number>()
  const edges: GraphEdge[] = []

  for (const row of rawData) {
    const s = String(row[source] ?? '')
    const t = String(row[target] ?? '')
    if (!s || !t) continue

    const w = metric ? Number(row[metric] ?? 1) : 1
    const weight = Number.isFinite(w) ? w : 1

    nodeValueMap.set(s, (nodeValueMap.get(s) ?? 0) + weight)
    nodeValueMap.set(t, (nodeValueMap.get(t) ?? 0) + weight)
    edges.push({
      source: s,
      target: t,
      value: weight,
      lineStyle: { width: Math.max(1, Math.min(8, weight / 5)) },
    })
  }

  // Scale node sizes around the configured base. Largest node ≈ 2× base; smallest ≈ 0.6× base.
  const values = Array.from(nodeValueMap.values())
  const maxV = values.length ? Math.max(...values) : 1
  const minV = values.length ? Math.min(...values) : 1
  const range = Math.max(1, maxV - minV)

  const nodes: GraphNode[] = Array.from(nodeValueMap.entries()).map(([name, v]) => {
    const norm = (v - minV) / range
    return {
      name,
      value: v,
      symbolSize: symbolSize * (0.6 + 1.4 * norm),
      itemStyle: { color: colorOf(name) },
    }
  })

  const series: GraphSeriesOption = {
    type: 'graph',
    layout,
    data: nodes,
    links: edges,
    roam: false,
    label: {
      show: showLabels,
      position: 'right',
      fontSize: 12,
    },
    edgeLabel: {
      show: showEdgeLabels,
      formatter: (p: unknown) => {
        const x = p as { value?: number }
        return formatNumber(Number(x.value ?? 0))
      },
    },
    lineStyle: {
      color: chartProps.theme?.colorBorder ?? '#aaa',
      curveness: 0.1,
    },
    emphasis: {
      focus: 'adjacency',
      lineStyle: { width: 3 },
    },
    force: {
      repulsion,
      edgeLength,
      // Run force iterations once and freeze. Important for headless rendering
      // (puppeteer screenshot would otherwise capture an animating frame).
      layoutAnimation: false,
    },
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { dataType?: string; name?: string; value?: number; data?: { source?: string; target?: string; value?: number } }
        if (x.dataType === 'edge') {
          const e = x.data ?? {}
          return `<b>${e.source ?? ''} → ${e.target ?? ''}</b><br/>weight: ${formatNumber(Number(e.value ?? 0))}`
        }
        return `<b>${x.name ?? ''}</b><br/>${formatNumber(Number(x.value ?? 0))}`
      },
    },
  }

  const echartOptions: EChartsCoreOption = {
    animation: false,
    tooltip: { trigger: 'item' },
    series: [series],
  }

  return { echartOptions, width, height }
}
