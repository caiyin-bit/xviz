// Public API of the @minimal-viz/maps satellite package.
//
// Phase 2 (this version): all 13 chart implementations are present.
// Layer types and form-data are defined for every chart; React component
// implementations cover the full Superset map catalog.

// Standard layers
export { DeckScatter } from './layers/DeckScatter'
export { DeckPath } from './layers/DeckPath'
export { DeckPolygon } from './layers/DeckPolygon'
export { DeckArc } from './layers/DeckArc'
export { DeckGeojson } from './layers/DeckGeojson'

// Aggregation layers
export { DeckGrid } from './layers/DeckGrid'
export { DeckHex } from './layers/DeckHex'
export { DeckHeatmap } from './layers/DeckHeatmap'
export { DeckScreengrid } from './layers/DeckScreengrid'
export { DeckContour } from './layers/DeckContour'

// Composite + specialty layers
export { DeckMulti } from './layers/DeckMulti'
export { PointClusterMap } from './layers/PointClusterMap'
export { Cartodiagram } from './layers/Cartodiagram'

// Common building blocks for users who want to compose their own map
// charts on top of @deck.gl/mapbox + maplibre-gl + xviz formData.
export { MapContainer } from './common/MapContainer'
export { computeViewport } from './common/viewport'

// Types for all 13 chart families.
export type {
  ViewState,
  AnyMapFormData,
  DeckScatterFormData,
  DeckPathFormData,
  DeckPolygonFormData,
  DeckArcFormData,
  DeckGeojsonFormData,
  DeckGridFormData,
  DeckHexFormData,
  DeckHeatmapFormData,
  DeckScreengridFormData,
  DeckContourFormData,
  DeckMultiFormData,
  PointClusterMapFormData,
  CartodiagramFormData,
} from './types'

export { DEFAULT_OSM_STYLE } from './types'
