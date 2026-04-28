// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Tree/transformProps.ts
// Hierarchical tree visualized as nodes + connecting links (ECharts native `tree`).
// Reuses viz/hierarchy.ts to convert flat rows → nested tree, then synthesizes
// a single root if there are multiple top-level groups (ECharts tree.data is
// a single root object, not an array).

import type { EChartsCoreOption } from 'echarts/core'
import type { TreeSeriesOption } from 'echarts/charts'
import type { ChartProps, TreeFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'
import { buildHierarchy, type TreeNode } from '../hierarchy'

export interface TransformedTreeProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformTreeProps(
  chartProps: ChartProps<TreeFormData>,
): TransformedTreeProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    layout = 'orthogonal',
    orient = 'LR',
    symbolSize = 10,
    showLabels = true,
    rootName = 'All',
    numberFormat = 'smart',
    colorScheme,
  } = formData

  const rawData = queriesData[0]?.data ?? []
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  // Build nested tree from flat rows. metric is optional — if absent, treat
  // every row's "value" as 1 so buildHierarchy proceeds (numeric guard).
  const effectiveMetric = metric ?? '__count__'
  const rowsForTree = metric
    ? rawData
    : rawData.map((r) => ({ ...r, __count__: 1 }))
  const topLevelNodes = buildHierarchy(rowsForTree, groupby, effectiveMetric, colorOf)

  // ECharts tree expects a single root.
  const root: TreeNode =
    topLevelNodes.length === 1
      ? topLevelNodes[0]
      : {
          name: rootName,
          children: topLevelNodes,
          itemStyle: { color: chartProps.theme?.colorTextSecondary ?? '#888' },
        }

  // Determine label position based on layout/orient.
  const labelPosition = layout === 'radial'
    ? 'inside'
    : (orient === 'RL' || orient === 'BT' ? 'left' : 'right')

  const series: TreeSeriesOption = {
    type: 'tree',
    data: [root],
    layout,
    orient: layout === 'orthogonal' ? orient : undefined,
    top: 24,
    left: 80,
    right: 80,
    bottom: 24,
    symbol: 'circle',
    symbolSize,
    label: {
      show: showLabels,
      position: labelPosition,
      verticalAlign: 'middle',
      align: layout === 'radial' ? 'center' : (orient === 'RL' || orient === 'BT' ? 'right' : 'left'),
      fontSize: 12,
    },
    leaves: {
      label: {
        position: labelPosition,
      },
    },
    expandAndCollapse: false,
    initialTreeDepth: -1,
    lineStyle: {
      color: chartProps.theme?.colorBorder ?? '#aaa',
      width: 1,
    },
    emphasis: {
      focus: 'descendant',
    },
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number }
        const v = x.value
        if (typeof v === 'number' && metric) {
          return `<b>${x.name ?? ''}</b><br/>${metric}: ${formatNumber(v)}`
        }
        return `<b>${x.name ?? ''}</b>`
      },
    },
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: { trigger: 'item' },
    series: [series],
  }

  return { echartOptions, width, height }
}
