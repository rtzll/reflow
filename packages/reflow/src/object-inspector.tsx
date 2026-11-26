import { on, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface ObjectInspectorProps {
  /** Any JSON-compatible or JavaScript value to inspect as a collapsible tree. */
  data: unknown
  /** Optional root key label (e.g. `'payload'`, `'event'`). */
  name?: string
  /** Initial auto-expand depth (`0` collapses root, `1` expands root children). Default `1`. */
  expandLevel?: number
  /** Alphabetically sorts object keys when `true`. Default `false`. */
  sortKeys?: boolean
  /** Shows a copy-JSON button in the header. Default `true`. */
  copyable?: boolean
  /** Called after the serialized JSON is copied. */
  onCopy?: () => void
  /** Called if clipboard copying fails. */
  onCopyError?: () => void
  /** Accessible name for the inspector tree. Default `'Object inspector'`. */
  label?: string
  /** Controls spacing and font scale. */
  size?: ControlSize
  class?: string
}

function isExpandable(value: unknown): value is Record<string, unknown> | readonly unknown[] {
  return typeof value === 'object' && value !== null
}

function childEntries(value: object, sortKeys: boolean): [string, unknown][] {
  if (Array.isArray(value)) {
    return value.map((item, idx) => [String(idx), item])
  }
  const entries = Object.entries(value)
  return sortKeys ? entries.sort(([a], [b]) => a.localeCompare(b)) : entries
}

function safeJson(value: unknown): string {
  const seen = new WeakSet<object>()
  try {
    return (
      JSON.stringify(
        value,
        (_key, val: unknown) => {
          if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) return '[Circular]'
            seen.add(val)
          }
          if (typeof val === 'bigint') return `${val}n`
          return val
        },
        2,
      ) ?? String(value)
    )
  } catch {
    return String(value)
  }
}

function renderPrimitive(value: unknown): RemixNode {
  if (value === null)
    return (
      <span class="rf-obj-val" data-type="null">
        null
      </span>
    )
  if (value === undefined)
    return (
      <span class="rf-obj-val" data-type="undefined">
        undefined
      </span>
    )
  if (typeof value === 'string') {
    return (
      <span class="rf-obj-val" data-type="string">
        "{value}"
      </span>
    )
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return (
      <span class="rf-obj-val" data-type="number">
        {String(value)}
      </span>
    )
  }
  if (typeof value === 'boolean') {
    return (
      <span class="rf-obj-val" data-type="boolean">
        {String(value)}
      </span>
    )
  }
  return (
    <span class="rf-obj-val" data-type="other">
      {String(value)}
    </span>
  )
}

function summaryFor(value: object, entries: readonly [string, unknown][]): string {
  if (Array.isArray(value)) {
    return entries.length === 0
      ? '[]'
      : `[${entries.length} ${entries.length === 1 ? 'item' : 'items'}]`
  }
  return entries.length === 0
    ? '{}'
    : `{${entries.length} ${entries.length === 1 ? 'key' : 'keys'}}`
}

/**
 * Collapsible structured JSON and object tree inspector with type-colored
 * primitives, circular-reference protection, and one-click JSON copy.
 */
