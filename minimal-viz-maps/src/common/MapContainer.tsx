// Shared container for all maps charts. Mounts a maplibre-gl Map + a
// deck.gl overlay (interleaved via @deck.gl/mapbox). Handles:
//   - default OSM tile style when no `mapStyle` is provided
//   - viewport fitting to data when no `initialView` is provided
//   - "tiles loaded + deck.gl initialized" signal so puppeteer screenshots
//     fire after the map is actually drawn (subscribers via `onIdle`)

import { useEffect, useRef } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import type { Layer } from '@deck.gl/core'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { DEFAULT_OSM_STYLE, type ViewState } from '../types'

export interface MapContainerProps {
  width: number
  height: number
  layers: Layer[]
  initialView: ViewState
  mapStyle?: string | object
  onIdle?: () => void
}

export function MapContainer({
  width,
  height,
  layers,
  initialView,
  mapStyle,
  onIdle,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)

  // Initialize maplibre-gl + the deck.gl overlay once on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const style: StyleSpecification | string =
      typeof mapStyle === 'string'
        ? mapStyle
        : ((mapStyle as StyleSpecification | undefined) ?? (DEFAULT_OSM_STYLE as unknown as StyleSpecification))

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [initialView.longitude, initialView.latitude],
      zoom: initialView.zoom,
      pitch: initialView.pitch ?? 0,
      bearing: initialView.bearing ?? 0,
      attributionControl: { compact: true },
      interactive: false, // headless renders never need pan/zoom interactions
    })
    mapRef.current = map

    // Wait for the style to load before adding the overlay; otherwise
    // deck.gl can't pick up the underlying gl context.
    map.on('load', () => {
      const overlay = new MapboxOverlay({ interleaved: true, layers })
      // maplibre-gl's TS surface differs slightly from mapbox-gl's; cast
      // through unknown to satisfy MapboxOverlay's IControl shape.
      map.addControl(overlay as unknown as maplibregl.IControl)
      overlayRef.current = overlay
    })

    // Fire the puppeteer-friendly "ready for screenshot" signal once
    // both the basemap and deck.gl have settled.
    map.on('idle', () => {
      if (overlayRef.current) onIdle?.()
    })

    return () => {
      overlayRef.current = null
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync layer changes after init.
  useEffect(() => {
    overlayRef.current?.setProps({ layers })
  }, [layers])

  // Sync viewport changes.
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.jumpTo({
      center: [initialView.longitude, initialView.latitude],
      zoom: initialView.zoom,
      pitch: initialView.pitch ?? 0,
      bearing: initialView.bearing ?? 0,
    })
  }, [initialView.longitude, initialView.latitude, initialView.zoom, initialView.pitch, initialView.bearing])

  return (
    <div
      ref={containerRef}
      style={{ width, height, position: 'relative' }}
      data-testid="map-container"
    />
  )
}
