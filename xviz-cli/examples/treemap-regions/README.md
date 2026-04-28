# Example: Treemap (region → country)

Render a 2-level hierarchical treemap from a flat sales-by-country
table. The transform builds a nested tree internally — duplicate
(region, country) leaf rows are summed; ECharts auto-aggregates the
region-level totals from the leaves.

## What this shows

- **Multi-column `groupby`**: pass `["region", "country"]` and the
  transform automatically builds the parent → child hierarchy.
- **No upstream aggregation needed**: feed the raw rows in any order.
- **Sized by metric**: each leaf rectangle's area is proportional to
  `sales`; each parent group's area is the sum of its children.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 700 --height 480
```

Open `chart.png` — you should see four region blocks (NA, EU, AS, SA)
with country sub-rectangles inside each one. Asia is the largest
region (CN + JP + IN dominate); SA is the smallest single-country
block.

## Customize

- **Drop the country level**: change `"groupby": ["region", "country"]`
  to `"groupby": ["region"]` for a flat treemap.
- **Hide values**: set `"showValues": false` to display only group
  names.
- **Use Sunburst instead**: the same data works as `vizType: "sunburst"`
  for a concentric-ring view (see `../sunburst.json`).

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses `puppeteer-core`.
  Set `XVIZ_CHROME=/path/to/chrome` if it isn't on the default search
  path.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render it locally to verify your environment.
