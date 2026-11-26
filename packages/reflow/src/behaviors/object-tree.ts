export function isExpandableObject(
  value: unknown,
): value is Record<string, unknown> | readonly unknown[] {
  return typeof value === 'object' && value !== null
}

export function objectChildEntries(value: object, sortKeys: boolean): [string, unknown][] {
  if (Array.isArray(value)) {
    return value.map((item, idx) => [String(idx), item])
  }
  const entries: [string, unknown][] = []
  for (const key of Object.keys(value)) {
    try {
      entries.push([key, (value as Record<string, unknown>)[key]])
    } catch {
      entries.push([key, '[Unreadable]'])
    }
  }
  return sortKeys ? entries.sort(([a], [b]) => a.localeCompare(b)) : entries
}

export function objectSummary(value: object, entries: readonly [string, unknown][]): string {
  if (Array.isArray(value)) {
    return entries.length === 0
      ? '[]'
      : `[${entries.length} ${entries.length === 1 ? 'item' : 'items'}]`
  }
  return entries.length === 0
    ? '{}'
    : `{${entries.length} ${entries.length === 1 ? 'key' : 'keys'}}`
}

function toJsonSafe(value: unknown, ancestors: ReadonlySet<object>): unknown {
  if (typeof value === 'bigint') return `${value}n`
  if (!isExpandableObject(value)) return value
  if (ancestors.has(value)) return '[Circular]'

  const nextAncestors = new Set(ancestors)
  nextAncestors.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item, nextAncestors))
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }

  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value)) {
    try {
      const child = (value as Record<string, unknown>)[key]
      if (child !== undefined && typeof child !== 'function' && typeof child !== 'symbol') {
        out[key] = toJsonSafe(child, nextAncestors)
      }
    } catch {
      out[key] = '[Unreadable]'
    }
  }
  return out
}

/**
 * Serializes arbitrary JavaScript values to pretty-printed JSON while preserving
 * non-cyclic shared sibling references and replacing true ancestor cycles with
 * `"[Circular]"`.
 */
export function safeJsonStringify(value: unknown): string {
  try {
    const prepared = toJsonSafe(value, new Set())
    return JSON.stringify(prepared, null, 2) ?? String(value)
  } catch {
    return String(value)
  }
}

export interface ObjectTreePrimitiveNode {
  kind: 'primitive'
  key: string | undefined
  path: string
  depth: number
  value: unknown
}

export interface ObjectTreeCircularNode {
  kind: 'circular'
  key: string | undefined
  path: string
  depth: number
}

export interface ObjectTreeBranchNode {
  kind: 'branch'
  key: string | undefined
  path: string
  depth: number
  summary: string
  canExpand: boolean
  expanded: boolean
  children: readonly ObjectTreeNode[]
}

export type ObjectTreeNode = ObjectTreePrimitiveNode | ObjectTreeCircularNode | ObjectTreeBranchNode

export interface InspectObjectOptions {
  name?: string
  sortKeys?: boolean
  isExpanded: (path: string, depth: number) => boolean
}

function buildNode(
  key: string | undefined,
  value: unknown,
  path: string,
  depth: number,
  ancestors: ReadonlySet<object>,
  options: InspectObjectOptions,
): ObjectTreeNode {
  if (!isExpandableObject(value)) {
    return { kind: 'primitive', key, path, depth, value }
  }
  if (ancestors.has(value)) {
    return { kind: 'circular', key, path, depth }
  }

  const entries = objectChildEntries(value, Boolean(options.sortKeys))
  const canExpand = entries.length > 0
  const expanded = canExpand && options.isExpanded(path, depth)

  if (!expanded) {
    return {
      kind: 'branch',
      key,
      path,
      depth,
      summary: objectSummary(value, entries),
      canExpand,
      expanded: false,
      children: [],
    }
  }

  const nextAncestors = new Set(ancestors)
  nextAncestors.add(value)

  return {
    kind: 'branch',
    key,
    path,
    depth,
    summary: objectSummary(value, entries),
    canExpand,
    expanded: true,
    children: entries.map(([k, child]) =>
      buildNode(k, child, `${path}.${k}`, depth + 1, nextAncestors, options),
    ),
  }
}

/**
 * Builds the visible tree of nodes for `ObjectInspector`, tracking ancestor
 * references per branch so shared siblings expand cleanly while cycles of any
 * depth terminate safely as `kind: 'circular'`.
 */
export function inspectObjectTree(value: unknown, options: InspectObjectOptions): ObjectTreeNode {
  return buildNode(options.name, value, '$', 0, new Set(), options)
}
