# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] — 2026-04-29

This release ships **M7-A of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md)** — the SDK-free half of the maps wave. xviz now ships 39 chart types (up from 37), covering ~67% of Superset's chart catalog.

> **M7-B (deck.gl-based maps) intentionally deferred**. See [the M7 spike report](docs/superpowers/specs/2026-04-29-m7-spike-report.md) for the full analysis. Adding deck.gl + maplibre-gl to core would 3×-bloat the bundle (1.1 MB → 3.5+ MB), violating the lightweight architectural principle. When implemented, M7-B will ship as an optional satellite package `@minimal-viz/maps` using **`maplibre-gl@^5`** (not `mapbox-gl` — that's BSL-licensed and incompatible with our Apache 2.0). 13 charts remain in backlog: PointClusterMap, Cartodiagram, and DeckGL × 11.

### Added
- **WorldMap chart** (`vizType: 'world-map'`) — country-level choropleth using ECharts' native `MapChart` series + `GeoComponent` coordinate system. Users supply the GeoJSON via `formData.geojson` (xviz does NOT inline country geometry — would balloon the bundle to 5+ MB). `countryColumn` matches a feature property (default `name`); auto-computed visualMap from data range. Available in `@minimal-viz/core` (export `WorldMap`, `WorldMapFormData`, `GeoJsonInput`) and the xviz CLI/serve/MCP surface.
- **CountryMap chart** (`vizType: 'country-map'`) — subdivision-level choropleth (US states, China provinces, etc). Same ECharts MapChart renderer as WorldMap; the wrapper just renames `countryColumn` → `regionColumn` to signal intent. Saved Superset slice configs that use `country_map` migrate without remapping.
- New walkthroughs: [`examples/world-map-gdp/`](xviz-cli/examples/world-map-gdp/README.md) (top-12 GDPs colored by 2024 USD billions) and [`examples/country-map-states/`](xviz-cli/examples/country-map-states/README.md) (US states by population). Both require a user-supplied GeoJSON file (the walkthroughs include `curl` + `node` snippets to fetch and inline a simplified one).

### Changed
- `xviz serve /health.supported` now returns 39 entries (was 37).
- `Window.__CHART__.type` union extended to 39 type literals.
- **`Echart.tsx` registers ECharts' `MapChart` and `GeoComponent`** to support the new map charts. Renderer bundle grew from ~1.108 MB (v0.9.0) to ~1.151 MB (v0.10.0) — about +43 KB.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 39-chart roster.

### Decided (no-op release impact, documented for future work)
- **`maplibre-gl@^5` selected as the only base-map SDK for the future M7-B satellite package.** `mapbox-gl` is rejected: its v2+ Business Source License is incompatible with xviz's Apache 2.0 license. `mapbox-gl` also requires a token at runtime and locks tile sources to mapbox.com, both of which conflict with xviz's "lightweight CLI / MCP-first" use case. Superset's own `preset-chart-deckgl` lists `maplibre-gl` and not `mapbox-gl`. Deck.gl's `@deck.gl/mapbox` is base-map-agnostic, so users with existing Mapbox infrastructure can fork the satellite package and swap one import. Full reasoning + implementation contract (default OSM tile style, `mapStyle: string | object` override) recorded in [`docs/superpowers/specs/2026-04-29-m7-spike-report.md`](docs/superpowers/specs/2026-04-29-m7-spike-report.md).

### Internal
- 9 new tests for the map charts (test count: 152 → 161): WorldMap series shape, GeoJSON `registerMap` caching (WeakMap-based reuse for the same GeoJSON object), visualMap min/max, custom `colorRange` / `nameProperty`, drop-on-bad-input, empty-data, plus a CountryMap alias smoke test.

## [0.9.0] — 2026-04-29

This release completes **M6 of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md)** — nine new chart types taking xviz from 28 → 37 supported types. xviz now covers ~64% of Superset's chart catalog and effectively 100% of common BI / management-dashboard use cases.

