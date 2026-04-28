# Example: Graph — service dependency map

Visualize a microservices call graph from a flat edge list (one row =
one call relationship + per-day call volume). xviz auto-discovers the
node set, sums incident call volume per node to drive symbolSize, and
renders with a force layout (animation disabled so puppeteer captures
a stable frame).

## What this shows

- **Edge-list input is sufficient**: no separate node table needed.
- **Heavy-traffic services grow visually**: `app` and `auth-service`
  end up larger because they're more central in the call graph.
- **Force layout settles before screenshot**: `force.layoutAnimation`
  is hard-coded to `false` inside `transformGraphProps`, so the same
  rendering result appears whether you screenshot at t=0 or t=∞.

## Run it

```bash
npm i -g xviz-cli

xviz render -d data.json -f form.json -o chart.png \
  --width 720 --height 540
```

Open `chart.png` — you should see 8 nodes (app, auth-service,
user-service, order-service, redis, postgres, kafka, plus
order-service rolling up its own dependency on user-service) wired
into a roughly hub-and-spoke arrangement.

## Customize

- **Layout**: try `"layout": "circular"` for a clean radial wheel
  (same nodes, different aesthetic).
- **Edge labels**: turn on `"showEdgeLabels": true` to label each
  arrow with the call volume.
- **Tighter / looser graph**: tune `repulsion` (default 200, larger →
  more spread) and `edgeLength` (default 80).

## Notes

- The edge list can be a SQL `GROUP BY (from_service, to_service)`
  result — pipe it through `xviz query --db ... --sql ... -f form.json`
  for live dashboards.
- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
