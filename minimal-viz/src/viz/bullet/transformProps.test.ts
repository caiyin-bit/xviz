import { describe, it, expect } from 'vitest'
import { transformBulletProps } from './transformProps'
import type { ChartProps, BulletFormData } from '../types'

const baseFormData: BulletFormData = {
  vizType: 'bullet',
  groupby: 'kpi',
  metric: 'actual',
  targetColumn: 'target',
  rangeColumns: ['poor', 'satisfactory', 'good'],
  numberFormat: 'smart',
}

const baseData = [
  { kpi: 'Revenue',   actual: 270, target: 250, poor: 150, satisfactory: 225, good: 300 },
  { kpi: 'Profit',    actual: 22,  target: 26,  poor: 20,  satisfactory: 24,  good: 28 },
  { kpi: 'New Users', actual: 1850,target: 2000,poor:1500, satisfactory:1750, good: 2100 },
]

function makeProps(
  overrides: Partial<BulletFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<BulletFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 240,
  }
}

describe('transformBulletProps', () => {
  it('emits 1 series per range + 1 value series', () => {
    const result = transformBulletProps(makeProps())
    type Series = { type: string; name: string; stack?: string }
    const opts = result.echartOptions as { series: Series[] }
    // 3 ranges + 1 value bar = 4
    expect(opts.series).toHaveLength(4)
    // First three have stack='ranges'
    expect(opts.series.slice(0, 3).every((s) => s.stack === 'ranges')).toBe(true)
    // Last is the actual value bar (no stack)
    expect(opts.series[3].name).toBe('actual')
    expect(opts.series[3].stack).toBeUndefined()
  })

  it('range values are stored as deltas between successive thresholds', () => {
    const result = transformBulletProps(makeProps())
    type Series = { name: string; data: number[] }
    const opts = result.echartOptions as { series: Series[] }
    // For Revenue row: poor=150, satisfactory=225, good=300
    //   range 0 (poor):         data[0] = 150
    //   range 1 (satisfactory): data[0] = 225 - 150 = 75
    //   range 2 (good):         data[0] = 300 - 225 = 75
    expect(opts.series[0].data[0]).toBe(150)
    expect(opts.series[1].data[0]).toBe(75)
    expect(opts.series[2].data[0]).toBe(75)
  })

  it('value series carries the actual metric values per row', () => {
    const result = transformBulletProps(makeProps())
    type Series = { name: string; data: number[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[3].data).toEqual([270, 22, 1850])
  })

  it('y-axis is categorical with input row order (inverse for top-to-bottom)', () => {
    const result = transformBulletProps(makeProps())
    const opts = result.echartOptions as { yAxis: { type: string; data: string[]; inverse: boolean } }
    expect(opts.yAxis.type).toBe('category')
    expect(opts.yAxis.data).toEqual(['Revenue', 'Profit', 'New Users'])
    expect(opts.yAxis.inverse).toBe(true)
  })

  it('emits markLine target ticks when targetColumn is set', () => {
    const result = transformBulletProps(makeProps())
    type Series = { markLine?: { data: unknown[] } }
    const opts = result.echartOptions as { series: Series[] }
    const valueSeries = opts.series[3]
    expect(valueSeries.markLine?.data).toBeDefined()
    expect(valueSeries.markLine!.data).toHaveLength(3) // one per row
  })

  it('omits markLine when targetColumn is not provided', () => {
    const result = transformBulletProps(makeProps({ targetColumn: undefined }))
    type Series = { markLine?: unknown }
    const opts = result.echartOptions as { series: Series[] }
    const valueSeries = opts.series[3]
    expect(valueSeries.markLine).toBeUndefined()
  })

  it('handles rangeColumns being empty (no qualitative bands)', () => {
    const result = transformBulletProps(
      makeProps({ rangeColumns: [], targetColumn: undefined }),
    )
    type Series = { type: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(1)
    expect(opts.series[0].type).toBe('bar')
  })

  it('drops rows with non-numeric metric', () => {
    const data = [
      { kpi: 'A', actual: 100, target: 90,  poor: 50,  satisfactory: 80,  good: 110 },
      { kpi: 'B', actual: 'oops', target: 90, poor: 50, satisfactory: 80, good: 110 },
    ]
    const result = transformBulletProps(makeProps({}, data))
    const opts = result.echartOptions as { yAxis: { data: string[] } }
    expect(opts.yAxis.data).toEqual(['A'])
  })

  it('handles empty data without throwing', () => {
    const result = transformBulletProps(makeProps({}, []))
    type Series = { data: number[] }
    const opts = result.echartOptions as { series: Series[]; yAxis: { data: string[] } }
    expect(opts.yAxis.data).toEqual([])
    expect(opts.series.every((s) => s.data.length === 0)).toBe(true)
  })
})
