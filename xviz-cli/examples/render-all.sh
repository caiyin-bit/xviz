#!/usr/bin/env bash
# Render every example to /tmp/xviz-out/. Useful as a visual regression check.
set -e
cd "$(dirname "$0")/.."

OUT="${1:-/tmp/xviz-out}"
mkdir -p "$OUT"

echo "Rendering all examples to $OUT ..."

node bin/xviz.mjs render -d examples/pie-data.json   -f examples/pie-form.json   -o "$OUT/pie.png"   --width 600 --height 400
node bin/xviz.mjs render -d examples/sales-data.json -f examples/bar-form.json   -o "$OUT/bar.png"   --width 700 --height 400
node bin/xviz.mjs render -d examples/sales-data.json -f examples/line-form.json  -o "$OUT/line.png"  --width 700 --height 400
node bin/xviz.mjs render -c examples/scatter.json    -o "$OUT/scatter.png"
node bin/xviz.mjs render -c examples/heatmap.json    -o "$OUT/heatmap.png"
node bin/xviz.mjs render -c examples/sankey.json     -o "$OUT/sankey.png"
node bin/xviz.mjs render -c examples/funnel.json     -o "$OUT/funnel.png"
node bin/xviz.mjs render -c examples/gauge.json      -o "$OUT/gauge.png"

# Dark variants of a few
node bin/xviz.mjs render -d examples/pie-data.json   -f examples/pie-form.json   -o "$OUT/pie-dark.png"  --width 600 --height 400 --theme dark
node bin/xviz.mjs render -d examples/sales-data.json -f examples/bar-form.json   -o "$OUT/bar-dark.png"  --width 700 --height 400 --theme dark
node bin/xviz.mjs render -c examples/gauge.json      -o "$OUT/gauge-dark.png"    --theme dark

# Superset CSV exports
node bin/xviz.mjs render \
  -d examples/superset-exports/covid_states.csv \
  -f examples/superset-exports/covid-form.json \
  -o "$OUT/covid.png" --width 900 --height 450
node bin/xviz.mjs render \
  -d examples/superset-exports/time_series.csv \
  -f examples/superset-exports/time-series-form.json \
  -o "$OUT/timeseries.png" --width 800 --height 420
node bin/xviz.mjs render \
  -d examples/superset-exports/ecommerce.csv \
  -f examples/superset-exports/ecommerce-form.json \
  -o "$OUT/ecommerce.png" --width 800 --height 480

echo ""
echo "✓ All examples rendered to $OUT"
ls -lh "$OUT"
