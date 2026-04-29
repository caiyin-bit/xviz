// Form-data types for the 13 maps charts. xviz core doesn't know about
// these; the maps satellite package owns the type surface end-to-end.

export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch?: number
  bearing?: number
}

/** Free OSM raster tile style — default when `mapStyle` is not provided. */
export const DEFAULT_OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
}

/** Per-chart formData fields that all map charts share. */
interface MapBaseFormData {
  longitudeColumn: string
  latitudeColumn: string
  /** Initial camera. If absent, viewport auto-fits to the data extent. */
  initialView?: ViewState
  /** maplibre-gl style URL or inline style object. Defaults to free OSM. */
  mapStyle?: string | object
}

export interface DeckScatterFormData extends MapBaseFormData {
  vizType: 'deck-scatter'
  metric?: string                  // numeric — drives radius if `radiusColumn` not set
  radiusColumn?: string            // numeric — explicit per-point radius source
  colorColumn?: string             // categorical — bucket points into colored series
  radius?: number                  // base radius in meters when no radiusColumn; default 50
  opacity?: number                 // 0..1; default 0.6
  colorScheme?: string[]
}

export interface DeckPathFormData extends MapBaseFormData {
  vizType: 'deck-path'
  pathColumn: string               // column whose value is an array of [lon, lat] tuples
  metricColumn?: string            // numeric — drives line width
  colorColumn?: string             // categorical — colors paths by group
  lineWidth?: number               // base width in pixels; default 3
  opacity?: number                 // default 0.7
  colorScheme?: string[]
}

export interface DeckPolygonFormData extends MapBaseFormData {
  vizType: 'deck-polygon'
  polygonColumn: string            // GeoJSON-like polygon coordinates
  metric?: string                  // numeric — drives fill color
  colorRange?: [string, string]    // low → high
  stroked?: boolean
  filled?: boolean
}

export interface DeckArcFormData extends MapBaseFormData {
  vizType: 'deck-arc'
  sourceLonColumn: string
  sourceLatColumn: string
  targetLonColumn: string
  targetLatColumn: string
  metricColumn?: string            // line width / opacity
  sourceColor?: [number, number, number, number?]
  targetColor?: [number, number, number, number?]
}

export interface DeckGeojsonFormData extends MapBaseFormData {
  vizType: 'deck-geojson'
  geojson: { type: string; features?: unknown[]; [k: string]: unknown }
  metric?: string
  colorRange?: [string, string]
}

export interface DeckGridFormData extends MapBaseFormData {
  vizType: 'deck-grid'
  metric?: string                  // aggregated cell value
  cellSize?: number                // meters; default 1000
  colorRange?: [string, string]
}

export interface DeckHexFormData extends MapBaseFormData {
  vizType: 'deck-hex'
  metric?: string
  radius?: number                  // hex radius in meters; default 1000
  elevationScale?: number
  colorRange?: [string, string]
}

export interface DeckHeatmapFormData extends MapBaseFormData {
  vizType: 'deck-heatmap'
  metric?: string
  radiusPixels?: number            // gaussian radius; default 30
  colorRange?: string[]            // multi-stop heatmap palette
  intensity?: number
}

export interface DeckScreengridFormData extends MapBaseFormData {
  vizType: 'deck-screengrid'
  metric?: string
  cellSizePixels?: number          // default 50
  colorRange?: string[]
}

export interface DeckContourFormData extends MapBaseFormData {
  vizType: 'deck-contour'
  metric?: string
  cellSize?: number                // meters
  contours?: { threshold: number; color: [number, number, number, number?] }[]
}

export interface DeckMultiFormData extends MapBaseFormData {
  vizType: 'deck-multi'
  // Compose multiple sublayers — each is a partial formData for one of
  // the layer types above. The transform dispatches by sublayer.vizType.
  sublayers: ({ vizType: string; data?: unknown[] } & Record<string, unknown>)[]
}

export interface PointClusterMapFormData extends MapBaseFormData {
  vizType: 'point-cluster-map'
  metricColumn?: string            // weight per point; default 1
  clusterRadius?: number           // pixels at zoom 0; default 60
  minZoom?: number
  maxZoom?: number
  colorRange?: [string, string]
}

export interface CartodiagramFormData extends MapBaseFormData {
  // Carto-style overlay: a small ECharts chart pinned to each lat/lon.
  // Phase-2 implementation; full schema TBD.
  vizType: 'cartodiagram'
  // Sublayer chart spec — same shape as a normal xviz formData (Pie,
  // Bar, etc) — gets repeated per geo point.
  sublayer: { vizType: string; [k: string]: unknown }
}

export type AnyMapFormData =
  | DeckScatterFormData
  | DeckPathFormData
  | DeckPolygonFormData
  | DeckArcFormData
  | DeckGeojsonFormData
  | DeckGridFormData
  | DeckHexFormData
  | DeckHeatmapFormData
  | DeckScreengridFormData
  | DeckContourFormData
  | DeckMultiFormData
  | PointClusterMapFormData
  | CartodiagramFormData
