import { on, type Handle, type RemixNode } from 'remix/component'
import { classList } from './systems/styling.ts'

export interface ResizableProps {
  label: string
  first: RemixNode
  second: RemixNode
  /** Horizontal puts the panes side by side. */
  orientation?: 'horizontal' | 'vertical'
  /** Size of the first pane, as a percentage of the available space. */
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number) => void
  onValueCommit?: (value: number) => void
  class?: string
}

export function Resizable(handle: Handle<ResizableProps>) {
  let size = handle.props.defaultValue ?? 50
  let drag:
    | { id: number; start: number; size: number; span: number; axis: 'x' | 'y'; direction: number }
    | undefined
  const panelId = handle.id + '-first'

  function limits() {
    const min = Number.isFinite(handle.props.min)
      ? Math.max(0, Math.min(100, handle.props.min!))
      : 15
    const max = Number.isFinite(handle.props.max)
      ? Math.max(min, Math.min(100, handle.props.max!))
      : Math.max(min, 85)
    return { min, max }
  }

  function bound(value: number) {
    const { min, max } = limits()
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 50))
  }

  function current() {
    return bound(handle.props.value ?? size)
  }

  function change(value: number, commit = false) {
    const next = bound(value)
    if (next === current()) return
    size = next
    handle.props.onValueChange?.(next)
    if (commit) handle.props.onValueCommit?.(next)
    void handle.update()
  }

  function position(event: PointerEvent, axis: 'x' | 'y') {
    return axis === 'x' ? event.clientX : event.clientY
  }

  return () => {
    const props = handle.props
    const vertical = props.orientation === 'vertical'
    const { min, max } = limits()
    const step = props.step && Number.isFinite(props.step) && props.step > 0 ? props.step : 5
    return (
      <div
        class={['rf-resizable', props.class].filter(Boolean).join(' ')}
        data-orientation={vertical ? 'vertical' : 'horizontal'}
        data-resizing={Boolean(drag) || undefined}
        style={{
          '--rf-resizable-first': `${current()}fr`,
          '--rf-resizable-second': `${100 - current()}fr`,
        }}
      >
        <div class="rf-resizable-pane" id={panelId} inert={current() === 0 || undefined}>
          {props.first}
        </div>
        <div
          class="rf-resizable-grip"
          role="separator"
          tabIndex={0}
          aria-label={props.label}
          aria-controls={panelId}
          aria-orientation={vertical ? 'horizontal' : 'vertical'}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Math.round(current() * 10) / 10}
          mix={[
            on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
              if (!event.isPrimary || event.button !== 0) return
              const grip = event.currentTarget
              const root = grip.parentElement!
              const span = vertical
                ? root.clientHeight - grip.offsetHeight
                : root.clientWidth - grip.offsetWidth
              if (span <= 0) return
              event.preventDefault()
              grip.focus({ preventScroll: true })
              const axis = vertical ? 'y' : 'x'
              const direction = !vertical && getComputedStyle(root).direction === 'rtl' ? -1 : 1
              drag = {
                id: event.pointerId,
                start: position(event, axis),
                size: current(),
                span,
                axis,
                direction,
              }
              grip.setPointerCapture(event.pointerId)
              void handle.update()
            }),
            on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
              if (!drag || drag.id !== event.pointerId) return
              const delta =
                ((position(event, drag.axis) - drag.start) / drag.span) * 100 * drag.direction
              change(drag.size + delta)
            }),
            on<HTMLDivElement, 'pointerup'>('pointerup', (event) => {
              if (!drag || drag.id !== event.pointerId || drag.size === current()) return
              handle.props.onValueCommit?.(current())
            }),
            on<HTMLDivElement, 'lostpointercapture'>('lostpointercapture', (event) => {
              if (drag?.id !== event.pointerId) return
              drag = undefined
              void handle.update()
            }),
            on<HTMLDivElement, 'keydown'>('keydown', (event) => {
              const rtl = !vertical && getComputedStyle(event.currentTarget).direction === 'rtl'
              const increase = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
              const decrease = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
              if (event.key === increase) change(current() + step, true)
              else if (event.key === decrease) change(current() - step, true)
              else if (event.key === 'Home') change(min, true)
              else if (event.key === 'End') change(max, true)
              else return
              event.preventDefault()
            }),
          ]}
        />
        <div class="rf-resizable-pane" inert={current() === 100 || undefined}>
          {props.second}
        </div>
      </div>
    )
  }
}

