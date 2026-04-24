import { useMemo } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, SankeyFormData } from '../types'
import { Echart } from '../Echart'
import { getNumberFormatter, makeColorScale, DEFAULT_PALETTE } from '../utils'

export function Sankey(props: ChartProps<SankeyFormData>) {
  const { formData, queriesData, width, height, theme } = props
  const echartOptions = useMemo<EChartsCoreOption>(() => {
    const { source, target, metric, colorScheme, numberFormat = 'smart' } = formData
    const rows = queriesData[0]?.data ?? []
    const fmt = getNumberFormatter(numberFormat)
    const colorOf = makeColorScale(colorScheme?.length ? colorScheme : DEFAULT_PALETTE)

    const nodeSet = new Set<string>()
    for (const r of rows) {
      nodeSet.add(String(r[source] ?? ''))
      nodeSet.add(String(r[target] ?? ''))
    }
    const nodes = Array.from(nodeSet).map((name) => ({ name, itemStyle: { color: colorOf(name) } }))
    const links = rows.map((r) => ({
      source: String(r[source] ?? ''),
      target: String(r[target] ?? ''),
      value: Number(r[metric] ?? 0),
    })).filter((l) => l.source && l.target && l.value > 0)

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const x = p as { dataType?: string; name?: string; value?: number; data?: { source?: string; target?: string; value?: number } }
          if (x.dataType === 'edge' && x.data) {
            return `${x.data.source} → ${x.data.target}<br/><b>${fmt(Number(x.data.value ?? 0))}</b>`
          }
          return `<b>${x.name ?? ''}</b>`
        },
      },
      series: [{
        type: 'sankey',
        data: nodes,
        links,
        nodeAlign: 'left',
        left: 16, right: 120, top: 16, bottom: 16,
        lineStyle: { color: 'gradient', opacity: 0.5, curveness: 0.5 },
        emphasis: { focus: 'adjacency' },
        label: { fontSize: 11 },
      }],
    }
  }, [formData, queriesData])

  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
