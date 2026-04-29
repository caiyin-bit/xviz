// Point Cluster Map — supercluster-backed marker clusters. Replaces a
// dense ScatterplotLayer with cluster bubbles whose radius reflects the
// number of points contained, then expands into individual points at high
// zoom. Mirrors Superset's `point_cluster_map` viz.

import { useMemo } from 'react'
import Supercluster from 'supercluster'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import type { ChartProps } from '@minimal-viz/core'
import { MapContainer } from '../common/MapContainer'
import { computeViewport } from '../common/viewport'
import { hexToRgb } from '../common/aggregation'
import type { PointClusterMapFormData } from '../types'

interface ClusterFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    cluster?: boolean
    cluster_id?: number
    point_count?: number
    sum?: number
  } & Record<string, unknown>
}

export function PointClusterMap(props: ChartProps<PointClusterMapFormData>) {
  const { formData, queriesData, width, height } = props
  const {
    longitudeColumn,
    latitudeColumn,
    metricColumn,
    clusterRadius = 60,
    minZoom = 0,
    maxZoom = 16,
    colorRange,
    initialView,
    mapStyle,
  } = formData

  const rows = queriesData[0]?.data ?? []

  const view = useMemo(
    () => initialView ?? computeViewport(rows, longitudeColumn, latitudeColumn, width, height),
    [initialView, rows, longitudeColumn, latitudeColumn, width, height],
  )

  const [low, high] = useMemo<[
    [number, number, number],
    [number, number, number],
  ]>(
    () => [
      hexToRgb(colorRange?.[0] ?? '#1FA8C9'),
      hexToRgb(colorRange?.[1] ?? '#FF7F44'),
    ],
    [colorRange],
  )

  // Build the supercluster index once per data/options change. Then query
  // it for the current viewport's cluster set at the chosen zoom.
  const clusters = useMemo<ClusterFeature[]>(() => {
    if (rows.length === 0) return []
    const points: ClusterFeature[] = []
    for (const r of rows) {
      const lon = Number(r[longitudeColumn] ?? NaN)
      const lat = Number(r[latitudeColumn] ?? NaN)
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      const sum = metricColumn ? Number(r[metricColumn] ?? 1) : 1
      points.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { sum: Number.isFinite(sum) ? sum : 1, ...r },
      })
    }
    const index = new Supercluster<{ sum: number }, { sum: number }>({
      radius: clusterRadius,
      minZoom,
      maxZoom,
      map: (props_) => ({ sum: Number(props_.sum ?? 1) }),
      reduce: (acc, props_) => {
        acc.sum += props_.sum
      },
    })
    index.load(points as unknown as Parameters<typeof index.load>[0])

    // Render clusters across the whole world at the current view zoom.
    const bbox: [number, number, number, number] = [-180, -85, 180, 85]
    const z = Math.round(view.zoom)
    return index.getClusters(bbox, z) as unknown as ClusterFeature[]
  }, [rows, longitudeColumn, latitudeColumn, metricColumn, clusterRadius, minZoom, maxZoom, view.zoom])

  // Pre-compute extreme cluster sums for color/radius lerp.
  const { minSum, maxSum } = useMemo(() => {
    let mn = Infinity
    let mx = -Infinity
    for (const f of clusters) {
      const s = Number(f.properties.point_count ?? f.properties.sum ?? 1)
      if (s < mn) mn = s
      if (s > mx) mx = s
    }
    if (!Number.isFinite(mn)) return { minSum: 0, maxSum: 1 }
    if (mn === mx) return { minSum: mn, maxSum: mn + 1 }
    return { minSum: mn, maxSum: mx }
  }, [clusters])

  const layers = useMemo<Layer[]>(() => {
    const lerp = (sum: number): [number, number, number, number] => {
      const t = (sum - minSum) / (maxSum - minSum)
      return [
        Math.round(low[0] + (high[0] - low[0]) * t),
        Math.round(low[1] + (high[1] - low[1]) * t),
        Math.round(low[2] + (high[2] - low[2]) * t),
        200,
      ]
    }
    const radius = (sum: number) => 8 + 22 * ((sum - minSum) / (maxSum - minSum))

    const dots = new ScatterplotLayer<ClusterFeature>({
      id: 'point-cluster',
      data: clusters,
      getPosition: (f) => f.geometry.coordinates,
      getFillColor: (f) => lerp(Number(f.properties.point_count ?? f.properties.sum ?? 1)),
      getRadius: (f) => radius(Number(f.properties.point_count ?? f.properties.sum ?? 1)),
      radiusUnits: 'pixels',
      stroked: true,
      getLineColor: [255, 255, 255, 220],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      pickable: false,
    })

    const labels = new TextLayer<ClusterFeature>({
      id: 'point-cluster-labels',
      data: clusters.filter((f) => Boolean(f.properties.cluster)),
      getPosition: (f) => f.geometry.coordinates,
      getText: (f) => String(f.properties.point_count ?? ''),
      getSize: 12,
      getColor: [255, 255, 255, 255],
      sizeUnits: 'pixels',
      fontFamily: 'sans-serif',
      pickable: false,
    })

    return [dots, labels]
  }, [clusters, minSum, maxSum, low, high])

  return <MapContainer width={width} height={height} layers={layers} initialView={view} mapStyle={mapStyle} />
}
