# Example: Gantt — H1 project schedule

A typical 8-task software project schedule with 4 owners. Each row
in `data.json` becomes one horizontal bar; tasks are colored by
owner so you can see ownership concentration at a glance. Bars are
positioned on a real ECharts `time` axis, so overlaps and slack time
are visually accurate.

## What this shows

- **`vizType: 'gantt'`** — implemented as an ECharts `custom` series
  with a `renderItem` that draws clipped rectangles. (ECharts has no
  native gantt — this is the standard pattern.)
- **`groupColumn: 'owner'`** — Alice's tasks all share one color,
  Bob's another, etc. Useful for spotting workload concentration.
- **Date column flexibility** — accepts ISO-8601 strings (this
  example) or numeric epoch ms. Mix-and-match works.
- **Tasks listed top-to-bottom in input order** — control task
  ordering by ordering rows.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 900 --height 360
```

Open `chart.png` — you should see 8 colored bars on a 6-month
timeline, with Discovery starting in early January and Release
ending mid-June. Alice owns 3 tasks (top, second, last), Bob owns
2, Carol 2, Dora 1.

## Customize

- **Drop the legend**: `"showLegend": false` (the colors still match
  owners — you'd just lose the explicit key).
- **Drop labels inside bars**: `"showLabels": false` for narrow tasks
  where the label gets clipped.
- **Single-color mode**: omit `groupColumn` — every bar uses one
  color from the palette.
- **Live data**: `groupColumn`, `startColumn`, `endColumn` accept any
  column names. Pipe a `xviz query --db ... --sql "SELECT task, owner,
  start, end FROM project_plan WHERE quarter='Q2'"` directly.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- Rows with unparseable dates are silently dropped. Check your input
  if a task seems missing.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
