// Compact metric × time table. Alias of TimeTable for users coming from
// Superset's `time_pivot` viz type.

import type { ChartProps, TimePivotFormData, TimeTableFormData } from '../types'
import { TimeTable } from '../time-table/TimeTable'

export function TimePivot(props: ChartProps<TimePivotFormData>) {
  const adapted: ChartProps<TimeTableFormData> = {
    ...props,
    formData: {
      vizType: 'time-table',
      timeColumn: props.formData.timeColumn,
      metrics: props.formData.metrics,
      metricLabels: props.formData.metricLabels,
      numberFormat: props.formData.numberFormat,
      timeFormat: props.formData.timeFormat,
      stripes: props.formData.stripes,
    },
  }
  return <TimeTable {...adapted} />
}
