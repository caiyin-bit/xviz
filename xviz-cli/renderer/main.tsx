import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  PieChart, BarChart, LineChart, Table, BigNumber,
  Scatter, Heatmap, Sankey, Funnel, Gauge, BoxPlot, Histogram, Treemap, Sunburst, Radar, Waterfall, Step, Tree, Graph, TimeseriesBar, TimeseriesLine, MixedTimeseries, Gantt,
  BigNumberTotal, BigNumberPeriodOverPeriod,
  LIGHT_THEME, DARK_THEME, extendTheme,
  type AnyFormData, type QueryData, type Theme,
} from '../../minimal-viz/src/viz'

// The CLI injects configuration as a global before navigating.
// Shape: { type, width, height, formData, queriesData }
declare global {
  interface Window {
    __CHART__?: {
      type: 'pie' | 'bar' | 'line' | 'table' | 'big-number' |
            'scatter' | 'heatmap' | 'sankey' | 'funnel' | 'gauge' | 'boxplot' | 'histogram' | 'treemap' | 'sunburst' | 'radar' | 'waterfall' | 'step' | 'tree' | 'graph' | 'timeseries-bar' | 'timeseries-line' | 'mixed-timeseries' | 'gantt' | 'big-number-total' | 'big-number-pop'
      width: number
      height: number
      formData: AnyFormData
      queriesData: QueryData[]
      theme?: 'light' | 'dark' | Partial<Theme>
    }
    __READY__?: boolean
  }
}

function Renderer() {
  const cfg = window.__CHART__
  if (!cfg) {
    return <div style={{ padding: 24, color: '#888' }}>Waiting for window.__CHART__...</div>
  }

  const { type, width, height, formData, queriesData, theme: themeOpt } = cfg
  const baseTheme =
    themeOpt === 'dark' ? DARK_THEME :
    themeOpt === 'light' ? LIGHT_THEME :
    LIGHT_THEME
  const theme = typeof themeOpt === 'object' && themeOpt !== null
    ? extendTheme(baseTheme, themeOpt)
    : baseTheme
  // Paint the page background to the theme so screenshots have the right background.
  document.body.style.background = theme.colorBg
  const common = { width, height, queriesData, theme }

  switch (type) {
    case 'pie':
      return <PieChart {...common} formData={formData as never} />
    case 'bar':
      return <BarChart {...common} formData={formData as never} />
    case 'line':
      return <LineChart {...common} formData={formData as never} />
    case 'table':
      return <Table {...common} formData={formData as never} />
    case 'big-number':
      return <BigNumber {...common} formData={formData as never} />
    case 'scatter':
      return <Scatter {...common} formData={formData as never} />
    case 'heatmap':
      return <Heatmap {...common} formData={formData as never} />
    case 'sankey':
      return <Sankey {...common} formData={formData as never} />
    case 'funnel':
      return <Funnel {...common} formData={formData as never} />
    case 'gauge':
      return <Gauge {...common} formData={formData as never} />
    case 'boxplot':
      return <BoxPlot {...common} formData={formData as never} />
    case 'histogram':
      return <Histogram {...common} formData={formData as never} />
    case 'treemap':
      return <Treemap {...common} formData={formData as never} />
    case 'sunburst':
      return <Sunburst {...common} formData={formData as never} />
    case 'radar':
      return <Radar {...common} formData={formData as never} />
    case 'waterfall':
      return <Waterfall {...common} formData={formData as never} />
    case 'step':
      return <Step {...common} formData={formData as never} />
    case 'tree':
      return <Tree {...common} formData={formData as never} />
    case 'graph':
      return <Graph {...common} formData={formData as never} />
    case 'timeseries-bar':
      return <TimeseriesBar {...common} formData={formData as never} />
    case 'timeseries-line':
      return <TimeseriesLine {...common} formData={formData as never} />
    case 'mixed-timeseries':
      return <MixedTimeseries {...common} formData={formData as never} />
    case 'gantt':
      return <Gantt {...common} formData={formData as never} />
    case 'big-number-total':
      return <BigNumberTotal {...common} formData={formData as never} />
    case 'big-number-pop':
      return <BigNumberPeriodOverPeriod {...common} formData={formData as never} />
    default:
      return <div style={{ color: 'red' }}>Unknown chart type: {String(type)}</div>
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Renderer />
  </StrictMode>
)

// Signal to puppeteer that the bundle has mounted.
// The CLI then triggers re-render by setting window.__CHART__.
window.__READY__ = true
