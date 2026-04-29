import { describe, it, expect } from 'vitest'
import { transformCalendarProps } from './transformProps'
import type { ChartProps, CalendarFormData } from '../types'

const baseFormData: CalendarFormData = {
  vizType: 'calendar',
  dateColumn: 'date',
  metric: 'commits',
  cellSize: 16,
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01-15', commits: 5 },
  { date: '2024-02-03', commits: 12 },
  { date: '2024-03-22', commits: 0 },
  { date: '2024-06-30', commits: 8 },
  { date: '2024-12-15', commits: 3 },
]

function makeProps(
  overrides: Partial<CalendarFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<CalendarFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 900,
    height: 220,
  }
}

describe('transformCalendarProps', () => {
  it('emits a heatmap series on the calendar coordinate system', () => {
    const result = transformCalendarProps(makeProps())
    type Series = { type: string; coordinateSystem: string; data: [string, number][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('heatmap')
    expect(opts.series[0].coordinateSystem).toBe('calendar')
    expect(opts.series[0].data).toHaveLength(5)
  })

  it('normalizes dates to ISO YYYY-MM-DD format', () => {
    const result = transformCalendarProps(makeProps())
    type Series = { data: [string, number][] }
    const opts = result.echartOptions as { series: Series[] }
    const dates = opts.series[0].data.map(([d]) => d)
    expect(dates[0]).toBe('2024-01-15')
    expect(dates[1]).toBe('2024-02-03')
  })

  it('auto-derives the calendar range from data when not provided', () => {
    const result = transformCalendarProps(makeProps())
    const opts = result.echartOptions as { calendar: { range: string | string[] } }
    expect(opts.calendar.range).toEqual(['2024-01-15', '2024-12-15'])
  })

  it('respects explicit rangeStart/rangeEnd', () => {
    const result = transformCalendarProps(
      makeProps({ rangeStart: '2024-01-01', rangeEnd: '2024-12-31' }),
    )
    const opts = result.echartOptions as { calendar: { range: string | string[] } }
    expect(opts.calendar.range).toEqual(['2024-01-01', '2024-12-31'])
  })

  it('passes a bare year string through to ECharts when both bounds are the same year', () => {
    const result = transformCalendarProps(
      makeProps({ rangeStart: '2024', rangeEnd: '2024' }),
    )
    const opts = result.echartOptions as { calendar: { range: string | string[] } }
    expect(opts.calendar.range).toBe('2024')
  })

  it('computes visualMap min/max from observed values', () => {
    const result = transformCalendarProps(makeProps())
    const opts = result.echartOptions as { visualMap: { min: number; max: number } }
    expect(opts.visualMap.min).toBe(0)
    expect(opts.visualMap.max).toBe(12)
  })

  it('uses provided colorRange override', () => {
    const result = transformCalendarProps(
      makeProps({ colorRange: ['#abc', '#def'] }),
    )
    const opts = result.echartOptions as {
      visualMap: { inRange: { color: string[] } }
    }
    expect(opts.visualMap.inRange.color).toEqual(['#abc', '#def'])
  })

  it('handles numeric epoch ms in the date column', () => {
    const data = [
      { date: 1704067200000, commits: 1 }, // 2024-01-01 UTC
      { date: 1735603200000, commits: 7 }, // 2024-12-31 UTC
    ]
    const result = transformCalendarProps(makeProps({}, data))
    type Series = { data: [string, number][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data[0][0]).toBe('2024-01-01')
    expect(opts.series[0].data[1][0]).toBe('2024-12-31')
  })

  it('drops rows with non-numeric metric or unparseable date', () => {
    const data = [
      { date: '2024-01-01', commits: 5 },
      { date: 'oops',       commits: 1 },
      { date: '2024-02-01', commits: 'nope' },
    ]
    const result = transformCalendarProps(makeProps({}, data))
    type Series = { data: [string, number][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toHaveLength(1)
    expect(opts.series[0].data[0][0]).toBe('2024-01-01')
  })

  it('handles empty data without throwing', () => {
    const result = transformCalendarProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toEqual([])
  })
})
