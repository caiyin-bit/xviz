// Slim ECharts-in-React wrapper.
// Adapted from plugin-chart-echarts/src/components/Echart.tsx, with
// Redux, styled-components, and Superset theme provider removed.

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { use as registerEcharts, init, type EChartsType } from 'echarts/core'
import { DEFAULT_THEME, type Theme } from './theme'
import {
  PieChart, BarChart, LineChart, ScatterChart,
  FunnelChart, GaugeChart, RadarChart, TreemapChart, SunburstChart,
  BoxplotChart, HeatmapChart, SankeyChart, TreeChart, GraphChart,
} from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import {
  TooltipComponent, TitleComponent, GridComponent, LegendComponent,
  GraphicComponent, DataZoomComponent, VisualMapComponent, MarkAreaComponent,
  MarkLineComponent, AriaComponent, ToolboxComponent,
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import type { EChartsCoreOption } from 'echarts/core'

registerEcharts([
  CanvasRenderer,
  PieChart, BarChart, LineChart, ScatterChart,
  FunnelChart, GaugeChart, RadarChart, TreemapChart, SunburstChart,
  BoxplotChart, HeatmapChart, SankeyChart, TreeChart, GraphChart,
  TooltipComponent, TitleComponent, GridComponent, LegendComponent,
  GraphicComponent, DataZoomComponent, VisualMapComponent, MarkAreaComponent,
  MarkLineComponent, AriaComponent, ToolboxComponent,
  LabelLayout,
])

export interface EchartProps {
  width: number
  height: number
  echartOptions: EChartsCoreOption
  eventHandlers?: Record<string, (params: unknown) => void>
  theme?: Theme
}

// Merge theme-derived defaults into the echartOptions so individual
// transforms can stay theme-agnostic.
function applyTheme(options: EChartsCoreOption, theme: Theme): EChartsCoreOption {
  const text = { color: theme.colorText, fontFamily: theme.fontFamily }
  const secondary = { color: theme.colorTextSecondary, fontFamily: theme.fontFamily }
  const axisCommon = {
    axisLine: { lineStyle: { color: theme.colorBorder } },
    axisTick: { lineStyle: { color: theme.colorBorder } },
    axisLabel: secondary,
    splitLine: { lineStyle: { color: theme.colorBorder } },
    nameTextStyle: secondary,
  }
  const normalizeAxis = (a: unknown) => {
    if (!a) return a
    if (Array.isArray(a)) return a.map((x) => ({ ...axisCommon, ...(x as object) }))
    return { ...axisCommon, ...(a as object) }
  }
  const merged: EChartsCoreOption = {
    backgroundColor: theme.colorBg,
    textStyle: { color: theme.colorText, fontFamily: theme.fontFamily },
    ...options,
    tooltip: options.tooltip
      ? {
          backgroundColor: theme.colorBgTooltip,
          borderColor: theme.colorBorder,
          textStyle: text,
          ...(options.tooltip as object),
        }
      : options.tooltip,
    legend: options.legend
      ? { textStyle: secondary, ...(options.legend as object) }
      : options.legend,
    xAxis: normalizeAxis(options.xAxis),
    yAxis: normalizeAxis(options.yAxis),
  }
  return merged
}

export function Echart({ width, height, echartOptions, eventHandlers, theme }: EchartProps) {
  const activeTheme = theme ?? DEFAULT_THEME
  const divRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType>(null)

  const themed = useMemo(
    () => applyTheme(echartOptions, activeTheme),
    [echartOptions, activeTheme],
  )

  useEffect(() => {
    if (!divRef.current) return
    if (!chartRef.current) {
      chartRef.current = init(divRef.current)
    }
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.setOption(themed, { notMerge: true, lazyUpdate: false })
    // (re)bind event handlers
    Object.entries(eventHandlers ?? {}).forEach(([name, handler]) => {
      chartRef.current?.off(name)
      chartRef.current?.on(name, handler)
    })
  }, [themed, eventHandlers])

  useLayoutEffect(() => {
    chartRef.current?.resize({ width, height })
  }, [width, height])

  return <div ref={divRef} style={{ width, height, background: activeTheme.colorBg }} />
}
