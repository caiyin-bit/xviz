# Example: Timeseries — monthly revenue by region

Two-region monthly revenue series rendered on a true ECharts `time`
axis (not a categorical month label). The transform parses the
`date` column with `Date.parse` and maps each series' data to
`[timestamp, value]` pairs so ECharts can space ticks proportionally
to elapsed time.

## What this shows

- **`vizType: 'timeseries-line'`** — proper time axis, not a category
  axis. Months are spaced evenly here because input is monthly, but
  if you fed in irregular gaps (some months missing) the gaps would
  show.
- **Multi-region breakdown via `seriesColumn`** — one line per
  distinct value in the `region` column, no upstream pivot needed.
- **Same data contract as LineChart** — only the `vizType` changes.
  Swap to `vizType: 'timeseries-bar'` to render the same series as
  bars on the same time axis.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 800 --height 420
```

Open `chart.png` — you should see two smoothed lines (NA and EU)
trending up over six months with markers at each data point.

## Customize

- **Switch to bars**: change `vizType` to `"timeseries-bar"` and
  optionally add `"stacked": true`.
- **Drop dots**: `"showDots": false` for a cleaner line.
- **Drop smoothing**: `"smooth": false` for piecewise-linear segments.
- **Numeric epoch input**: replace ISO date strings with epoch ms
  (e.g. `1704067200000`) — the parser auto-detects.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