> Many of these are legacy NVD3-era charts that Superset itself is gradually deprecating. xviz preserves the `vizType` discriminators so users with saved Superset slice configs can switch to xviz without remapping. Where the underlying NVD3 visual style was niche, xviz aliases the chart to a more idiomatic ECharts equivalent (e.g. PairedTTest → BoxPlot variant, Compare → multi-line TimeseriesLine).

### Added (full-implementation charts)
- **Rose chart** (`vizType: 'rose'`) — Nightingale rose. Pie variant with `roseType: 'radius' | 'area'` (sector size encodes either radius or area). Wrapper over the existing PieChart renderer.
- **ParallelCoordinates chart** (`vizType: 'parallel'`) — multi-axis polyline plot. ECharts 6 native `parallel` series + `parallel` coordinate component (now registered in `Echart.tsx`). One row → one polyline traversing N axes; optional seriesColumn groups lines by category.
- **Bullet chart** (`vizType: 'bullet'`) — KPI dashboard tile. ECharts has no native bullet, so xviz layers stacked qualitative-range bars (poor / satisfactory / good) + a narrow value bar (`barGap: '-100%'` overlay) + per-row markLine target ticks.
- **Chord chart** (`vizType: 'chord'`) — circular flow diagram. Native ECharts 6 `chord` series. Edge-list input (source / target / optional metric weight); nodes auto-inferred with cumulative incident-edge weights.

### Added (alias charts)
These reuse existing renderers with sensible defaults; the `vizType` discriminator is preserved for users coming from Superset.
- **Compare** (`vizType: 'compare'`) → TimeseriesLine with `area: false`. Year-over-year multi-line plot; comparison periods carried by `seriesColumn`.
- **Partition** (`vizType: 'partition'`) → Treemap with `showBreadcrumb: true`. Hierarchical icicle/partition rendering.
- **TimePivot** (`vizType: 'time-pivot'`) → TimeTable. Alias for Superset's legacy `time_pivot` slice type.
- **Horizon** (`vizType: 'horizon'`) → TimeseriesLine with `smooth: true, area: true`. Single-band horizon chart. The classic folded multi-band variant (positive/negative values into stacked colored bands) is on the backlog as it requires a custom renderItem implementation.
- **PairedTTest** (`vizType: 'paired-ttest'`) → BoxPlot grouped by `pairColumn`. Practical visual equivalent of Superset's legacy `paired_ttest` slice for most BI use cases.

### Changed
- `xviz serve /health.supported` now returns 37 entries (was 28).
- `Window.__CHART__.type` union (renderer bundle) extended to 37 type literals.
- **`Echart.tsx` registers more ECharts modules**: `ParallelChart`, `ChordChart`, `LinesChart`, `ThemeRiverChart`, and the `ParallelComponent` coordinate system. Renderer bundle grew from 1.054 MB (v0.8.1) to 1.108 MB (v0.9.0) — about +54 KB total across all M6 work, dominated by these module additions rather than the per-chart code.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 37-chart roster.
- New top-level fixtures: `rose.json`, `parallel.json`, `bullet.json`, `chord.json`. New walkthroughs: [`examples/chord-trade/`](xviz-cli/examples/chord-trade/README.md) (global trade flows) and [`examples/bullet-kpi/`](xviz-cli/examples/bullet-kpi/README.md) (Q4 KPI dashboard).

### Internal
- 31 new tests across the nine charts (test count: 121 → 152). Mix of inline-snapshot transform tests for the full-implementation charts (Rose, Parallel, Bullet, Chord) and SSR smoke tests for the alias wrappers.
- Implementation note: the v0.8.0 publish failure (CalendarFormData missing from staged types.ts) prompted a "git status check before each commit" discipline that paid off here — M6's nine charts shipped over four commits without any types.ts staging slips.

## [0.8.1] — 2026-04-29

