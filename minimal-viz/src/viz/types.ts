// Types for the minimal viz SDK.
// Modeled after Superset's ChartProps but trimmed to essentials.

export type DataRecord = Record<string, string | number | boolean | null>

export interface QueryData {
  data: DataRecord[]
  colnames?: string[]
}

export type NumberFormatKind = 'int' | 'float1' | 'float2' | 'percent' | 'smart'

export interface PieFormData {
  vizType: 'pie'
  groupby: string[]
  metric: string
  colorScheme?: string[]
  donut?: boolean
  innerRadius?: number
  outerRadius?: number
  labelType?: 'key' | 'value' | 'percent' | 'key_value' | 'key_value_percent' | 'key_percent'
  showLabels?: boolean
  labelsOutside?: boolean
  showLegend?: boolean
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  numberFormat?: NumberFormatKind
  roseType?: 'radius' | 'area' | null
  thresholdForOther?: number
  showTotal?: boolean
}

/** Cartesian (bar/line) form data. */
export interface CartesianFormData {
  vizType: 'bar' | 'line'
  xAxis: string              // column name for the x axis
  metrics: string[]          // y-axis metrics
  seriesColumn?: string      // optional breakdown column -> multiple series
  colorScheme?: string[]
  stacked?: boolean
  horizontal?: boolean       // bar only
  smooth?: boolean           // line only
  area?: boolean             // line only
  showDots?: boolean         // line only
  showValues?: boolean       // bar only
  showLegend?: boolean
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  numberFormat?: NumberFormatKind
  xAxisLabel?: string
  yAxisLabel?: string
}

export interface TableFormData {
  vizType: 'table'
  columns?: string[]                // default: all colnames
  columnLabels?: Record<string, string>
  numericColumns?: string[]         // apply number formatter
  numberFormat?: NumberFormatKind
  pageSize?: number                 // default 10, 0 = no pagination
  sortable?: boolean
  stripes?: boolean
}

export interface BigNumberFormData {
  vizType: 'big-number'
  metric: string                    // column to pull value from (first row)
  subheader?: string
  numberFormat?: NumberFormatKind
  color?: string                    // override value color
  trendColumn?: string              // if set, render tiny trendline from all rows
  trendTimeColumn?: string          // x axis for trend (optional, uses index otherwise)
  compareToPrevious?: boolean       // show delta% from first vs last row in trend
}

export interface ScatterFormData {
  vizType: 'scatter'
  xAxis: string
  yAxis: string
  seriesColumn?: string          // color dots by this column
  sizeColumn?: string            // bubble size column
  colorScheme?: string[]
  showLegend?: boolean
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  numberFormat?: NumberFormatKind
  xAxisLabel?: string
  yAxisLabel?: string
  minSize?: number               // default 8
  maxSize?: number               // default 40
}

export interface HeatmapFormData {
  vizType: 'heatmap'
  xAxis: string
  yAxis: string
  metric: string
  colorRange?: [string, string]  // min/max colors, default teal palette
  showValues?: boolean
  numberFormat?: NumberFormatKind
}

export interface SankeyFormData {
  vizType: 'sankey'
  source: string
  target: string
  metric: string
  colorScheme?: string[]
  numberFormat?: NumberFormatKind
}

export interface FunnelFormData {
  vizType: 'funnel'
  groupby: string[]
  metric: string
  colorScheme?: string[]
  sortDesc?: boolean             // default true
  labelType?: 'key' | 'value' | 'percent' | 'key_value' | 'key_percent' | 'key_value_percent'
  showLegend?: boolean
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  numberFormat?: NumberFormatKind
}

export interface GaugeFormData {
  vizType: 'gauge'
  metric: string
  min?: number                   // default 0
  max?: number                   // default auto: metric * 1.2 or 100
  thresholds?: { at: number; color: string }[] // e.g. [{at:0.3,color:'green'},{at:0.7,color:'yellow'},{at:1,color:'red'}]
  subheader?: string
  numberFormat?: NumberFormatKind
}

export interface BoxPlotFormData {
  vizType: 'boxplot'
  groupby: string                      // category column — one box per distinct value
  metric: string                       // numeric column — observations within each group
  whiskerType?: 'tukey' | 'min-max'    // 'tukey' = Q1-1.5·IQR / Q3+1.5·IQR; 'min-max' = absolute extremes; default 'tukey'
  showOutliers?: boolean               // default true (only meaningful with whiskerType='tukey')
  horizontal?: boolean                 // default false (vertical boxes)
  showLegend?: boolean                 // default false (single-metric chart)
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  numberFormat?: NumberFormatKind
  xAxisLabel?: string
  yAxisLabel?: string
  colorScheme?: string[]
}

export interface HistogramFormData {
  vizType: 'histogram'
  metric: string                       // numeric column — raw observations
  bins?: number                        // number of equal-width buckets; default 20
  binStart?: number                    // lower edge; default min(values)
  binEnd?: number                      // upper edge; default max(values)
  density?: boolean                    // default false. If true, normalize counts to a probability density (count / (n · binWidth))
  cumulative?: boolean                 // default false. If true, output running cumulative bin values
  showLegend?: boolean                 // default false
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  numberFormat?: NumberFormatKind
  xAxisLabel?: string
  yAxisLabel?: string
  colorScheme?: string[]
}

export interface TreemapFormData {
  vizType: 'treemap'
  groupby: string[]                    // hierarchy levels (outermost first); ≥1 column required
  metric: string                       // numeric column for leaf node sizes
  showLabels?: boolean                 // default true
  showValues?: boolean                 // default false (show value alongside name)
  showBreadcrumb?: boolean             // default false
  colorScheme?: string[]
  numberFormat?: NumberFormatKind
}

export interface SunburstFormData {
  vizType: 'sunburst'
  groupby: string[]                    // hierarchy levels (innermost-ring first); ≥1 column required
  metric: string                       // numeric column for leaf node sizes
  showLabels?: boolean                 // default true
  showValues?: boolean                 // default false
  innerRadius?: number                 // percentage (0..100); default 0 (full sunburst, no donut hole)
  outerRadius?: number                 // percentage (0..100); default 90
  colorScheme?: string[]
  numberFormat?: NumberFormatKind
}

export interface RadarFormData {
  vizType: 'radar'
  metrics: string[]                    // numeric columns — each becomes one radar axis (≥3 strongly preferred)
  groupby?: string                     // optional category column — each distinct value becomes a series
  shape?: 'polygon' | 'circle'         // default 'polygon'
  fill?: boolean                       // default true (filled area under each polygon)
  showLegend?: boolean                 // default true
  legendOrientation?: 'top' | 'right' | 'bottom' | 'left'
  axisMax?: number                     // override the auto-computed per-axis max (applied uniformly)
  numberFormat?: NumberFormatKind
  colorScheme?: string[]
}

export type AnyFormData =
  | PieFormData
  | CartesianFormData
  | TableFormData
  | BigNumberFormData
  | ScatterFormData
  | HeatmapFormData
  | SankeyFormData
  | FunnelFormData
  | GaugeFormData
  | BoxPlotFormData
  | HistogramFormData
  | TreemapFormData
  | SunburstFormData
  | RadarFormData

export interface ChartProps<FD = AnyFormData> {
  formData: FD
  queriesData: QueryData[]
  width: number
  height: number
  theme?: import('./theme').Theme
}
