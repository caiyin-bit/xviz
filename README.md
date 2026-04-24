# minimal-viz + xviz

A lightweight alternative to Apache Superset's visualization layer, split into
two packages that can be used independently:

- **[`minimal-viz/`](./minimal-viz/)** — a React + ECharts chart library with
  10 chart types (Pie, Bar, Line, Table, BigNumber, Scatter, Heatmap, Sankey,
  Funnel, Gauge). Runs in any React 18+ app. No Superset backend required.
- **[`xviz-cli/`](./xviz-cli/)** — a headless renderer that turns JSON, CSV,
  or SQL query results into PNG/PDF/HTML charts. Has four modes: one-shot
  `render`, SQL `query`, HTTP `serve`, and MCP server for LLM tool-use.

Together they cover the "I have some data, I want a chart" story without
pulling in the full Superset stack.

## Why this exists

Apache Superset ships ~66 chart types via a plugin system built on top of
React + ECharts. Their npm packages (`@superset-ui/*`) work but:

- **Published versions are several years behind** the monorepo source.
- **Require React 16-era** APIs (breaks on React 19, awkward on 18).
- **~15 MB of transitive deps** pulled in (antd v4 + v5, emotion,
  react-loadable, react-ace, chart-controls, …).
- **Hard to use headless** — no CLI, no HTTP API, no LLM integration.

`minimal-viz` vendors just the Pie/Bar/Line/... transform logic directly and
wraps ECharts. Result: **10 charts in ~1,300 lines** with 3 runtime deps
(`react`, `react-dom`, `echarts`).

`xviz-cli` adds the headless layer: Puppeteer drives the minimal-viz bundle,
returning image bytes. Perfect for reports, email attachments, automated
dashboards, or LLM-generated charts.

## Quick start

```bash
# Browse the demos
cd minimal-viz && npm install && npm run dev
# → http://localhost:5173

# Render a chart from JSON on the command line
cd xviz-cli && npm install && npm run build
node bin/xviz.mjs render \
  -d examples/pie-data.json \
  -f examples/pie-form.json \
  -o chart.png

# Query a database directly (SQL → PNG in one step)
node bin/xviz.mjs query \
  --db sqlite:examples/sql/sample.db \
  --sql "SELECT region, SUM(revenue) AS revenue FROM orders GROUP BY 1" \
  --form examples/sql/region-pie-form.json \
  --out regions.png

# Or serve it over HTTP
node bin/xviz.mjs serve --port 3737
curl -X POST http://localhost:3737/render \
  -H 'Content-Type: application/json' \
  -d @examples/pie-payload.json \
  -o chart.png

# Or expose it to an LLM over MCP
node bin/xviz.mjs mcp   # stdio transport
```

## Chart catalog (10)

| Chart | Package export | Typical use |
|---|---|---|
| Pie / Donut | `PieChart` | Part-of-a-whole, with "Other" bucketing and total annotation |
| Bar | `BarChart` | Categorical comparison, stacked and grouped |
| Line | `LineChart` | Time series with smooth/area/scatter variants |
| Table | `Table` | Sortable, paginated data grid with formatted cells |
| Big Number | `BigNumber` | KPI tile with optional trendline and period-over-period delta |
| Scatter | `Scatter` | Correlation / bubble chart with color + size dimensions |
| Heatmap | `Heatmap` | 2D intensity matrix with a color-scale legend |
| Sankey | `Sankey` | Flow / routing diagrams between nodes |
| Funnel | `Funnel` | Stage-to-stage conversion with percentage drop-off |
| Gauge | `Gauge` | Single-metric dial with color-banded thresholds |

## Superset compatibility

The CLI's CSV parser is tested against real-world Superset `Export to CSV`
output (16-test suite at [`xviz-cli/test/csv-compat.test.mjs`](./xviz-cli/test/csv-compat.test.mjs)). It handles:

- UTF-8 BOM (Superset uses `encoding="utf-8-sig"`)
- Thousands-separated numbers: `"9,823,456"` and `"24,800.00"`
- CSV-injection guard: `"'+12V"` → `"+12V"`, `"'@formula"` → `"@formula"`
- Nested double quotes: `"""Pro"" Kit"` → `"Pro" Kit`
- Aggregate column names: `SUM(confirmed)`, `COUNT(*)`
- `__timestamp` columns preserved as strings (not coerced)

Run compatibility tests: `cd xviz-cli && node test/csv-compat.test.mjs`

## Layout

```
superset-workspace/
├── README.md                 ← this file
├── minimal-viz/              ← React + ECharts chart library
│   ├── src/viz/
│   │   ├── pie/ bar/ line/ table/ bigNumber/
│   │   ├── scatter/ heatmap/ sankey/ funnel/ gauge/
│   │   ├── Echart.tsx        ← theme-aware ECharts wrapper
│   │   ├── theme.ts          ← light/dark/custom themes
│   │   └── types.ts          ← ChartProps, FormData types
│   └── src/App.tsx           ← live demo with all 10 charts
├── xviz-cli/                 ← headless renderer
│   ├── bin/xviz.mjs          ← CLI entry: render / serve / mcp
│   ├── bin/renderer.mjs      ← puppeteer engine (shared)
│   ├── bin/mcp.mjs           ← MCP server (LLM tool-use)
│   ├── bin/csv.mjs           ← Superset-compatible CSV parser
│   ├── renderer/             ← built to a single self-contained HTML
│   └── examples/             ← sample forms + data (JSON + CSV)
└── superset/                 ← upstream Apache Superset (reference only)
```

## License

Apache 2.0 — same as Apache Superset, whose architecture inspired this project.
