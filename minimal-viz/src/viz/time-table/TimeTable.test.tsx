import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TimeTable } from './TimeTable'
import type { ChartProps, TimeTableFormData } from '../types'

const baseFormData: TimeTableFormData = {
  vizType: 'time-table',
  timeColumn: 'date',
  metrics: ['orders', 'revenue'],
  numberFormat: 'smart',
  timeFormat: 'iso',
}

const baseData = [
  { date: '2024-01-01', orders: 100, revenue: 1000 },
  { date: '2024-02-01', orders: 120, revenue: 1200 },
  { date: '2024-03-01', orders: 90,  revenue: 950 },
]

function makeProps(
  overrides: Partial<TimeTableFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<TimeTableFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 200,
  }
}

describe('TimeTable', () => {
  it('pivots metrics into rows and times into columns', () => {
    const html = renderToStaticMarkup(<TimeTable {...makeProps()} />)
    // Header has "Metric" + 3 time labels
    expect(html).toContain('Metric')
    expect(html).toContain('2024-01-01')
    expect(html).toContain('2024-02-01')
    expect(html).toContain('2024-03-01')
    // Two metric rows
    expect(html).toContain('orders')
    expect(html).toContain('revenue')
    // Some values
    expect(html).toContain('100')
    expect(html).toContain('1.2K') // 1200 in smart format
  })

  it('sorts time columns chronologically regardless of input order', () => {
    const data = [
      { date: '2024-03-01', orders: 90,  revenue: 950 },
      { date: '2024-01-01', orders: 100, revenue: 1000 },
      { date: '2024-02-01', orders: 120, revenue: 1200 },
    ]
    const html = renderToStaticMarkup(<TimeTable {...makeProps({}, data)} />)
    const idx1 = html.indexOf('2024-01-01')
    const idx2 = html.indexOf('2024-02-01')
    const idx3 = html.indexOf('2024-03-01')
    expect(idx1).toBeGreaterThan(-1)
    expect(idx1).toBeLessThan(idx2)
    expect(idx2).toBeLessThan(idx3)
  })

  it('aggregates duplicate (time × metric) cells with sum', () => {
    const data = [
      { date: '2024-01-01', orders: 50, revenue: 500 },
      { date: '2024-01-01', orders: 50, revenue: 500 },
    ]
    const html = renderToStaticMarkup(<TimeTable {...makeProps({}, data)} />)
    expect(html).toContain('100') // 50 + 50
    expect(html).toContain('1K')  // 500 + 500 = 1000 → smart format "1K"
  })

  it('shows em-dash for missing cells', () => {
    const data = [
      { date: '2024-01-01', orders: 100 },                   // revenue missing
      { date: '2024-02-01', revenue: 1200 },                 // orders missing
    ]
    const html = renderToStaticMarkup(<TimeTable {...makeProps({}, data)} />)
    expect(html).toContain('—')
  })

  it('uses metricLabels for pretty row names', () => {
    const html = renderToStaticMarkup(
      <TimeTable
        {...makeProps({
          metricLabels: { orders: 'Order count', revenue: 'Revenue (USD)' },
        })}
      />,
    )
    expect(html).toContain('Order count')
    expect(html).toContain('Revenue (USD)')
  })

  it('formats time labels as YYYY-MM when timeFormat=short', () => {
    const html = renderToStaticMarkup(
      <TimeTable {...makeProps({ timeFormat: 'short' })} />,
    )
    expect(html).toContain('2024-01')
    expect(html).toContain('2024-02')
    expect(html).toContain('2024-03')
    // ISO labels should not appear in short mode
    expect(html).not.toContain('2024-01-01')
  })

  it('handles empty data without throwing', () => {
    const html = renderToStaticMarkup(<TimeTable {...makeProps({}, [])} />)
    // Empty body — but headers still render with metrics column
    expect(html).toContain('Metric')
    expect(html).toContain('orders')
    expect(html).toContain('revenue')
  })
})