Hotfix release. **`v0.8.0` was tagged on 2026-04-29 but failed to publish to npm** because `CalendarFormData` was missing from the public `types.ts` export at the tagged commit (the type definition was added locally but not staged into the M5.1 / v0.8.0 commits — the type-import sites in `viz/index.ts`, `Calendar.tsx`, and `transformProps.ts` consequently failed to resolve during the `publish-core` job's typecheck step). v0.8.0 was never on npm; this v0.8.1 release ships the same Calendar feature with the type definition correctly committed.

### Fixed
- `minimal-viz/src/viz/types.ts`: `CalendarFormData` interface and its addition to the `AnyFormData` union are now committed (was an uncommitted local-only change at the v0.8.0 tag).

## [0.8.0] — 2026-04-29 (failed to publish — superseded by 0.8.1)

This release ships **M5 of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md) at half scope** — Calendar (1 of 2 planned charts). xviz now supports 28 chart types (up from 27). WordCloud is deferred for ecosystem reasons (see below).

### Added
- **Calendar chart** (`vizType: 'calendar'`) — GitHub-contributions-style heatmap, one cell per day, colored by metric intensity. Uses ECharts' `calendar` coordinate system + `heatmap` series; range is auto-derived from data (or set explicitly via `rangeStart`/`rangeEnd`, including bare-year shortcuts like `'2024'`). Date column accepts ISO-8601 strings or numeric epoch ms. Available in `@minimal-viz/core` (export `Calendar`, `CalendarFormData`) and the xviz CLI/serve/MCP surface.
- `xviz-cli/examples/calendar.json` quick-reference fixture (52-week 2024 commit data) and walkthrough [`examples/calendar-contributions/`](xviz-cli/examples/calendar-contributions/README.md).
- 10 inline tests cover series shape, ISO date normalization, auto-range derivation, explicit-range pass-through, bare-year shortcut, visualMap min/max, custom colorRange, numeric-epoch parsing, drop-on-bad-input, and empty-data guard.

### Changed
- `xviz serve /health.supported` now returns 28 entries instead of 27.
- `Window.__CHART__.type` union (renderer bundle) extended to 28 type literals.
- **`CalendarComponent` is now registered in `Echart.tsx`** so the calendar coordinate system works at runtime. Renderer bundle grew from ~1.040 MB (v0.7.0) to ~1.054 MB (v0.8.0) — about +14 KB.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 28-chart roster.

### Deferred
- **WordCloud chart** (originally scoped as M5.2) — `echarts-wordcloud@2.1.0` declares `echarts@^5` as a peerDependency, conflicting with our `echarts@6`. Rather than downgrade ECharts (a breaking change to all 27 existing charts) or force-install with `--legacy-peer-deps` (unverified runtime), WordCloud is deferred until upstream publishes an echarts-6-compatible version. Will revisit on the next echarts-wordcloud release (check ecomfe/echarts-wordcloud release notes).

## [0.7.0] — 2026-04-28

This release completes **M4 of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md)** — four new chart types taking xviz from 23 → 27 supported types. No breaking changes. All four new charts are pure React/HTML (no ECharts dependency), so the renderer bundle grows by only ~7 KB.

> **AgGridTable deliberately deferred** (originally scoped as M4.5). Adding AG Grid Community would mean a ~500 KB runtime dependency — half the size of xviz today — for behavior that the existing `Table` and the new `PivotTable` already cover for ~95% of use cases. The lightweight architectural principle wins. AgGridTable can return as an optional satellite package if there's user demand.

