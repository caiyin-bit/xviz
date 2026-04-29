import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CountryMap } from './CountryMap'
import type { ChartProps, CountryMapFormData, GeoJsonInput } from '../types'

const fakeGeoJson: GeoJsonInput = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'California' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'Texas' },      geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'New York' },   geometry: { type: 'Polygon', coordinates: [] } },
  ],
}

const baseFormData: CountryMapFormData = {
  vizType: 'country-map',
  regionColumn: 'state',
  metric: 'population',
  geojson: fakeGeoJson,
  numberFormat: 'smart',
}

const baseData = [
  { state: 'California', population: 39_000_000 },
  { state: 'Texas',      population: 30_000_000 },
  { state: 'New York',   population: 19_000_000 },
]

function makeProps(): ChartProps<CountryMapFormData> {
  return {
    formData: baseFormData,
    queriesData: [{ data: baseData as { [k: string]: string | number | boolean | null }[] }],
    width: 700,
    height: 480,
  }
}

describe('CountryMap', () => {
  it('renders without throwing (delegates to WorldMap)', () => {
    expect(() => renderToStaticMarkup(<CountryMap {...makeProps()} />)).not.toThrow()
  })
})
