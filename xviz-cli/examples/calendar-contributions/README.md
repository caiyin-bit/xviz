# Example: Calendar — yearly contribution heatmap

GitHub-style year-at-a-glance heatmap. Each cell is one day, colored
by the metric value (here: commits per week). Empty cells stay
unfilled — you can tell "no data" from "actually 0".

## What this shows

- **`vizType: 'calendar'`** — ECharts' `calendar` coordinate system
  + a `heatmap` series. The transform handles ISO date normalization
  and auto-derives the visualMap min/max from your data.
- **Range control** — pin a full-year frame with explicit
  `rangeStart` / `rangeEnd`, even when your data starts mid-year.
- **GitHub palette** — the `colorRange: ['#ebedf0', '#216e39']` pair
  matches GitHub's contribution shading, but any two-color tuple
  works (try `['#fff5e0', '#cf3e00']` for a fire palette).

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 900 --height 220
```

Open `chart.png` — you should see a single 2024 block with weekly
cells colored from light green to dark green. Spikes around April
(15), June (18), and December (17) stand out.

## Customize

- **Multi-year**: drop `rangeStart`/`rangeEnd` and feed in 2 years
  of data — the calendar auto-derives the frame, but you'll want to
  bump `--height` to leave room for both years.
- **Per-day data**: this example uses one data point per week; feed
  in one row per day for a denser visualization.
- **Numeric epoch input**: replace ISO strings with `Date.parse`
  results — the parser auto-detects.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
