# Example: BoxPlot with Tukey outliers

Render a categorical box-and-whisker plot from a flat observation table.
The transform computes 5-number summaries (min / Q1 / median / Q3 / max)
per group, applies the Tukey 1.5·IQR fence, and overlays out-of-fence
points as red dots.

## What this shows

- One box per `groupby` value — no upstream pivoting required.
- Tukey whiskers vs `min-max` whiskers (set `whiskerType: 'min-max'` in
  `form.json` to disable outlier detection).
- Outlier scatter overlay — Team B's `1000` is intentionally extreme
  to demonstrate fence detection.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 700 --height 480
```

Open `chart.png` — you should see two boxes (Team A in the 10–26 range,
Team B in the 30–44 range with a single red dot at the top for the
1000 outlier).

## Customize

- **Wider IQR tolerance**: change Tukey to `min-max` (no outlier
  classification — the box just spans absolute min..max).
- **Horizontal layout**: add `"horizontal": true` to `form.json`.
- **Multiple metrics in one box**: not supported in this release —
  one chart per metric is intentional.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses `puppeteer-core`.
  Set `XVIZ_CHROME=/path/to/chrome` if it isn't on the default search
  path.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render it locally to verify your environment.
