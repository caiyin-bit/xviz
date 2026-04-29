import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PairedTTest } from './PairedTTest'
import type { ChartProps, PairedTTestFormData } from '../types'

const baseFormData: PairedTTestFormData = {
  vizType: 'paired-ttest',
  pairColumn: 'group',
  metric: 'value',
  numberFormat: 'smart',
}

const baseData = [
  { group: 'A', value: 10 }, { group: 'A', value: 12 }, { group: 'A', value: 15 },
  { group: 'B', value: 22 }, { group: 'B', value: 25 }, { group: 'B', value: 28 },
]

function makeProps(): ChartProps<PairedTTestFormData> {
  return {
    formData: baseFormData,
    queriesData: [{ data: baseData as { [k: string]: string | number | boolean | null }[] }],
    width: 600,
    height: 400,
  }
}

describe('PairedTTest', () => {
  it('renders without throwing (delegates to BoxPlot)', () => {
    expect(() => renderToStaticMarkup(<PairedTTest {...makeProps()} />)).not.toThrow()
  })
})
