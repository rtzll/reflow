import { on, ref, type Handle } from 'remix/component'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { fluidHover } from './systems/fluid-hover.ts'
import { classList, type ControlSize } from './systems/styling.ts'

export interface SavedView {
  id: string
  label: string
  count?: number
  /** Marks the active view as having unsaved filter/display changes. */
  dirty?: boolean
}

export interface SavedViewTabsProps {
  /** Saved view tabs in display order. */
  views: readonly SavedView[]
  /** Active view ID. */
  activeId: string
  /** Called when a tab is selected. */
  onSelect?: (id: string) => void
  /** Called when the user clicks `+ New view`. */
  onCreate?: () => void
  /** Called when the user commits an inline double-click rename on the active view. */
  onRename?: (id: string, name: string) => void
  /** Called when the user saves changes on a dirty view. */
  onSave?: (id: string) => void
  /** Called when the user resets unsaved changes on a dirty view. */
  onReset?: (id: string) => void
  /** Accessible label for the tablist. Default `'Saved views'`. */
  label?: string
  /** Controls tab padding and font scale. */
  size?: ControlSize
  class?: string
}

/**
 * Linear-style horizontal saved view bar with fluid hover, roving keyboard
 * navigation, inline rename, dirty-state Save/Reset controls, and `+ New view`.
 */
export function SavedViewTabs(handle: Handle<SavedViewTabsProps>) {
  const hover = fluidHover({ highlightedSelector: '[data-active="true"]' })
  let listEl: HTMLDivElement | null = null
  let editingId: string | null = null
  let draft = ''

  const listRef = ref<HTMLDivElement>((node) => {
    listEl = node
  })

  function focusTab(index: number) {
    const tabs = listEl?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    if (!tabs || tabs.length === 0) return
    const clamped = Math.max(0, Math.min(tabs.length - 1, index))
    tabs[clamped]?.focus()
  }

  function commitRename() {
    if (!editingId) return
    const trimmed = draft.trim()
    const targetId = editingId
    editingId = null
    void handle.update()
    if (trimmed) handle.props.onRename?.(targetId, trimmed)
  }

  return () => {
    const props = handle.props
    const activeView = props.views.find((v) => v.id === props.activeId)

    return (
      <div class={classList('rf-saved-view-tabs', props.class)} data-size={props.size}>
        <div
          class="rf-saved-view-tabs-list"
          role="tablist"
          aria-label={props.label ?? 'Saved views'}
          mix={[listRef, hover]}
        >
          <span class="rf-saved-view-tabs-hover" data-rf-hover-layer aria-hidden="true" />
          {props.views.map((view, index) => {
            const active = view.id === props.activeId
            if (editingId === view.id) {
              return (
                <input
                  key={view.id}
                  type="text"
                  class="rf-saved-view-tabs-rename"
                  aria-label="Rename view"
                  value={draft}
                  mix={[
                    on('input', (event) => {
                      const target = event.currentTarget
                      draft = target instanceof HTMLInputElement ? target.value : ''
                      void handle.update()
                    }),
                    on('keydown', (event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitRename()
                      } else if (event.key === 'Escape') {
                        event.preventDefault()
                        editingId = null
                        void handle.update()
                      }
                    }),
                    on('blur', commitRename),
                  ]}
                />
              )
            }

            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                class="rf-saved-view-tab"
                data-rf-hover-item
                data-active={active ? 'true' : undefined}
                aria-selected={active ? 'true' : 'false'}
                tabIndex={active ? 0 : -1}
                mix={[
                  on('click', () => props.onSelect?.(view.id)),
                  on('dblclick', () => {
                    if (!props.onRename) return
                    editingId = view.id
                    draft = view.label
                    void handle.update()
                  }),
                  on('keydown', (event) => {
                    if (event.key === 'ArrowRight') {
                      event.preventDefault()
                      const next = (index + 1) % props.views.length
                      focusTab(next)
                      props.onSelect?.(props.views[next]!.id)
                    } else if (event.key === 'ArrowLeft') {
                      event.preventDefault()
                      const prev = (index - 1 + props.views.length) % props.views.length
                      focusTab(prev)
                      props.onSelect?.(props.views[prev]!.id)
                    } else if (event.key === 'Home') {
                      event.preventDefault()
                      focusTab(0)
                      props.onSelect?.(props.views[0]!.id)
                    } else if (event.key === 'End') {
                      event.preventDefault()
                      const last = props.views.length - 1
                      focusTab(last)
                      props.onSelect?.(props.views[last]!.id)
                    }
                  }),
                ]}
              >
                <span class="rf-saved-view-tab-label">{view.label}</span>
                {view.count !== undefined && (
                  <span class="rf-saved-view-tab-count">{view.count}</span>
                )}
                {view.dirty && (
                  <span class="rf-saved-view-tab-dirty" aria-label="Unsaved changes" />
                )}
              </button>
            )
          })}
        </div>

        <div class="rf-saved-view-tabs-actions">
          {activeView?.dirty && props.onSave && (
            <Button
              variant="primary"
              size="compact"
              mix={on('click', () => props.onSave?.(activeView.id))}
            >
              Save
            </Button>
          )}
          {activeView?.dirty && props.onReset && (
            <Button
              variant="ghost"
              size="compact"
              mix={on('click', () => props.onReset?.(activeView.id))}
            >
              Reset
            </Button>
          )}
          {props.onCreate && (
            <Button
              variant="ghost"
              size="compact"
              leadingIcon={<Icon name="plus" size={12} />}
              mix={on('click', () => props.onCreate?.())}
            >
              New view
            </Button>
          )}
        </div>
      </div>
    )
  }
}
