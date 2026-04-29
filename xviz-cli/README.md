# xviz

Headless chart renderer. Takes JSON or CSV data in, emits PNG / PDF / HTML out.
Built on [`@minimal-viz/core`](../minimal-viz/README.md) + Puppeteer.

Three modes:

- **`xviz render`** — one-shot CLI rendering
- **`xviz serve`** — HTTP server with `POST /render`
- **`xviz mcp`** — MCP server for LLM tool-use (Claude, etc.)

Supports 39 chart types: `pie bar line table big-number scatter heatmap sankey funnel gauge boxplot histogram treemap sunburst radar waterfall step tree graph timeseries-bar timeseries-line mixed-timeseries gantt big-number-total big-number-pop time-table pivot-table calendar rose parallel bullet compare partition time-pivot chord horizon paired-ttest world-map country-map`.

## Setup

```bash
npm i -g xviz-cli
```

Chrome or Chromium is required at runtime — `xviz` uses `puppeteer-core`
and does not bundle a browser. The CLI auto-detects these paths:

- macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Linux: `/usr/bin/google-chrome`, `/usr/bin/chromium`,
  `/usr/bin/chromium-browser`

Override the path with `XVIZ_CHROME=/path/to/chrome`.

### From source (contributors only)

```bash
git clone https://github.com/caiyin-bit/xviz.git
cd xviz/xviz-cli
npm ci --include=optional
npm run build        # builds the renderer bundle into dist/
node bin/xviz.mjs --help
```

## `xviz render`

Render a single chart to a file.

```bash
node bin/xviz.mjs render \
  --data examples/pie-data.json \
  --form examples/pie-form.json \
  --out chart.png \
  --width 800 --height 500 \
  --theme dark
```

Flags:

