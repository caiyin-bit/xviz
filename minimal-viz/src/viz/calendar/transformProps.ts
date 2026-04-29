// Adapted from superset-frontend/plugins/legacy-plugin-chart-calendar/src/transformProps.ts
// GitHub-contributions-style calendar heatmap. ECharts uses a `calendar`
// coordinate system + a `heatmap` series with `coordinateSystem: 'calendar'`
// to render. Cells are one per day, colored by the metric value.

import type { EChartsCoreOption } from 'echarts/core'
import type { HeatmapSeriesOption } from 'echarts/charts'
import type { ChartProps, CalendarFormData } from '../types'
import { getNumberFormatter } from '../utils'

export interface TransformedCalendarProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

function parseTime(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v < 1e12 ? v * 1000 : v
  }
  const s = String(v ?? '')
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    return n < 1e12 ? n * 1000 : n
  }
  return Date.parse(s)
}

function toIsoDate(ts: number): string {
  if (!Number.isFinite(ts)) return ''
  const d = new Date(ts)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Resolve a range bound. Accepts year ('2024'), ISO date, or epoch ms. */
function resolveBound(input: string | undefined, fallback: number): string {
  if (!input) return toIsoDate(fallback)
  if (/^\d{4}$/.test(input)) return input // bare year — let ECharts expand
  const ts = parseTime(input)
  if (Number.isFinite(ts)) return toIsoDate(ts)
  return input
}

export function transformCalendarProps(
  chartProps: ChartProps<CalendarFormData>,
): TransformedCalendarProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    dateColumn,
    metric,
    rangeStart,
    rangeEnd,
    cellSize = 16,
    colorRange,
    showLabel = false,
    numberFormat = 'smart',
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const rawData = queriesData[0]?.data ?? []

  // Parse rows: [isoDate, value]; drop unparseable.
  const points: [string, number][] = []
  let minTs = Infinity
  let maxTs = -Infinity
  let minV = Infinity
  let maxV = -Infinity
  for (const r of rawData) {
    const ts = parseTime(r[dateColumn])
    const v = Number(r[metric] ?? NaN)
    if (!Number.isFinite(ts) || !Number.isFinite(v)) continue
    const iso = toIsoDate(ts)
    points.push([iso, v])
    if (ts < minTs) minTs = ts
    if (ts > maxTs) maxTs = ts
    if (v < minV) minV = v
    if (v > maxV) maxV = v
  }

  const start = resolveBound(rangeStart, Number.isFinite(minTs) ? minTs : Date.now())
  const end = resolveBound(rangeEnd, Number.isFinite(maxTs) ? maxTs : Date.now())
  // ECharts accepts a single year string or [start, end] tuple.
  const range = start === end || (start.length === 4 && end.length === 4 && start === end)
    ? start
    : [start, end]

  const palette = colorRange ?? ['#e8f5f5', chartProps.theme?.colorHighlight ?? '#1FA8C9']

  const series: HeatmapSeriesOption = {
    type: 'heatmap',
    coordinateSystem: 'calendar',
    data: points,
    label: showLabel
      ? {
          show: true,
          formatter: (p: unknown) => {
            const x = p as { value?: [string, number] }
            return String(x.value?.[1] ?? '')
          },
        }
      : { show: false },
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { value?: [string, number] }
        const v = x.value ?? ['', 0]
        return `<b>${v[0]}</b><br/>${metric}: ${fmt(Number(v[1]))}`
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
    calendar: {
      range,
      cellSize: ['auto', cellSize],
      top: 32,
      left: 40,
      right: 24,
      itemStyle: {
        borderColor: chartProps.theme?.colorBg ?? '#fff',
        borderWidth: 2,
      },
      splitLine: { show: false },
      yearLabel: { show: true, color: chartProps.theme?.colorTextSecondary ?? '#666' },
      monthLabel: { color: chartProps.theme?.colorTextSecondary ?? '#888' },
      dayLabel: { color: chartProps.theme?.colorTextSecondary ?? '#888' },
    },
    series: [series],
  }

  return { echartOptions, width, height }
}
