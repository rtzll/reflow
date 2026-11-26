import { on, type Handle } from 'remix/component'
import { Icon } from './icon.tsx'
import { Popover } from './popover.tsx'
import { SegmentedControl } from './segmented-control.tsx'
import { Select } from './select.tsx'
import { Switch } from './switch.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface ViewOptionChoice {
  value: string
  label: string
}

export interface ViewPropertyToggle {
  id: string
  label: string
  visible: boolean
}

export interface ViewOptionsPopoverProps {
  /** Active layout mode (e.g. `'list'`, `'board'`, `'roadmap'`). */
  layout?: string
  /** Available layout choices rendered in a SegmentedControl. */
  layouts?: readonly ViewOptionChoice[]
  /** Called when layout changes. */
  onLayoutChange?: (layout: string) => void
  /** Active grouping axis (e.g. `'status'`, `'priority'`, `'assignee'`). */
  groupBy?: string
  /** Available grouping options. */
  groupByOptions?: readonly ViewOptionChoice[]
  /** Called when grouping changes. */
  onGroupByChange?: (value: string) => void
  /** Active sort order (e.g. `'manual'`, `'priority'`, `'updated'`). */
  orderBy?: string
  /** Available sort options. */
  orderByOptions?: readonly ViewOptionChoice[]
  /** Called when sort order changes. */
  onOrderByChange?: (value: string) => void
  /** Toggleable display properties (Priority, Assignee, Labels, Estimate, etc.). */
  properties?: readonly ViewPropertyToggle[]
  /** Called when a display property pill is toggled. */
  onToggleProperty?: (id: string, visible: boolean) => void
  /** Whether empty columns/groups stay visible. */
  showEmptyGroups?: boolean
  /** Called when the show-empty-groups switch changes. */
  onShowEmptyGroupsChange?: (show: boolean) => void
  /** Trigger button label. Default `'Display'`. */
  triggerLabel?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

/**
 * Linear-style "Display" view configuration popover combining layout switcher,
 * Grouping / Ordering selectors, empty-group toggle, and property visibility pills.
 */
export function ViewOptionsPopover(handle: Handle<ViewOptionsPopoverProps>) {
  return () => {
    const props = handle.props
    const triggerLabel = props.triggerLabel ?? 'Display'

    return (
      <span class={classList('rf-view-options', props.class)} data-size={props.size}>
        <Popover
          label="Display options"
          placement="bottom-end"
          triggerVariant="secondary"
          triggerSize={props.size ?? 'compact'}
          trigger={
            <span class="rf-view-options-trigger-inner">
              <Icon name="settings" size={13} />
              <span>{triggerLabel}</span>
            </span>
          }
        >
          <div class="rf-view-options-panel">
            {props.layouts && props.layouts.length > 0 && (
              <div class="rf-view-options-section">
                <SegmentedControl
                  label="Layout"
                  size="compact"
                  value={props.layout ?? props.layouts[0]?.value}
                  options={props.layouts.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  onValueChange={(value) => props.onLayoutChange?.(value)}
                />
              </div>
            )}

            {props.groupByOptions && props.groupByOptions.length > 0 && (
              <div class="rf-view-options-row">
                <span class="rf-view-options-key">Grouping</span>
                <Select
                  label="Grouping"
                  size="compact"
                  value={props.groupBy ?? props.groupByOptions[0]?.value}
                  options={props.groupByOptions.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  onValueChange={(value) => {
                    if (value) props.onGroupByChange?.(value)
                  }}
                />
              </div>
            )}

            {props.orderByOptions && props.orderByOptions.length > 0 && (
              <div class="rf-view-options-row">
                <span class="rf-view-options-key">Ordering</span>
                <Select
                  label="Ordering"
                  size="compact"
                  value={props.orderBy ?? props.orderByOptions[0]?.value}
                  options={props.orderByOptions.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  onValueChange={(value) => {
                    if (value) props.onOrderByChange?.(value)
                  }}
                />
              </div>
            )}

            {props.onShowEmptyGroupsChange && (
              <div class="rf-view-options-row">
                <span class="rf-view-options-key">Show empty groups</span>
                <Switch
                  label="Show empty groups"
                  size="compact"
                  checked={Boolean(props.showEmptyGroups)}
                  onCheckedChange={(checked) => props.onShowEmptyGroupsChange?.(checked)}
                />
              </div>
            )}

            {props.properties && props.properties.length > 0 && (
              <div class="rf-view-options-props">
                <span class="rf-view-options-key">Display properties</span>
                <div class="rf-view-options-pills" role="group" aria-label="Display properties">
                  {props.properties.map((prop) => (
                    <button
                      key={prop.id}
                      type="button"
                      class="rf-view-options-pill"
                      data-active={prop.visible ? 'true' : undefined}
                      aria-pressed={prop.visible ? 'true' : 'false'}
                      mix={on('click', () => props.onToggleProperty?.(prop.id, !prop.visible))}
                    >
                      {prop.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Popover>
      </span>
    )
  }
}
