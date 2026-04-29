// Adapted from superset-frontend/plugins/legacy-plugin-chart-rose
// Nightingale rose chart = Pie chart with `roseType` set. We delegate
// to transformPieProps and force the rose-specific defaults.

import type { ChartProps, RoseFormData, PieFormData } from '../types'
import { transformPieProps, type TransformedPieProps } from '../pie/transformProps'

export type TransformedRoseProps = TransformedPieProps

export function transformRoseProps(
  chartProps: ChartProps<RoseFormData>,
): TransformedRoseProps {
  const { formData } = chartProps
  const {
    roseType = 'radius',
    innerRadius = 0,
    outerRadius = 75,
    showLabels = true,
    labelType = 'key',
    showLegend = true,
    legendOrientation = 'top',
    numberFormat = 'smart',
    ...rest
  } = formData

  const pieFormData: PieFormData = {
    ...rest,
    vizType: 'pie',
    roseType,
    donut: innerRadius > 0,
    innerRadius,
    outerRadius,
    showLabels,
    labelsOutside: false, // rose looks better with inner labels
    labelType,
    showLegend,
    legendOrientation,
    numberFormat,
  }

  return transformPieProps({ ...chartProps, formData: pieFormData })
}
