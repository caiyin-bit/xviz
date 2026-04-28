// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Treemap/transformProps.ts
// Converts flat rows → nested tree, then emits an ECharts treemap series.
// Aggregation rule: leaf nodes carry summed metric values; ECharts auto-aggregates parents.

import type { EChartsCoreOption } from 'echarts/core'
import type { TreemapSeriesOption } from 'echarts/charts'
import type { ChartProps, TreemapFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

export interface TransformedTreemapProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

interface TreeNode {
  name: string
  value?: number
  children?: TreeNode[]
  itemStyle?: { color?: string }
}

function buildHierarchy(
  rows: ReadonlyArray<Record<string, unknown>>,
  groupby: string[],
  metric: string,
  colorOf: (name: string) => string,
): TreeNode[] {
  const root: TreeNode[] = []
  for (const row of rows) {
    const v = Number(row[metric] ?? NaN)
    if (!Number.isFinite(v)) continue

    let cursor = root
    for (let depth = 0; depth < groupby.length; depth += 1) {
      const key = String(row[groupby[depth]] ?? '')
      const isLeaf = depth === groupby.length - 1
      let node = cursor.find((n) => n.name === key)
      if (!node) {
        node = isLeaf
          ? { name: key, value: 0, itemStyle: { color: colorOf(key) } }
          : { name: key, children: [], itemStyle: { color: colorOf(key) } }
        cursor.push(node)
      }
      if (isLeaf) {
        node.value = (node.value ?? 0) + v
      } else {
        if (!node.children) node.children = []
        cursor = node.children
      }
    }
  }
  return root
}

export function transformTreemapProps(
  chartProps: ChartProps<TreemapFormData>,
): TransformedTreemapProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    showLabels = true,
    showValues = false,
    showBreadcrumb = false,
    colorScheme,
    numberFormat = 'smart',
  } = formData

  const rawData = queriesData[0]?.data ?? []
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  const tree = buildHierarchy(rawData, groupby, metric, colorOf)

  const labelFormatter = (p: { name?: string; value?: number }) => {
    const name = p.name ?? ''
    if (!showValues) return name
    return `${name}\n${formatNumber(Number(p.value ?? 0))}`
  }

  const series: TreemapSeriesOption = {
    type: 'treemap',
    data: tree,
    roam: false,
    nodeClick: false,
    breadcrumb: { show: showBreadcrumb },
    label: {
      show: showLabels,
      formatter: (p) =>
        labelFormatter(p as { name?: string; value?: number }),
    },
    upperLabel: {
      show: showLabels && groupby.length > 1,
      height: 20,
    },
    itemStyle: {
      borderColor: chartProps.theme?.colorBg ?? '#fff',
      borderWidth: 1,
      gapWidth: 1,
    },
    levels: [
      { itemStyle: { borderColor: chartProps.theme?.colorBg ?? '#fff', borderWidth: 2, gapWidth: 2 } },
      { itemStyle: { borderColor: chartProps.theme?.colorBg ?? '#fff', borderWidth: 1, gapWidth: 1 } },
    ],
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number }
        return `<b>${x.name ?? ''}</b><br/>${formatNumber(Number(x.value ?? 0))}`
      },
    },
    series: [series],
  }

  return { echartOptions, width, height }
}
