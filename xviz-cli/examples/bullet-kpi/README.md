# Example: Bullet — Q4 KPI dashboard

Five quarterly KPIs with graded performance bands (poor /
satisfactory / good), each row showing the actual value bar
overlaid on the bands plus a target tick. Compact, dense, and
scannable — suitable for management dashboards or weekly reviews.

## What this shows

- **`vizType: 'bullet'`** — ECharts has no native bullet, so xviz
  layers stacked qualitative-range bars + a narrow value bar
  (`barGap: -100%` to overlay) + per-row markLine for the target
  tick.
- **Graded bands** — `rangeColumns` defines the threshold values
  (lightest → darkest gray by default); each band's width is the
  delta between successive thresholds.
- **Mixed metric directions** — note "Support response (h)": its
  thresholds are descending (poor=8h, satisfactory=4h, good=1h)
  because lower is better. The transform sorts bands ascending by
  value, so the visual still works — green-zone is on the left.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 700 --height 240
```

Open `chart.png` — you should see 5 horizontal bullets stacked
top-to-bottom: Revenue (in good zone), Gross margin (just below
target), New customers (between satisfactory and good but missing
target), NPS (very close to target), Support response (in
satisfactory zone, well behind the 2h target).

## Customize

- **Two bands instead of three**: `"rangeColumns": ["poor", "good"]`
  for a simpler dashboard.
- **Custom band colors**: pass `"rangeColors": ["#ffeded", "#ffe4a3",
  "#caf0c2"]` for a red-yellow-green semaphore palette.
- **Drop the target tick**: omit `"targetColumn"` if you only care
  about which band each KPI lands in.
- **Brand color for the value bar**: `"metricColor": "#ff5722"`
  (default is the theme accent).

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
