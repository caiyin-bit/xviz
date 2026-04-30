// CountryMap is structurally identical to WorldMap — both are choropleths
// rendered via ECharts MapChart with user-supplied GeoJSON. The only API
// difference is the column name (`regionColumn` vs `countryColumn`),
// signaling intent: CountryMap is for subdivisions of a single country
// (US states, China provinces, etc), WorldMap is for a globe view.
//
// The wrapper re-shapes the formData and delegates.

import { useMemo } from 'react'
import type { ChartProps, CountryMapFormData, WorldMapFormData } from '../types'
import { transformWorldMapProps } from '../world-map/transformProps'
import { Echart } from '../Echart'

export function CountryMap(props: ChartProps<CountryMapFormData>) {
  const { theme, formData, queriesData, width, height } = props
  const wmFormData: WorldMapFormData = useMemo(() => ({
    vizType: 'world-map',
    countryColumn: formData.regionColumn,
    metric: formData.metric,
    geojson: formData.geojson,
    nameProperty: formData.nameProperty,
    colorRange: formData.colorRange,
    showLabels: formData.showLabels,
    numberFormat: formData.numberFormat,
  }), [formData])
  const { echartOptions, width: w, height: h } = useMemo(
    () => transformWorldMapProps({
      formData: wmFormData,
      queriesData,
      width,
      height,
      theme,
    }),
    [wmFormData, queriesData, width, height, theme],
  )
  return <Echart width={w} height={h} echartOptions={echartOptions} theme={theme} />
}
