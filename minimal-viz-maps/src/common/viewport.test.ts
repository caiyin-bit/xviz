import { describe, it, expect } from 'vitest'
import { computeViewport } from './viewport'

describe('computeViewport', () => {
  it('returns the fallback view for empty data', () => {
    const v = computeViewport([], 'lon', 'lat', 800, 600)
    expect(v.longitude).toBe(0)
    expect(v.latitude).toBe(20)
    expect(v.zoom).toBe(1)
  })

  it('centers on the data extent', () => {
    const rows = [
      { lon: -120, lat: 40 },
      { lon: -100, lat: 30 },
      { lon: -80,  lat: 50 },
    ]
    const v = computeViewport(rows, 'lon', 'lat', 800, 600)
    expect(v.longitude).toBe(-100)
    expect(v.latitude).toBe(40)
  })

  it('skips rows with non-finite lon/lat', () => {
    const rows = [
      { lon: -100, lat: 40 },
      { lon: 'nope' as unknown as number, lat: 0 },
      { lon: NaN, lat: NaN },
      { lon: -80, lat: 30 },
    ]
    const v = computeViewport(rows, 'lon', 'lat', 800, 600)
    expect(v.longitude).toBe(-90)
    expect(v.latitude).toBe(35)
  })

  it('clamps zoom into [0, 18]', () => {
    // Very tight extent → high zoom; should cap at 18.
    const rows = [
      { lon: -120.0001, lat: 40.0001 },
      { lon: -120.0002, lat: 40.0002 },
    ]
    const v = computeViewport(rows, 'lon', 'lat', 800, 600)
    expect(v.zoom).toBeLessThanOrEqual(18)
    expect(v.zoom).toBeGreaterThanOrEqual(0)
  })

  it('produces the same view across multiple invocations (deterministic)', () => {
    const rows = [
      { lon: 10, lat: 50 },
      { lon: 20, lat: 60 },
    ]
    const a = computeViewport(rows, 'lon', 'lat', 800, 600)
    const b = computeViewport(rows, 'lon', 'lat', 800, 600)
    expect(a).toEqual(b)
  })
})