### Added
- **BigNumberTotal chart** (`vizType: 'big-number-total'`) — single-statistic KPI tile that sums the metric across all input rows (vs the default `BigNumber` which displays the last row, treating data as a time series). Available in `@minimal-viz/core` (export `BigNumberTotal`, `BigNumberTotalFormData`) and the xviz CLI/serve/MCP surface.
- **BigNumberPeriodOverPeriod chart** (`vizType: 'big-number-pop'`) — period-over-period KPI: headline current value with previous-period value and delta (absolute + percent), with red-down / green-up convention. Two input shapes: long format (last row = current, first row = previous) or wide format (`previousMetric` pulls both columns from the same row). Configurable `compareLabel` (default `vs previous`). Available in `@minimal-viz/core` (export `BigNumberPeriodOverPeriod`, `BigNumberPeriodOverPeriodFormData`) and the xviz CLI/serve/MCP surface.
- **TimeTable chart** (`vizType: 'time-table'`) — pivot table with metrics as rows and chronologically-sorted time points as columns. Plain HTML rendering (no ECharts). Aggregates duplicate (time × metric) cells by sum; missing cells show em-dash. `metricLabels` for pretty row names; `timeFormat: 'iso' | 'short'` toggles full date vs YYYY-MM. Available in `@minimal-viz/core` (export `TimeTable`, `TimeTableFormData`) and the xviz CLI/serve/MCP surface.
- **PivotTable chart** (`vizType: 'pivot-table'`) — full pivot: row dimensions × column dimensions × single metric with one of five aggregators (sum / avg / count / min / max). Multi-level row/col dims are joined with `' / '` (no nested headers — keeps the implementation compact and the table easy to consume programmatically). Optional row totals (right column), column totals (bottom row), and grand total. Plain HTML rendering. Available in `@minimal-viz/core` (export `PivotTable`, `PivotTableFormData`) and the xviz CLI/serve/MCP surface.
- `xviz-cli/examples/` quick-reference fixtures for each new type: `big-number-total.json`, `big-number-pop.json`, `time-table.json`, `pivot-table.json`. `render-all.sh` runs them all.
- New walkthroughs: [`examples/pivot-financial/`](xviz-cli/examples/pivot-financial/README.md) (H1 revenue by region × quarter × channel — multi-level pivot) and [`examples/big-number-kpi/`](xviz-cli/examples/big-number-kpi/README.md) (MAU month-over-month KPI tile with delta). Ship without a pre-rendered `chart.png`; render locally.

### Changed
- `xviz serve /health.supported` now returns 27 entries instead of 23.
- `Window.__CHART__.type` union (renderer bundle) extended to 27 type literals.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 27-chart roster.

### Internal
- vitest config now includes `**/*.test.tsx` so React-component tests (server-side rendered with `renderToStaticMarkup`) can be picked up alongside transform tests. Required because all four new charts are React components with no `transformProps.ts` to test in isolation.
- 28 new SSR-rendered tests across the four new charts (test count: 83 → 111).
- Renderer bundle grew from ~1.033 MB (v0.6.0) to ~1.040 MB (v0.7.0) — only +7 KB across all four charts because none required new ECharts modules.

## [0.6.0] — 2026-04-28

This release completes **M3 of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md)** — four new chart types taking xviz from 19 → 23 supported types. No breaking changes; the existing categorical Bar / Line charts remain in place untouched. The new `timeseries-bar` and `timeseries-line` types are independent additions, not reskins of the old ones.

### Added
- **TimeseriesBar / TimeseriesLine charts** (`vizType: 'timeseries-bar' | 'timeseries-line'`) — proper time-axis variants of the existing categorical Bar / Line charts. Reuses `transformCartesianProps` and rewires the x-axis to ECharts' `time` type, remapping each series' data to `[timestamp, value]` pairs. Accepts ISO-8601 strings or numeric epoch ms in the time column. Available in `@minimal-viz/core` (export `TimeseriesBar`, `TimeseriesLine`, `TimeseriesFormData`) and the xviz CLI/serve/MCP surface.
- **MixedTimeseries chart** (`vizType: 'mixed-timeseries'`) — combined bar + line chart on the same time axis with optional dual Y axis. Bar metrics live on the left axis (default); line metrics can move to a right axis (`dualAxis: true`) for mixing absolute counts with rate / ratio metrics. Aggregates duplicate (date × metric) cells and chronologically sorts x values. Available in `@minimal-viz/core` (export `MixedTimeseries`, `MixedTimeseriesFormData`) and the xviz CLI/serve/MCP surface.
- **Gantt chart** (`vizType: 'gantt'`) — task schedule visualization with horizontal bars on a time axis. Implemented as an ECharts `custom` series with a `renderItem` that draws clipped rectangles spanning [start, end]. `groupColumn` colors tasks by owner / department; tasks listed top-to-bottom in input order. Tasks with unparseable dates are dropped. Available in `@minimal-viz/core` (export `Gantt`, `GanttFormData`) and the xviz CLI/serve/MCP surface.
- `xviz-cli/examples/` quick-reference fixtures for each new type: `timeseries-bar.json`, `timeseries-line.json`, `mixed-timeseries.json`, `gantt.json`. `render-all.sh` runs them all.
- New walkthroughs: [`examples/timeseries-revenue/`](xviz-cli/examples/timeseries-revenue/README.md) (multi-region monthly revenue on a true time axis) and [`examples/gantt-project/`](xviz-cli/examples/gantt-project/README.md) (H1 project schedule with 8 tasks × 4 owners). Ship without a pre-rendered `chart.png`; render locally.

