import { describe, it, expect } from 'vitest'
import { transformChordProps } from './transformProps'
import type { ChartProps, ChordFormData } from '../types'

const baseFormData: ChordFormData = {
  vizType: 'chord',
  source: 'from',
  target: 'to',
  metric: 'flow',
  numberFormat: 'smart',
}

const baseData = [
  { from: 'NA', to: 'EU', flow: 100 },
  { from: 'NA', to: 'AS', flow: 200 },
  { from: 'EU', to: 'AS', flow: 150 },
  { from: 'AS', to: 'NA', flow:  80 },
]

function makeProps(
  overrides: Partial<ChordFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<ChordFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 600,
  }
}

describe('transformChordProps', () => {
  it('emits a chord series with auto-inferred nodes', () => {
    const result = transformChordProps(makeProps())
    type Series = { type: string; data: { name: string }[]; edges: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('chord')
    const names = opts.series[0].data.map((n) => n.name).sort()
    expect(names).toEqual(['AS', 'EU', 'NA'])
    expect(opts.series[0].edges).toHaveLength(4)
  })

  it('aggregates incident edge weights into node values', () => {
    const result = transformChordProps(makeProps())
    type Node = { name: string; value: number }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const byName: Record<string, number> = {}
    for (const n of opts.series[0].data) byName[n.name] = n.value
    // NA: 100 (NA→EU) + 200 (NA→AS) + 80 (AS→NA) = 380
    // EU: 100 (NA→EU) + 150 (EU→AS) = 250
    // AS: 200 (NA→AS) + 150 (EU→AS) + 80 (AS→NA) = 430
    expect(byName.NA).toBe(380)
    expect(byName.EU).toBe(250)
    expect(byName.AS).toBe(430)
  })

  it('uses weight=1 per edge when metric is absent', () => {
    const data = [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
    ]
    const result = transformChordProps(makeProps({ metric: undefined }, data))
    type Edge = { value: number }
    const opts = result.echartOptions as { series: { edges: Edge[] }[] }
    expect(opts.series[0].edges.every((e) => e.value === 1)).toBe(true)
  })

  it('skips rows with empty source or target', () => {
    const data = [
      { from: 'A', to: 'B', flow: 5 },
      { from: '',  to: 'C', flow: 1 },
      { from: 'D', to: '',  flow: 1 },
    ]
    const result = transformChordProps(makeProps({}, data))
    type Series = { data: { name: string }[]; edges: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data.map((n) => n.name).sort()).toEqual(['A', 'B'])
    expect(opts.series[0].edges).toHaveLength(1)
  })

  it('handles empty data without throwing', () => {
    const result = transformChordProps(makeProps({}, []))
    type Series = { data: unknown[]; edges: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toEqual([])
    expect(opts.series[0].edges).toEqual([])
  })
})
