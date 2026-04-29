// Default no-op maps registry. Used when XVIZ_ENABLE_MAPS != "1" at
// build time. Keeps deck.gl + maplibre-gl out of the bundle.

import type { ComponentType } from 'react'

export const MAPS_REGISTRY: Record<string, ComponentType<unknown>> = {}
export const MAPS_TYPES: string[] = []
export const MAPS_ENABLED = false