### Changed
- `xviz serve /health.supported` now returns 23 entries instead of 19.
- `Window.__CHART__.type` union (renderer bundle) extended to 23 type literals.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 23-chart roster and the ~99% BI-coverage figure.
- **`CustomChart` is now registered in `Echart.tsx`** to support Gantt's custom-series rendering. Renderer bundle grew by ~17 KB to accommodate it (1.014 MB → 1.033 MB total). Future custom-series-based charts (e.g. Bullet) can reuse the same registration.

### Internal
- `transformTimeseriesProps` reuses `transformCartesianProps` (line/bar variant) and post-processes the output to convert the x-axis from `category` to `time`, rezipping series data with parsed timestamps. Existing `BarChart` / `LineChart` behavior is untouched.
- `transformMixedTimeseriesProps` is independent (no cartesian reuse) — multi-metric multi-type series wiring with optional `yAxisIndex` routing differs enough from the cartesian model that a separate pass was simpler.
- `transformGanttProps` builds a `custom` series with an inline `renderItem` that maps `[start, end]` value tuples to clipped rectangles. y-axis is categorical and `inverse: true` so input row order matches visual top-to-bottom.
- 23 new inline-snapshot / assertion tests across the four new transforms (test count: 60 → 83).

## [0.5.0] — 2026-04-28

This release completes **M2 of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md)** — four new chart types taking xviz from 15 → 19 supported types. No breaking changes; all v0.4.0 charts and APIs are preserved.

### Added
- **Waterfall chart** (`vizType: 'waterfall'`) — running-total visualization with positive (gain) and negative (loss) deltas plus an optional terminal Total bar. Implemented as two stacked `bar` series (transparent placeholder + colored deltas) since ECharts has no native waterfall. Available in `@minimal-viz/core` (export `Waterfall`, `WaterfallFormData`) and the xviz CLI/serve/MCP surface.
- **Step chart** (`vizType: 'step'`) — stepped line chart for state-change time series. Reuses `transformCartesianProps` (line variant) with a post-pass that injects ECharts' `step: 'start' | 'middle' | 'end'`. Same data contract as LineChart (xAxis + metrics + optional seriesColumn breakdown). Available in `@minimal-viz/core` (export `Step`, `StepFormData`) and the xviz CLI/serve/MCP surface.
- **Tree chart** (`vizType: 'tree'`) — hierarchical tree visualized as nodes + connecting links. Accepts a flat row set + multi-column `groupby` path; reuses `viz/hierarchy.ts` to build the nested tree, then synthesizes a single root when ≥2 top-level groups exist (configurable via `rootName`). Layouts: `'orthogonal'` (with `orient: 'LR' | 'RL' | 'TB' | 'BT'`) or `'radial'`. Available in `@minimal-viz/core` (export `Tree`, `TreeFormData`) and the xviz CLI/serve/MCP surface.
- **Graph chart** (`vizType: 'graph'`) — network/relationship plot from a flat edge list. Nodes are auto-inferred as `unique(source) ∪ unique(target)`; node values aggregate incident edge weights (or degree count when metric is absent), driving symbolSize. Layouts: `'force'` (default — animation disabled for headless rendering), `'circular'`, or `'none'`. Available in `@minimal-viz/core` (export `Graph`, `GraphFormData`) and the xviz CLI/serve/MCP surface.
- `xviz-cli/examples/` quick-reference fixtures for each new type: `waterfall.json`, `step.json`, `tree.json`, `graph.json`. `render-all.sh` runs them all.
- New walkthroughs: [`examples/waterfall-pnl/`](xviz-cli/examples/waterfall-pnl/README.md) (P&L decomposition with running total) and [`examples/graph-deps/`](xviz-cli/examples/graph-deps/README.md) (microservices call-graph with auto-inferred nodes). These ship without a pre-rendered `chart.png`; render locally.

