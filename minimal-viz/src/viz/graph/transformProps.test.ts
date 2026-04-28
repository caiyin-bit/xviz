import { describe, it, expect } from 'vitest'
import { transformGraphProps } from './transformProps'
import type { ChartProps, GraphFormData } from '../types'

const baseFormData: GraphFormData = {
  vizType: 'graph',
  source: 'from',
  target: 'to',
  metric: 'weight',
  layout: 'force',
  symbolSize: 12,
  showLabels: true,
  numberFormat: 'smart',
}

const baseData = [
  { from: 'A', to: 'B', weight: 5 },
  { from: 'B', to: 'C', weight: 3 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'C', to: 'D', weight: 4 },
]

function makeProps(
  overrides: Partial<GraphFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<GraphFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 500,
  }
}

describe('transformGraphProps', () => {
  it('infers nodes from edge endpoints (unique source ∪ target)', () => {
    const result = transformGraphProps(makeProps())
    type Series = { data: { name: string }[]; links: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    const names = opts.series[0].data.map((n) => n.name).sort()
    expect(names).toEqual(['A', 'B', 'C', 'D'])
    expect(opts.series[0].links).toHaveLength(4)
  })

  it('aggregates incident edge weights into node values', () => {
    const result = transformGraphProps(makeProps())
    type Node = { name: string; value: number }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const byName: Record<string, number> = {}
    for (const n of opts.series[0].data) byName[n.name] = n.value
    // A: edges to B (5) + to C (2) = 7
    // B: edge from A (5) + to C (3)   = 8
    // C: from B (3) + from A (2) + to D (4) = 9
    // D: from C (4) = 4
    expect(byName.A).toBe(7)
    expect(byName.B).toBe(8)
    expect(byName.C).toBe(9)
    expect(byName.D).toBe(4)
  })

  it('falls back to weight=1 per edge when metric is absent', () => {
    const data = [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'A', to: 'C' },
    ]
    const result = transformGraphProps(makeProps({ metric: undefined }, data))
    type Node = { name: string; value: number }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const byName: Record<string, number> = {}
    for (const n of opts.series[0].data) byName[n.name] = n.value
    // A: deg 2, B: deg 2, C: deg 2
    expect(byName.A).toBe(2)
    expect(byName.B).toBe(2)
    expect(byName.C).toBe(2)
  })

  it('skips rows with empty source or target', () => {
    const data = [
      { from: 'A', to: 'B', weight: 5 },
      { from: '',  to: 'C', weight: 1 },
      { from: 'D', to: '',  weight: 1 },
    ]
    const result = transformGraphProps(makeProps({}, data))
    type Series = { data: { name: string }[]; links: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data.map((n) => n.name).sort()).toEqual(['A', 'B'])
    expect(opts.series[0].links).toHaveLength(1)
  })

  it('respects layout=circular override', () => {
    const result = transformGraphProps(makeProps({ layout: 'circular' }))
    const opts = result.echartOptions as { series: { layout: string }[] }
    expect(opts.series[0].layout).toBe('circular')
  })

  it('disables force-layout animation for headless rendering', () => {
    const result = transformGraphProps(makeProps())
    const opts = result.echartOptions as {
      series: { force?: { layoutAnimation?: boolean } }[]
    }
    expect(opts.series[0].force?.layoutAnimation).toBe(false)
  })

  it('handles empty data without throwing', () => {
    const result = transformGraphProps(makeProps({}, []))
    type Series = { data: unknown[]; links: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toEqual([])
    expect(opts.series[0].links).toEqual([])
  })
})
