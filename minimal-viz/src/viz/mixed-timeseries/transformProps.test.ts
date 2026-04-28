import { describe, it, expect } from 'vitest'
import { transformMixedTimeseriesProps } from './transformProps'
import type { ChartProps, MixedTimeseriesFormData } from '../types'

const baseFormData: MixedTimeseriesFormData = {
  vizType: 'mixed-timeseries',
  xAxis: 'date',
  barMetrics: ['orders'],
  lineMetrics: ['conversion_rate'],
  dualAxis: true,
  stacked: false,
  smooth: false,
  showDots: true,
  showLegend: true,
  legendOrientation: 'top',
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01-01', orders: 1200, conversion_rate: 0.04 },
  { date: '2024-02-01', orders: 1450, conversion_rate: 0.05 },
  { date: '2024-03-01', orders: 1100, conversion_rate: 0.03 },
  { date: '2024-04-01', orders: 1700, conversion_rate: 0.06 },
]

function makeProps(
  overrides: Partial<MixedTimeseriesFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<MixedTimeseriesFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 420,
  }
}

describe('transformMixedTimeseriesProps', () => {
  it('emits one bar series and one line series with time-axis tuples', () => {
    const result = transformMixedTimeseriesProps(makeProps())
    type Series = { type: string; name: string; data: [number, number][]; yAxisIndex: number }
    const opts = result.echartOptions as { series: Series[]; xAxis: { type: string } }
    expect(opts.xAxis.type).toBe('time')
    expect(opts.series).toHaveLength(2)
    const barS = opts.series.find((s) => s.type === 'bar')!
    const lineS = opts.series.find((s) => s.type === 'line')!
    expect(barS.name).toBe('orders')
    expect(lineS.name).toBe('conversion_rate')
    expect(barS.data[0][0]).toBe(Date.parse('2024-01-01'))
    expect(barS.data[0][1]).toBe(1200)
  })

  it('puts lines on right Y axis when dualAxis=true', () => {
    const result = transformMixedTimeseriesProps(makeProps())
    type Series = { type: string; yAxisIndex: number }
    const opts = result.echartOptions as { series: Series[]; yAxis: unknown[] | unknown }
    const lineS = opts.series.find((s) => s.type === 'line')!
    expect(lineS.yAxisIndex).toBe(1)
    expect(Array.isArray(opts.yAxis)).toBe(true)
    expect((opts.yAxis as unknown[]).length).toBe(2)
  })

  it('uses single Y axis when dualAxis=false', () => {
    const result = transformMixedTimeseriesProps(makeProps({ dualAxis: false }))
    type Series = { type: string; yAxisIndex: number }
    const opts = result.echartOptions as { series: Series[]; yAxis: unknown }
    const lineS = opts.series.find((s) => s.type === 'line')!
    expect(lineS.yAxisIndex).toBe(0)
    expect(Array.isArray(opts.yAxis)).toBe(false)
  })

  it('handles multiple bar metrics with stacking', () => {
    const data = [
      { date: '2024-01-01', orders_a: 100, orders_b: 80, ctr: 0.04 },
      { date: '2024-02-01', orders_a: 120, orders_b: 90, ctr: 0.05 },
    ]
    const result = transformMixedTimeseriesProps(
      makeProps(
        { barMetrics: ['orders_a', 'orders_b'], lineMetrics: ['ctr'], stacked: true },
        data,
      ),
    )
    type Series = { type: string; stack?: string; name: string }
    const opts = result.echartOptions as { series: Series[] }
    const bars = opts.series.filter((s) => s.type === 'bar')
    expect(bars).toHaveLength(2)
    expect(bars.every((b) => b.stack === 'total')).toBe(true)
  })

  it('aggregates duplicate (date, metric) cells', () => {
    const data = [
      { date: '2024-01-01', orders: 100, conversion_rate: 0.04 },
      { date: '2024-01-01', orders: 50, conversion_rate: 0.01 },
      { date: '2024-02-01', orders: 120, conversion_rate: 0.05 },
    ]
    const result = transformMixedTimeseriesProps(makeProps({}, data))
    type Series = { type: string; data: [number, number][] }
    const opts = result.echartOptions as { series: Series[] }
    const barS = opts.series.find((s) => s.type === 'bar')!
    expect(barS.data[0][1]).toBe(150)
  })

  it('sorts x values chronologically', () => {
    const data = [
      { date: '2024-04-01', orders: 4, conversion_rate: 0.04 },
      { date: '2024-01-01', orders: 1, conversion_rate: 0.01 },
      { date: '2024-03-01', orders: 3, conversion_rate: 0.03 },
      { date: '2024-02-01', orders: 2, conversion_rate: 0.02 },
    ]
    const result = transformMixedTimeseriesProps(makeProps({}, data))
    type Series = { type: string; data: [number, number][] }
    const opts = result.echartOptions as { series: Series[] }
    const barS = opts.series.find((s) => s.type === 'bar')!
    const ts = barS.data.map(([t]) => t)
    expect(ts).toEqual([...ts].sort((a, b) => a - b))
    expect(barS.data.map(([, v]) => v)).toEqual([1, 2, 3, 4])
  })

  it('handles empty data without throwing', () => {
    const result = transformMixedTimeseriesProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series.every((s) => s.data.length === 0)).toBe(true)
  })
})
