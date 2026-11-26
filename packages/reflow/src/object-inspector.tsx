import { on, ref, type Handle, type RemixNode } from 'remix/component'
import {
  inspectObjectTree,
  safeJsonStringify,
  type ObjectTreeNode,
} from './behaviors/object-tree.ts'
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

interface FlatTreeItem {
  path: string
  parentPath: string | null
  depth: number
  canExpand: boolean
  expanded: boolean
}

function flattenVisibleNodes(
  node: ObjectTreeNode,
  parentPath: string | null,
  out: FlatTreeItem[],
): void {
  const canExpand = node.kind === 'branch' && node.canExpand
  const expanded = node.kind === 'branch' && node.expanded
  out.push({ path: node.path, parentPath, depth: node.depth, canExpand, expanded })
  if (node.kind === 'branch' && node.expanded) {
    for (const child of node.children) {
      flattenVisibleNodes(child, node.path, out)
    }
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

/**
 * Collapsible structured JSON and object tree inspector with type-colored
 * primitives, circular-reference protection, WAI-ARIA tree keyboard navigation,
 * and one-click JSON copy.
 */
export function ObjectInspector(handle: Handle<ObjectInspectorProps>) {
  const overrides = new Map<string, boolean>()
  let focusedPath = '$'
  let copyState: 'idle' | 'copied' | 'error' = 'idle'
  let copyTimer: ReturnType<typeof setTimeout> | undefined
  let treeEl: HTMLUListElement | null = null

  handle.signal.addEventListener('abort', () => clearTimeout(copyTimer), { once: true })

  const mountTree = ref<HTMLUListElement>((node) => {
    treeEl = node
  })

  function focusItem(path: string) {
    focusedPath = path
    void handle.update()
    queueMicrotask(() => {
      if (!treeEl) return
      const target = Array.from(treeEl.querySelectorAll<HTMLElement>('[role="treeitem"]')).find(
        (el) => el.dataset.path === path,
      )
      target?.focus()
    })
  }

  return () => {
    const props = handle.props
    const expandLevel = props.expandLevel ?? 1
    const sortKeys = Boolean(props.sortKeys)
    const copyable = props.copyable ?? true

    function isExpanded(path: string, depth: number): boolean {
      const override = overrides.get(path)
      return override !== undefined ? override : depth < expandLevel
    }

    function setExpanded(path: string, next: boolean) {
      overrides.set(path, next)
      void handle.update()
    }

    function toggle(path: string, depth: number) {
      focusedPath = path
      setExpanded(path, !isExpanded(path, depth))
    }

    async function copyAll() {
      clearTimeout(copyTimer)
      try {
        await navigator.clipboard.writeText(safeJsonStringify(props.data))
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

    const rootNode = inspectObjectTree(props.data, {
      name: props.name,
      sortKeys,
      isExpanded,
    })
    const visibleItems: FlatTreeItem[] = []
    flattenVisibleNodes(rootNode, null, visibleItems)
    const activePath = visibleItems.some((item) => item.path === focusedPath)
      ? focusedPath
      : (visibleItems[0]?.path ?? '$')

    function onTreeKeyDown(event: KeyboardEvent) {
      const idx = visibleItems.findIndex((item) => item.path === activePath)
      if (idx < 0) return
      const current = visibleItems[idx]!

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const next = visibleItems[Math.min(visibleItems.length - 1, idx + 1)]
        if (next) focusItem(next.path)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        const prev = visibleItems[Math.max(0, idx - 1)]
        if (prev) focusItem(prev.path)
      } else if (event.key === 'Home') {
        event.preventDefault()
        const first = visibleItems[0]
        if (first) focusItem(first.path)
      } else if (event.key === 'End') {
        event.preventDefault()
        const last = visibleItems[visibleItems.length - 1]
        if (last) focusItem(last.path)
      } else if (event.key === 'ArrowRight') {
        if (!current.canExpand) return
        event.preventDefault()
        if (!current.expanded) {
          setExpanded(current.path, true)
        } else {
          const firstChild = visibleItems[idx + 1]
          if (firstChild && firstChild.parentPath === current.path) {
            focusItem(firstChild.path)
          }
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        if (current.canExpand && current.expanded) {
          setExpanded(current.path, false)
        } else if (current.parentPath) {
          focusItem(current.parentPath)
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (!current.canExpand) return
        event.preventDefault()
        toggle(current.path, current.depth)
      }
    }

    function renderNode(node: ObjectTreeNode): RemixNode {
      const tabIdx = node.path === activePath ? 0 : -1

      if (node.kind === 'primitive') {
        return (
          <li
            key={node.path}
            class="rf-obj-row"
            role="treeitem"
            data-path={node.path}
            tabIndex={tabIdx}
            aria-selected="false"
            mix={on('focus', () => {
              if (focusedPath !== node.path) {
                focusedPath = node.path
                void handle.update()
              }
            })}
          >
            <span class="rf-obj-spacer" aria-hidden="true" />
            {node.key !== undefined && (
              <>
                <span class="rf-obj-key">{node.key}</span>
                <span class="rf-obj-colon" aria-hidden="true">
                  :
                </span>
              </>
            )}
            {renderPrimitive(node.value)}
          </li>
        )
      }

      if (node.kind === 'circular') {
        return (
          <li
            key={node.path}
            class="rf-obj-row"
            role="treeitem"
            data-path={node.path}
            tabIndex={tabIdx}
            aria-selected="false"
            mix={on('focus', () => {
              if (focusedPath !== node.path) {
                focusedPath = node.path
                void handle.update()
              }
            })}
          >
            <span class="rf-obj-spacer" aria-hidden="true" />
            {node.key !== undefined && (
              <>
                <span class="rf-obj-key">{node.key}</span>
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

      return (
        <li
          key={node.path}
          class="rf-obj-branch"
          role="treeitem"
          data-path={node.path}
          tabIndex={tabIdx}
          aria-expanded={node.canExpand ? node.expanded : undefined}
          aria-selected="false"
          data-open={node.expanded ? 'true' : undefined}
          mix={on('focus', (event) => {
            if (event.target === event.currentTarget && focusedPath !== node.path) {
              focusedPath = node.path
              void handle.update()
            }
          })}
        >
          <div class="rf-obj-row">
            {node.canExpand ? (
              <button
                type="button"
                class="rf-obj-toggle"
                tabIndex={-1}
                aria-label={`${node.expanded ? 'Collapse' : 'Expand'} ${node.key ?? 'root'}`}
                mix={on('click', () => toggle(node.path, node.depth))}
              >
                <span class="rf-obj-chevron" aria-hidden="true">
                  <Icon name="chevron-right" size={12} />
                </span>
                {node.key !== undefined && (
                  <>
                    <span class="rf-obj-key">{node.key}</span>
                    <span class="rf-obj-colon" aria-hidden="true">
                      :
                    </span>
                  </>
                )}
                <span class="rf-obj-summary">{node.summary}</span>
              </button>
            ) : (
              <>
                <span class="rf-obj-spacer" aria-hidden="true" />
                {node.key !== undefined && (
                  <>
                    <span class="rf-obj-key">{node.key}</span>
                    <span class="rf-obj-colon" aria-hidden="true">
                      :
                    </span>
                  </>
                )}
                <span class="rf-obj-summary">{node.summary}</span>
              </>
            )}
          </div>
          {node.expanded && (
            <ul class="rf-obj-children" role="group">
              {node.children.map((child) => renderNode(child))}
            </ul>
          )}
        </li>
      )
    }

    return (
      <div class={classList('rf-object-inspector', props.class)} data-size={props.size}>
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
        <ul
          class="rf-obj-tree"
          role="tree"
          aria-label={props.label ?? 'Object inspector'}
          mix={[mountTree, on<HTMLUListElement, 'keydown'>('keydown', onTreeKeyDown)]}
        >
          {renderNode(rootNode)}
        </ul>
      </div>
    )
  }
}
