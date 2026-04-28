import { describe, it, expect } from 'vitest'
import { transformTimeseriesProps } from './transformProps'
import type { ChartProps, TimeseriesFormData } from '../types'

const baseLineFormData: TimeseriesFormData = {
  vizType: 'timeseries-line',
  xAxis: 'date',
  metrics: ['value'],
  smooth: false,
  area: false,
  showDots: true,
  showLegend: true,
  legendOrientation: 'top',
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01-01', value: 10 },
  { date: '2024-02-01', value: 20 },
  { date: '2024-03-01', value: 15 },
  { date: '2024-04-01', value: 30 },
]

function makeProps(
  overrides: Partial<TimeseriesFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<TimeseriesFormData> {
  return {
    formData: { ...baseLineFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 420,
  }
}

describe('transformTimeseriesProps', () => {
  it('produces a time axis (not category)', () => {
    const result = transformTimeseriesProps(makeProps())
    type Axis = { type: string; data?: unknown }
    const opts = result.echartOptions as { xAxis: Axis }
    expect(opts.xAxis.type).toBe('time')
    expect(opts.xAxis.data).toBeUndefined()
  })

  it('emits [timestamp, value] tuples instead of bare values', () => {
    const result = transformTimeseriesProps(makeProps())
    type Series = { type: string; data: [number, number][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(1)
    const data = opts.series[0].data
    expect(data).toHaveLength(4)
    expect(data[0][0]).toBe(Date.parse('2024-01-01'))
    expect(data[0][1]).toBe(10)
    expect(data[3][0]).toBe(Date.parse('2024-04-01'))
    expect(data[3][1]).toBe(30)
  })

  it('produces a bar series for vizType=timeseries-bar', () => {
    const result = transformTimeseriesProps(makeProps({ vizType: 'timeseries-bar' }))
    type Series = { type: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('bar')
  })

  it('produces a line series for vizType=timeseries-line', () => {
    const result = transformTimeseriesProps(makeProps())
    type Series = { type: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('line')
  })

  it('keeps smooth/area on line variant', () => {
    const result = transformTimeseriesProps(
      makeProps({ smooth: true, area: true }),
    )
    type Series = { smooth?: boolean; areaStyle?: unknown }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].smooth).toBe(true)
    expect(opts.series[0].areaStyle).toBeDefined()
  })

  it('handles numeric epoch ms in x-axis values', () => {
    const data = [
      { date: 1704067200000, value: 10 },
      { date: 1706745600000, value: 20 },
    ]
    const result = transformTimeseriesProps(makeProps({}, data))
    type Series = { data: [number, number][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data[0][0]).toBe(1704067200000)
    expect(opts.series[0].data[1][0]).toBe(1706745600000)
  })

  it('produces multi-series timeseries when seriesColumn is set', () => {
    const data = [
      { date: '2024-01-01', region: 'NA', value: 10 },
      { date: '2024-01-01', region: 'EU', value: 5 },
      { date: '2024-02-01', region: 'NA', value: 20 },
      { date: '2024-02-01', region: 'EU', value: 15 },
    ]
    const result = transformTimeseriesProps(
      makeProps({ seriesColumn: 'region' }, data),
    )
    type Series = { name: string; data: [number, number][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(2)
    expect(opts.series.map((s) => s.name).sort()).toEqual(['EU', 'NA'])
    expect(opts.series.every((s) => s.data.length === 2)).toBe(true)
  })

  it('handles empty data without throwing', () => {
    const result = transformTimeseriesProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toEqual([])
  })
})
