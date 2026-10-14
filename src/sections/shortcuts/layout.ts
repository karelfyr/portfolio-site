import type { Shortcut, ShortcutCategory } from './data'

/** A section (or part of one) within a column — port of the app's `ColumnSlice`. */
export type ColumnSlice = { id: string; categoryName: string; shortcuts: Shortcut[] }

const MAX_ROWS = 22 // rows per column
const HEADER_COST = 2 // title row + gap

/**
 * Port of `HUDView.buildColumns`: fill columns up to 22 rows; a section only starts if
 * at least 3 rows remain; sections that overflow continue in the next column with their
 * title repeated.
 */
export function buildColumns(categories: ShortcutCategory[]): ColumnSlice[][] {
  const result: ColumnSlice[][] = []
  let column: ColumnSlice[] = []
  let rows = 0
  categories.forEach((category, sliceIndex) => {
    let remaining = category.shortcuts
    let part = 0
    while (remaining.length) {
      const available = MAX_ROWS - rows
      if (available < HEADER_COST + 1) {
        if (column.length) {
          result.push(column)
          column = []
          rows = 0
        }
        continue
      }
      const take = Math.min(available - HEADER_COST, remaining.length)
      column.push({ id: `${category.name}-${sliceIndex}-${part}`, categoryName: category.name, shortcuts: remaining.slice(0, take) })
      rows += HEADER_COST + take
      remaining = remaining.slice(take)
      part += 1
      if (remaining.length) {
        result.push(column)
        column = []
        rows = 0
      }
    }
  })
  if (column.length) result.push(column)
  return result
}

/** Splits "⌘ / or ⌘ P" into parts so the separators can be dimmed, as the app does. */
export function parseKeys(keys: string): { text: string; separator: boolean }[] {
  for (const sep of [' or ', ' and ']) {
    const parts = keys.split(sep)
    if (parts.length > 1) return parts.flatMap((p, i) => (i ? [{ text: sep, separator: true }, { text: p, separator: false }] : [{ text: p, separator: false }]))
  }
  return [{ text: keys, separator: false }]
}

/** The app's search: case-insensitive substring on the action name only. */
export const matches = (s: Shortcut, query: string) => !query || s.action.toLowerCase().includes(query.toLowerCase())
