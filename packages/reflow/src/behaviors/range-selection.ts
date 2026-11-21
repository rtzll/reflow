/**
 * Extend and contract an adjacent range without losing independent selections.
 * Fills the multi-select range gesture gap in `@remix-run/ui` 0.14.0.
 */
export function createRangeSelection<Key>() {
  let gesture: { anchor: Key; end: Key; previous: Set<Key> } | undefined

  return {
    reset() {
      gesture = undefined
    },
    extend(order: readonly Key[], selected: ReadonlySet<Key>, from: Key, to: Key): Set<Key> {
      if (!gesture || gesture.end !== from || order.indexOf(gesture.anchor) === -1) {
        gesture = { anchor: from, end: from, previous: new Set(selected) }
      }
      const anchor = order.indexOf(gesture.anchor)
      const end = order.indexOf(to)
      if (anchor === -1 || end === -1) {
        gesture = undefined
        return new Set(selected)
      }
      gesture.end = to
      const result = new Set(gesture.previous)
      for (const key of order.slice(Math.min(anchor, end), Math.max(anchor, end) + 1)) {
        result.add(key)
      }
      return result
    },
  }
}
