# Example: WorldMap — GDP choropleth (USD billions, 2024)

Top-12 economies colored by 2024 GDP. xviz uses ECharts' native
`MapChart` series — no map SDK, no token, no tile server. The
GeoJSON is supplied by the user (this example uses Natural Earth
110m simplified borders, fetched at runtime).

## What this shows

- **`vizType: 'world-map'`** — pure ECharts choropleth. Zero
  external SDK; the renderer just registers the GeoJSON, matches
  data rows by country name, and colors each shape by metric.
- **No token / no tile server** — works offline once the GeoJSON is
  loaded. Contrast with deck.gl + maplibre-based maps which need
  raster tiles fetched per-render.
- **`countryColumn` matches a feature property** — by default the
  property is `name`. Natural Earth uses common English country
  names ("United States", "Germany", etc.); for ISO 3166 codes
  ("USA", "DEU"), set `nameProperty: 'iso_a3'` and put codes in
  `countryColumn`.

## Run it

This example needs a world-borders GeoJSON. Pull a simplified one
into the form file before rendering:

```bash
npm i -g xviz-cli

# Fetch a simplified world borders GeoJSON (~250 KB)
curl -sL https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson \
  -o /tmp/countries.geojson

# Inline the GeoJSON into the form (small JS / jq dance)
node -e "
const fs = require('fs');
const form = JSON.parse(fs.readFileSync('form.json', 'utf-8'));
form.geojson = JSON.parse(fs.readFileSync('/tmp/countries.geojson', 'utf-8'));
fs.writeFileSync('/tmp/world-form.json', JSON.stringify(form));
"

xviz render -d data.json -f /tmp/world-form.json -o chart.png \
  --width 900 --height 480
```

Open `chart.png` — you should see a world map with the 12 listed
countries colored from light teal (smaller GDP) to dark teal (USA,
the largest at $27.4T). All other countries stay neutral gray.

## Customize

- **Different palette**: pass `"colorRange": ["#fff5e0", "#cf3e00"]`
  for a fire palette.
- **ISO 3166 codes instead of names**: set `"nameProperty": "iso_a3"`
  in `form.json` and change the data column to ISO codes.
- **Per-metric label inside each country**: set `"showLabels": true`
  (only legible on large maps; default is off).

## Notes

- xviz does not bundle world or country GeoJSON — those files are
  10s-of-MB each at full detail. Users supply the geometry to keep
  the xviz install tiny.
- Requires Chrome or Chromium at runtime — `xviz` uses
  `puppeteer-core`. Set `XVIZ_CHROME=/path/to/chrome` if needed.
- This walkthrough deliberately ships **without** a pre-rendered
  `chart.png` — render locally to verify your environment.
