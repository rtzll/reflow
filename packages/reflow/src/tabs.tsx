import { fluidHover } from './systems/fluid-hover.ts'
import { on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import * as tabs from '@remix-run/ui/tabs'
import { navigationIndex } from './behaviors/list-navigation.ts'

export interface TabItem {
  value: string
  label: string
  panel?: RemixNode
  icon?: RemixNode
  disabled?: boolean
}

export interface TabsProps {
  label: string
  items: readonly TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  variant?: 'pill' | 'underline'
  activeLabel?: boolean
  size?: 'default' | 'compact'
}

export function Tabs(handle: Handle<TabsProps>) {
  const indicators = fluidHover({
    axis: 'x',
    selectedSelector: '[aria-selected="true"]',
    fastHover: true,
  })
  return () => {
    const {
      label,
      items,
      defaultValue,
      value,
      onValueChange,
      variant = 'pill',
      activeLabel,
      size,
    } = handle.props
    const initial = items.find((item) => item.value === defaultValue && !item.disabled)?.value

    return (
      <tabs.Context activeTab={value} defaultActiveTab={initial} onActiveTabChange={onValueChange}>
        <div class="rf-tabs" data-variant={variant} data-density={size} mix={tabs.root()}>
          <div
            class="rf-tabs-list"
            aria-label={label}
            mix={[
              tabs.list(),
              indicators,
              on(
                'keydown',
                (event) => {
                  const enabled = Array.from(
                    event.currentTarget.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]:not(:disabled)',
                    ),
                  )
                  const index = enabled.indexOf(event.target as HTMLButtonElement)
                  if (index < 0) return
                  const next = navigationIndex(event.key, index, enabled.length)
                  if (next === undefined) return
                  event.preventDefault()
                  event.stopPropagation()
                  enabled[next]?.focus()
                },
                true,
              ),
            ]}
          >
            <span
              class="rf-highlight rf-tab-selection"
              aria-hidden="true"
              data-rf-selection-layer
            />
            <span class="rf-highlight rf-tab-hover" aria-hidden="true" data-rf-hover-layer />
            <span class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
            {items.map((item) => (
              <button
                key={item.value}
                class="rf-tab"
                type="button"
                aria-label={item.label}
                data-rf-hover-item
                data-active-label={activeLabel && item.icon != null ? '' : undefined}
                mix={tabs.tab({ name: item.value, disabled: item.disabled })}
              >
                {item.icon != null && (
                  <span class="rf-tab-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span class="rf-tab-label" data-label={item.label}>
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </div>
          {items.map((item) => (
            <div
              key={item.value}
              class="rf-tab-panel"
              tabIndex={item.panel != null ? 0 : undefined}
              mix={tabs.panel({ name: item.value })}
            >
              {item.panel}
            </div>
          ))}
        </div>
      </tabs.Context>
    )
  }
}
