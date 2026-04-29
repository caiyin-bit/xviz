# Example: CountryMap — US states by population (millions, 2024)

US states colored by 2024 population estimates. CountryMap is the
sibling of WorldMap, with a different name signaling intent
(subdivisions of a single country rather than the globe). Same
renderer, same zero-SDK / zero-token story.

## What this shows

- **`vizType: 'country-map'`** — same ECharts `MapChart` underneath
  as WorldMap. The naming difference makes saved Superset slice
  configs clearer to read; functionally identical.
- **State-level GeoJSON** — typically ~5-10 MB at full detail; users
  supply via `geojson` field. Use a simplified version
  (e.g. [topojson/us-atlas](https://github.com/topojson/us-atlas))
  for production-friendly file sizes.

## Run it

```bash
npm i -g xviz-cli

# Fetch a US states GeoJSON (~1 MB simplified)
curl -sL https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json \
  -o /tmp/us-states.geojson

node -e "
const fs = require('fs');
const form = JSON.parse(fs.readFileSync('form.json', 'utf-8'));
form.geojson = JSON.parse(fs.readFileSync('/tmp/us-states.geojson', 'utf-8'));
fs.writeFileSync('/tmp/states-form.json', JSON.stringify(form));
"

xviz render -d data.json -f /tmp/states-form.json -o chart.png \
  --width 800 --height 480
```

Open `chart.png` — you should see the contiguous US (and Alaska /
Hawaii if your GeoJSON includes them) colored by population. CA
and TX dominate; smaller listed states show light coloring; states
with no data row stay neutral.

## Customize

- **All 50 states**: extend `data.json` with rows for every state.
- **County-level**: substitute a county GeoJSON (e.g.
  topojson/us-atlas's `counties-10m.json`) and put county names /
  FIPS codes in `state` (rename to taste; the `regionColumn` field
  in `form.json` controls which data column matches features).
- **State abbreviations vs full names**: set `"nameProperty": "STUSPS"`
  if your GeoJSON's state code property is `STUSPS` and your data
  uses 2-letter codes.

## Notes

- Same as WorldMap: xviz doesn't bundle subdivision GeoJSON. The
  user supplies the geometry — it's the only way to support
  "any country, any granularity" without bloating xviz to 100+ MB.
- Requires Chrome or Chromium at runtime. Set `XVIZ_CHROME` if needed.
- Ships without a pre-rendered `chart.png`.
