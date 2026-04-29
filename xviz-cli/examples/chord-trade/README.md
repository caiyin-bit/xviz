# Example: Chord — global trade flows

Circular flow diagram showing weighted bilateral exchanges between
five regions. Each ribbon's thickness is proportional to the trade
volume between two regions. Self-edges (flows within a region) are
omitted from this dataset.

## What this shows

- **`vizType: 'chord'`** — ECharts 6's native `chord` series. xviz
  feeds it an edge list (source / target / metric weight); nodes
  are auto-inferred from the union of source and target columns.
- **Bidirectional flows** — both `NA → EU` and `EU → NA` are present
  with different volumes, drawn as separate ribbons. Combined node
  size = sum of all incident edge weights.
- **Color by source** — `lineStyle.color: 'source'` keeps each
  ribbon the color of its origin node, making "where does this flow
  come from?" visually obvious.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 600 --height 600
```

Open `chart.png` — you should see a circular layout with 5 region
arcs, each sized by total trade volume. Asia Pacific is the largest
node (it's the largest exporter and importer combined); ribbons
crisscross to show flow patterns.

## Customize

- **Drop labels**: `"showLabels": false` for a minimalist look (the
  arc colors stay).
- **No metric**: omit `"metric": "flow"` and each edge gets weight 1
  — useful when you only have source/target pairs without volume
  data, but the chart loses much of its information density.
- **Live data**: feed a `xviz query --db ... --sql "SELECT origin,
  destination, SUM(value) FROM trade_2024 GROUP BY 1,2"` directly.

## Notes

- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
