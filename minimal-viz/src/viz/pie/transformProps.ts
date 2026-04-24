// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Pie/transformProps.ts
// Stripped to the essentials: formData + tabular data -> ECharts option.
// Supports: donut, inner/outer radius, 6 label types, legend placement,
// rose type, "Other" threshold bucketing, show-total annotation.
// Dropped: cross-filters, context menu, template labels, currency formatting.

import type { EChartsCoreOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type { ChartProps, PieFormData } from '../types'
import { getNumberFormatter, makeColorScale, percentFormatter } from '../utils'

const LEGEND_GAP = 24

export interface TransformedPieProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformPieProps(
  chartProps: ChartProps<PieFormData>,
): TransformedPieProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    colorScheme,
    donut = false,
    innerRadius = 30,
    outerRadius = 70,
    labelType = 'key',
    showLabels = true,
    labelsOutside = true,
    showLegend = true,
    legendOrientation = 'top',
    numberFormat = 'smart',
    roseType = null,
    thresholdForOther = 0,
    showTotal = false,
  } = formData

  const rawData = queriesData[0]?.data ?? []
  const nameOf = (row: Record<string, unknown>) =>
    groupby.map((g) => String(row[g] ?? '')).join(' · ')

  const total = rawData.reduce((s, r) => s + Number(r[metric] ?? 0), 0)
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  // Group values below the threshold into an "Other" bucket.
  type Row = { name: string; value: number; isOther?: boolean }
  const rows: Row[] = []
  let otherSum = 0
  for (const r of rawData) {
    const v = Number(r[metric] ?? 0)
    const pct = total ? v / total : 0
    if (thresholdForOther && pct * 100 < thresholdForOther) {
      otherSum += v
    } else {
      rows.push({ name: nameOf(r), value: v })
    }
  }
  if (otherSum > 0) rows.push({ name: 'Other', value: otherSum, isOther: true })

  // Build data array with stable colors.
  const seriesData = rows.map((r) => ({
    name: r.name,
    value: r.value,
    itemStyle: { color: r.isOther ? '#888' : colorOf(r.name) },
  }))

  // Label formatter based on labelType.
  const label = (p: { name?: string; value?: number; percent?: number }) => {
    const name = p.name ?? ''
    const value = formatNumber(Number(p.value ?? 0))
    const pct = percentFormatter(Number(p.percent ?? 0) / 100)
    switch (labelType) {
      case 'key': return name
      case 'value': return value
      case 'percent': return pct
      case 'key_value': return `${name}: ${value}`
      case 'key_percent': return `${name}: ${pct}`
      case 'key_value_percent': return `${name}: ${value} (${pct})`
      default: return name
    }
  }

  const series: PieSeriesOption = {
    type: 'pie',
    radius: [`${donut ? innerRadius : 0}%`, `${outerRadius}%`],
    center: ['50%', '50%'],
    roseType: roseType || undefined,
    avoidLabelOverlap: true,
    label: {
      show: showLabels,
      position: labelsOutside ? 'outer' : 'inner',
      formatter: (p) => label(p as { name?: string; value?: number; percent?: number }),
    },
    labelLine: { show: labelsOutside && showLabels },
    emphasis: {
      label: { show: true, fontWeight: 'bold' },
    },
    data: seriesData,
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number; percent?: number }
        return `<b>${x.name ?? ''}</b><br/>${formatNumber(Number(x.value ?? 0))} · ${percentFormatter(Number(x.percent ?? 0) / 100)}`
      },
    },
    legend: {
      show: showLegend,
      orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
      [legendOrientation]: LEGEND_GAP,
    },
    graphic: showTotal
      ? {
          type: 'text',
          left: 'center',
          top: donut ? 'middle' : '6%',
          style: {
            text: `Total: ${formatNumber(total)}`,
            fontSize: 16,
            fontWeight: 'bold',
            fill: chartProps.theme?.colorText ?? '#222',
          },
        }
      : undefined,
    series: [series],
  }

  return { echartOptions, width, height }
}
