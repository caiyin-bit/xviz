import { describe, it, expect } from 'vitest'
import { transformBoxPlotProps } from './transformProps'
import type { ChartProps, BoxPlotFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: BoxPlotFormData = {
  vizType: 'boxplot',
  groupby: 'team',
  metric: 'score',
  whiskerType: 'tukey',
  showOutliers: true,
  horizontal: false,
  showLegend: false,
  legendOrientation: 'top',
  numberFormat: 'smart',
}

// Two teams with clear-cut distributions; team B has one outlier (1000) under Tukey rule.
const baseData = [
  { team: 'A', score: 10 }, { team: 'A', score: 12 }, { team: 'A', score: 14 },
  { team: 'A', score: 16 }, { team: 'A', score: 18 }, { team: 'A', score: 20 },
  { team: 'A', score: 22 }, { team: 'A', score: 24 }, { team: 'A', score: 26 },
  { team: 'B', score: 30 }, { team: 'B', score: 32 }, { team: 'B', score: 34 },
  { team: 'B', score: 36 }, { team: 'B', score: 38 }, { team: 'B', score: 40 },
  { team: 'B', score: 42 }, { team: 'B', score: 44 }, { team: 'B', score: 1000 },
]

function makeProps(
  overrides: Partial<BoxPlotFormData> = {},
  data = baseData,
): ChartProps<BoxPlotFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data }],
    width: 600,
    height: 400,
  }
}

describe('transformBoxPlotProps', () => {
  it('produces 5-number-summary boxes plus outlier scatter for the two-team case', () => {
    const result = transformBoxPlotProps(makeProps())
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
                [
                  10,
                  14,
                  18,
                  22,
                  26,
                ],
                [
                  30,
                  34,
                  38,
                  42,
                  44,
                ],
              ],
              "itemStyle": {
                "borderColor": "#333",
                "color": "#1FA8C9",
              },
              "name": "score",
              "tooltip": {
                "formatter": "[Function]",
              },
              "type": "boxplot",
            },
            {
              "data": [
                [
                  1,
                  1000,
                ],
              ],
              "itemStyle": {
                "color": "#d9534f",
              },
              "name": "outliers",
              "symbolSize": 6,
              "tooltip": {
                "formatter": "[Function]",
              },
              "type": "scatter",
            },
          ],
          "tooltip": {
            "trigger": "item",
          },
          "xAxis": {
            "data": [
              "A",
              "B",
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
            "name": "",
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

  it('omits outlier series when showOutliers=false', () => {
    const result = transformBoxPlotProps(makeProps({ showOutliers: false }))
    const opts = result.echartOptions as { series: { type: string }[] }
    expect(opts.series).toHaveLength(1)
    expect(opts.series[0].type).toBe('boxplot')
  })

  it('omits outlier series when whiskerType=min-max (no Tukey fence)', () => {
    const result = transformBoxPlotProps(makeProps({ whiskerType: 'min-max' }))
    const opts = result.echartOptions as { series: { type: string }[] }
    expect(opts.series).toHaveLength(1)
  })

  it('swaps axes when horizontal=true', () => {
    const result = transformBoxPlotProps(makeProps({ horizontal: true }))
    const opts = result.echartOptions as {
      xAxis: { type: string }
      yAxis: { type: string; data?: string[] }
    }
    expect(opts.xAxis.type).toBe('value')
    expect(opts.yAxis.type).toBe('category')
    expect(opts.yAxis.data).toEqual(['A', 'B'])
  })
})
