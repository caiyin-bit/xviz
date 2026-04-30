# xviz Render Benchmark

`render-bench.mjs` measures wall-clock per render through the same `Engine`
that powers `xviz render`, `xviz serve`, and `xviz mcp`. Cold start
(puppeteer launch + bundle parse) is reported separately from warm renders;
the latter is what dominates a long-running `xviz serve` process.

## Run

```sh
# Build the renderer first.
npm run build

# Default: 5 fixtures × 3 runs each.
node bench/render-bench.mjs

# More runs for a stabler signal.
node bench/render-bench.mjs --runs 10

# Machine-readable output (for plotting / regression checks).
node bench/render-bench.mjs --json --output bench/results-$(date +%F).json
```

## Fixtures

| File | Type | Notes |
|---|---|---|
| `01-pie.json` | `pie` | 4-slice donut with center total — minimal ECharts surface. |
| `02-line.json` | `line` | 12-point single-metric series — basic Cartesian path. |
| `03-heatmap.json` | `heatmap` | 28-cell categorical matrix — exercises ECharts visualMap + tooltip layout. |
| `04-timeseries-bar.json` | `timeseries-bar` | 8-row stacked time-bar — covers the Timeseries family. |
| `05-table.json` | `table` | 8-row plain HTML table — covers the non-ECharts render path. |

These were chosen to span the four major rendering paths in xviz (ECharts
canvas / ECharts SVG-for-tables / pure HTML / pure React) without dragging
in fixtures that need network access (maps) or heavy data (perf would be
dominated by parsing rather than rendering).

## Notes

- The bench runs **sequentially** through the same `Engine` instance — that
  matches the real-world `xviz serve` shape (single browser, many renders).
- Each render gets a `delay` of 200 ms after mount to let ECharts settle
  before screenshot. This is the same default the CLI uses; lowering it
  produces faster-but-flickery results.
- Cold-start figures depend heavily on disk and bundle size. The default
  renderer (~1.15 MB) typically launches in 800–1500 ms on a Mac M-series
  laptop or similar Linux runner; the maps-enabled bundle (~3 MB) takes
  ~1.5–2.5×.
- This bench is a **baseline**, not a regression gate. CI does not run it
  by default. Re-run it locally before any change you suspect could move
  the perf needle, and update the README's perf table when relevant.
