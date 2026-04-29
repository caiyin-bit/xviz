// Maps-enabled registry. Imports the @minimal-viz/maps satellite and
// wires every chart type into a vizType→component map. Activated via
// the vite alias when XVIZ_ENABLE_MAPS=1 is set during the build.

import type { ComponentType } from 'react'
import {
  DeckScatter,
  DeckPath,
  DeckPolygon,
  DeckArc,
  DeckGeojson,
  DeckGrid,
  DeckHex,
  DeckHeatmap,
  DeckScreengrid,
  DeckContour,
  DeckMulti,
  PointClusterMap,
  Cartodiagram,
} from '../../minimal-viz-maps/src'

export const MAPS_REGISTRY: Record<string, ComponentType<unknown>> = {
  'deck-scatter': DeckScatter as unknown as ComponentType<unknown>,
  'deck-path': DeckPath as unknown as ComponentType<unknown>,
  'deck-polygon': DeckPolygon as unknown as ComponentType<unknown>,
  'deck-arc': DeckArc as unknown as ComponentType<unknown>,
  'deck-geojson': DeckGeojson as unknown as ComponentType<unknown>,
  'deck-grid': DeckGrid as unknown as ComponentType<unknown>,
  'deck-hex': DeckHex as unknown as ComponentType<unknown>,
  'deck-heatmap': DeckHeatmap as unknown as ComponentType<unknown>,
  'deck-screengrid': DeckScreengrid as unknown as ComponentType<unknown>,
  'deck-contour': DeckContour as unknown as ComponentType<unknown>,
  'deck-multi': DeckMulti as unknown as ComponentType<unknown>,
  'point-cluster-map': PointClusterMap as unknown as ComponentType<unknown>,
  'cartodiagram': Cartodiagram as unknown as ComponentType<unknown>,
}

export const MAPS_TYPES = Object.keys(MAPS_REGISTRY)
export const MAPS_ENABLED = true
