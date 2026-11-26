/**
 * Pure headless grouping, multi-item drag/keyboard reordering, and bounded undo
 * helpers shared by KanbanBoard, GroupedList, and issue-tracking workspaces.
 */

export interface PlaceGroupedItemsOptions<T, K extends string> {
  movingIds: ReadonlySet<string>
  targetGroup: K
  /** Insert before this item ID inside the list, or `null` to append to the target group. */
  beforeId: string | null
  getId: (item: T) => string
  getGroup: (item: T) => K
  setGroup: (item: T, group: K) => T
}

/** Buckets `items` into the ordered `groups` keys while preserving relative order. */
export function groupItemsBy<T, K extends string>(
  items: readonly T[],
  groups: readonly K[],
  getGroup: (item: T) => K,
): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const group of groups) map.set(group, [])
  for (const item of items) {
    const key = getGroup(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

/**
 * Moves one or more items into `targetGroup` before `beforeId` (or at the end
 * when `beforeId` is `null`), returning the original array reference when the
 * target group's order and membership did not change.
 */
export function placeGroupedItems<T, K extends string>(
  items: readonly T[],
  options: PlaceGroupedItemsOptions<T, K>,
): T[] {
  const { movingIds, targetGroup, beforeId, getId, getGroup, setGroup } = options
  if (movingIds.size === 0) return [...items]

  const moving = items.filter((item) => movingIds.has(getId(item)))
  if (moving.length === 0) return [...items]

  const rest = items.filter((item) => !movingIds.has(getId(item)))
  const moved = moving.map((item) =>
    getGroup(item) === targetGroup ? item : setGroup(item, targetGroup),
  )

  let insertIndex = beforeId ? rest.findIndex((item) => getId(item) === beforeId) : -1
  if (insertIndex < 0) {
    // Append right after the last remaining item in `targetGroup` if present, else at end.
    let lastInGroup = -1
    for (let i = rest.length - 1; i >= 0; i--) {
      if (getGroup(rest[i]!) === targetGroup) {
        lastInGroup = i
        break
      }
    }
    insertIndex = lastInGroup >= 0 ? lastInGroup + 1 : rest.length
  }

  const next = rest.toSpliced(insertIndex, 0, ...moved)
  const prevTarget = items.filter((item) => getGroup(item) === targetGroup)
  const nextTarget = next.filter((item) => getGroup(item) === targetGroup)
  const unchanged =
    prevTarget.length === nextTarget.length &&
    prevTarget.every((item, idx) => getId(item) === getId(nextTarget[idx]!)) &&
    items.length === next.length &&
    items.every(
      (item, idx) => getId(item) === getId(next[idx]!) && getGroup(item) === getGroup(next[idx]!),
    )

  return unchanged ? [...items] : next
}

export interface UndoStack<T> {
  push(snapshot: T): void
  undo(current: T): T | undefined
  redo(current: T): T | undefined
  readonly canUndo: boolean
  readonly canRedo: boolean
  clear(): void
}

/** Bounded undo/redo stack for drag moves and bulk triage mutations. */
export function createUndoStack<T>(maxDepth = 50): UndoStack<T> {
  const limit = Math.max(1, Math.floor(maxDepth))
  const past: T[] = []
  const future: T[] = []

  return {
    push(snapshot: T) {
      past.push(snapshot)
      if (past.length > limit) past.shift()
      future.length = 0
    },
    undo(current: T) {
      const prev = past.pop()
      if (prev === undefined) return undefined
      future.push(current)
      return prev
    },
    redo(current: T) {
      const next = future.pop()
      if (next === undefined) return undefined
      past.push(current)
      return next
    },
    get canUndo() {
      return past.length > 0
    },
    get canRedo() {
      return future.length > 0
    },
    clear() {
      past.length = 0
      future.length = 0
    },
  }
}
