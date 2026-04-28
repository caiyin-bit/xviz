import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BigNumberPeriodOverPeriod } from './BigNumberPeriodOverPeriod'
import type { ChartProps, BigNumberPeriodOverPeriodFormData } from '../types'

const baseFormData: BigNumberPeriodOverPeriodFormData = {
  vizType: 'big-number-pop',
  metric: 'value',
  subheader: 'Monthly users',
  numberFormat: 'smart',
}

function makeProps(
  overrides: Partial<BigNumberPeriodOverPeriodFormData> = {},
  data: Record<string, unknown>[] = [{ value: 100 }, { value: 150 }],
): ChartProps<BigNumberPeriodOverPeriodFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 360,
    height: 180,
  }
}

describe('BigNumberPeriodOverPeriod', () => {
  it('renders current value (last row) and previous (first row) for long format', () => {
    const html = renderToStaticMarkup(<BigNumberPeriodOverPeriod {...makeProps()} />)
    expect(html).toContain('150')
    expect(html).toContain('100')
    expect(html).toContain('▲')        // 100 → 150 = positive
    expect(html).toContain('50.00%')   // (150-100)/100 = 50%
  })

  it('shows red downward arrow when current < previous', () => {
    const html = renderToStaticMarkup(
      <BigNumberPeriodOverPeriod
        {...makeProps({}, [{ value: 200 }, { value: 150 }])}
      />,
    )
    expect(html).toContain('▼')
    expect(html).toContain('25.00%')   // (150-200)/200 = -25%
    expect(html).toContain('#e04355')  // negative-delta color
  })

  it('uses wide format when previousMetric is set', () => {
    const html = renderToStaticMarkup(
      <BigNumberPeriodOverPeriod
        {...makeProps(
          { previousMetric: 'last' },
          [{ value: 250, last: 200 }],
        )}
      />,
    )
    expect(html).toContain('250')
    expect(html).toContain('200')
    expect(html).toContain('25.00%')
  })

  it('handles previous=0 by omitting the percent (still shows absolute delta)', () => {
    const html = renderToStaticMarkup(
      <BigNumberPeriodOverPeriod
        {...makeProps({}, [{ value: 0 }, { value: 80 }])}
      />,
    )
    expect(html).toContain('80')
    // No percent shown when previous is zero (division by zero guard)
    expect(html).not.toContain('%')
  })

  it('renders 0/0 for empty data without throwing', () => {
    const html = renderToStaticMarkup(
      <BigNumberPeriodOverPeriod {...makeProps({}, [])} />,
    )
    expect(html).toContain('0')
  })

  it('honors compareLabel override', () => {
    const html = renderToStaticMarkup(
      <BigNumberPeriodOverPeriod
        {...makeProps({ compareLabel: 'YoY' })}
      />,
    )
    expect(html).toContain('YoY')
  })
})
