# Example: BigNumberPeriodOverPeriod — MAU month-over-month

Headline KPI tile with the current period (last row) on top and the
previous period (first row) shown alongside, with delta in absolute
units and percent. Color-coded green-up / red-down.

## What this shows

- **Long-format input** — last row = current, first row = previous.
  No need to compute the delta upstream.
- **Auto-formatted delta** — both absolute (`▲ 2.8K`) and percent
  (`(15.14%)`).
- **Configurable label** — `compareLabel` defaults to "vs previous";
  this example overrides to "vs last month".

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 420 --height 200
```

Open `chart.png` — you should see "Monthly active users" subhead,
"21.3K" headline, "previous: 18.5K" plus a green "▲ 2.8K (15.14%) vs
last month" delta line.

## Customize

- **Wide format**: if your data has both columns on the same row
  (e.g. a SQL query that joined this period and last period), pass
  `previousMetric: 'last_month_users'` and put both columns on the
  same row.
- **Custom delta colors**: not directly configurable yet — fork
  `BigNumberPeriodOverPeriod.tsx` if you need brand-specific palette.
- **For a non-comparison total**: use `vizType: 'big-number-total'`
  instead — it sums across all rows for a single headline number.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
