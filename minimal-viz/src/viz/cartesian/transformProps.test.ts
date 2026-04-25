import { describe, it, expect } from 'vitest'
import { transformCartesianProps } from './transformProps'
import type { ChartProps, CartesianFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseData = [
  { month: '2024-01', region: 'NA', revenue: 1000 },
  { month: '2024-02', region: 'NA', revenue: 1200 },
  { month: '2024-01', region: 'EU', revenue: 800 },
  { month: '2024-02', region: 'EU', revenue: 950 },
]

function makeProps(
  formOverrides: Partial<CartesianFormData> = {},
): ChartProps<CartesianFormData> {
  return {
    formData: {
      vizType: 'bar',
      xAxis: 'month',
      metrics: ['revenue'],
      seriesColumn: 'region',
      stacked: false,
      horizontal: false,
      smooth: false,
      area: false,
      showDots: true,
      showValues: false,
      showLegend: true,
      legendOrientation: 'top',
      numberFormat: 'smart',
      ...formOverrides,
    } as CartesianFormData,
    queriesData: [{ data: baseData }],
    width: 600,
    height: 400,
  }
}

describe('transformCartesianProps', () => {
  it('produces a stacked bar option with breakdown by region', () => {
    const result = transformCartesianProps(makeProps({ stacked: true }))
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "grid": {
            "bottom": 48,
            "left": 56,
            "right": 24,
            "top": 48,
          },
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 8,
          },
          "series": [
            {
              "data": [
                1000,
                1200,
              ],
              "itemStyle": {
                "color": "#1FA8C9",
              },
              "label": {
                "show": false,
              },
              "name": "NA",
              "showSymbol": false,
              "smooth": false,
              "stack": "total",
              "symbolSize": 6,
              "type": "bar",
            },
            {
              "data": [
                800,
                950,
              ],
              "itemStyle": {
                "color": "#454E7C",
              },
              "label": {
                "show": false,
              },
              "name": "EU",
              "showSymbol": false,
              "smooth": false,
              "stack": "total",
              "symbolSize": 6,
              "type": "bar",
            },
          ],
          "tooltip": {
            "axisPointer": {
              "type": "shadow",
            },
            "trigger": "axis",
            "valueFormatter": "[Function]",
          },
          "xAxis": {
            "data": [
              "2024-01",
              "2024-02",
            ],
            "nameGap": 28,
            "nameLocation": "middle",
            "type": "category",
          },
          "yAxis": {
            "axisLabel": {
              "formatter": "[Function]",
            },
            "nameGap": 40,
            "nameLocation": "middle",
            "type": "value",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('produces a smooth line option when vizType is line', () => {
    const result = transformCartesianProps(
      makeProps({ vizType: 'line', smooth: true, area: true }),
    )
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "grid": {
            "bottom": 48,
            "left": 56,
            "right": 24,
            "top": 48,
          },
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 8,
          },
          "series": [
            {
              "areaStyle": {
                "opacity": 0.25,
              },
              "data": [
                1000,
                1200,
              ],
              "itemStyle": {
                "color": "#1FA8C9",
              },
              "label": {
                "show": false,
              },
              "name": "NA",
              "showSymbol": true,
              "smooth": true,
              "symbolSize": 6,
              "type": "line",
            },
            {
              "areaStyle": {
                "opacity": 0.25,
              },
              "data": [
                800,
                950,
              ],
              "itemStyle": {
                "color": "#454E7C",
              },
              "label": {
                "show": false,
              },
              "name": "EU",
              "showSymbol": true,
              "smooth": true,
              "symbolSize": 6,
              "type": "line",
            },
          ],
          "tooltip": {
            "axisPointer": {
              "type": "line",
            },
            "trigger": "axis",
            "valueFormatter": "[Function]",
          },
          "xAxis": {
            "data": [
              "2024-01",
              "2024-02",
            ],
            "nameGap": 28,
            "nameLocation": "middle",
            "type": "category",
          },
          "yAxis": {
            "axisLabel": {
              "formatter": "[Function]",
            },
            "nameGap": 40,
            "nameLocation": "middle",
            "type": "value",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('handles single metric without breakdown', () => {
    const data = [
      { month: '2024-01', revenue: 1800 },
      { month: '2024-02', revenue: 2150 },
    ]
    const result = transformCartesianProps({
      formData: {
        vizType: 'bar',
        xAxis: 'month',
        metrics: ['revenue'],
      } as CartesianFormData,
      queriesData: [{ data }],
      width: 600,
      height: 400,
    })
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "grid": {
            "bottom": 48,
            "left": 56,
            "right": 24,
            "top": 48,
          },
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 8,
          },
          "series": [
            {
              "data": [
                1800,
                2150,
              ],
              "itemStyle": {
                "color": "#1FA8C9",
              },
              "label": {
                "show": false,
              },
              "name": "revenue",
              "showSymbol": false,
              "smooth": false,
              "symbolSize": 6,
              "type": "bar",
            },
          ],
          "tooltip": {
            "axisPointer": {
              "type": "shadow",
            },
            "trigger": "axis",
            "valueFormatter": "[Function]",
          },
          "xAxis": {
            "data": [
              "2024-01",
              "2024-02",
            ],
            "nameGap": 28,
            "nameLocation": "middle",
            "type": "category",
          },
          "yAxis": {
            "axisLabel": {
              "formatter": "[Function]",
            },
            "nameGap": 40,
            "nameLocation": "middle",
            "type": "value",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })
})