| Flag | Default | Notes |
|---|---|---|
| `-d, --data <file>` | — | JSON array, JSON QueryData[], or `.csv` |
| `-f, --form <file>` | — | JSON with chart `formData` (includes `vizType`) |
| `-c, --config <file>` | — | Single JSON with `{type, width, height, formData, data}` |
| `-o, --out <file>` | `chart.png` | Extension selects format: `.png .jpg .pdf .html` |
| `-w, --width <px>` | `800` | |
| `-h, --height <px>` | `500` | |
| `--scale <n>` | `2` | Device scale factor (`2` = retina) |
| `--theme <name>` | `light` | `light` \| `dark` |
| `--delay <ms>` | `400` | Extra wait after render (for ECharts' canvas draw) |
| `--verbose` | | Stream browser console to stderr |

Input data accepts three shapes:

```json
// 1. Array of rows (most common)
[{ "region": "NA", "sales": 1200 }, ...]

// 2. Superset's QueryData
[{ "data": [{...}], "colnames": [...] }]

// 3. Single QueryData
{ "data": [...], "colnames": [...] }
```

## `xviz query`

Query a database and render the result in one step. Combines SQL execution
with chart rendering — no JSON / CSV intermediate needed.

```bash
node bin/xviz.mjs query \
  --db sqlite:examples/sql/sample.db \
  --sql "SELECT region, SUM(revenue) AS revenue FROM orders GROUP BY 1" \
  --form examples/sql/region-pie-form.json \
  --out /tmp/regions.png
```

Flags specific to `query`:

| Flag | Notes |
|---|---|
| `--db <url>` | Connection URL (see below). Required. |
| `--sql <sql>` | Inline SQL query. |
| `--sql-file <file>` | Path to a `.sql` file (alternative to `--sql`). |
| `--limit <n>` | Max rows accepted from SQL (default 10000). |

All other flags from `render` apply (`--form`, `--out`, `--width`, `--theme`, …).

### Supported connection URLs

| Driver | URL shape | Install |
|---|---|---|
| SQLite | `sqlite:/abs/path.db` or `./app.db` | `npm install better-sqlite3` |
| PostgreSQL | `postgres://user:pass@host:5432/db` | `npm install pg` |
| MySQL | `mysql://user:pass@host:3306/db` | `npm install mysql2` |

Drivers are **optional** — `xviz` imports them dynamically and errors with a
helpful message if the one you need isn't installed.

### Example

```bash
# Build the sample SQLite database (96 rows of orders across 6 months)
node examples/sql/build-sample.mjs

# Monthly revenue stacked by category
node bin/xviz.mjs query \
  --db sqlite:examples/sql/sample.db \
  --sql "SELECT strftime('%Y-%m', placed_at) AS month,
                product_category AS category,
                SUM(revenue) AS revenue
         FROM orders GROUP BY 1, 2 ORDER BY 1, 2" \
  --form examples/sql/monthly-revenue-form.json \
  --out /tmp/monthly.png --width 800 --height 450
```

## `xviz serve`

Long-lived HTTP server. Puppeteer browser stays warm between requests (~1.2s / render on an M-series Mac).

```bash
node bin/xviz.mjs serve --port 3737 --host 127.0.0.1
```

```bash
curl http://localhost:3737/health
# → {"status":"ok","service":"xviz","version":"0.1.0",
#    "endpoints":["POST /render"],
#    "supported":["pie","bar","line",...]}

curl -X POST http://localhost:3737/render \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "pie",
    "width": 600, "height": 400,
    "data": [
      {"region": "NA", "sales": 1200},
      {"region": "EU", "sales": 900},
      {"region": "AS", "sales": 1500}
    ],
    "formData": {
      "vizType": "pie",
      "groupby": ["region"],
      "metric": "sales",
      "donut": true, "showTotal": true
    }
  }' -o chart.png
```

Request body:

| Field | Required | Default |
|---|---|---|
| `type` | yes¹ | — |
| `formData` | yes | — |
| `data` or `queriesData` | yes | — |
| `width` / `height` | no | 800 / 500 |
| `format` | no | `png` (or `jpg`, `jpeg`, `pdf`, `html`) |
| `theme` | no | `light`, `dark`, or partial Theme object |
| `scale`, `delay` | no | 2, 400 |

¹ Derived from `formData.vizType` if omitted.

## `xviz mcp`

Exposes rendering as MCP tools so Claude and other LLMs can generate charts
through natural language. Communicates over stdio.

```bash
node bin/xviz.mjs mcp
```

Tools advertised:

- **`render_chart`** — `{type, data, formData, width?, height?}` → returns base64 PNG + metadata
- **`list_chart_types`** — lists supported chart types

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "xviz": {
      "command": "node",
      "args": ["/absolute/path/to/xviz-cli/bin/xviz.mjs", "mcp"]
    }
  }
}
```

Then ask Claude: *"Chart these numbers as a donut: {NA: 1200, EU: 900, AS: 1500}"*.

## Superset compatibility

The CSV parser handles Apache Superset's `Export to CSV` output verbatim.
Tested with 16 real-world edge cases at [`test/csv-compat.test.mjs`](./test/csv-compat.test.mjs):

- UTF-8 BOM (`encoding="utf-8-sig"`)
- Thousands-separated numbers: `"9,823,456"`, `"24,800.00"`
- CSV-injection guard: `"'+12V"` → `"+12V"`, `"'@formula"` → `"@formula"`
- Nested double quotes: `"""Pro"" Kit"` → `"Pro" Kit`
- Aggregate column names: `SUM(confirmed)`, `COUNT(*)`
- `__timestamp` columns preserved as strings
- Scientific notation, leading-zero strings, etc.

```bash
node test/csv-compat.test.mjs   # 16 passed, 0 failed
```

See [`examples/superset-exports/`](./examples/superset-exports/) for real
Superset-style CSV files you can pipe through the CLI.

## Examples

The `examples/` directory contains ready-to-run configs:

```bash
# JSON data
node bin/xviz.mjs render -d examples/pie-data.json   -f examples/pie-form.json   -o /tmp/pie.png
node bin/xviz.mjs render -d examples/sales-data.json -f examples/bar-form.json   -o /tmp/bar.png
node bin/xviz.mjs render -d examples/sales-data.json -f examples/line-form.json  -o /tmp/line.png
node bin/xviz.mjs render -c examples/scatter.json    -o /tmp/scatter.png
node bin/xviz.mjs render -c examples/heatmap.json    -o /tmp/heatmap.png
node bin/xviz.mjs render -c examples/sankey.json     -o /tmp/sankey.png
node bin/xviz.mjs render -c examples/funnel.json     -o /tmp/funnel.png
node bin/xviz.mjs render -c examples/gauge.json      -o /tmp/gauge.png

# Real Superset CSV exports
node bin/xviz.mjs render \
  -d examples/superset-exports/covid_states.csv \
  -f examples/superset-exports/covid-form.json \
  -o /tmp/covid.png --width 900
```

## License

Apache 2.0
