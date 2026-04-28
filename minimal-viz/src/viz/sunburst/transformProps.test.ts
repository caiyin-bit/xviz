import { describe, it, expect } from 'vitest'
import { transformSunburstProps } from './transformProps'
import type { ChartProps, SunburstFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: SunburstFormData = {
  vizType: 'sunburst',
  groupby: ['region', 'country'],
  metric: 'sales',
  showLabels: true,
  showValues: false,
  innerRadius: 0,
  outerRadius: 90,
  numberFormat: 'smart',
}

const baseData = [
  { region: 'NA', country: 'US', sales: 1200 },
  { region: 'NA', country: 'CA', sales: 400 },
  { region: 'EU', country: 'DE', sales: 800 },
  { region: 'AS', country: 'JP', sales: 700 },
  { region: 'AS', country: 'CN', sales: 1500 },
]

function makeProps(
  overrides: Partial<SunburstFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<SunburstFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 400,
  }
}

describe('transformSunburstProps', () => {
  it('builds a 2-level hierarchy and emits a sunburst series', () => {
    const result = transformSunburstProps(makeProps())
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "series": [
            {
              "data": [
                {
                  "children": [
                    {
                      "itemStyle": {
                        "color": "#454E7C",
                      },
                      "name": "US",
                      "value": 1200,
                    },
                    {
                      "itemStyle": {
                        "color": "#5AC189",
                      },
                      "name": "CA",
                      "value": 400,
                    },
                  ],
                  "itemStyle": {
                    "color": "#1FA8C9",
                  },
                  "name": "NA",
                },
                {
                  "children": [
                    {
                      "itemStyle": {
                        "color": "#666666",
                      },
                      "name": "DE",
                      "value": 800,
                    },
                  ],
                  "itemStyle": {
                    "color": "#FF7F44",
                  },
                  "name": "EU",
                },
                {
                  "children": [
                    {
                      "itemStyle": {
                        "color": "#FCC700",
                      },
                      "name": "JP",
                      "value": 700,
                    },
                    {
                      "itemStyle": {
                        "color": "#A868B7",
                      },
                      "name": "CN",
                      "value": 1500,
                    },
                  ],
                  "itemStyle": {
                    "color": "#E04355",
                  },
                  "name": "AS",
                },
              ],
              "emphasis": {
                "focus": "ancestor",
              },
              "itemStyle": {
                "borderColor": "#fff",
                "borderWidth": 1,
              },
              "label": {
                "formatter": "[Function]",
                "minAngle": 5,
                "show": true,
              },
              "radius": [
                "0%",
                "90%",
              ],
              "type": "sunburst",
            },
          ],
          "tooltip": {
            "formatter": "[Function]",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('respects innerRadius/outerRadius for donut-shaped sunburst', () => {
    const result = transformSunburstProps(
      makeProps({ innerRadius: 30, outerRadius: 80 }),
    )
    const opts = result.echartOptions as { series: { radius: string[] }[] }
    expect(opts.series[0].radius).toEqual(['30%', '80%'])
  })

  it('handles single-level groupby', () => {
    const result = transformSunburstProps(
      makeProps({ groupby: ['region'] }, [
        { region: 'NA', sales: 1600 },
        { region: 'EU', sales: 800 },
      ]),
    )
    type Node = { name: string; value?: number; children?: unknown }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data.map((n) => n.name).sort()).toEqual(['EU', 'NA'])
    expect(opts.series[0].data.every((n) => !n.children)).toBe(true)
  })

  it('drops rows with non-numeric metric', () => {
    const data = [
      { region: 'NA', country: 'US', sales: 100 },
      { region: 'EU', country: 'DE', sales: 'oops' },
    ]
    const result = transformSunburstProps(makeProps({}, data))
    type Node = { name: string }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data).toHaveLength(1)
    expect(opts.series[0].data[0].name).toBe('NA')
  })

  it('handles empty data', () => {
    const result = transformSunburstProps(makeProps({}, []))
    type Node = { name: string }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data).toEqual([])
  })
})
