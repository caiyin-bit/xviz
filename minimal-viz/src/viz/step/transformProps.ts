// Step chart = Line chart with stepped interpolation.
// Reuses transformCartesianProps verbatim (cast vizType: 'line') and post-
// processes each line series to set ECharts' `step` field. This keeps the
// breakdown / stacked / x-axis discovery logic in one place.

import type { ChartProps, StepFormData, CartesianFormData } from '../types'
import {
  transformCartesianProps,
  type TransformedCartesianProps,
} from '../cartesian/transformProps'

export type TransformedStepProps = TransformedCartesianProps

export function transformStepProps(
  chartProps: ChartProps<StepFormData>,
): TransformedStepProps {
  const { formData } = chartProps
  const { step = 'end', ...rest } = formData

  const lineFormData: CartesianFormData = {
    ...rest,
    vizType: 'line',
  }

  const result = transformCartesianProps({
    ...chartProps,
    formData: lineFormData,
  })

  // Inject `step` into each line series. transformCartesianProps emits one
  // series per (metric × breakdown), all with type:'line' here.
  const opts = result.echartOptions as {
    series?: { type?: string; step?: string | boolean }[]
  }
  for (const s of opts.series ?? []) {
    if (s.type === 'line') s.step = step
  }

  return result
}
