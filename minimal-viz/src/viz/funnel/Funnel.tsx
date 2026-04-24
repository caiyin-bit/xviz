import { useMemo } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, FunnelFormData } from '../types'
import { Echart } from '../Echart'
import { getNumberFormatter, makeColorScale, DEFAULT_PALETTE, percentFormatter } from '../utils'

export function Funnel(props: ChartProps<FunnelFormData>) {
  const { formData, queriesData, width, height, theme } = props
  const echartOptions = useMemo<EChartsCoreOption>(() => {
    const {
      groupby, metric, colorScheme,
      sortDesc = true,
      labelType = 'key_value_percent',
      showLegend = true, legendOrientation = 'top',
      numberFormat = 'smart',
    } = formData
    const rows = queriesData[0]?.data ?? []
    const fmt = getNumberFormatter(numberFormat)
    const colorOf = makeColorScale(colorScheme?.length ? colorScheme : DEFAULT_PALETTE)

    const nameOf = (r: Record<string, unknown>) =>
      groupby.map((g) => String(r[g] ?? '')).join(' · ')

    const items = rows.map((r) => ({
      name: nameOf(r),
      value: Number(r[metric] ?? 0),
    })).filter((x) => x.value > 0)
    if (sortDesc) items.sort((a, b) => b.value - a.value)

    const total = items.reduce((s, it) => s + it.value, 0)

    const label = (p: { name?: string; value?: number }) => {
      const n = p.name ?? ''
      const v = fmt(Number(p.value ?? 0))
      const pct = percentFormatter(total ? Number(p.value ?? 0) / total : 0)
      switch (labelType) {
        case 'key': return n
        case 'value': return v
        case 'percent': return pct
        case 'key_value': return `${n}: ${v}`
        case 'key_percent': return `${n}: ${pct}`
        case 'key_value_percent': return `${n}: ${v} (${pct})`
        default: return n
      }
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const x = p as { name?: string; value?: number }
          return `<b>${x.name ?? ''}</b>: ${fmt(Number(x.value ?? 0))} (${percentFormatter(total ? Number(x.value ?? 0) / total : 0)})`
        },
      },
      legend: {
        show: showLegend,
        orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
        [legendOrientation]: 8,
        data: items.map((it) => it.name),
      },
      series: [{
        type: 'funnel',
        sort: sortDesc ? 'descending' : 'ascending',
        left: 16, right: 16, top: showLegend ? 40 : 16, bottom: 16,
        gap: 2,
        label: { position: 'inside', formatter: (p: unknown) => label(p as { name?: string; value?: number }) },
        labelLine: { show: false },
        data: items.map((it) => ({ ...it, itemStyle: { color: colorOf(it.name) } })),
      }],
    }
  }, [formData, queriesData])

  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
