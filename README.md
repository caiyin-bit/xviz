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
> no dashboards — just charts, **thirty-nine of them** (v0.10.0), plus a renderer
> that turns data into PNG / PDF / HTML.

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
`echarts`. ~5 KB gzipped (excluding peers).

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

## The charts

Thirty-nine chart types covering ~99% of everyday BI needs (as of v0.10.0).

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

**Added in v0.10.0** — M7-A of the same roadmap (SDK-free choropleths; deck.gl-based maps deferred):

| Chart | Use case | Notes |
|---|---|---|
| **WorldMap** | Country-level choropleth | ECharts native MapChart + user-supplied GeoJSON. Zero new deps, zero token, no tile server |
| **CountryMap** | Subdivision-level choropleth (states / provinces / counties) | Same renderer as WorldMap, signaling intent only |

> **Map SDK note** — xviz core uses ECharts' native MapChart for static choropleths. The 13 deck.gl-based maps from Superset (PointClusterMap, Cartodiagram, DeckGL Arc/Geojson/Grid/Hex/Heatmap/Multi/Path/Polygon/Scatter/Screengrid/Contour) are intentionally deferred to a future optional satellite package `@minimal-viz/maps`. Adding them to core would 3×-bloat the bundle (1.1 MB → 3.5+ MB). When implemented, the satellite package will use **`maplibre-gl@^5`** (BSD-3 license, no token needed, OSM-friendly) — not `mapbox-gl` (BSL license incompatible with Apache 2.0). See [`docs/superpowers/specs/2026-04-29-m7-spike-report.md`](./docs/superpowers/specs/2026-04-29-m7-spike-report.md) for the full decision trail.

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

- 📖 **[Technical deep dive](./docs/blog/2026-04-24-extracting-superset-viz.md)**
  — architecture, trade-offs, side-by-side comparisons
- 🧩 **[minimal-viz library docs](./minimal-viz/README.md)** — full API, theming, all 39 chart types
- 🛠️ **[xviz CLI docs](./xviz-cli/README.md)** — `render`, `query`, `serve`, `mcp` commands
- 🧪 **[Runnable examples](./xviz-cli/examples/README.md)** — Postgres, SQLite, CSV, MCP, HTTP
- 🤝 **[Contributing](./CONTRIBUTING.md)** — bug reports, PRs, dev setup
- 📜 **[Code of Conduct](./CODE_OF_CONDUCT.md)**

## License

Apache 2.0
