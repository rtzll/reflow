import { on, ref, type Handle } from 'remix/component'
import { classList, type ControlSize } from './systems/styling.ts'

export type StatusStripState = 'passed' | 'failed' | 'running' | 'warning' | 'cancelled' | 'skipped'

export interface StatusStripItem {
  id: string
  status: StatusStripState
  /** Accessible label describing this run or interval (e.g. `'Run #4578 · passed · 4m 12s'`). */
  label: string
  /** Optional positive numeric magnitude (e.g. duration in ms) used to scale bar height. */
  value?: number
  /** Optional compact detail string surfaced in the hover/selection readout. */
  detail?: string
}

export interface StatusStripProps {
  /** Accessible name for the status strip. */
  label: string
  /** Chronological status bars (oldest to newest). */
  items: readonly StatusStripItem[]
  /** Controlled selected item ID. */
  value?: string | null
  /** Initial selected item ID when uncontrolled. */
  defaultValue?: string
  /** Called when a bar is clicked or activated via keyboard. */
  onValueChange?: (id: string) => void
  /** Scales bar height proportionally to `item.value` when provided. Default `true`. */
  scaleHeight?: boolean
  /** Shows a quiet readout caption for the hovered or selected bar. Default `false`. */
  showReadout?: boolean
  /** Strip height in pixels. Default `24` (`18` when compact). */
  height?: number
  /** Controls bar sizing and spacing. */
  size?: ControlSize
  class?: string
}

/**
 * Compact run-history status strip showing recent CI runs, deployments, or
 * uptime intervals as duration-scaled, status-colored bars.
 */
export function StatusStrip(handle: Handle<StatusStripProps>) {
  let internalSelected = handle.props.defaultValue ?? null
  let hoveredId: string | null = null
  let rootNode: HTMLDivElement | undefined

  const mountRoot = ref<HTMLDivElement>((node, signal) => {
    rootNode = node
    signal.addEventListener(
      'abort',
      () => {
        rootNode = undefined
      },
      { once: true },
    )
  })

  function focusIndex(index: number) {
    const buttons = rootNode?.querySelectorAll<HTMLButtonElement>('[data-strip-id]')
    buttons?.[index]?.focus()
  }

  return () => {
    const props = handle.props
    const {
      label,
      items,
      value,
      scaleHeight = true,
      showReadout = false,
      height,
      size,
      class: classProp,
    } = props

    const current = value !== undefined ? value : internalSelected
    const maxVal = Math.max(
      1,
      ...items.map((item) => (item.value !== undefined && item.value > 0 ? item.value : 0)),
    )
    const hasValues =
      scaleHeight && items.some((item) => item.value !== undefined && item.value > 0)
    const stripHeight = height ?? (size === 'compact' ? 18 : 24)
    const activeItem =
      items.find((item) => item.id === hoveredId) ??
      items.find((item) => item.id === current) ??
      items[items.length - 1]

    function select(id: string) {
      if (value === undefined) internalSelected = id
      props.onValueChange?.(id)
      void handle.update()
    }

    return (
      <div
        class={classList('rf-status-strip', classProp)}
        data-density={size === 'compact' ? 'compact' : undefined}
        mix={mountRoot}
      >
        <div
          class="rf-status-strip-bars"
          role="listbox"
          aria-label={label}
          aria-orientation="horizontal"
          style={{ blockSize: `${stripHeight}px` }}
        >
          {items.map((item, index) => {
            const isSelected = current === item.id
            const ratio =
              hasValues && item.value !== undefined
                ? Math.max(0.28, Math.min(1, item.value / maxVal))
                : 1
            const tabIndex =
              current && items.some((entry) => entry.id === current)
                ? isSelected
                  ? 0
                  : -1
                : index === items.length - 1
                  ? 0
                  : -1

            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={item.label}
                title={item.detail ? `${item.label} — ${item.detail}` : item.label}
                tabIndex={tabIndex}
                class="rf-status-strip-bar"
                data-strip-id={item.id}
                data-status={item.status}
                data-selected={isSelected ? 'true' : undefined}
                mix={[
                  on('click', () => select(item.id)),
                  on('pointerenter', () => {
                    hoveredId = item.id
                    if (showReadout) void handle.update()
                  }),
                  on('pointerleave', () => {
                    if (hoveredId === item.id) {
                      hoveredId = null
                      if (showReadout) void handle.update()
                    }
                  }),
                  on('focus', () => {
                    hoveredId = item.id
                    if (showReadout) void handle.update()
                  }),
                  on('blur', () => {
                    if (hoveredId === item.id) {
                      hoveredId = null
                      if (showReadout) void handle.update()
                    }
                  }),
                  on('keydown', (event) => {
                    if (event.key === 'ArrowRight') {
                      event.preventDefault()
                      focusIndex(Math.min(items.length - 1, index + 1))
                    } else if (event.key === 'ArrowLeft') {
                      event.preventDefault()
                      focusIndex(Math.max(0, index - 1))
                    } else if (event.key === 'Home') {
                      event.preventDefault()
                      focusIndex(0)
                    } else if (event.key === 'End') {
                      event.preventDefault()
                      focusIndex(items.length - 1)
                    }
                  }),
                ]}
              >
                <span
                  class="rf-status-strip-fill"
                  data-status={item.status}
                  style={{ blockSize: `${Math.round(ratio * 100)}%` }}
                />
              </button>
            )
          })}
        </div>

        {showReadout && activeItem && (
          <div class="rf-status-strip-readout">
            <span class="rf-status-strip-readout-label">{activeItem.label}</span>
            {activeItem.detail && (
              <span class="rf-status-strip-readout-detail">{activeItem.detail}</span>
            )}
          </div>
        )}
      </div>
    )
  }
}
