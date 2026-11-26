import type { Handle } from 'remix/component'
import { Dropdown, type DropdownItem } from './dropdown.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface EstimateOption {
  value: string | number
  label: string
  hint?: string
}

export interface EstimatePillProps {
  /** Current estimate value (e.g. `3`, `'M'`, or `null` when unestimated). */
  value?: string | number | null
  /** Choices offered in the picker. Defaults to Fibonacci points (`1, 2, 3, 5, 8`). */
  options?: readonly EstimateOption[]
  /** Called when the user selects or clears an estimate. */
  onChange?: (value: string | number | null) => void
  /** Unit suffix shown beside numeric values (e.g. `'pts'`, `'h'`). Default `'pts'`. */
  unit?: string
  /** Renders a static non-interactive pill when true. Default `false`. */
  readonly?: boolean
  /** Accessible name. Default `'Estimate'`. */
  label?: string
  /** Controls pill padding and font scale. */
  size?: ControlSize
  class?: string
}

const defaultOptions: readonly EstimateOption[] = [
  { value: 1, label: '1 pt', hint: 'Trivial' },
  { value: 2, label: '2 pts', hint: 'Small' },
  { value: 3, label: '3 pts', hint: 'Medium' },
  { value: 5, label: '5 pts', hint: 'Large' },
  { value: 8, label: '8 pts', hint: 'XL' },
]

function formatEstimate(value: string | number | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === '') return 'No estimate'
  if (typeof value === 'number') return `${value} ${unit}`
  return value
}

/**
 * Compact effort/points selector pill (Fibonacci points, T-shirt sizes, or
 * hours) for issue rows, board cards, and quick-create bars.
 */
export function EstimatePill(handle: Handle<EstimatePillProps>) {
  return () => {
    const props = handle.props
    const unit = props.unit ?? 'pts'
    const options = props.options ?? defaultOptions
    const text = formatEstimate(props.value, unit)
    const unset = props.value === null || props.value === undefined || props.value === ''

    if (props.readonly || !props.onChange) {
      return (
        <span
          class={classList('rf-estimate-pill', props.class)}
          data-size={props.size}
          data-unset={unset ? 'true' : undefined}
          aria-label={`${props.label ?? 'Estimate'}: ${text}`}
        >
          {text}
        </span>
      )
    }

    const items: DropdownItem[] = [
      {
        value: '__clear__',
        label: 'No estimate',
        type: 'radio',
        checked: unset,
        closeOnSelect: true,
      },
      ...options.map((opt) => ({
        value: String(opt.value),
        label: opt.label,
        hint: opt.hint,
        type: 'radio' as const,
        checked: !unset && String(props.value) === String(opt.value),
        closeOnSelect: true,
      })),
    ]

    return (
      <span
        class={classList('rf-estimate-pill-wrap', props.class)}
        data-size={props.size}
        data-unset={unset ? 'true' : undefined}
      >
        <Dropdown
          label={`${props.label ?? 'Estimate'}: ${text}`}
          variant="bare"
          chevron={false}
          items={items}
          triggerClass="rf-estimate-pill-trigger"
          triggerContent={<span>{text}</span>}
          onSelect={(raw) => {
            if (raw === '__clear__') {
              props.onChange?.(null)
              return
            }
            const match = options.find((opt) => String(opt.value) === raw)
            props.onChange?.(match ? match.value : raw)
          }}
        />
      </span>
    )
  }
}