### Changed
- `xviz serve /health.supported` now returns 19 entries instead of 15.
- `Window.__CHART__.type` union (renderer bundle) extended to 19 type literals.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 19-chart roster and the ~98% BI-coverage figure.

### Internal
- `Step` reuses `transformCartesianProps` (line variant) and post-processes the emitted series to inject ECharts' `step` field — no transform duplication.
- `Tree` reuses `viz/hierarchy.ts` (`buildHierarchy`) for the second consumer after Treemap/Sunburst; helper now serves four charts.
- 27 new inline-snapshot / assertion tests across the four new transforms (test count: 33 → 60).
- Renderer bundle grew from ~1.01 MB (v0.4.0) to ~1.014 MB (v0.5.0) — about +5 KB across all four charts (Step/Graph have the lightest footprint due to reuse).

## [0.4.0] — 2026-04-26

This release completes **M1 of the [xviz × Superset feature-parity roadmap](docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md)** — five new chart types taking xviz from 10 → 15 supported types in a single sweep. No breaking changes; all v0.2.0 charts and APIs are preserved.

> **Versioning note:** v0.3.x was an internal lint/CI quality release that was deliberately not published to npm (no user-visible behavior change). v0.4.0 is the next user-facing release after v0.2.0.

### Added
- **BoxPlot chart** (`vizType: 'boxplot'`) — categorical box-and-whisker with Tukey or min-max whiskers and optional outlier overlay. Computes 5-number summaries client-side from raw observations. Available in `@minimal-viz/core` (export `BoxPlot`, `BoxPlotFormData`) and the xviz CLI/serve/MCP surface (registered in `/health.supported`).
- **Histogram chart** (`vizType: 'histogram'`) — equal-width binning with optional density normalization and cumulative (empirical CDF) modes. Client-side bin computation; uses ECharts `bar` series under the hood. Available in `@minimal-viz/core` (export `Histogram`, `HistogramFormData`) and the xviz CLI/serve/MCP surface.
- **Treemap chart** (`vizType: 'treemap'`) — multi-level hierarchical rectangles, sized by metric. Accepts a flat row set + multi-column `groupby` path (e.g. `['region', 'country']`); the transform builds a nested tree and ECharts auto-aggregates parent levels. Available in `@minimal-viz/core` (export `Treemap`, `TreemapFormData`) and the xviz CLI/serve/MCP surface.
- **Sunburst chart** (`vizType: 'sunburst'`) — concentric-ring hierarchy, sized by metric. Same data contract as Treemap (flat rows + multi-column `groupby`), with optional `innerRadius`/`outerRadius` for donut shapes. Available in `@minimal-viz/core` (export `Sunburst`, `SunburstFormData`) and the xviz CLI/serve/MCP surface.
- **Radar chart** (`vizType: 'radar'`) — multi-axis comparison plot. Each metric in `metrics: string[]` becomes a radar axis; each `groupby` value becomes a series. Per-axis scale auto-computed from data, with `axisMax` override available. Filled by default; `fill: false` for outline-only. Polygon or circle shape. Available in `@minimal-viz/core` (export `Radar`, `RadarFormData`) and the xviz CLI/serve/MCP surface.
- `xviz-cli/examples/` quick-reference fixtures for each new type: `boxplot.json`, `histogram.json`, `treemap.json`, `sunburst.json`, `radar.json`. `render-all.sh` runs them all.
- New walkthroughs: [`examples/boxplot-tukey/`](xviz-cli/examples/boxplot-tukey/README.md) (statistical exploration with outlier detection) and [`examples/treemap-regions/`](xviz-cli/examples/treemap-regions/README.md) (2-level hierarchy from flat rows). These deliberately ship without a pre-rendered `chart.png`; render locally to verify your environment.