export interface ResizablePane {
  id: string
  /** Accessible name for the pane (used on its collapse/resize separator). */
  label?: string
  content: RemixNode
  /** Initial percentage width/height. Remaining space is distributed across panes without a defaultSize. */
  defaultSize?: number
  /** Minimum percentage when expanded. Default `10`. */
  min?: number
  /** Maximum percentage when expanded. Default `85`. */
  max?: number
  /** Allows collapsing this pane to 0% via separator double-click or Enter. */
  collapsible?: boolean
  /** Starts collapsed when `collapsible` is true. */
  defaultCollapsed?: boolean
}

export interface ResizableGroupProps {
  /** Accessible label prefix for separators. */
  label: string
  /** Two or more ordered panes (e.g. FileTree | DiffView | Review Inspector). */
  panes: readonly ResizablePane[]
  /** Horizontal lays panes side by side. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical'
  /** Controlled pane sizes (percentages summing to 100). */
  values?: readonly number[]
  /** Called while dragging or nudging any separator. */
  onValuesChange?: (values: readonly number[]) => void
  /** Called on pointer release or keyboard commit. */
  onValuesCommit?: (values: readonly number[]) => void
  /** Controlled collapsed pane IDs. */
  collapsed?: readonly string[]
  /** Called when a collapsible pane toggles collapsed state. */
  onCollapsedChange?: (collapsed: readonly string[]) => void
  /** Keyboard step percentage. Default `5`. */
  step?: number
  class?: string
}

function initialPaneSizes(panes: readonly ResizablePane[]): number[] {
  if (panes.length === 0) return []
  const explicit = panes.map((p) =>
    p.defaultCollapsed && p.collapsible
      ? 0
      : p.defaultSize !== undefined && Number.isFinite(p.defaultSize)
        ? Math.max(0, p.defaultSize)
        : null,
  )
  const used = explicit.reduce<number>((sum, val) => sum + (val ?? 0), 0)
  const unspecified = explicit.filter((v) => v === null).length
  const fallback = unspecified > 0 ? Math.max(0, 100 - used) / unspecified : 0
  const raw = explicit.map((v) => v ?? fallback)
  const total = raw.reduce((sum, v) => sum + v, 0)
  if (total <= 0) return panes.map(() => 100 / panes.length)
  return raw.map((v) => (v / total) * 100)
}

/**
 * Multi-pane resizable workspace layout supporting 3+ panes (such as FileTree |
 * DiffView | Review Inspector) with collapsible side panels that remember their
 * restored size.
 */
