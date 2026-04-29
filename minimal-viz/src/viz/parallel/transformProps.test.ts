import { describe, it, expect } from 'vitest'
import { transformParallelCoordinatesProps } from './transformProps'
import type { ChartProps, ParallelCoordinatesFormData } from '../types'

const baseFormData: ParallelCoordinatesFormData = {
  vizType: 'parallel',
  dimensions: ['mpg', 'horsepower', 'weight', 'price'],
  seriesColumn: 'class',
  numberFormat: 'smart',
}

const baseData = [
  { class: 'compact', mpg: 32, horsepower: 110, weight: 2400, price: 18000 },
  { class: 'compact', mpg: 28, horsepower: 130, weight: 2700, price: 21000 },
  { class: 'sedan',   mpg: 24, horsepower: 180, weight: 3200, price: 28000 },
  { class: 'suv',     mpg: 20, horsepower: 250, weight: 4200, price: 42000 },
]

function makeProps(
  overrides: Partial<ParallelCoordinatesFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<ParallelCoordinatesFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 400,
  }
}

describe('transformParallelCoordinatesProps', () => {
  it('emits a parallelAxis entry per dimension', () => {
    const result = transformParallelCoordinatesProps(makeProps())
    type Axis = { dim: number; name: string }
    const opts = result.echartOptions as { parallelAxis: Axis[] }
    expect(opts.parallelAxis).toHaveLength(4)
    expect(opts.parallelAxis.map((a) => a.name)).toEqual(['mpg', 'horsepower', 'weight', 'price'])
    expect(opts.parallelAxis.map((a) => a.dim)).toEqual([0, 1, 2, 3])
  })

  it('groups lines by seriesColumn when provided', () => {
    const result = transformParallelCoordinatesProps(makeProps())
    type Series = { type: string; name: string; data: number[][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(3) // compact, sedan, suv
    const compact = opts.series.find((s) => s.name === 'compact')!
    expect(compact.data).toHaveLength(2)
    expect(compact.data[0]).toEqual([32, 110, 2400, 18000])
  })

  it('produces a single anonymous series when seriesColumn is omitted', () => {
    const result = transformParallelCoordinatesProps(
      makeProps({ seriesColumn: undefined }),
    )
    type Series = { type: string; name: string; data: number[][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toHaveLength(1)
    expect(opts.series[0].name).toBe('')
    expect(opts.series[0].data).toHaveLength(4)
  })

  it('series.type is parallel for every emitted series', () => {
    const result = transformParallelCoordinatesProps(makeProps())
    type Series = { type: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series.every((s) => s.type === 'parallel')).toBe(true)
  })

  it('null-fills non-numeric or missing dimension values', () => {
    const data = [
      { class: 'A', mpg: 30, horsepower: 'oops', weight: 2500, price: 20000 },
      { class: 'A', mpg: 25, horsepower: 150,    weight: NaN,  price: 25000 },
    ]
    const result = transformParallelCoordinatesProps(makeProps({}, data))
    type Series = { data: (number | null)[][] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data[0][1]).toBeNull()
    expect(opts.series[0].data[1][2]).toBeNull()
  })

  it('respects lineOpacity override', () => {
    const result = transformParallelCoordinatesProps(makeProps({ lineOpacity: 0.2 }))
    type Series = { lineStyle: { opacity: number } }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].lineStyle.opacity).toBe(0.2)
  })

  it('handles empty data without throwing', () => {
    const result = transformParallelCoordinatesProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series).toEqual([])
  })
})
