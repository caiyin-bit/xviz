# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **TimeseriesBar / TimeseriesLine charts** (`vizType: 'timeseries-bar' | 'timeseries-line'`) — proper time-axis variants of the existing categorical Bar / Line charts. Reuses `transformCartesianProps` and rewires the x-axis to ECharts' `time` type, remapping each series' data to `[timestamp, value]` pairs. Accepts ISO-8601 strings or numeric epoch ms in the time column. Available in `@minimal-viz/core` (export `TimeseriesBar`, `TimeseriesLine`, `TimeseriesFormData`) and the xviz CLI/serve/MCP surface. First charts of M3 (xviz × Superset parity roadmap).
- **MixedTimeseries chart** (`vizType: 'mixed-timeseries'`) — combined bar + line chart on the same time axis with optional dual Y axis. Bar metrics live on the left axis (default); line metrics can move to a right axis (`dualAxis: true`) for mixing absolute counts with rate / ratio metrics. Aggregates duplicate (date × metric) cells and chronologically sorts x values. Available in `@minimal-viz/core` (export `MixedTimeseries`, `MixedTimeseriesFormData`) and the xviz CLI/serve/MCP surface.
- **Gantt chart** (`vizType: 'gantt'`) — task schedule visualization with horizontal bars on a time axis. Implemented as an ECharts `custom` series with a `renderItem` that draws clipped rectangles spanning [start, end]. `groupColumn` colors tasks by owner / department; tasks listed top-to-bottom in input order. Tasks with unparseable dates are dropped. **`CustomChart` is now registered in the renderer** to support this. Available in `@minimal-viz/core` (export `Gantt`, `GanttFormData`) and the xviz CLI/serve/MCP surface.
- **M3 milestone complete**: TimeseriesBar + TimeseriesLine + MixedTimeseries + Gantt — 4 new chart types, taking xviz from 19 → 23 supported types. Roadmap M3.1–M3.3 all ✅ (Gantt counted as M3.3, since TimeseriesBar/Line shared a transform and shipped together).

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
