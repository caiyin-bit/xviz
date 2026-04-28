import { describe, it, expect } from 'vitest'
import { transformStepProps } from './transformProps'
import type { ChartProps, StepFormData } from '../types'

const baseFormData: StepFormData = {
  vizType: 'step',
  xAxis: 'date',
  metrics: ['value'],
  step: 'end',
  showDots: true,
  showLegend: true,
  legendOrientation: 'top',
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01', value: 10 },
  { date: '2024-02', value: 20 },
  { date: '2024-03', value: 15 },
  { date: '2024-04', value: 30 },
]

function makeProps(
  overrides: Partial<StepFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<StepFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 700,
    height: 420,
  }
}

describe('transformStepProps', () => {
  it('emits one line series with step=end by default', () => {
    const result = transformStepProps(makeProps())
    type Series = { type: string; step?: string; data: number[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(1)
    expect(opts.series[0].type).toBe('line')
    expect(opts.series[0].step).toBe('end')
    expect(opts.series[0].data).toEqual([10, 20, 15, 30])
  })

  it('respects step=start override', () => {
    const result = transformStepProps(makeProps({ step: 'start' }))
    type Series = { step?: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].step).toBe('start')
  })

  it('respects step=middle override', () => {
    const result = transformStepProps(makeProps({ step: 'middle' }))
    type Series = { step?: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].step).toBe('middle')
  })

  it('produces multi-series step lines when seriesColumn is set', () => {
    const data = [
      { date: '2024-01', region: 'NA', value: 10 },
      { date: '2024-01', region: 'EU', value: 8 },
      { date: '2024-02', region: 'NA', value: 20 },
      { date: '2024-02', region: 'EU', value: 12 },
    ]
    const result = transformStepProps(
      makeProps({ seriesColumn: 'region', step: 'middle' }, data),
    )
    type Series = { name: string; type: string; step?: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(2)
    expect(opts.series.every((s) => s.type === 'line' && s.step === 'middle')).toBe(true)
    expect(opts.series.map((s) => s.name).sort()).toEqual(['EU', 'NA'])
  })

  it('passes xAxis category labels through unchanged', () => {
    const result = transformStepProps(makeProps())
    type Axis = { type: string; data: string[] }
    const opts = result.echartOptions as { xAxis: Axis }
    expect(opts.xAxis.type).toBe('category')
    expect(opts.xAxis.data).toEqual(['2024-01', '2024-02', '2024-03', '2024-04'])
  })

  it('handles empty data without throwing', () => {
    const result = transformStepProps(makeProps({}, []))
    type Series = { data: number[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toEqual([])
  })
})
