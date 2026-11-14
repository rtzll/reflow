import { on, type Handle, type MixInput, type RemixNode } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'
import { Tooltip } from './tooltip.tsx'

export interface SegmentedControlOption {
  value: string
  /** Names the segment; for an icon-only segment it is read out and shown in a Tooltip. */
  label: string
  icon?: RemixNode
  /** Shows only the icon. The label stays for screen readers and appears in a Tooltip on hover. */
  iconOnly?: boolean
  disabled?: boolean
}

export interface SegmentedControlProps {
  /** Names the group for assistive technology. */
  label: string
  options: readonly SegmentedControlOption[]
  /** The selected option in controlled mode. */
  value?: string
  /** The option selected first in uncontrolled mode. Defaults to the first enabled option. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Submits the selected value with a surrounding form. */
  name?: string
  disabled?: boolean
  size?: 'default' | 'compact'
  /** Stretches the control to its container, with equal-width segments. */
  fill?: boolean
}

/**
 * One choice from a short row of options, such as a view or a time range. A
 * segmented control is never empty: without a value, the first enabled option
 * is selected. Each segment is a native radio, so arrow keys move the
 * selection and the value takes part in forms. A raised thumb glides to the
 * selected segment and squeezes while a segment is pressed.
 */
export function SegmentedControl(handle: Handle<SegmentedControlProps>) {
  const indicators = fluidHover({
    axis: 'x',
    selectedSelector: ':has(input:checked)',
    focusSelector: ':has(input:focus-visible)',
  })
  return () => {
    const {
      label,
      options,
      value,
      defaultValue,
      onValueChange,
      name = handle.id,
      disabled,
      size,
      fill,
    } = handle.props
    const selectable = (candidate: string | undefined) =>
      options.some((option) => option.value === candidate && !option.disabled)
    const fallback = options.find((option) => !option.disabled)?.value
    const selected =
      value !== undefined
        ? selectable(value)
          ? value
          : fallback
        : selectable(defaultValue)
          ? defaultValue
          : fallback

    const segment = (option: SegmentedControlOption, mix?: MixInput) => (
      <label
        key={option.value}
        class="rf-segment"
        data-rf-hover-item
        data-icon-only={option.iconOnly && option.icon != null ? '' : undefined}
        aria-disabled={disabled || option.disabled || undefined}
        mix={mix}
      >
        <input
          type="radio"
          class="rf-segment-input"
          name={name}
          value={option.value}
          disabled={option.disabled}
          {...(value === undefined
            ? { defaultChecked: selected === option.value }
            : { checked: selected === option.value })}
          mix={
            onValueChange &&
            on<HTMLInputElement, 'change'>('change', (event) => {
              if (event.currentTarget.checked) onValueChange(option.value)
            })
          }
        />
        {option.icon != null && (
          <span class="rf-segment-icon" aria-hidden="true">
            {option.icon}
          </span>
        )}
        {option.iconOnly && option.icon != null ? (
          <span class="rf-basic-sr-only">{option.label}</span>
        ) : (
          <span class="rf-segment-text">
            <span class="rf-segment-sizer" aria-hidden="true">
              {option.label}
            </span>
            <span class="rf-segment-label">{option.label}</span>
          </span>
        )}
      </label>
    )

    return (
      <fieldset
        class="rf-segmented"
        data-density={size}
        data-fill={fill ? '' : undefined}
        disabled={disabled}
      >
        <legend class="rf-basic-sr-only">{label}</legend>
        <div class="rf-segmented-track" mix={indicators}>
          <span
            class="rf-highlight rf-segmented-thumb"
            aria-hidden="true"
            data-rf-selection-layer
          />
          <span class="rf-highlight rf-segmented-hover" aria-hidden="true" data-rf-hover-layer />
          <span class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          {options.map((option) =>
            option.iconOnly && option.icon != null ? (
              // The label already names the segment, so the tooltip only shows it.
              <Tooltip
                key={option.value}
                content={option.label}
                renderTrigger={(trigger) => segment(option, trigger.mix)}
              />
            ) : (
              segment(option)
            ),
          )}
        </div>
      </fieldset>
    )
  }
}
