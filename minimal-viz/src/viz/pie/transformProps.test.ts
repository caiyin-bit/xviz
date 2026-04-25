import { describe, it, expect } from 'vitest'
import { transformPieProps } from './transformProps'
import type { ChartProps, PieFormData } from '../types'

// Strip functions so the snapshot is stable and human-readable.
function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: PieFormData = {
  vizType: 'pie',
  groupby: ['region'],
  metric: 'sales',
  donut: true,
  innerRadius: 40,
  outerRadius: 70,
  labelType: 'key_percent',
  showLabels: true,
  labelsOutside: true,
  showLegend: true,
  legendOrientation: 'top',
  numberFormat: 'smart',
  thresholdForOther: 0,
  showTotal: true,
}

const baseData = [
  { region: 'NA', sales: 1200 },
  { region: 'EU', sales: 900 },
  { region: 'AS', sales: 1500 },
]

function makeProps(
  overrides: Partial<PieFormData> = {},
  data = baseData,
): ChartProps<PieFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data }],
    width: 600,
    height: 400,
  }
}

describe('transformPieProps', () => {
  it('produces a donut option for the basic 3-region case', () => {
    const result = transformPieProps(makeProps())
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "graphic": {
            "left": "center",
            "style": {
              "fill": "#222",
              "fontSize": 16,
              "fontWeight": "bold",
              "text": "Total: 3.6K",
            },
            "top": "middle",
            "type": "text",
          },
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 24,
          },
          "series": [
            {
              "avoidLabelOverlap": true,
              "center": [
                "50%",
                "50%",
              ],
              "data": [
                {
                  "itemStyle": {
                    "color": "#1FA8C9",
                  },
                  "name": "NA",
                  "value": 1200,
                },
                {
                  "itemStyle": {
                    "color": "#454E7C",
                  },
                  "name": "EU",
                  "value": 900,
                },
                {
                  "itemStyle": {
                    "color": "#5AC189",
                  },
                  "name": "AS",
                  "value": 1500,
                },
              ],
              "emphasis": {
                "label": {
                  "fontWeight": "bold",
                  "show": true,
                },
              },
              "label": {
                "formatter": "[Function]",
                "position": "outer",
                "show": true,
              },
              "labelLine": {
                "show": true,
              },
              "radius": [
                "40%",
                "70%",
              ],
              "type": "pie",
            },
          ],
          "tooltip": {
            "formatter": "[Function]",
            "trigger": "item",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('buckets small slices into "Other" when thresholdForOther > 0', () => {
    const data = [
      { region: 'NA', sales: 1000 },
      { region: 'EU', sales: 50 },  // 4.5% — below threshold
      { region: 'AS', sales: 50 },  // 4.5% — below threshold
    ]
    const result = transformPieProps(
      makeProps({ thresholdForOther: 5 }, data),
    )
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "graphic": {
            "left": "center",
            "style": {
              "fill": "#222",
              "fontSize": 16,
              "fontWeight": "bold",
              "text": "Total: 1.1K",
            },
            "top": "middle",
            "type": "text",
          },
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 24,
          },
          "series": [
            {
              "avoidLabelOverlap": true,
              "center": [
                "50%",
                "50%",
              ],
              "data": [
                {
                  "itemStyle": {
                    "color": "#1FA8C9",
                  },
                  "name": "NA",
                  "value": 1000,
                },
                {
                  "itemStyle": {
                    "color": "#888",
                  },
                  "name": "Other",
                  "value": 100,
                },
              ],
              "emphasis": {
                "label": {
                  "fontWeight": "bold",
                  "show": true,
                },
              },
              "label": {
                "formatter": "[Function]",
                "position": "outer",
                "show": true,
              },
              "labelLine": {
                "show": true,
              },
              "radius": [
                "40%",
                "70%",
              ],
              "type": "pie",
            },
          ],
          "tooltip": {
            "formatter": "[Function]",
            "trigger": "item",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('omits the showTotal graphic when disabled', () => {
    const result = transformPieProps(makeProps({ showTotal: false }))
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 24,
          },
          "series": [
            {
              "avoidLabelOverlap": true,
              "center": [
                "50%",
                "50%",
              ],
              "data": [
                {
                  "itemStyle": {
                    "color": "#1FA8C9",
                  },
                  "name": "NA",
                  "value": 1200,
                },
                {
                  "itemStyle": {
                    "color": "#454E7C",
                  },
                  "name": "EU",
                  "value": 900,
                },
                {
                  "itemStyle": {
                    "color": "#5AC189",
                  },
                  "name": "AS",
                  "value": 1500,
                },
              ],
              "emphasis": {
                "label": {
                  "fontWeight": "bold",
                  "show": true,
                },
              },
              "label": {
                "formatter": "[Function]",
                "position": "outer",
                "show": true,
              },
              "labelLine": {
                "show": true,
              },
              "radius": [
                "40%",
                "70%",
              ],
              "type": "pie",
            },
          ],
          "tooltip": {
            "formatter": "[Function]",
            "trigger": "item",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })
})
