import { describe, it, expect } from 'vitest'
import { transformGanttProps } from './transformProps'
import type { ChartProps, GanttFormData } from '../types'

const baseFormData: GanttFormData = {
  vizType: 'gantt',
  taskColumn: 'task',
  startColumn: 'start',
  endColumn: 'end',
  groupColumn: 'owner',
  showLabels: true,
  numberFormat: 'smart',
}

const baseData = [
  { task: 'Design',  owner: 'Alice', start: '2024-01-01', end: '2024-02-15' },
  { task: 'Build',   owner: 'Bob',   start: '2024-02-10', end: '2024-04-30' },
  { task: 'Test',    owner: 'Alice', start: '2024-04-15', end: '2024-05-31' },
  { task: 'Release', owner: 'Carol', start: '2024-06-01', end: '2024-06-15' },
]

function makeProps(
  overrides: Partial<GanttFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<GanttFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 900,
    height: 360,
  }
}

describe('transformGanttProps', () => {
  it('emits a custom series with one bar per task', () => {
    const result = transformGanttProps(makeProps())
    type Series = { type: string; data: { value: unknown[] }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('custom')
    expect(opts.series[0].data).toHaveLength(4)
  })

  it('parses date strings into epoch ms in the value tuple', () => {
    const result = transformGanttProps(makeProps())
    type Series = { data: { value: [number, number, number, string, string, string] }[] }
    const opts = result.echartOptions as { series: Series[] }
    const first = opts.series[0].data[0].value
    expect(first[0]).toBe(0) // y index
    expect(first[1]).toBe(Date.parse('2024-01-01'))
    expect(first[2]).toBe(Date.parse('2024-02-15'))
    expect(first[3]).toBe('Design')
    expect(first[4]).toBe('Alice')
  })

  it('uses category yAxis with task names in input order', () => {
    const result = transformGanttProps(makeProps())
    type Axis = { type: string; data: string[]; inverse?: boolean }
    const opts = result.echartOptions as { yAxis: Axis }
    expect(opts.yAxis.type).toBe('category')
    expect(opts.yAxis.data).toEqual(['Design', 'Build', 'Test', 'Release'])
    expect(opts.yAxis.inverse).toBe(true)
  })

  it('uses time xAxis', () => {
    const result = transformGanttProps(makeProps())
    type Axis = { type: string }
    const opts = result.echartOptions as { xAxis: Axis }
    expect(opts.xAxis.type).toBe('time')
  })

  it('shares color across tasks with the same owner', () => {
    const result = transformGanttProps(makeProps())
    type Series = { data: { itemStyle: { color: string } }[] }
    const opts = result.echartOptions as { series: Series[] }
    const colorByIndex = opts.series[0].data.map((d) => d.itemStyle.color)
    // Design (Alice, 0) and Test (Alice, 2) share a color
    expect(colorByIndex[0]).toBe(colorByIndex[2])
    // Build (Bob, 1) and Release (Carol, 3) differ from each other and from Alice
    expect(colorByIndex[1]).not.toBe(colorByIndex[0])
    expect(colorByIndex[3]).not.toBe(colorByIndex[0])
    expect(colorByIndex[3]).not.toBe(colorByIndex[1])
  })

  it('drops rows with non-parseable dates', () => {
    const data = [
      { task: 'Good',  owner: 'A', start: '2024-01-01', end: '2024-02-01' },
      { task: 'Bad',   owner: 'B', start: 'oops',       end: '2024-03-01' },
      { task: 'Empty', owner: 'C', start: '',           end: '' },
    ]
    const result = transformGanttProps(makeProps({}, data))
    type Series = { data: unknown[] }
    type Axis = { data: string[] }
    const opts = result.echartOptions as { series: Series[]; yAxis: Axis }
    expect(opts.series[0].data).toHaveLength(1)
    expect(opts.yAxis.data).toEqual(['Good'])
  })

  it('handles numeric epoch ms in date columns', () => {
    const data = [
      { task: 'A', owner: 'O', start: 1704067200000, end: 1706745600000 },
    ]
    const result = transformGanttProps(makeProps({}, data))
    type Series = { data: { value: [number, number, number, string, string, string] }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data[0].value[1]).toBe(1704067200000)
    expect(opts.series[0].data[0].value[2]).toBe(1706745600000)
  })

  it('handles empty data without throwing', () => {
    const result = transformGanttProps(makeProps({}, []))
    type Series = { data: unknown[] }
    type Axis = { data: string[] }
    const opts = result.echartOptions as { series: Series[]; yAxis: Axis }
    expect(opts.series[0].data).toEqual([])
    expect(opts.yAxis.data).toEqual([])
  })
})
