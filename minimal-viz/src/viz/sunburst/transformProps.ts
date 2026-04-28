// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Sunburst/transformProps.ts
// Same flat-rows → nested-tree pipeline as Treemap (shared via viz/hierarchy.ts).
// Differs in series type ('sunburst') and radius/label semantics.

import type { EChartsCoreOption } from 'echarts/core'
import type { SunburstSeriesOption } from 'echarts/charts'
import type { ChartProps, SunburstFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'
import { buildHierarchy } from '../hierarchy'

export interface TransformedSunburstProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformSunburstProps(
  chartProps: ChartProps<SunburstFormData>,
): TransformedSunburstProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    showLabels = true,
    showValues = false,
    innerRadius = 0,
    outerRadius = 90,
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

  const series: SunburstSeriesOption = {
    type: 'sunburst',
    data: tree,
    radius: [`${innerRadius}%`, `${outerRadius}%`],
    label: {
      show: showLabels,
      formatter: (p) =>
        labelFormatter(p as { name?: string; value?: number }),
      minAngle: 5,
    },
    itemStyle: {
      borderColor: chartProps.theme?.colorBg ?? '#fff',
      borderWidth: 1,
    },
    emphasis: {
      focus: 'ancestor',
    },
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
