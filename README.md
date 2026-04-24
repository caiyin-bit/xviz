# xviz — lightweight charts + headless renderer

<p align="center">
  <a href="https://github.com/caiyin-bit/xviz/actions/workflows/ci.yml">
    <img src="https://github.com/caiyin-bit/xviz/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/license-Apache_2.0-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg" alt="Node" />
</p>

<p align="center">
  <img src="docs/blog/images/hero-pie.png" width="520" alt="Pie chart rendered by xviz" />
</p>

> A React + ECharts charting library plus a headless CLI that turns JSON, CSV,
> or SQL query results into PNG / PDF / HTML. Also ships an HTTP server and
> an MCP server for LLM tool-use.

## Origin

This project grew out of an actual business need for production-quality
chart rendering without a BI backend. It is inspired by — and borrows
architectural ideas from — Apache Superset's chart plugin system, but was
extracted into a standalone library so it can be used in any React app or
run headless as a CLI / HTTP / MCP service.

## The charts

Ten chart types covering ~80% of everyday BI needs.

| | | |
|:---:|:---:|:---:|
| ![Pie](docs/blog/images/hero-pie.png) | ![Bar](docs/blog/images/02-bar-stacked.png) | ![Line](docs/blog/images/03-line-area.png) |
| **Pie / Donut** | **Bar (stacked)** | **Line (smooth + area)** |
| ![Table](docs/blog/images/04-table.png) | ![Scatter](docs/blog/images/05-scatter.png) | ![Heatmap](docs/blog/images/06-heatmap.png) |
| **Table** | **Scatter / Bubble** | **Heatmap** |
| ![Sankey](docs/blog/images/07-sankey.png) | ![Funnel](docs/blog/images/08-funnel.png) | ![Gauge](docs/blog/images/09-gauge.png) |
| **Sankey** | **Funnel** | **Gauge** |

Plus **BigNumber** (KPI tile with trendline + % delta) and light/dark themes:

<p align="center">
  <img src="docs/blog/images/10-pie-dark.png" width="340" alt="Dark theme" />
  <img src="docs/blog/images/11-gauge-dark.png" width="340" alt="Dark gauge" />
</p>

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
cd xviz-cli && npm install && npm run build

# From JSON or CSV
xviz render -d data.csv -f form.json -o chart.png

# Straight from a database
xviz query --db sqlite:./orders.db \
  --sql "SELECT region, SUM(revenue) r FROM orders GROUP BY 1" \
  --form pie.json -o regions.png

# Or as an HTTP service — browser stays warm, ~1.2s/request
xviz serve --port 3737
```

See the [CLI docs →](./xviz-cli/README.md)

### 3 · As an LLM tool (MCP)

Ask Claude *"chart these numbers as a donut"* and it calls `render_chart`
directly:

<p align="center">
  <img src="docs/blog/images/15-mcp.png" width="420" alt="MCP-rendered chart" />
</p>

```json
// Add to Claude Desktop's config:
{ "mcpServers": { "xviz": { "command": "node",
  "args": ["/path/to/xviz-cli/bin/xviz.mjs", "mcp"] } } }
```

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
- 🧩 **[minimal-viz library docs](./minimal-viz/README.md)** — full API, theming, all 10 chart types
- 🛠️ **[xviz CLI docs](./xviz-cli/README.md)** — `render`, `query`, `serve`, `mcp` commands

## License

Apache 2.0
