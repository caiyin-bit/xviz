import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BigNumberTotal } from './BigNumberTotal'
import type { ChartProps, BigNumberTotalFormData } from '../types'

const baseFormData: BigNumberTotalFormData = {
  vizType: 'big-number-total',
  metric: 'value',
  subheader: 'Lifetime sales',
  numberFormat: 'smart',
}

function makeProps(
  overrides: Partial<BigNumberTotalFormData> = {},
  data: Record<string, unknown>[] = [{ value: 1500 }],
): ChartProps<BigNumberTotalFormData> {
  return {
    formData: { ...baseFormData, ...overrides },
    queriesData: [{ data: data as { [k: string]: string | number | boolean | null }[] }],
    width: 320,
    height: 160,
  }
}

describe('BigNumberTotal', () => {
  it('renders a single-row metric value', () => {
    const html = renderToStaticMarkup(<BigNumberTotal {...makeProps()} />)
    expect(html).toContain('1.5K')
    expect(html).toContain('Lifetime sales')
  })

  it('sums across multiple rows (total semantic)', () => {
    const html = renderToStaticMarkup(
      <BigNumberTotal
        {...makeProps({}, [
          { value: 100 },
          { value: 200 },
          { value: 300 },
        ])}
      />,
    )
    expect(html).toContain('600')
  })

  it('skips non-finite values during summation', () => {
    const html = renderToStaticMarkup(
      <BigNumberTotal
        {...makeProps({}, [
          { value: 100 },
          { value: 'nope' },
          { value: NaN },
          { value: 200 },
        ])}
      />,
    )
    expect(html).toContain('300')
  })

  it('renders 0 for empty data without throwing', () => {
    const html = renderToStaticMarkup(<BigNumberTotal {...makeProps({}, [])} />)
    expect(html).toContain('0')
  })

  it('honors color override', () => {
    const html = renderToStaticMarkup(
      <BigNumberTotal {...makeProps({ color: '#ff00ff' })} />,
    )
    expect(html).toContain('#ff00ff')
  })
})
