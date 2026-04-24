// Minimal design-token theme system.
// A theme provides colors for text/background/grid/axis + the categorical palette.
// Consumers pass `theme` as a prop to every chart; no React context required
// (keeps the SDK hookless-friendly and headless-renderer-friendly).

export interface Theme {
  name: string
  palette: string[]          // categorical color scheme (cycled for series)
  colorText: string          // primary text (labels, totals, axis labels)
  colorTextSecondary: string // legend labels, tooltips, deemphasized
  colorBg: string            // chart background
  colorBgTooltip: string
  colorBorder: string        // grid lines, axis lines, separators
  colorHighlight: string     // accent for hover/selection
  fontFamily: string
}

export const LIGHT_THEME: Theme = {
  name: 'light',
  palette: [
    '#1FA8C9', '#454E7C', '#5AC189', '#FF7F44', '#666666',
    '#E04355', '#FCC700', '#A868B7', '#3CCCCB', '#A38F79',
  ],
  colorText: '#1a1a1a',
  colorTextSecondary: '#595959',
  colorBg: '#ffffff',
  colorBgTooltip: '#ffffff',
  colorBorder: '#e0e0e0',
  colorHighlight: '#1FA8C9',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
}

export const DARK_THEME: Theme = {
  name: 'dark',
  palette: [
    '#4FC3F7', '#9FA8DA', '#81C784', '#FFB74D', '#BDBDBD',
    '#F06292', '#FFD54F', '#CE93D8', '#80DEEA', '#D7CCC8',
  ],
  colorText: '#e8e8e8',
  colorTextSecondary: '#a0a0a0',
  colorBg: '#1a1a1a',
  colorBgTooltip: '#2a2a2a',
  colorBorder: '#3a3a3a',
  colorHighlight: '#4FC3F7',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
}

export const DEFAULT_THEME = LIGHT_THEME

/** Shallow merge overrides into a base theme. */
export function extendTheme(base: Theme, overrides: Partial<Theme>): Theme {
  return { ...base, ...overrides }
}
