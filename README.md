# xviz — Apache Superset's chart engine, unbundled

<p align="center">
  <a href="https://github.com/caiyin-bit/xviz/actions/workflows/ci.yml">
    <img src="https://github.com/caiyin-bit/xviz/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://codecov.io/gh/caiyin-bit/xviz">
    <img src="https://codecov.io/gh/caiyin-bit/xviz/branch/main/graph/badge.svg" alt="Coverage" />
  </a>
  <img src="https://img.shields.io/badge/license-Apache_2.0-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg" alt="Node" />
  <img src="https://img.shields.io/badge/v1.0-stable-success.svg" alt="Stability" />
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="docs/blog/images/hero-pie.png" width="520" alt="Pie chart rendered by xviz" />
</p>

> The chart layer of Apache Superset, extracted into a standalone library.
> Use it as a React component, render it headlessly from JSON / CSV / SQL via
> the CLI, or hand it to an LLM agent over MCP. No BI platform, no metadata DB,
> no dashboards — just charts. **Stable 1.0**: 39 chart types in core +
> 13 deck.gl-powered map types in the optional `@minimal-viz/maps` satellite,
> covering Apache Superset's full chart catalog. SemVer commitment in
> [VERSIONING.md](./VERSIONING.md).

## Three ways to use it

### 1 · As a React library

```bash
npm install @minimal-viz/core react react-dom echarts
```

```tsx
import { PieChart } from '@minimal-viz/core'

<PieChart
  width={600} height={400}
  formData={{ vizType: 'pie', groupby: ['region'], metric: 'sales', donut: true }}
  queriesData={[{ data: [
    { region: 'NA', sales: 1200 },
    { region: 'EU', sales:  900 },
    { region: 'AS', sales: 1500 },
  ]}]}
/>
```

Runs in any React 18+ app. Three runtime deps: `react`, `react-dom`,
`echarts`. ~76 KB ESM / ~18 KB gzipped (excluding peers).

See the [library docs →](./minimal-viz/README.md)

### 2 · As a CLI

```bash
npm i -g xviz-cli

# From JSON or CSV
xviz render -d data.csv -f form.json -o chart.png

# Straight from a database
xviz query --db sqlite:./orders.db \
  --sql "SELECT region, SUM(revenue) r FROM orders GROUP BY 1" \
  --form pie.json -o regions.png

# Or as an HTTP service — browser stays warm, ~1.2s/request
xviz serve --port 3737
```

Chrome or Chromium is required at runtime (`xviz` uses `puppeteer-core`,
no browser bundled). Set `XVIZ_CHROME=/path/to/chrome` if it isn't on the
default search path.

### 2½ · As a Docker image (no Chrome install needed)

```bash
# Latest stable
docker run --rm -v "$PWD:/data" ghcr.io/caiyin-bit/xviz/xviz-cli:latest \
  render -d /data/sales.json -f /data/pie.json -o /data/out.png

# Pin to a major.minor for production
docker run --rm ghcr.io/caiyin-bit/xviz/xviz-cli:1.0 --help
```

Multi-stage Alpine image (~250 MB) with chromium pre-wired. Maps satellite
is *not* in this image — for `XVIZ_ENABLE_MAPS=1` builds, fork the
[Dockerfile](./xviz-cli/Dockerfile) and build with the env override.

See the [CLI docs →](./xviz-cli/README.md) and the
[runnable examples →](./xviz-cli/examples/README.md)

### 3 · As an LLM tool (MCP)

Ask Claude *"chart these numbers as a donut"* and it calls `render_chart`
directly:

<p align="center">
  <img src="docs/blog/images/15-mcp.png" width="420" alt="MCP-rendered chart" />
</p>

```json
{ "mcpServers": { "xviz": { "command": "npx",
  "args": ["xviz-cli", "mcp"] } } }
```

Drop that into your Claude Desktop config and Claude can render any of
the thirty-nine chart types on demand. Full walk-through in the
[MCP example](./xviz-cli/examples/mcp-claude-desktop/README.md).

## What `1.0` means

1.0 is **a contract**, not a "we're done" sign. From this version onward,
xviz follows strict SemVer:

