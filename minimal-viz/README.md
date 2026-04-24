# @minimal-viz/core

Lightweight React chart components modeled after Apache Superset's
visualization plugins. 10 chart types, one dependency (ECharts), ~5 KB
gzipped (excluding peer deps).

```bash
npm install @minimal-viz/core react react-dom echarts
```

## Quick example

```tsx
import { PieChart } from '@minimal-viz/core'

export default function Dashboard() {
  return (
    <PieChart
      width={600}
      height={400}
      formData={{
        vizType: 'pie',
        groupby: ['region'],
        metric: 'sales',
        donut: true,
        innerRadius: 40,
        outerRadius: 75,
        labelType: 'key_percent',
        showTotal: true,
      }}
      queriesData={[{
        data: [
          { region: 'North America', sales: 1200 },
          { region: 'Europe',        sales: 900 },
          { region: 'Asia',          sales: 1500 },
        ],
      }]}
    />
  )
}
```

## Chart catalog

All charts take the same shape of props: `{ formData, queriesData, width, height, theme? }`.

### PieChart

```tsx
<PieChart formData={{
  vizType: 'pie',
  groupby: ['region'],
  metric: 'sales',
  donut: true,              // hole in the middle
  innerRadius: 40,
  outerRadius: 75,
  labelType: 'key_value_percent',  // or: 'key', 'value', 'percent', 'key_value', 'key_percent'
  labelsOutside: true,
  showLegend: true,
  legendOrientation: 'top',
  numberFormat: 'smart',    // or: 'int', 'float1', 'float2', 'percent'
  thresholdForOther: 5,     // roll up slices < 5% into "Other"
  showTotal: true,          // annotate center (donut) or top (pie)
  roseType: null,           // 'radius' | 'area' for Nightingale rose
}} queriesData={[...]} width={600} height={400} />
```

### BarChart, LineChart

Both share the same Cartesian form data:

```tsx
<BarChart formData={{
  vizType: 'bar',
  xAxis: 'month',           // column for the category axis
  metrics: ['sales'],       // one or more measure columns
  seriesColumn: 'region',   // optional: break down into multiple series
  stacked: true,
  horizontal: false,
  showValues: false,        // show value labels on bars
  showLegend: true,
  numberFormat: 'smart',
  xAxisLabel: 'Month',
  yAxisLabel: 'Sales',
}} ... />

<LineChart formData={{
  vizType: 'line',
  xAxis: 'month',
  metrics: ['sales'],
  seriesColumn: 'region',
  smooth: true,
  area: true,               // fill under the line
  showDots: true,
}} ... />
```

### Table

```tsx
<Table formData={{
  vizType: 'table',
  columns: ['sku', 'product', 'units', 'revenue'],  // defaults to colnames
  columnLabels: { sku: 'SKU', units: 'Units Sold' },
  numericColumns: ['units', 'revenue'],             // right-align + format
  numberFormat: 'smart',
  pageSize: 10,             // 0 = no pagination
  sortable: true,
  stripes: true,
}} ... />
```

### BigNumber

```tsx
<BigNumber formData={{
  vizType: 'big-number',
  metric: 'sales',
  subheader: 'Total monthly sales',
  numberFormat: 'smart',
  trendColumn: 'sales',     // render a sparkline from all rows
  compareToPrevious: true,  // show ▲/▼ % delta first vs last row
}} ... />
```

### Scatter

```tsx
<Scatter formData={{
  vizType: 'scatter',
  xAxis: 'price', yAxis: 'rating',
  seriesColumn: 'category', // color by category
  sizeColumn: 'reviews',    // bubble size
  minSize: 8, maxSize: 40,
}} ... />
```

### Heatmap

```tsx
<Heatmap formData={{
  vizType: 'heatmap',
  xAxis: 'hour', yAxis: 'day', metric: 'visitors',
  colorRange: ['#f5f7fa', '#1FA8C9'],
  showValues: true,
}} ... />
```

### Sankey, Funnel, Gauge

```tsx
<Sankey formData={{
  vizType: 'sankey',
  source: 'from', target: 'to', metric: 'count',
}} ... />

<Funnel formData={{
  vizType: 'funnel',
  groupby: ['stage'], metric: 'users',
  labelType: 'key_value_percent',
  sortDesc: true,
}} ... />

<Gauge formData={{
  vizType: 'gauge',
  metric: 'cpu',
  min: 0, max: 100,
  subheader: 'CPU utilization %',
  thresholds: [
    { at: 0.6, color: '#3ea04a' },
    { at: 0.8, color: '#f7b500' },
    { at: 1.0, color: '#e04355' },
  ],
}} ... />
```

## Theming

Built-in light and dark themes. Pass a theme object to any chart:

```tsx
import { PieChart, DARK_THEME, LIGHT_THEME, extendTheme } from '@minimal-viz/core'

// Use a bundled theme
<PieChart theme={DARK_THEME} ... />

// Or extend one
const brandTheme = extendTheme(LIGHT_THEME, {
  palette: ['#FF6B35', '#F7C548', '#00A896', '#02C39A', '#028090'],
  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
})
<PieChart theme={brandTheme} ... />
```

A `Theme` has these fields:

```ts
interface Theme {
  name: string
  palette: string[]            // categorical color scheme
  colorText: string
  colorTextSecondary: string
  colorBg: string
  colorBgTooltip: string
  colorBorder: string          // grid/axis lines
  colorHighlight: string
  fontFamily: string
}
```

## Data shape

Superset ships data inside `queriesData[0].data`. We keep the same shape so
you can pipe Superset responses (or CSV-to-JSON output) in unchanged:

```ts
interface QueryData {
  data: Record<string, string | number | boolean | null>[]
  colnames?: string[]
}

interface ChartProps<FD> {
  formData: FD               // chart-specific options
  queriesData: QueryData[]   // typically one entry
  width: number
  height: number
  theme?: Theme
}
```

## Rendering outside the browser

For headless rendering (reports, emails, server-side charts) use the companion
CLI [**`xviz`**](../xviz-cli/README.md):

```bash
xviz render -d data.csv -f form.json -o chart.png
xviz serve  # HTTP POST /render
xviz mcp    # stdio for LLM tool-use
```

## Development

```bash
npm install
npm run dev          # live demo at http://localhost:5173
npm run build        # emit ESM + CJS + d.ts to ./dist
npm pack --dry-run   # inspect what would be published (~28 KB)
```

## License

Apache 2.0
