import { describe, it, expect } from 'vitest'
import { transformTreemapProps } from './transformProps'
import type { ChartProps, TreemapFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: TreemapFormData = {
  vizType: 'treemap',
  groupby: ['region', 'country'],
  metric: 'sales',
  showLabels: true,
  showValues: false,
  showBreadcrumb: false,
  numberFormat: 'smart',
}

const baseData = [
  { region: 'NA', country: 'US', sales: 1200 },
  { region: 'NA', country: 'CA', sales: 400 },
  { region: 'EU', country: 'DE', sales: 800 },
  { region: 'EU', country: 'FR', sales: 600 },
  { region: 'AS', country: 'JP', sales: 700 },
  { region: 'AS', country: 'CN', sales: 1500 },
]

function makeProps(
  overrides: Partial<TreemapFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<TreemapFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 400,
  }
}

describe('transformTreemapProps', () => {
  it('builds a 2-level hierarchy from flat rows', () => {
    const result = transformTreemapProps(makeProps())
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "series": [
            {
              "breadcrumb": {
                "show": false,
              },
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
                    {
                      "itemStyle": {
                        "color": "#E04355",
                      },
                      "name": "FR",
                      "value": 600,
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
                        "color": "#A868B7",
                      },
                      "name": "JP",
                      "value": 700,
                    },
                    {
                      "itemStyle": {
                        "color": "#3CCCCB",
                      },
                      "name": "CN",
                      "value": 1500,
                    },
                  ],
                  "itemStyle": {
                    "color": "#FCC700",
                  },
                  "name": "AS",
                },
              ],
              "itemStyle": {
                "borderColor": "#fff",
                "borderWidth": 1,
                "gapWidth": 1,
              },
              "label": {
                "formatter": "[Function]",
                "show": true,
              },
              "levels": [
                {
                  "itemStyle": {
                    "borderColor": "#fff",
                    "borderWidth": 2,
                    "gapWidth": 2,
                  },
                },
                {
                  "itemStyle": {
                    "borderColor": "#fff",
                    "borderWidth": 1,
                    "gapWidth": 1,
                  },
                },
              ],
              "nodeClick": false,
              "roam": false,
              "type": "treemap",
              "upperLabel": {
                "height": 20,
                "show": true,
              },
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

  it('aggregates duplicate leaf rows under the same path', () => {
    const data = [
      { region: 'NA', country: 'US', sales: 100 },
      { region: 'NA', country: 'US', sales: 50 }, // same leaf — should sum
      { region: 'NA', country: 'CA', sales: 30 },
    ]
    const result = transformTreemapProps(makeProps({}, data))
    type Tree = { name: string; value?: number; children?: Tree[] }
    const opts = result.echartOptions as { series: { data: Tree[] }[] }
    const na = opts.series[0].data.find((n) => n.name === 'NA')!
    const us = na.children!.find((n) => n.name === 'US')!
    expect(us.value).toBe(150)
  })

  it('handles single-level groupby (flat treemap)', () => {
    const result = transformTreemapProps(
      makeProps({ groupby: ['region'] }, [
        { region: 'NA', sales: 1600 },
        { region: 'EU', sales: 1400 },
        { region: 'AS', sales: 2200 },
      ]),
    )
    type Node = { name: string; value?: number; children?: unknown }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data.map((n) => n.name).sort()).toEqual(['AS', 'EU', 'NA'])
    expect(opts.series[0].data.every((n) => !n.children)).toBe(true)
  })

  it('drops rows with non-numeric metric', () => {
    const data = [
      { region: 'NA', country: 'US', sales: 100 },
      { region: 'EU', country: 'DE', sales: 'oops' },
      { region: 'AS', country: 'JP', sales: NaN },
    ]
    const result = transformTreemapProps(makeProps({}, data))
    type Node = { name: string }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data).toHaveLength(1)
    expect(opts.series[0].data[0].name).toBe('NA')
  })

  it('handles empty data without throwing', () => {
    const result = transformTreemapProps(makeProps({}, []))
    type Node = { name: string }
    const opts = result.echartOptions as { series: { data: Node[] }[] }
    expect(opts.series[0].data).toEqual([])
  })
})