### Changed
- `xviz serve /health.supported` now returns 15 entries instead of 10.
- `Window.__CHART__.type` union (renderer bundle) extended to 15 type literals.
- Top-level READMEs (EN + zh-CN), `minimal-viz/README.md`, `xviz-cli/README.md`, and `xviz-cli/examples/README.md` updated to reflect the 15-chart roster and the 95% BI-coverage figure.

### Internal
- `minimal-viz/src/viz/hierarchy.ts` introduced as the shared flat-rows-to-tree helper used by Treemap and Sunburst (slated for M2 Tree/Graph reuse). Treemap was refactored to consume the helper; snapshot output unchanged.
- 27 new inline-snapshot / assertion tests across the five new transforms (test count: 6 → 33).
- Renderer bundle grew from ~1.00 MB to ~1.01 MB (+~17 KB across all five charts).

## [0.2.0] — 2026-04-25

### Added
- `xviz-cli`: `prepack` build hook so `npm pack` always rebuilds the renderer
  before tarballing (replaces the now-removed `prepublishOnly` to avoid
  double builds).
- `xviz-cli`: Vitest smoke tests for `render`, `query` (SQLite), and `mcp`
  paths. The legacy hand-runnable `test/mcp-client.mjs` was ported.
- `@minimal-viz/core`: Vitest snapshot tests for `transformPieProps` and
  `transformCartesianProps`.
- CI: `pack-smoke` job that does fresh-checkout `npm pack` →
  `npm i -g <tarball>` → real `xviz render`, with Chrome installed via
  `browser-actions/setup-chrome`. Regression net for the
  `npm i -g xviz-cli` user path.
- CI: `vitest` job covering both packages.
- Repo: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1),
  issue templates (bug / feature / config), and PR template.
- `xviz-cli` + `@minimal-viz/core`: Vitest V8 coverage configured;
  `npm run test:coverage` produces `coverage/lcov.info` and an HTML
  report locally. CI uploads the combined coverage as a 14-day
  workflow artifact and (best-effort) sends lcov to Codecov.
- CI: `lint-typecheck` job runs `npm run lint` (minimal-viz) and
  `npm run typecheck` (both packages) on every PR.
- Top-level: `README.md` rewritten with the value proposition
  ("Apache Superset's chart engine, unbundled"), language toggle,
  Coverage badge slot, and corrected `npm i -g xviz-cli` install
  command.
- New: `README.zh-CN.md` Chinese top-level README.
- New: `xviz-cli/examples/README.md` index plus five end-to-end
  example folders (`postgres-pie`, `csv-bar`, `sqlite-cron`,
  `mcp-claude-desktop`, `serve-curl`), each with sample data /
  config, a runnable script, and a pre-rendered `chart.png`.
- `minimal-viz`: ESLint config now ignores `coverage/` and the
  echarts `use` import was renamed to `registerEcharts` to silence
  a `react-hooks/rules-of-hooks` false positive.

### Removed
- `xviz-cli`: `prepublishOnly` script (functionally subsumed by `prepack`).
- `xviz-cli/test/mcp-client.mjs` (replaced by Vitest equivalent).

## [0.1.0] — 2026-04-24

Initial release.

### `@minimal-viz/core` — React chart library

