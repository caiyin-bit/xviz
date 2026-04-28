import { describe, it, expect } from 'vitest'
import { transformRadarProps } from './transformProps'
import type { ChartProps, RadarFormData } from '../types'

function serializable(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? '[Function]' : v)),
  )
}

const baseFormData: RadarFormData = {
  vizType: 'radar',
  metrics: ['q1', 'q2', 'q3', 'q4'],
  groupby: 'team',
  shape: 'polygon',
  fill: true,
  showLegend: true,
  legendOrientation: 'top',
  numberFormat: 'smart',
}

const baseData = [
  { team: 'A', q1: 100, q2: 80, q3: 90, q4: 110 },
  { team: 'B', q1: 70, q2: 95, q3: 85, q4: 100 },
  { team: 'C', q1: 60, q2: 70, q3: 110, q4: 90 },
]

function makeProps(
  overrides: Partial<RadarFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<RadarFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 400,
  }
}

describe('transformRadarProps', () => {
  it('builds indicators per metric and one series per group', () => {
    const result = transformRadarProps(makeProps())
    expect(serializable(result)).toMatchInlineSnapshot(`
      {
        "echartOptions": {
          "animation": true,
          "legend": {
            "orient": "horizontal",
            "show": true,
            "top": 24,
          },
          "radar": {
            "indicator": [
              {
                "max": 100,
                "name": "q1",
              },
              {
                "max": 95,
                "name": "q2",
              },
              {
                "max": 110,
                "name": "q3",
              },
              {
                "max": 110,
                "name": "q4",
              },
            ],
            "shape": "polygon",
            "splitNumber": 4,
          },
          "series": [
            {
              "data": [
                {
                  "areaStyle": {
                    "opacity": 0.25,
                  },
                  "itemStyle": {
                    "color": "#1FA8C9",
                  },
                  "lineStyle": {
                    "color": "#1FA8C9",
                  },
                  "name": "A",
                  "value": [
                    100,
                    80,
                    90,
                    110,
                  ],
                },
                {
                  "areaStyle": {
                    "opacity": 0.25,
                  },
                  "itemStyle": {
                    "color": "#454E7C",
                  },
                  "lineStyle": {
                    "color": "#454E7C",
                  },
                  "name": "B",
                  "value": [
                    70,
                    95,
                    85,
                    100,
                  ],
                },
                {
                  "areaStyle": {
                    "opacity": 0.25,
                  },
                  "itemStyle": {
                    "color": "#5AC189",
                  },
                  "lineStyle": {
                    "color": "#5AC189",
                  },
                  "name": "C",
                  "value": [
                    60,
                    70,
                    110,
                    90,
                  ],
                },
              ],
              "tooltip": {
                "formatter": "[Function]",
              },
              "type": "radar",
            },
          ],
          "tooltip": {
            "trigger": "item",
          },
        },
        "height": 400,
        "width": 600,
      }
    `)
  })

  it('sums duplicate group rows per metric', () => {
    const data = [
      { team: 'A', q1: 50, q2: 40, q3: 45, q4: 55 },
      { team: 'A', q1: 50, q2: 40, q3: 45, q4: 55 },
      { team: 'B', q1: 70, q2: 95, q3: 85, q4: 100 },
    ]
    const result = transformRadarProps(makeProps({}, data))
    type Series = { data: { name: string; value: number[] }[] }
    const opts = result.echartOptions as { series: Series[] }
    const a = opts.series[0].data.find((s) => s.name === 'A')!
    expect(a.value).toEqual([100, 80, 90, 110])
  })

  it('produces a single merged series when groupby is omitted', () => {
    const result = transformRadarProps(makeProps({ groupby: undefined }))
    type Series = { data: { name: string; value: number[] }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toHaveLength(1)
    expect(opts.series[0].data[0].value).toEqual([230, 245, 285, 300])
  })

  it('respects shape=circle override', () => {
    const result = transformRadarProps(makeProps({ shape: 'circle' }))
    const opts = result.echartOptions as { radar: { shape: string } }
    expect(opts.radar.shape).toBe('circle')
  })

  it('respects axisMax override on indicators', () => {
    const result = transformRadarProps(makeProps({ axisMax: 200 }))
    const opts = result.echartOptions as {
      radar: { indicator: { name: string; max: number }[] }
    }
    expect(opts.radar.indicator.every((i) => i.max === 200)).toBe(true)
  })

  it('omits area fill when fill=false', () => {
    const result = transformRadarProps(makeProps({ fill: false }))
    type Series = { data: { areaStyle?: unknown }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data.every((s) => s.areaStyle === undefined)).toBe(true)
  })

  it('handles empty data without throwing', () => {
    const result = transformRadarProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as {
      series: Series[]
      radar: { indicator: { max: number }[] }
    }
    expect(opts.series[0].data).toEqual([])
    expect(opts.radar.indicator.every((i) => i.max === 1)).toBe(true)
  })
})
