import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Partition } from './Partition'
import type { ChartProps, PartitionFormData } from '../types'

const baseFormData: PartitionFormData = {
  vizType: 'partition',
  groupby: ['region', 'country'],
  metric: 'sales',
  numberFormat: 'smart',
}

const baseData = [
  { region: 'NA', country: 'US', sales: 1200 },
  { region: 'NA', country: 'CA', sales: 400 },
  { region: 'EU', country: 'DE', sales: 800 },
]

function makeProps(): ChartProps<PartitionFormData> {
  return {
    formData: baseFormData,
    queriesData: [{ data: baseData as { [k: string]: string | number | boolean | null }[] }],
    width: 700,
    height: 400,
  }
}

describe('Partition', () => {
  it('renders without throwing (delegates to Treemap)', () => {
    expect(() => renderToStaticMarkup(<Partition {...makeProps()} />)).not.toThrow()
  })
})
