// Hierarchical partition (icicle-style). Same data contract as Treemap;
// xviz delegates to the Treemap renderer with `showBreadcrumb: true`
// (so the partition path is always visible) and `showValues: true`.
// Users coming from Superset's `partition` viz get the same conceptual
// "drill into hierarchy" experience.

import { useMemo } from 'react'
import type { ChartProps, PartitionFormData, TreemapFormData } from '../types'
import { transformTreemapProps } from '../treemap/transformProps'
import { Echart } from '../Echart'

export function Partition(props: ChartProps<PartitionFormData>) {
  const { theme, formData, queriesData, width, height } = props
  const tmFormData: TreemapFormData = {
    vizType: 'treemap',
    groupby: formData.groupby,
    metric: formData.metric,
    showLabels: formData.showLabels ?? true,
    showValues: formData.showValues ?? true,
    showBreadcrumb: true,
    colorScheme: formData.colorScheme,
    numberFormat: formData.numberFormat,
  }
  const { echartOptions, width: w, height: h } = useMemo(
    () => transformTreemapProps({
      formData: tmFormData,
      queriesData,
      width,
      height,
      theme,
    }),
    [tmFormData, queriesData, width, height, theme],
  )
  return <Echart width={w} height={h} echartOptions={echartOptions} theme={theme} />
}
