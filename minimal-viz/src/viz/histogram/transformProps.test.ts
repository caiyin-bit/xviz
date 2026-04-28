import { describe, it, expect } from 'vitest'
import { transformHistogramProps } from './transformProps'
import type { ChartProps, HistogramFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: HistogramFormData = {
  vizType: 'histogram',
  metric: 'value',
  bins: 5,
  density: false,
  cumulative: false,
  showLegend: false,
  legendOrientation: 'top',
  numberFormat: 'smart',
}

// 20 observations spanning 0..100 — 5 bins of width 20 → counts [4,4,4,4,4]
const evenData = [
  0, 5, 10, 15,
  20, 25, 30, 35,
  40, 45, 50, 55,
  60, 65, 70, 75,
  80, 85, 90, 100,
].map((value) => ({ value }))

const skewData = [
  ...Array.from({ length: 16 }, (_, i) => ({ value: i })),
  { value: 50 }, { value: 50 },
  { value: 90 }, { value: 100 },
]

function makeProps(
  overrides: Partial<HistogramFormData> = {},
  data: { value: number }[] = evenData,
): ChartProps<HistogramFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data }],
    width: 600,
    height: 400,
  }
}

describe('transformHistogramProps', () => {
  it('produces equal-width counts on uniformly distributed data', () => {
    const result = transformHistogramProps(makeProps())
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "legend": {
            "show": false,
          },
          "series": [
            {
              "barCategoryGap": "5%",
              "data": [
                4,
                4,
                4,
                4,
                4,
              ],
              "itemStyle": {
                "color": "#1FA8C9",
              },
              "name": "count(value)",
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
            "axisLabel": {
              "rotate": 0,
            },
            "data": [
              "0–20)",
              "20–40)",
              "40–60)",
              "60–80)",
              "80–100]",
            ],
            "name": "value",
            "nameGap": 28,
            "nameLocation": "middle",
            "type": "category",
          },
          "yAxis": {
            "axisLabel": {
              "formatter": "[Function]",
            },
            "name": "count",
            "nameGap": 36,
            "nameLocation": "middle",
            "type": "value",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('density mode normalizes counts to (count / (n · binWidth))', () => {
    const result = transformHistogramProps(makeProps({ density: true }))
    const opts = result.echartOptions as { series: { data: number[] }[] }
    expect(opts.series[0].data).toEqual([0.01, 0.01, 0.01, 0.01, 0.01])
  })

  it('cumulative mode emits running sum (empirical CDF on density)', () => {
    const result = transformHistogramProps(
      makeProps({ density: true, cumulative: true }),
    )
    const opts = result.echartOptions as { series: { data: number[] }[] }
    expect(opts.series[0].data.map((v) => Number(v.toFixed(2))))
      .toEqual([0.01, 0.02, 0.03, 0.04, 0.05])
  })

  it('skewed distribution puts most mass in the first bin', () => {
    const result = transformHistogramProps(makeProps({}, skewData))
    const opts = result.echartOptions as { series: { data: number[] }[] }
    expect(opts.series[0].data).toEqual([16, 0, 2, 0, 2])
  })

  it('handles empty data without throwing', () => {
    const result = transformHistogramProps(makeProps({}, []))
    const opts = result.echartOptions as {
      series: { data: number[] }[]
      xAxis: { data: string[] }
    }
    expect(opts.series[0].data).toEqual([])
    expect(opts.xAxis.data).toEqual([])
  })

  it('handles all-identical values (degenerate range) with a single bucket', () => {
    const result = transformHistogramProps(
      makeProps({}, [{ value: 5 }, { value: 5 }, { value: 5 }]),
    )
    const opts = result.echartOptions as {
      series: { data: number[] }[]
      xAxis: { data: string[] }
    }
    expect(opts.series[0].data).toEqual([3])
    expect(opts.xAxis.data).toHaveLength(1)
  })
})
