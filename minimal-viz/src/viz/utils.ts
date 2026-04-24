// Tiny replacements for the handful of @superset-ui/core helpers we actually need.

// Superset's default categorical palette (the "supersetColors" scheme).
export const DEFAULT_PALETTE = [
  '#1FA8C9', '#454E7C', '#5AC189', '#FF7F44', '#666666',
  '#E04355', '#FCC700', '#A868B7', '#3CCCCB', '#A38F79',
  '#8FD3E4', '#A1A6BD', '#ACE1C4', '#FEC0A1', '#B2B2B2',
  '#EFA1AA', '#FDE380', '#D3B3DA', '#9EE5E5', '#D1C6BC',
]

// Stable color assignment by name. Same name → same color across renders.
export function makeColorScale(palette = DEFAULT_PALETTE) {
  const assigned = new Map<string, string>()
  let next = 0
  return (name: string): string => {
    const hit = assigned.get(name)
    if (hit) return hit
    const color = palette[next % palette.length]
    assigned.set(name, color)
    next += 1
    return color
  }
}

// Number formatters: a pragmatic subset of Superset's `d3-format` presets.
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const float1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const float2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function getNumberFormatter(kind: string | undefined) {
  switch (kind) {
    case 'int':     return (v: number) => int.format(v)
    case 'float1':  return (v: number) => float1.format(v)
    case 'float2':  return (v: number) => float2.format(v)
    case 'percent': return (v: number) => pct.format(v)
    case 'smart':
    default:        return (v: number) => compact.format(v)
  }
}

export const percentFormatter = (v: number) => pct.format(v)
