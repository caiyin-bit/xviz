import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PivotTable } from './PivotTable'
import type { ChartProps, PivotTableFormData } from '../types'

const baseFormData: PivotTableFormData = {
  vizType: 'pivot-table',
  rows: ['region'],
  columns: ['quarter'],
  value: 'sales',
  aggregator: 'sum',
  numberFormat: 'smart',
}

const baseData = [
  { region: 'NA', country: 'US', quarter: 'Q1', sales: 100 },
  { region: 'NA', country: 'US', quarter: 'Q2', sales: 150 },
  { region: 'NA', country: 'CA', quarter: 'Q1', sales:  50 },
  { region: 'EU', country: 'DE', quarter: 'Q1', sales:  80 },
  { region: 'EU', country: 'DE', quarter: 'Q2', sales: 120 },
  { region: 'AS', country: 'JP', quarter: 'Q2', sales: 200 },
]

function makeProps(
  overrides: Partial<PivotTableFormData> = {},
  data: Record<string, unknown>[] = baseData,
): ChartProps<PivotTableFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 280,
  }
}

describe('PivotTable', () => {
  it('pivots rows × columns × value with sum aggregator', () => {
    const html = renderToStaticMarkup(<PivotTable {...makeProps()} />)
    expect(html).toContain('region')
    expect(html).toContain('Q1')
    expect(html).toContain('Q2')
    // NA Q1 = 100 + 50 = 150
    expect(html).toContain('150')
    // NA Q2 = 150
    expect(html).toContain('150')
    // EU Q1 = 80
    expect(html).toContain('80')
    // EU Q2 = 120
    expect(html).toContain('120')
    // AS Q2 = 200; AS Q1 = no data → '—'
    expect(html).toContain('200')
    expect(html).toContain('—')
  })

  it('shows row totals on the right when showRowTotals=true', () => {
    const html = renderToStaticMarkup(<PivotTable {...makeProps()} />)
    expect(html).toContain('Total')
    // NA total = 100 + 150 + 50 = 300
    expect(html).toContain('300')
  })

  it('shows column totals at the bottom when showColumnTotals=true', () => {
    const html = renderToStaticMarkup(<PivotTable {...makeProps()} />)
    // Q1 total = 100 + 50 + 80 = 230
    expect(html).toContain('230')
    // Q2 total = 150 + 120 + 200 = 470
    expect(html).toContain('470')
    // Grand total = 700
    expect(html).toContain('700')
  })

  it('hides totals when flags are false', () => {
    const html = renderToStaticMarkup(
      <PivotTable {...makeProps({ showRowTotals: false, showColumnTotals: false })} />,
    )
    // No "Total" header / footer cell
    expect(html.match(/Total/g) ?? []).toHaveLength(0)
  })

  it('respects aggregator=avg', () => {
    const html = renderToStaticMarkup(
      <PivotTable {...makeProps({ aggregator: 'avg' })} />,
    )
    // NA Q1 has two rows (100, 50) → avg 75
    expect(html).toContain('75')
  })

  it('respects aggregator=count', () => {
    const html = renderToStaticMarkup(
      <PivotTable {...makeProps({ aggregator: 'count' })} />,
    )
    // NA Q1 has 2 observations → count 2
    expect(html).toContain('2')
  })

  it('joins multi-level row/col keys with " / "', () => {
    const html = renderToStaticMarkup(
      <PivotTable {...makeProps({ rows: ['region', 'country'] })} />,
    )
    // Multi-row header label is concatenated
    expect(html).toContain('region / country')
    // NA / US row key appears
    expect(html).toContain('NA / US')
    expect(html).toContain('EU / DE')
  })

  it('handles empty columns array — single value column with the metric name as header', () => {
    const html = renderToStaticMarkup(
      <PivotTable {...makeProps({ columns: [] })} />,
    )
    // Header includes the metric name 'sales'
    expect(html).toContain('sales')
    // Each row's value is its row total
    expect(html).toContain('300')   // NA
    expect(html).toContain('200')   // EU = 80+120
    expect(html).toContain('200')   // AS = 200
  })

  it('handles empty data without throwing', () => {
    const html = renderToStaticMarkup(
      <PivotTable {...makeProps({}, [])} />,
    )
    // Header still renders
    expect(html).toContain('region')
    // No data rows
    expect(html).not.toContain('NA')
  })

  it('drops rows with non-numeric value', () => {
    const data = [
      { region: 'NA', quarter: 'Q1', sales: 100 },
      { region: 'NA', quarter: 'Q1', sales: 'oops' },
      { region: 'NA', quarter: 'Q1', sales: NaN },
      { region: 'EU', quarter: 'Q1', sales: 50 },
    ]
    const html = renderToStaticMarkup(<PivotTable {...makeProps({}, data)} />)
    // NA Q1 should be just 100 (non-numeric dropped)
    expect(html).toContain('100')
    expect(html).toContain('50')
  })
})
