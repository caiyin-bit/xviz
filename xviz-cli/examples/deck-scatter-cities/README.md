# DeckGL Scatter — World Cities by Population

Plots the world's largest urban areas as a scatter map (one circle per city,
size driven by `population`, color bucketed by country).

Requires a maps-enabled build:

```sh
XVIZ_ENABLE_MAPS=1 npm run build:maps
node bin/xviz.mjs render \
  -d examples/deck-scatter-cities/data.json \
  -f examples/deck-scatter-cities/form.json \
  -o cities.png \
  --width 900 --height 540
```

Notes:
- Uses the free OpenStreetMap raster tile layer (no Mapbox / MapTiler token
  needed). Override with `--form` and add `mapStyle` to point at a custom
  basemap if desired.
- The smoke test in `test/render-cli-maps.test.mjs` uses this example to
  validate the WebGL path through puppeteer's headless Chrome.
