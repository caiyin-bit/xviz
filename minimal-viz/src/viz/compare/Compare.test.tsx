import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Compare } from './Compare'
import type { ChartProps, CompareFormData } from '../types'

const baseFormData: CompareFormData = {
  vizType: 'compare',
  xAxis: 'date',
  metrics: ['revenue'],
  seriesColumn: 'period',
  smooth: false,
  showDots: true,
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01', period: '2023', revenue: 1000 },
  { date: '2024-01', period: '2024', revenue: 1200 },
  { date: '2024-02', period: '2023', revenue: 1100 },
  { date: '2024-02', period: '2024', revenue: 1350 },
]

function makeProps(
  overrides: Partial<CompareFormData> = {},
): ChartProps<CompareFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: baseData as { [k: string]: string | number | boolean | null }[] }],
    width: 700,
    height: 400,
  }
}

describe('Compare', () => {
  it('renders without throwing (delegates to TimeseriesLine)', () => {
    // SSR via Echart wrapper just renders an empty <div>; this verifies
    // the chain compiles + invokes the timeseries transform.
    expect(() => renderToStaticMarkup(<Compare {...makeProps()} />)).not.toThrow()
  })
})