export function ResizableGroup(handle: Handle<ResizableGroupProps>) {
  let sizes = initialPaneSizes(handle.props.panes)
  const savedSizes = new Map<string, number>()
  let uncontrolledCollapsed = new Set<string>(
    handle.props.panes.filter((p) => p.collapsible && p.defaultCollapsed).map((p) => p.id),
  )
  let drag:
    | {
        index: number
        id: number
        start: number
        startSizes: readonly number[]
        span: number
        axis: 'x' | 'y'
        direction: number
      }
    | undefined

  function currentCollapsed(): ReadonlySet<string> {
    return handle.props.collapsed ? new Set(handle.props.collapsed) : uncontrolledCollapsed
  }

  function currentSizes(): number[] {
    if (handle.props.values && handle.props.values.length === handle.props.panes.length) {
      return [...handle.props.values]
    }
    if (sizes.length !== handle.props.panes.length) {
      sizes = initialPaneSizes(handle.props.panes)
    }
    return [...sizes]
  }

  function commitSizes(next: number[], commit: boolean) {
    sizes = next
    handle.props.onValuesChange?.(next)
    if (commit) handle.props.onValuesCommit?.(next)
    void handle.update()
  }

  function adjustPair(
    sepIndex: number,
    delta: number,
    baseSizes: readonly number[],
    commit: boolean,
  ) {
    const panes = handle.props.panes
    const a = panes[sepIndex]
    const b = panes[sepIndex + 1]
    if (!a || !b) return
    const next = [...baseSizes]
    const pairTotal = next[sepIndex]! + next[sepIndex + 1]!
    const minA = a.min ?? 10
    const maxA = a.max ?? 85
    const minB = b.min ?? 10
    const maxB = b.max ?? 85
    const lo = Math.max(minA, pairTotal - maxB)
    const hi = Math.min(maxA, pairTotal - minB)
    const clampedA = Math.max(lo, Math.min(hi, next[sepIndex]! + delta))
    next[sepIndex] = Number(clampedA.toFixed(2))
    next[sepIndex + 1] = Number((pairTotal - clampedA).toFixed(2))
    commitSizes(next, commit)
  }

  function toggleCollapse(sepIndex: number) {
    const panes = handle.props.panes
    const left = panes[sepIndex]
    const right = panes[sepIndex + 1]
    if (!left || !right) return
    const targetIdx = left.collapsible ? sepIndex : right.collapsible ? sepIndex + 1 : -1
    if (targetIdx < 0) return
    const neighborIdx = targetIdx === sepIndex ? sepIndex + 1 : sepIndex
    const target = panes[targetIdx]!

    const collapsedSet = new Set(currentCollapsed())
    const nextSizes = currentSizes()
    if (collapsedSet.has(target.id)) {
      collapsedSet.delete(target.id)
      const restore = Math.min(
        savedSizes.get(target.id) ?? target.defaultSize ?? 22,
        Math.max(target.min ?? 10, nextSizes[neighborIdx]! - (panes[neighborIdx]!.min ?? 10)),
      )
      nextSizes[targetIdx] = Number(restore.toFixed(2))
      nextSizes[neighborIdx] = Number(Math.max(0, nextSizes[neighborIdx]! - restore).toFixed(2))
    } else {
      collapsedSet.add(target.id)
      if (nextSizes[targetIdx]! > 0) savedSizes.set(target.id, nextSizes[targetIdx]!)
      nextSizes[neighborIdx] = Number((nextSizes[neighborIdx]! + nextSizes[targetIdx]!).toFixed(2))
      nextSizes[targetIdx] = 0
    }

    if (!handle.props.collapsed) uncontrolledCollapsed = collapsedSet
    handle.props.onCollapsedChange?.([...collapsedSet])
    commitSizes(nextSizes, true)
  }

  return () => {
    const props = handle.props
    const vertical = props.orientation === 'vertical'
    const step = props.step && Number.isFinite(props.step) && props.step > 0 ? props.step : 5
    const activeSizes = currentSizes()
    const collapsedSet = currentCollapsed()

    const tracks = props.panes
      .flatMap((pane, idx) => {
        const size = collapsedSet.has(pane.id) ? 0 : (activeSizes[idx] ?? 0)
        const track = size === 0 ? '0px' : `minmax(0, ${size}fr)`
        return idx < props.panes.length - 1 ? [track, 'var(--rf-resizable-grip-size)'] : [track]
      })
      .join(' ')

    return (
      <div
        class={classList('rf-resizable', 'rf-resizable-group', props.class)}
        data-orientation={vertical ? 'vertical' : 'horizontal'}
        data-resizing={Boolean(drag) || undefined}
        style={vertical ? { gridTemplateRows: tracks } : { gridTemplateColumns: tracks }}
      >
        {props.panes.map((pane, idx) => {
          const isCollapsed = collapsedSet.has(pane.id) || (activeSizes[idx] ?? 0) === 0
          const nextPane = props.panes[idx + 1]
          const canCollapse = Boolean(pane.collapsible || nextPane?.collapsible)
          return (
            <>
              <div
                key={`pane-${pane.id}`}
                class="rf-resizable-pane"
                id={`${handle.id}-pane-${pane.id}`}
                data-pane={pane.id}
                data-collapsed={isCollapsed ? 'true' : undefined}
                inert={isCollapsed || undefined}
              >
                {pane.content}
              </div>
              {nextPane && (
                <div
                  key={`sep-${pane.id}`}
                  class="rf-resizable-grip"
                  role="separator"
                  tabIndex={0}
                  aria-label={`${props.label}: ${pane.label ?? pane.id} / ${nextPane.label ?? nextPane.id}`}
                  aria-controls={`${handle.id}-pane-${pane.id}`}
                  aria-orientation={vertical ? 'horizontal' : 'vertical'}
                  aria-valuemin={pane.collapsible ? 0 : (pane.min ?? 10)}
                  aria-valuemax={pane.max ?? 85}
                  aria-valuenow={Math.round((activeSizes[idx] ?? 0) * 10) / 10}
                  mix={[
                    on<HTMLDivElement, 'dblclick'>('dblclick', () => {
                      if (canCollapse) toggleCollapse(idx)
                    }),
                    on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
                      if (!event.isPrimary || event.button !== 0) return
                      const grip = event.currentTarget
                      const root = grip.parentElement!
                      const gripTotal =
                        (props.panes.length - 1) * (vertical ? grip.offsetHeight : grip.offsetWidth)
                      const span = (vertical ? root.clientHeight : root.clientWidth) - gripTotal
                      if (span <= 0) return
                      event.preventDefault()
                      grip.focus({ preventScroll: true })
                      const axis = vertical ? 'y' : 'x'
                      const direction =
                        !vertical && getComputedStyle(root).direction === 'rtl' ? -1 : 1
                      drag = {
                        index: idx,
                        id: event.pointerId,
                        start: axis === 'x' ? event.clientX : event.clientY,
                        startSizes: currentSizes(),
                        span,
                        axis,
                        direction,
                      }
                      grip.setPointerCapture(event.pointerId)
                      void handle.update()
                    }),
                    on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
                      if (!drag || drag.id !== event.pointerId || drag.index !== idx) return
                      const pos = drag.axis === 'x' ? event.clientX : event.clientY
                      const delta = ((pos - drag.start) / drag.span) * 100 * drag.direction
                      adjustPair(idx, delta, drag.startSizes, false)
                    }),
                    on<HTMLDivElement, 'pointerup'>('pointerup', (event) => {
                      if (!drag || drag.id !== event.pointerId || drag.index !== idx) return
                      handle.props.onValuesCommit?.(currentSizes())
                    }),
                    on<HTMLDivElement, 'lostpointercapture'>('lostpointercapture', (event) => {
                      if (drag?.id !== event.pointerId) return
                      drag = undefined
                      void handle.update()
                    }),
                    on<HTMLDivElement, 'keydown'>('keydown', (event) => {
                      if (event.key === 'Enter' && canCollapse) {
                        event.preventDefault()
                        toggleCollapse(idx)
                        return
                      }
                      const rtl =
                        !vertical && getComputedStyle(event.currentTarget).direction === 'rtl'
                      const increase = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
                      const decrease = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
                      if (event.key === increase) adjustPair(idx, step, currentSizes(), true)
                      else if (event.key === decrease) adjustPair(idx, -step, currentSizes(), true)
                      else return
                      event.preventDefault()
                    }),
                  ]}
                />
              )}
            </>
          )
        })}
      </div>
    )
  }
}
