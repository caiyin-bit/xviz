# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/caiyin-bit/xviz/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/caiyin-bit/xviz/releases/tag/v0.1.0
