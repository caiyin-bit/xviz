// Snapshot of the @minimal-viz/core public API surface.
// Per VERSIONING.md, the frozen 1.x surface is exactly the symbols this
// module re-exports. Any add/remove/rename to the snapshot below must be
// accompanied by a SemVer bump (minor for additions, major for removals).
//
// If this test fails, you have changed the public API. Update the snapshot
// only after deciding whether the change is breaking and bumping
// package.json accordingly.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as publicApi from './index'

const __dir = dirname(fileURLToPath(import.meta.url))

describe('@minimal-viz/core public API', () => {
  it('exports exactly the documented surface', () => {
    // Sort to make order-of-export changes irrelevant — only the *set* of
    // exported names is part of the contract.
    const names = Object.keys(publicApi).sort()
    expect(names).toMatchInlineSnapshot(`
      [
        "BarChart",
        "BigNumber",
        "BigNumberPeriodOverPeriod",
        "BigNumberTotal",
        "BoxPlot",
        "Bullet",
        "Calendar",
        "Chord",
        "Compare",
        "CountryMap",
        "DARK_THEME",
        "DEFAULT_THEME",
        "Echart",
        "Funnel",
        "Gantt",
        "Gauge",
        "Graph",
        "Heatmap",
        "Histogram",
        "Horizon",
        "LIGHT_THEME",
        "LineChart",
        "MixedTimeseries",
        "PairedTTest",
        "ParallelCoordinates",
        "Partition",
        "PieChart",
        "PivotTable",
        "Radar",
        "Rose",
        "Sankey",
        "Scatter",
        "Step",
        "Sunburst",
        "Table",
        "TimePivot",
        "TimeTable",
        "TimeseriesBar",
        "TimeseriesLine",
        "Tree",
        "Treemap",
        "Waterfall",
        "WorldMap",
        "extendTheme",
        "transformCartesianProps",
        "transformPieProps",
      ]
    `)
  })

  it('exports exactly the documented type surface', () => {
    // TypeScript `export type { ... }` re-exports do not appear at runtime,
    // so we parse the source file and merge names from every
    // `export type { ... }` block (single-line or multi-line).
    const source = readFileSync(resolve(__dir, 'index.ts'), 'utf-8')
    const blocks = [...source.matchAll(/export type \{([^}]+)\}/g)]
    expect(blocks.length, 'index.ts must contain at least one `export type { ... }` block').toBeGreaterThan(0)
    const types = blocks
      .flatMap((m) => m[1].split(','))
      .map((s) => s.trim())
      .filter(Boolean)
      .sort()
    expect(types).toMatchInlineSnapshot(`
      [
        "AnyFormData",
        "BigNumberFormData",
        "BigNumberPeriodOverPeriodFormData",
        "BigNumberTotalFormData",
        "BoxPlotFormData",
        "BulletFormData",
        "CalendarFormData",
        "CartesianFormData",
        "ChartProps",
        "ChordFormData",
        "CompareFormData",
        "CountryMapFormData",
        "DataRecord",
        "FunnelFormData",
        "GanttFormData",
        "GaugeFormData",
        "GeoJsonInput",
        "GraphFormData",
        "HeatmapFormData",
        "HistogramFormData",
        "HorizonFormData",
        "MixedTimeseriesFormData",
        "NumberFormatKind",
        "PairedTTestFormData",
        "ParallelCoordinatesFormData",
        "PartitionFormData",
        "PieFormData",
        "PivotTableFormData",
        "QueryData",
        "RadarFormData",
        "RoseFormData",
        "SankeyFormData",
        "ScatterFormData",
        "StepFormData",
        "SunburstFormData",
        "TableFormData",
        "Theme",
        "TimePivotFormData",
        "TimeTableFormData",
        "TimeseriesFormData",
        "TreeFormData",
        "TreemapFormData",
        "WaterfallFormData",
        "WorldMapFormData",
      ]
    `)
  })
})
