// Shared flat-rows → nested-tree helper used by hierarchical charts
// (Treemap, Sunburst; later Tree, Graph in M2). Pure / side-effect-free.
//
// Aggregation rule: leaf nodes carry summed metric values; ECharts then
// auto-aggregates intermediate levels at render time.

export interface TreeNode {
  name: string
  value?: number
  children?: TreeNode[]
  itemStyle?: { color?: string }
}

/**
 * Build a nested tree from flat rows by walking a multi-column `groupby` path.
 * Rows with non-finite metric values are dropped silently.
 */
export function buildHierarchy(
  rows: ReadonlyArray<Record<string, unknown>>,
  groupby: ReadonlyArray<string>,
  metric: string,
  colorOf: (name: string) => string,
): TreeNode[] {
  const root: TreeNode[] = []
  for (const row of rows) {
    const v = Number(row[metric] ?? NaN)
    if (!Number.isFinite(v)) continue

    let cursor = root
    for (let depth = 0; depth < groupby.length; depth += 1) {
      const key = String(row[groupby[depth]] ?? '')
      const isLeaf = depth === groupby.length - 1
      let node = cursor.find((n) => n.name === key)
      if (!node) {
        node = isLeaf
          ? { name: key, value: 0, itemStyle: { color: colorOf(key) } }
          : { name: key, children: [], itemStyle: { color: colorOf(key) } }
        cursor.push(node)
      }
      if (isLeaf) {
        node.value = (node.value ?? 0) + v
      } else {
        if (!node.children) node.children = []
        cursor = node.children
      }
    }
  }
  return root
}