| Change | Bump |
|---|---|
| Breaking change to the public API | major (`2.0.0`) |
| New chart type / new CLI flag / new MCP tool | minor (`1.1.0`) |
| Bug fix / doc change / internal refactor | patch (`1.0.1`) |

The frozen public surface of `@minimal-viz/core@1.x` is exactly the
symbols re-exported from [`src/viz/index.ts`](./minimal-viz/src/viz/index.ts) — pinned by an
[inline-snapshot test](./minimal-viz/src/viz/public-api.test.ts) that
fails CI on any unintended add/remove/rename. The full versioning
contract lives in [VERSIONING.md](./VERSIONING.md); the security policy
and supported-version matrix in [SECURITY.md](./SECURITY.md).

`@minimal-viz/maps` stays on its **independent 0.x track** — see the
[maps satellite](#maps-the-minimal-vizmaps-satellite) section. It will
graduate to 1.x once it accrues real-world feedback.

### What's actually new in 1.0 (vs 0.10)

| | |
|---|---|
| **Maps satellite** | The 13 deck.gl chart types are now shipping in [`@minimal-viz/maps@0.1.0`](./minimal-viz-maps/README.md), behind an `XVIZ_ENABLE_MAPS=1` build flag in xviz-cli — default bundle stays light |
| **Docker image** | `ghcr.io/caiyin-bit/xviz/xviz-cli:1.0` — alpine + chromium pre-wired, no host-side Chrome install |
| **MCP API freeze** | Tool names, parameter shapes, and response shapes locked under SemVer |
| **Bundle size budgets** | CI fails if core ESM > 250 KB, default renderer > 1.30 MB raw / 400 KB gzip, or maps renderer > 3.30 MB raw / 950 KB gzip |
| **Cross-OS CI** | `build-lib` runs on Linux/macOS/Windows × Node 20+22; core test suite also runs on macOS+Windows |
| **Live WebGL smoke** | `maps-webgl-smoke` CI job builds the maps-enabled renderer and renders through real headless Chrome (deck.gl + maplibre-gl) on every push |
| **Perf baseline** | [`xviz-cli/bench/`](./xviz-cli/bench/) — 5-fixture × N-runs harness, cold-start vs warm-render separated |
| **Auto-release** | `git tag v1.0.1 && git push --tags` now also publishes Docker, creates GH release, extracts notes from CHANGELOG |

Backstory & rationale in the launch post:
[**xviz 1.0 — what 1.0 means, satellite split, infra wins**](./docs/blog/2026-04-30-xviz-v1-launch.md).

## The charts

Thirty-nine chart types in core, covering Apache Superset's full
ECharts-based catalog. Add the `@minimal-viz/maps` satellite for the
13 deck.gl-powered map types — see the [maps section](#maps-the-minimal-vizmaps-satellite) below.

| | | |
|:---:|:---:|:---:|
| ![Pie](docs/blog/images/hero-pie.png) | ![Bar](docs/blog/images/02-bar-stacked.png) | ![Line](docs/blog/images/03-line-area.png) |
| **Pie / Donut** | **Bar (stacked)** | **Line (smooth + area)** |
| ![Table](docs/blog/images/04-table.png) | ![Scatter](docs/blog/images/05-scatter.png) | ![Heatmap](docs/blog/images/06-heatmap.png) |
| **Table** | **Scatter / Bubble** | **Heatmap** |
| ![Sankey](docs/blog/images/07-sankey.png) | ![Funnel](docs/blog/images/08-funnel.png) | ![Gauge](docs/blog/images/09-gauge.png) |
| **Sankey** | **Funnel** | **Gauge** |

**Added in v0.4.0** — M1 of the [Superset feature-parity roadmap](./docs/superpowers/specs/2026-04-26-xviz-superset-parity-roadmap.md):

| Chart | Use case | Notes |
|---|---|---|
| **BoxPlot** | Distribution comparison across groups | Tukey or min-max whiskers, optional outlier overlay |
| **Histogram** | Single-column distribution | Equal-width bins, optional density / cumulative modes |
| **Treemap** | Hierarchical part-to-whole | Multi-column `groupby` builds nested tree |
| **Sunburst** | Concentric-ring hierarchy | Same data contract as Treemap |
| **Radar** | Multi-axis comparison | Each metric → one axis; each group → one polygon |

**Added in v0.5.0** — M2 of the same roadmap:

| Chart | Use case | Notes |
|---|---|---|
| **Waterfall** | Running-total / P&L decomposition | Gain (green) + loss (red) + optional Total bar |
| **Step** | State-change time series | LineChart with `step: 'start'` / `'middle'` / `'end'` |
| **Tree** | Org / taxonomy structure | Orthogonal (LR/RL/TB/BT) or radial layout |
| **Graph** | Node-edge relationships | Edge-list input, auto-inferred nodes; force-layout (no animation) for headless rendering |

**Added in v0.6.0** — M3 of the same roadmap (timeseries baseline):

| Chart | Use case | Notes |
|---|---|---|
| **TimeseriesBar / TimeseriesLine** | Native time-axis bar / line | True `time`-axis ECharts (vs the existing categorical Bar / Line); accepts ISO-8601 or numeric epoch ms |
| **MixedTimeseries** | Mixed bar + line on shared time axis | Optional dual Y axis (`dualAxis: true`) — bars on the left, lines on the right |
| **Gantt** | Task / project schedule | Horizontal bars on a time axis via ECharts `custom` series; group-by-owner coloring |

**Added in v0.7.0** — M4 of the same roadmap (table family + KPI variants):

| Chart | Use case | Notes |
|---|---|---|
| **BigNumberTotal** | Single-number KPI tile | Sums the metric across all input rows (vs default BigNumber which displays the last row) |
| **BigNumberPeriodOverPeriod** | Period-over-period KPI | Headline current value with previous-period value and delta (absolute + percent); long or wide format |
| **TimeTable** | Metrics × time pivot | Plain HTML table; chronological column sort; em-dash for missing cells |
| **PivotTable** | Full row × column × value pivot | 5 aggregators (sum / avg / count / min / max); optional row + column + grand totals |

**Added in v0.8.0** — M5 of the same roadmap (calendar; WordCloud deferred):

| Chart | Use case | Notes |
|---|---|---|
| **Calendar** | GitHub-contributions-style heatmap | One cell per day, colored by metric intensity. Auto-derives range from data; date column accepts ISO-8601 or epoch ms |

> **WordCloud deferred** — `echarts-wordcloud@2.x` requires `echarts@5`, conflicting with our `echarts@6`. Will return when upstream releases an echarts-6-compatible version.

**Added in v0.9.0** — M6 of the same roadmap (legacy independent charts; 9 charts):

| Chart | Use case | Notes |
|---|---|---|
| **Rose** | Nightingale rose | Pie variant with `roseType: 'radius' \| 'area'` |
| **ParallelCoordinates** | Multi-axis polyline | One line per row across N axes; native ECharts `parallel` |
| **Bullet** | KPI dashboard tile | Graded ranges (poor/good/excellent) + actual value bar + target tick |
| **Compare** | Year-over-year line plot | Wrapper over TimeseriesLine; comparison periods via seriesColumn |
| **Partition** | Hierarchical icicle | Wrapper over Treemap with breadcrumb |
| **TimePivot** | Metrics × time table | Alias of TimeTable for legacy `time_pivot` users |
| **Chord** | Circular flow diagram | Edge-list input; ECharts 6 native ChordChart |
| **Horizon** | Single-band time-series area | Simplified — multi-band folded variant in backlog |
| **PairedTTest** | Paired statistical exploration | BoxPlot variant with pair grouping |

**Added in v0.10.0** — M7-A of the same roadmap (SDK-free choropleths in core):

| Chart | Use case | Notes |
|---|---|---|
| **WorldMap** | Country-level choropleth | ECharts native MapChart + user-supplied GeoJSON. Zero new deps, zero token, no tile server |
| **CountryMap** | Subdivision-level choropleth (states / provinces / counties) | Same renderer as WorldMap, signaling intent only |

### Maps: the `@minimal-viz/maps` satellite

The 13 deck.gl-powered map types from Superset ship as an **optional
satellite package** ([`@minimal-viz/maps`](./minimal-viz-maps), 0.1.0) so
the core bundle stays light. Adding deck.gl + maplibre-gl to core would
3×-bloat the renderer (1.15 MB → 3.02 MB); putting them behind an opt-in
keeps that cost off everyone who doesn't draw maps.

| Chart | Layer family | Notes |
|---|---|---|
| **DeckScatter / DeckPath / DeckPolygon / DeckArc / DeckGeojson** | Standard layers | Direct deck.gl `ScatterplotLayer` / `PathLayer` / `PolygonLayer` / `ArcLayer` / `GeoJsonLayer` |
| **DeckGrid / DeckHex / DeckHeatmap / DeckScreengrid / DeckContour** | Aggregation layers | Bin → color-by-metric. Heatmap is GPU gaussian, others are CPU aggregation |
| **DeckMulti** | Composite | One sublayer per `formData.sublayers[]` entry, dispatched by `vizType` |
| **PointClusterMap** | Specialty | `supercluster` index + ScatterplotLayer cluster bubbles + TextLayer labels |
| **Cartodiagram** | Specialty | Per-point donut markers, rendered as canvas → `IconLayer` (avoids per-point ECharts mount cost) |

```bash
# As a library
npm install @minimal-viz/maps maplibre-gl \
  @deck.gl/core @deck.gl/layers @deck.gl/aggregation-layers @deck.gl/mapbox

# In xviz-cli — opt in at build time
git clone https://github.com/caiyin-bit/xviz.git
cd xviz/xviz-cli && npm ci --include=optional
npm run build:maps    # XVIZ_ENABLE_MAPS=1 vite build
xviz render -d examples/deck-scatter-cities/data.json \
  -f examples/deck-scatter-cities/form.json -o cities.png
```

Map SDK choice (recorded in [`docs/superpowers/specs/2026-04-29-m7-spike-report.md`](./docs/superpowers/specs/2026-04-29-m7-spike-report.md)):
**`maplibre-gl@^5`** (BSD-3, zero-token, OSM-friendly), **not** `mapbox-gl`
(BSL — incompatible with our Apache 2.0). Default tile style is free
OpenStreetMap raster; users can override with any maplibre-compatible
style URL or inline style.

Plus **BigNumber** (KPI tile with trendline + % delta) and light/dark themes:

<p align="center">
  <img src="docs/blog/images/10-pie-dark.png" width="340" alt="Dark theme" />
  <img src="docs/blog/images/11-gauge-dark.png" width="340" alt="Dark gauge" />
</p>

## CSV compatibility

The CSV parser handles the edge cases BI tools produce — UTF-8 BOM,
thousands-separated numbers (`"9,823,456"`), nested double quotes,
CSV-injection escaping, aggregate column names like `SUM(x)` and
`__timestamp`. 16 regression tests cover real-world export shapes.

## What this is **not**

xviz is not a BI platform. No dashboards, no permissioning, no saved
queries, no metadata DB. It's the "I have some data, I want a chart"
part of the problem — nothing more.

## Learn more

- 📰 **[v1.0 launch post](./docs/blog/2026-04-30-xviz-v1-launch.md)** —
  what 1.0 means, the satellite split, what shipped vs what's deferred
- 📖 **[Original deep dive](./docs/blog/2026-04-24-extracting-superset-viz.md)**
  — how the chart layer was extracted from Superset (architecture, trade-offs, comparisons)
- 📜 **[VERSIONING.md](./VERSIONING.md)** — SemVer commitment, deprecation policy, supported versions
- 🛡️ **[SECURITY.md](./SECURITY.md)** — vulnerability reporting, threat model
- 🧩 **[minimal-viz library docs](./minimal-viz/README.md)** — full API, theming, all 39 chart types
- 🗺️ **[minimal-viz/maps satellite](./minimal-viz-maps/)** — 13 deck.gl-powered map types
- 🛠️ **[xviz CLI docs](./xviz-cli/README.md)** — `render`, `query`, `serve`, `mcp` commands
- ⚡ **[Performance baseline](./xviz-cli/bench/README.md)** — re-runnable bench harness
- 🧪 **[Runnable examples](./xviz-cli/examples/README.md)** — Postgres, SQLite, CSV, MCP, HTTP
- 🤝 **[Contributing](./CONTRIBUTING.md)** — bug reports, PRs, dev setup
- 📜 **[Code of Conduct](./CODE_OF_CONDUCT.md)**

## License

Apache 2.0
