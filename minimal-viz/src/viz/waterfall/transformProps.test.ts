import { describe, it, expect } from 'vitest'
import { transformWaterfallProps } from './transformProps'
import type { ChartProps, WaterfallFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: WaterfallFormData = {
  vizType: 'waterfall',
  groupby: 'period',
  metric: 'delta',
  showTotal: true,
  totalLabel: 'Total',
  showValues: true,
  numberFormat: 'smart',
}

const baseData = [
  { period: 'Q1', delta: 100 },
  { period: 'Q2', delta: 50 },
  { period: 'Q3', delta: -30 },
  { period: 'Q4', delta: 80 },
]

function makeProps(
  overrides: Partial<WaterfallFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<WaterfallFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 700,
    height: 420,
  }
}

describe('transformWaterfallProps', () => {
  it('walks a sequence with positives, negatives and a total', () => {
    const result = transformWaterfallProps(makeProps())
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "legend": {
            "show": false,
          },
          "series": [
            {
              "data": [
                0,
                100,
                120,
                120,
                0,
              ],
              "emphasis": {
                "itemStyle": {
                  "borderColor": "transparent",
                  "color": "transparent",
                },
              },
              "itemStyle": {
                "borderColor": "transparent",
                "color": "transparent",
              },
              "name": "placeholder",
              "silent": true,
              "stack": "total",
              "type": "bar",
            },
            {
              "data": [
                {
                  "itemStyle": {
                    "color": "#5AC189",
                  },
                  "signedValue": 100,
                  "value": 100,
                },
                {
                  "itemStyle": {
                    "color": "#5AC189",
                  },
                  "signedValue": 50,
                  "value": 50,
                },
                {
                  "itemStyle": {
                    "color": "#E04355",
                  },
                  "signedValue": -30,
                  "value": 30,
                },
                {
                  "itemStyle": {
                    "color": "#5AC189",
                  },
                  "signedValue": 80,
                  "value": 80,
                },
                {
                  "isTotal": true,
                  "itemStyle": {
                    "color": "#1FA8C9",
                  },
                  "signedValue": 200,
                  "value": 200,
                },
              ],
              "label": {
                "formatter": "[Function]",
                "position": "top",
                "show": true,
              },
              "name": "delta",
              "stack": "total",
              "tooltip": {
                "formatter": "[Function]",
              },
              "type": "bar",
            },
          ],
          "tooltip": {
            "trigger": "item",
          },
          "xAxis": {
            "data": [
              "Q1",
              "Q2",
              "Q3",
              "Q4",
              "Total",
            ],
            "name": "",
            "nameGap": 28,
            "nameLocation": "middle",
            "type": "category",
          },
          "yAxis": {
            "axisLabel": {
              "formatter": "[Function]",
            },
            "name": "delta",
            "nameGap": 36,
            "nameLocation": "middle",
            "type": "value",
          },
        },
        "height": 420,
        "width": 700,
      }
    `)
  })

  it('skips the total bar when showTotal=false', () => {
    const result = transformWaterfallProps(makeProps({ showTotal: false }))
    const opts = result.echartOptions as { xAxis: { data: string[] } }
    expect(opts.xAxis.data).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })

  it('produces correct placeholder offsets for an all-positive sequence', () => {
    const data = [
      { period: 'A', delta: 10 },
      { period: 'B', delta: 20 },
      { period: 'C', delta: 30 },
    ]
    const result = transformWaterfallProps(makeProps({ showTotal: false }, data))
    const opts = result.echartOptions as { series: { data: number[] }[] }
    expect(opts.series[0].data).toEqual([0, 10, 30])
  })

  it('places negative bars beneath the running total', () => {
    const data = [
      { period: 'A', delta: 50 },
      { period: 'B', delta: -20 },
    ]
    const result = transformWaterfallProps(makeProps({ showTotal: false }, data))
    const opts = result.echartOptions as {
      series: { data: number[] | { value: number }[] }[]
    }
    expect(opts.series[0].data).toEqual([0, 30])
    type Bar = { value: number }
    const visibleData = opts.series[1].data as Bar[]
    expect(visibleData.map((b) => b.value)).toEqual([50, 20])
  })

  it('drops rows with non-numeric metric', () => {
    const data = [
      { period: 'A', delta: 10 },
      { period: 'B', delta: 'oops' },
      { period: 'C', delta: 5 },
    ]
    const result = transformWaterfallProps(makeProps({ showTotal: false }, data))
    const opts = result.echartOptions as { xAxis: { data: string[] } }
    expect(opts.xAxis.data).toEqual(['A', 'C'])
  })

  it('handles empty data without throwing', () => {
    const result = transformWaterfallProps(makeProps({ showTotal: false }, []))
    const opts = result.echartOptions as {
      xAxis: { data: string[] }
      series: { data: unknown[] }[]
    }
    expect(opts.xAxis.data).toEqual([])
    expect(opts.series[0].data).toEqual([])
    expect(opts.series[1].data).toEqual([])
  })

  it('emits a Total bar with running sum and totalColor', () => {
    const result = transformWaterfallProps(
      makeProps({ totalColor: '#abcdef', totalLabel: 'Net' }),
    )
    const opts = result.echartOptions as {
      xAxis: { data: string[] }
      series: { data: { value: number; itemStyle: { color: string } }[] }[]
    }
    expect(opts.xAxis.data[opts.xAxis.data.length - 1]).toBe('Net')
    const visibles = opts.series[1].data
    const last = visibles[visibles.length - 1]
    expect(last.value).toBe(200)
    expect(last.itemStyle.color).toBe('#abcdef')
  })
})