export function ObjectInspector(handle: Handle<ObjectInspectorProps>) {
  const overrides = new Map<string, boolean>()
  let copyState: 'idle' | 'copied' | 'error' = 'idle'
  let copyTimer: ReturnType<typeof setTimeout> | undefined

  handle.signal.addEventListener('abort', () => clearTimeout(copyTimer), { once: true })

  return () => {
    const props = handle.props
    const expandLevel = props.expandLevel ?? 1
    const sortKeys = Boolean(props.sortKeys)
    const copyable = props.copyable ?? true

    function isExpanded(path: string, depth: number): boolean {
      const override = overrides.get(path)
      return override !== undefined ? override : depth < expandLevel
    }

    function toggle(path: string, depth: number) {
      overrides.set(path, !isExpanded(path, depth))
      void handle.update()
    }

    async function copyAll() {
      clearTimeout(copyTimer)
      try {
        await navigator.clipboard.writeText(safeJson(props.data))
        copyState = 'copied'
        props.onCopy?.()
      } catch {
        copyState = 'error'
        props.onCopyError?.()
      }
      void handle.update()
      copyTimer = setTimeout(() => {
        copyState = 'idle'
        void handle.update()
      }, 1600)
    }

    function renderNode(
      keyLabel: string | undefined,
      value: unknown,
      path: string,
      depth: number,
      ancestors: ReadonlySet<object>,
    ): RemixNode {
      if (!isExpandable(value)) {
        return (
          <li key={path} class="rf-obj-row" role="treeitem" aria-selected="false">
            <span class="rf-obj-spacer" aria-hidden="true" />
            {keyLabel !== undefined && (
              <>
                <span class="rf-obj-key">{keyLabel}</span>
                <span class="rf-obj-colon" aria-hidden="true">
                  :
                </span>
              </>
            )}
            {renderPrimitive(value)}
          </li>
        )
      }

      if (ancestors.has(value)) {
        return (
          <li key={path} class="rf-obj-row" role="treeitem" aria-selected="false">
            <span class="rf-obj-spacer" aria-hidden="true" />
            {keyLabel !== undefined && (
              <>
                <span class="rf-obj-key">{keyLabel}</span>
                <span class="rf-obj-colon" aria-hidden="true">
                  :
                </span>
              </>
            )}
            <span class="rf-obj-val" data-type="circular">
              [Circular]
            </span>
          </li>
        )
      }

      const entries = childEntries(value, sortKeys)
      const expanded = entries.length > 0 && isExpanded(path, depth)
      const nextAncestors = new Set(ancestors)
      nextAncestors.add(value)
      const canExpand = entries.length > 0

      return (
        <li
          key={path}
          class="rf-obj-branch"
          role="treeitem"
          aria-expanded={canExpand ? expanded : undefined}
          aria-selected="false"
          data-open={expanded ? 'true' : undefined}
        >
          <div class="rf-obj-row">
            {canExpand ? (
              <button
                type="button"
                class="rf-obj-toggle"
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${keyLabel ?? 'root'}`}
                mix={on('click', () => toggle(path, depth))}
              >
                <span class="rf-obj-chevron" aria-hidden="true">
                  <Icon name="chevron-right" size={12} />
                </span>
                {keyLabel !== undefined && (
                  <>
                    <span class="rf-obj-key">{keyLabel}</span>
                    <span class="rf-obj-colon" aria-hidden="true">
                      :
                    </span>
                  </>
                )}
                <span class="rf-obj-summary">{summaryFor(value, entries)}</span>
              </button>
            ) : (
              <>
                <span class="rf-obj-spacer" aria-hidden="true" />
                {keyLabel !== undefined && (
                  <>
                    <span class="rf-obj-key">{keyLabel}</span>
                    <span class="rf-obj-colon" aria-hidden="true">
                      :
                    </span>
                  </>
                )}
                <span class="rf-obj-summary">{summaryFor(value, entries)}</span>
              </>
            )}
          </div>
          {expanded && (
            <ul class="rf-obj-children" role="group">
              {entries.map(([k, childVal]) =>
                renderNode(k, childVal, `${path}.${k}`, depth + 1, nextAncestors),
              )}
            </ul>
          )}
        </li>
      )
    }

    return (
      <div
        class={classList('rf-object-inspector', props.class)}
        data-size={props.size === 'compact' ? 'compact' : undefined}
      >
        {(props.name || copyable) && (
          <div class="rf-obj-head">
            <span class="rf-obj-title">{props.name ?? 'JSON'}</span>
            {copyable && (
              <button
                type="button"
                class="rf-obj-copy"
                aria-label="Copy JSON"
                mix={on('click', () => void copyAll())}
              >
                <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={12} />
                <span>
                  {copyState === 'copied'
                    ? 'Copied'
                    : copyState === 'error'
                      ? 'Copy failed'
                      : 'Copy'}
                </span>
              </button>
            )}
          </div>
        )}
        <ul class="rf-obj-tree" role="tree" aria-label={props.label ?? 'Object inspector'}>
          {renderNode(props.name, props.data, '$', 0, new Set())}
        </ul>
      </div>
    )
  }
}
