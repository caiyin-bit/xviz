import { describe, it, expect } from 'vitest'
import { transformWorldMapProps } from './transformProps'
import type { ChartProps, WorldMapFormData, GeoJsonInput } from '../types'

const fakeGeoJson: GeoJsonInput = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'United States' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'Germany' },       geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'Japan' },         geometry: { type: 'Polygon', coordinates: [] } },
  ],
}

const baseFormData: WorldMapFormData = {
  vizType: 'world-map',
  countryColumn: 'country',
  metric: 'gdp',
  geojson: fakeGeoJson,
  numberFormat: 'smart',
}

const baseData = [
  { country: 'United States', gdp: 25000 },
  { country: 'Germany',       gdp:  4000 },
  { country: 'Japan',         gdp:  4900 },
]

function makeProps(
  overrides: Partial<WorldMapFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<WorldMapFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 480,
  }
}

describe('transformWorldMapProps', () => {
  it('emits a map series with country/value points', () => {
    const result = transformWorldMapProps(makeProps())
    type Series = { type: string; name: string; data: { name: string; value: number }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].type).toBe('map')
    expect(opts.series[0].data).toHaveLength(3)
    const byName: Record<string, number> = {}
    for (const p of opts.series[0].data) byName[p.name] = p.value
    expect(byName['United States']).toBe(25000)
    expect(byName['Japan']).toBe(4900)
  })

  it('registers the GeoJSON map under a stable per-instance name', () => {
    const result = transformWorldMapProps(makeProps())
    type Series = { map: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].map).toMatch(/^xviz-world-\d+$/)
  })

  it('reuses the same registered map name when the same GeoJSON object is passed twice', () => {
    const r1 = transformWorldMapProps(makeProps())
    const r2 = transformWorldMapProps(makeProps())
    type Series = { map: string }
    const m1 = (r1.echartOptions as { series: Series[] }).series[0].map
    const m2 = (r2.echartOptions as { series: Series[] }).series[0].map
    expect(m1).toBe(m2)
  })

  it('computes visualMap min/max from observed values', () => {
    const result = transformWorldMapProps(makeProps())
    const opts = result.echartOptions as { visualMap: { min: number; max: number } }
    expect(opts.visualMap.min).toBe(4000)
    expect(opts.visualMap.max).toBe(25000)
  })

  it('respects custom colorRange', () => {
    const result = transformWorldMapProps(makeProps({ colorRange: ['#abc', '#def'] }))
    const opts = result.echartOptions as { visualMap: { inRange: { color: string[] } } }
    expect(opts.visualMap.inRange.color).toEqual(['#abc', '#def'])
  })

  it('respects custom nameProperty', () => {
    const result = transformWorldMapProps(makeProps({ nameProperty: 'iso_a3' }))
    type Series = { nameProperty: string }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].nameProperty).toBe('iso_a3')
  })

  it('drops rows with non-numeric metric or empty country', () => {
    const data = [
      { country: 'United States', gdp: 25000 },
      { country: '',              gdp:  1000 },
      { country: 'Japan',         gdp: 'oops' },
    ]
    const result = transformWorldMapProps(makeProps({}, data))
    type Series = { data: { name: string }[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toHaveLength(1)
    expect(opts.series[0].data[0].name).toBe('United States')
  })

  it('handles empty data without throwing', () => {
    const result = transformWorldMapProps(makeProps({}, []))
    type Series = { data: unknown[] }
    const opts = result.echartOptions as { series: Series[] }
    expect(opts.series[0].data).toEqual([])
  })
})
