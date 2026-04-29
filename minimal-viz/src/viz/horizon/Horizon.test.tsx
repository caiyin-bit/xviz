import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Horizon } from './Horizon'
import type { ChartProps, HorizonFormData } from '../types'

const baseFormData: HorizonFormData = {
  vizType: 'horizon',
  xAxis: 'date',
  metric: 'value',
  numberFormat: 'smart',
}

const baseData = [
  { date: '2024-01', value: 10 },
  { date: '2024-02', value: 20 },
  { date: '2024-03', value: 15 },
]

function makeProps(): ChartProps<HorizonFormData> {
  return {
    formData: baseFormData,
    queriesData: [{ data: baseData as { [k: string]: string | number | boolean | null }[] }],
    width: 800,
    height: 200,
  }
}

describe('Horizon', () => {
  it('renders without throwing (delegates to TimeseriesLine with area=true)', () => {
    expect(() => renderToStaticMarkup(<Horizon {...makeProps()} />)).not.toThrow()
  })
})
