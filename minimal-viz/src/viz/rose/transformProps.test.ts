import { describe, it, expect } from 'vitest'
import { transformRoseProps } from './transformProps'
import type { ChartProps, RoseFormData } from '../types'

const baseFormData: RoseFormData = {
  vizType: 'rose',
  groupby: ['region'],
  metric: 'sales',
  roseType: 'radius',
  numberFormat: 'smart',
}

const baseData = [
  { region: 'NA', sales: 1200 },
  { region: 'EU', sales:  900 },
  { region: 'AS', sales: 1500 },
  { region: 'SA', sales:  300 },
]

function makeProps(
  overrides: Partial<RoseFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<RoseFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 500,
    height: 500,
  }
}

describe('transformRoseProps', () => {
  it('emits a pie series with roseType set to radius by default', () => {
    const result = transformRoseProps(makeProps())
    type Series = { type: string; roseType?: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('pie')
    expect(opts.series[0].roseType).toBe('radius')
  })

  it('respects roseType=area override', () => {
    const result = transformRoseProps(makeProps({ roseType: 'area' }))
    type Series = { roseType?: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].roseType).toBe('area')
  })

  it('builds 4 slices from input data', () => {
    const result = transformRoseProps(makeProps())
    type Series = { data: { name: string; value: number }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toHaveLength(4)
    expect(opts.series[0].data.map((d) => d.name).sort()).toEqual(['AS', 'EU', 'NA', 'SA'])
  })

  it('respects innerRadius/outerRadius for donut-rose', () => {
    const result = transformRoseProps(
      makeProps({ innerRadius: 30, outerRadius: 80 }),
    )
    type Series = { radius: string[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].radius).toEqual(['30%', '80%'])
  })

  it('handles empty data without throwing', () => {
    const result = transformRoseProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toEqual([])
  })
})
