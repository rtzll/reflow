import { on, ref, type Handle, type RemixNode } from 'remix/component'
import type { ControlSize } from './basic.tsx'
import { Icon } from './icon.tsx'
import { fluidHover } from './systems/fluid-hover.ts'

export interface TreeItem {
  /** Unique across the tree. */
  value: string
  label: string
  icon?: RemixNode
  children?: readonly TreeItem[]
}

export interface TreeProps {
  label: string
  items: readonly TreeItem[]
  value?: string | null
  defaultValue?: string
  onValueChange?: (value: string) => void
  expanded?: readonly string[]
  defaultExpanded?: readonly string[]
  onExpandedChange?: (expanded: string[]) => void
  size?: ControlSize
}

interface VisibleItem {
  item: TreeItem
  parent?: string
}

export function Tree(handle: Handle<TreeProps>) {
  let selected = handle.props.defaultValue
  let expanded = [...(handle.props.defaultExpanded ?? [])]
  let active: string | undefined
  let root: HTMLUListElement | undefined
  let typeahead = ''
  let lastTyped = 0
  const hover = fluidHover({ fastHover: true })
  const capture = ref<HTMLUListElement>((element, signal) => {
    root = element
    signal.addEventListener(
      'abort',
      () => {
        root = undefined
      },
      { once: true },
    )
  })

  function focus(value: string) {
    active = value
    const element = [...(root?.querySelectorAll<HTMLElement>('[data-tree-value]') ?? [])].find(
      (item) => item.dataset.treeValue === value,
    )
    element?.focus()
    void handle.update()
  }

  function toggle(value: string) {
    const open = handle.props.expanded ?? expanded
    expanded = open.includes(value) ? open.filter((item) => item !== value) : [...open, value]
    handle.props.onExpandedChange?.(expanded)
    void handle.update()
  }

  function activate(item: TreeItem) {
    if (item.children?.length) {
      toggle(item.value)
    } else if ((handle.props.value === undefined ? selected : handle.props.value) !== item.value) {
      selected = item.value
      handle.props.onValueChange?.(item.value)
      void handle.update()
    }
  }

  return () => {
    const { label, items, value, size } = handle.props
    const open = new Set(handle.props.expanded ?? expanded)
    const current = value === undefined ? selected : value
    const visible: VisibleItem[] = []
    function collect(nodes: readonly TreeItem[], parent?: string) {
      for (const item of nodes) {
        visible.push({ item, parent })
        if (open.has(item.value) && item.children) collect(item.children, item.value)
      }
    }
    collect(items)
    const entry =
      visible.find(({ item }) => item.value === active) ??
      visible.find(({ item }) => item.value === current) ??
      visible[0]

    function handleKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !(event.target instanceof HTMLElement)
      )
        return
      const key = event.target.dataset.treeValue
      const index = visible.findIndex(({ item }) => item.value === key)
      const row = visible[index]
      if (!row) return
      const { item, parent } = row
      let target: string | undefined
      switch (event.key) {
        case 'ArrowDown':
          target = visible[index + 1]?.item.value
          break
        case 'ArrowUp':
          target = visible[index - 1]?.item.value
          break
        case 'Home':
          target = visible[0]?.item.value
          break
        case 'End':
          target = visible.at(-1)?.item.value
          break
        case 'ArrowRight':
          if (item.children?.length) {
            if (open.has(item.value)) target = item.children[0].value
            else toggle(item.value)
          }
          break
        case 'ArrowLeft':
          if (item.children?.length && open.has(item.value)) toggle(item.value)
          else target = parent
          break
        case 'Enter':
        case ' ':
          activate(item)
          break
        default: {
          if (event.key.length !== 1) return
          const char = event.key.toLocaleLowerCase()
          const now = Date.now()
          typeahead = now - lastTyped < 500 ? typeahead + char : char
          lastTyped = now
          const repeated = [...typeahead].every((letter) => letter === char)
          const query = repeated ? char : typeahead
          const start = repeated ? index + 1 : index
          const ordered = [...visible.slice(start), ...visible.slice(0, start)]
          target = ordered.find(({ item }) => item.label.toLocaleLowerCase().startsWith(query))
            ?.item.value
        }
      }
      event.preventDefault()
      if (target !== undefined) focus(target)
    }

    function renderItems(nodes: readonly TreeItem[], level: number): RemixNode {
      return nodes.map((item) => {
        const branch = !!item.children?.length
        const isOpen = branch && open.has(item.value)
        return (
          <li
            key={item.value}
            role="treeitem"
            aria-label={item.label}
            aria-expanded={branch ? isOpen : undefined}
            aria-selected={branch ? undefined : current === item.value}
            tabIndex={entry?.item.value === item.value ? 0 : -1}
            data-tree-value={item.value}
            mix={on('focus', () => {
              if (active === item.value) return
              active = item.value
              void handle.update()
            })}
          >
            <div
              class="rf-tree-row"
              data-rf-hover-item
              data-branch={branch || undefined}
              data-expanded={isOpen || undefined}
              style={{ '--rf-tree-level': level }}
              mix={on('click', () => {
                focus(item.value)
                activate(item)
              })}
            >
              <span class="rf-tree-disclosure" aria-hidden="true">
                {branch && <Icon name="chevron-right" />}
              </span>
              {item.icon ?? <Icon name={branch ? 'folder' : 'file'} />}
              <span class="rf-tree-label" title={item.label}>
                {item.label}
              </span>
            </div>
            {isOpen && <ul role="group">{renderItems(item.children!, level + 1)}</ul>}
          </li>
        )
      })
    }

    return (
      <ul
        role="tree"
        aria-label={label}
        class="rf-tree"
        data-size={size}
        mix={[capture, hover, on<HTMLUListElement, 'keydown'>('keydown', handleKey)]}
      >
        <li
          role="presentation"
          class="rf-highlight rf-tree-hover"
          data-rf-hover-layer
          aria-hidden="true"
        />
        {renderItems(items, 0)}
      </ul>
    )
  }
}
