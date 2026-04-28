import { describe, it, expect } from 'vitest'
import { transformTreeProps } from './transformProps'
import type { ChartProps, TreeFormData } from '../types'

const baseFormData: TreeFormData = {
  vizType: 'tree',
  groupby: ['region', 'country'],
  metric: 'sales',
  layout: 'orthogonal',
  orient: 'LR',
  symbolSize: 10,
  showLabels: true,
  rootName: 'All',
  numberFormat: 'smart',
}

const baseData = [
  { region: 'NA', country: 'US', sales: 1200 },
  { region: 'NA', country: 'CA', sales: 400 },
  { region: 'EU', country: 'DE', sales: 800 },
]

function makeProps(
  overrides: Partial<TreeFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<TreeFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 500,
  }
}

describe('transformTreeProps', () => {
  it('synthesizes an All root when there are multiple top-level groups', () => {
    const result = transformTreeProps(makeProps())
    type Node = { name: string; children?: Node[] }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const root = opts.series[0].data[0]
    expect(root.name).toBe('All')
    expect(root.children!.map((c) => c.name).sort()).toEqual(['EU', 'NA'])
  })

  it('uses the single top-level group directly when there is only one', () => {
    const data = [
      { region: 'NA', country: 'US', sales: 100 },
      { region: 'NA', country: 'CA', sales: 50 },
    ]
    const result = transformTreeProps(makeProps({}, data))
    type Node = { name: string; children?: Node[] }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const root = opts.series[0].data[0]
    expect(root.name).toBe('NA')
    expect(root.children!.map((c) => c.name).sort()).toEqual(['CA', 'US'])
  })

  it('respects custom rootName', () => {
    const result = transformTreeProps(makeProps({ rootName: 'World' }))
    type Node = { name: string }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data[0].name).toBe('World')
  })

  it('respects layout=radial', () => {
    const result = transformTreeProps(makeProps({ layout: 'radial' }))
    const opts = result.echartOptions as { series: { layout: string; orient?: unknown }[] }
    expect(opts.series[0].layout).toBe('radial')
    // radial layout strips orient
    expect(opts.series[0].orient).toBeUndefined()
  })

  it('respects orthogonal orient override', () => {
    const result = transformTreeProps(makeProps({ orient: 'TB' }))
    const opts = result.echartOptions as { series: { layout: string; orient: string }[] }
    expect(opts.series[0].layout).toBe('orthogonal')
    expect(opts.series[0].orient).toBe('TB')
  })

  it('handles missing metric (uses count fallback) without throwing', () => {
    const data = [
      { region: 'NA', country: 'US' },
      { region: 'EU', country: 'DE' },
    ]
    const result = transformTreeProps(makeProps({ metric: undefined }, data))
    type Node = { name: string; children?: Node[] }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const root = opts.series[0].data[0]
    expect(root.name).toBe('All')
    expect(root.children).toHaveLength(2)
  })

  it('handles empty data without throwing', () => {
    const result = transformTreeProps(makeProps({}, []))
    type Node = { name: string; children?: unknown[] }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    const root = opts.series[0].data[0]
    expect(root.name).toBe('All')
    expect(root.children).toEqual([])
  })
})
