import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TimePivot } from './TimePivot'
import type { ChartProps, TimePivotFormData } from '../types'

const baseFormData: TimePivotFormData = {
  vizType: 'time-pivot',
  timeColumn: 'date',
  metrics: ['orders', 'revenue'],
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01-01', orders: 100, revenue: 1000 },
  { date: '2024-02-01', orders: 120, revenue: 1200 },
]

function makeProps(): ChartProps<TimePivotFormData> {
  return {
    formData: baseFormData,
    queriesData: [{ data: baseData as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 200,
  }
}

describe('TimePivot', () => {
  it('renders the same table as TimeTable (alias)', () => {
    const html = renderToStaticMarkup(<TimePivot {...makeProps()} />)
    expect(html).toContain('orders')
    expect(html).toContain('revenue')
    expect(html).toContain('100')
  })
})
