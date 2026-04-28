# Example: Waterfall — quarterly P&L decomposition

Walk a quarter's revenue down through COGS, OpEx, R&D, taxes, and
other one-offs to net income. The transform tracks the running total
left-to-right, colors gains green and losses red, and appends a final
Total bar.

## What this shows

- One row = one P&L step. Sign of `delta` determines color.
- The running cumulative total is implicit — no upstream pivoting or
  spreadsheet formula needed.
- Optional `showTotal: true` (default) appends a closing bar with the
  net result.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 720 --height 440
```

Open `chart.png` — you should see Revenue (+1200) start the chain,
followed by losses (COGS, OpEx, R&D, Tax) and a small +40 gain
(Other income), closing on a Net income total bar.

## Customize

- **Drop the Total bar**: set `"showTotal": false`.
- **Custom colors**: pass `positiveColor`, `negativeColor`,
  `totalColor` (hex strings).
- **Different label**: set `"totalLabel": "EBITDA"` etc.

## Notes

- This example deliberately omits Gross-profit subtotal as a delta
  (delta=0) so you can see how zero-delta rows behave (no visible
  bar; running total unchanged).
- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
