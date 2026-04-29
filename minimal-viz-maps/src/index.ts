// Public API of the @minimal-viz/maps satellite package.
//
// Phase 1 (this version): DeckScatter + DeckPath as reference
// implementations. Layer types and form-data are defined for all 13
// charts; React component implementations land per-phase.

export { DeckScatter } from './layers/DeckScatter'
export { DeckPath } from './layers/DeckPath'

// Common building blocks for users who want to compose their own map
// charts on top of @deck.gl/mapbox + maplibre-gl + xviz formData.
export { MapContainer } from './common/MapContainer'
export { computeViewport } from './common/viewport'

// Types for all 13 chart families (FormData declared even where the
// React component is not yet implemented — gives users / TypeScript
// consumers a stable API surface to plan against).
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
