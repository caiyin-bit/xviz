import { useMemo } from 'react'
import type { ChartProps, BigNumberFormData } from '../types'
import { getNumberFormatter, percentFormatter } from '../utils'
import { Echart } from '../Echart'
import { DEFAULT_THEME } from '../theme'

export function BigNumber(props: ChartProps<BigNumberFormData>) {
  const { formData, queriesData, width, height } = props
  const theme = props.theme ?? DEFAULT_THEME
  const {
    metric,
    subheader,
    numberFormat = 'smart',
    color,
    trendColumn,
    compareToPrevious = false,
  } = formData

  const rows = useMemo(() => queriesData[0]?.data ?? [], [queriesData])
  const fmt = getNumberFormatter(numberFormat)

  // Big value = last row's metric (most recent); fall back to first row if only one.
  const bigValue = rows.length
    ? Number(rows[rows.length - 1][metric] ?? 0)
    : 0

  // Delta vs first row.
  const delta = useMemo(() => {
    if (!compareToPrevious || rows.length < 2) return null
    const first = Number(rows[0][metric] ?? 0)
    if (first === 0) return null
    return (bigValue - first) / Math.abs(first)
  }, [rows, metric, bigValue, compareToPrevious])

  const hasTrend = !!trendColumn && rows.length > 1
  const trendData = hasTrend
    ? rows.map((r, i) => [i, Number(r[trendColumn!] ?? r[metric] ?? 0)])
    : []

  const trendOption = hasTrend
    ? {
        tooltip: { show: false },
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
        xAxis: { type: 'category', show: false },
        yAxis: { type: 'value', show: false, scale: true },
        series: [{
          type: 'line',
          data: trendData.map(([, v]) => v),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: color ?? '#1FA8C9', width: 2 },
          areaStyle: { color: color ?? '#1FA8C9', opacity: 0.12 },
          animation: false,
        }],
      }
    : null

  const deltaColor =
    delta == null ? undefined : delta >= 0 ? '#3ea04a' : '#e04355'
  const deltaText =
    delta == null ? null : `${delta >= 0 ? '▲' : '▼'} ${percentFormatter(Math.abs(delta))}`

  return (
    <div
      style={{
        width,
        height,
        padding: 16,
        fontFamily: theme.fontFamily,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        background: theme.colorBg,
      }}
    >
      <div>
        {subheader && <div style={{ color: theme.colorTextSecondary, fontSize: 14, marginBottom: 4 }}>{subheader}</div>}
        <div
          style={{
            fontSize: Math.min(64, height * 0.35),
            fontWeight: 700,
            lineHeight: 1,
            color: color ?? theme.colorText,
          }}
        >
          {fmt(bigValue)}
        </div>
        {deltaText && (
          <div style={{ color: deltaColor, fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            {deltaText} vs start
          </div>
        )}
      </div>

      {hasTrend && trendOption && (
        <div style={{ marginTop: 12 }}>
          <Echart
            width={width - 32}
            height={Math.max(48, height * 0.3)}
            echartOptions={trendOption}
            theme={theme}
          />
        </div>
      )}
    </div>
  )
}