- **10 chart types**: Pie, Bar, Line, Table, BigNumber, Scatter, Heatmap,
  Sankey, Funnel, Gauge.
- **Theming system**: built-in `LIGHT_THEME` / `DARK_THEME` + `extendTheme()`
  for brand palettes. Theme is applied centrally in the `Echart` wrapper so
  individual `transformProps` functions stay theme-agnostic.
- **Publishing**: ships ESM + CJS + `.d.ts`. `peerDependencies`:
  `react >=18`, `react-dom >=18`, `echarts >=5 <7`. Package size ~28 KB
  on disk, ~5 KB gzipped.
- **API surface**: every chart component takes
  `{ formData, queriesData, width, height, theme? }`. `formData` schemas
  are typed per chart (`PieFormData`, `CartesianFormData`, etc.).

### `xviz-cli` — headless renderer

- **`xviz render`**: one-shot render from JSON or CSV file to PNG / JPG /
  PDF / HTML.
- **`xviz query`**: run a SQL query and render the result in one step.
  Drivers loaded dynamically — install only what you use
  (`better-sqlite3`, `pg`, `mysql2/promise`). Row-count safety cap
  (default 10,000).
- **`xviz serve`**: long-running HTTP server with `POST /render`.
  Puppeteer browser kept warm between requests (~1.2 s / render).
- **`xviz mcp`**: MCP server over stdio, exposing `render_chart` and
  `list_chart_types` tools for LLM integration (Claude Desktop config
  example in the README).
- **Rendering pipeline**: Vite builds the renderer into a single
  self-contained HTML file (JS + CSS inlined via
  `vite-plugin-singlefile`). The CLI injects `window.__CHART__` before
  the page script runs, then screenshots the `#root` element with
  Puppeteer (`puppeteer-core`, bring-your-own-Chrome via
  `XVIZ_CHROME=...`).

### CSV compatibility

Handles real-world BI-tool CSV exports, with 16 regression tests in
[`xviz-cli/test/csv-compat.test.mjs`](./xviz-cli/test/csv-compat.test.mjs):

- UTF-8 BOM stripped (covers `encoding="utf-8-sig"`).
- Thousands-separated integers and floats: `"9,823,456"`, `"24,800.00"`.
- CSV-injection guard defused: `"'+12V"` → `"+12V"`,
  `"'@formula"` → `"@formula"`.
- Nested double quotes: `"""Pro"" Kit"` → `"Pro" Kit`.
- Aggregate column names preserved: `SUM(confirmed)`, `COUNT(*)`.
- `__timestamp` columns kept as strings (not eagerly coerced).
- Scientific notation, leading-zero strings, booleans, blank trailing
  lines.

### Tooling / CI

- **GitHub Actions** (`.github/workflows/ci.yml`): three jobs on every
  push / PR — `csv-compat`, `build-lib` (Node 20 × 22), and
  `build-renderer` (bundle-size sanity check).
- **Examples**: 14 ready-to-run configs under `xviz-cli/examples/` plus
  `render-all.sh` as a visual smoke test. Three sample Superset-style
  CSV exports under `xviz-cli/examples/superset-exports/` (COVID stats,
  time series, e-commerce with quoted fields).

### Docs

- Per-package READMEs with full API surface and usage examples.
- A technical deep-dive blog post with 15 screenshots tracing the
  extraction from concept to shipping
  ([`docs/blog/2026-04-24-extracting-superset-viz.md`](./docs/blog/2026-04-24-extracting-superset-viz.md)).

### Acknowledgements

Architectural ideas — especially the `formData` / `queriesData` prop
shape, the `transformProps` indirection, and the chart-metadata
registry pattern — are adapted from
[Apache Superset](https://superset.apache.org/)'s chart plugin system.
This project is an independent extraction and is not affiliated with
or endorsed by The Apache Software Foundation.

[Unreleased]: https://github.com/caiyin-bit/xviz/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/caiyin-bit/xviz/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/caiyin-bit/xviz/releases/tag/v0.1.0
