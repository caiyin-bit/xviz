# Example: PivotTable — H1 revenue by region × quarter × channel

Two-level row dimensions (`region` / `country`) crossed with two-level
column dimensions (`quarter` / `channel`), summed on `revenue`. The
transform handles the full pivot in one walk through the input rows
(no upstream `GROUP BY` needed) and emits row totals, column totals,
and a grand total.

## What this shows

- **Multi-level row + column dims** — values are joined with `' / '`
  in headers (e.g. `NA / US` for the row, `Q1 / Web` for the column).
  Programmatic-friendly; no nested `<th>` markup.
- **`sum` aggregator** — try `aggregator: 'avg'` for averages or
  `'count'` for transaction counts.
- **Totals** — right column = per-row total across all (quarter ×
  channel) combinations; bottom row = per-column total across all
  countries; bottom-right = grand total.
- **Empty cells** — missing (region × country × quarter × channel)
  combinations show `—` instead of `0`, so you can distinguish
  "no data" from "actual zero".

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 900 --height 360
```

Open `chart.png` — you should see a 6×5 table (6 country rows, 5
columns: 4 (quarter × channel) combos + Total) with a grand total of
$137,600 in the bottom-right corner.

## Customize

- **One-level dims**: drop `'country'` from `rows` and/or `'channel'`
  from `columns` for a simpler 3×2 table.
- **Different aggregator**: set `aggregator` to `avg`, `count`,
  `min`, or `max`.
- **Hide totals**: set `showRowTotals: false` and/or
  `showColumnTotals: false`.
- **Live data**: this is a `xviz query` candidate — pipe a SQL
  `GROUP BY (region, country, quarter, channel)` result directly.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- Rows with non-numeric `revenue` values are silently dropped.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
