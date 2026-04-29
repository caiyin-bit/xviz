# @minimal-viz/maps

Optional satellite package for [xviz](https://github.com/caiyin-bit/xviz)
— adds **13 deck.gl-powered map chart types** that intentionally don't
ship in `@minimal-viz/core` because they would 3×-bloat the bundle.

| Chart family | Charts |
|---|---|
| Single-purpose | PointClusterMap, Cartodiagram |
| DeckGL × 11 | Arc, Geojson, Grid, Hex, Heatmap, Multi, Path, Polygon, Scatter, Screengrid, Contour |

## Why a satellite package?

- **Bundle size**: deck.gl + maplibre-gl add ~2.5-3 MB. xviz core stays
  ~1.1 MB without them. Users who don't need maps don't pay the cost.
- **License**: maplibre-gl is BSD-3 / MIT (compatible with xviz's
  Apache 2.0). mapbox-gl@v2+ is BSL-licensed and explicitly rejected.
- **Token-free defaults**: defaults to free OSM raster tiles; no
  Mapbox account required.

## Status

🚧 **Phase 1 — under construction.** The package skeleton, dependency
declarations, and reference implementations for `deck-scatter` and
`deck-path` ship in xviz v0.10.x. The remaining 11 chart types and
puppeteer-headless validation are tracked in the M7-B backlog.

If you have a use case that needs one of the unimplemented chart
types, please file an issue with a specific scenario — that helps
prioritize the order.

## Install (when complete)

```bash
npm i @minimal-viz/core @minimal-viz/maps react react-dom echarts
```

## Use (when complete)

```tsx
import { DeckScatter } from '@minimal-viz/maps'

<DeckScatter
  width={800} height={600}
  formData={{
    vizType: 'deck-scatter',
    longitudeColumn: 'lon',
    latitudeColumn: 'lat',
    metric: 'value',
    radius: 50,
    initialView: { longitude: -98, latitude: 39, zoom: 3 },
  }}
  queriesData={[{ data: [...] }]}
/>
```

## Map SDK choice — maplibre-gl, not mapbox-gl

Recorded in [the M7 spike report](../docs/superpowers/specs/2026-04-29-m7-spike-report.md).
TL;DR: `mapbox-gl@v2+` is BSL-licensed (incompatible with Apache 2.0)
and requires a token; `maplibre-gl@v5` is BSD-3 / MIT and accepts any
tile source. deck.gl's `@deck.gl/mapbox` is base-map-agnostic, so users
with corporate Mapbox infrastructure can fork this package and swap
one import.

## License

Apache 2.0 (same as xviz core).
