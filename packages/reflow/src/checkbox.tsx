import { on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'

type ChoiceProps = Omit<StyledProps<'input'>, 'size' | 'type' | 'role' | 'children'> & {
  size?: ControlSize
  label?: RemixNode
  onCheckedChange?: (checked: boolean, event: Event) => void
}

export type CheckboxProps = ChoiceProps
export function Checkbox(handle: Handle<CheckboxProps>) {
  return () => {
    const {
      class: classProp,
      className,
      size,
      label,
      mix,
      indeterminate,
      checked,
      defaultChecked,
      onCheckedChange,
      ...props
    } = handle.props

    const Root = label == null ? 'span' : 'label'
    return (
      <Root class={classList('rf-choice', 'rf-checkbox', classProp, className)} data-size={size}>
        <input
          {...props}
          {...(defaultChecked === undefined ? {} : { defaultChecked })}
          {...(checked === undefined ? {} : { checked })}
          type="checkbox"
          data-slot="checkbox"
          aria-checked={indeterminate ? 'mixed' : undefined}
          aria-readonly={props.readOnly || undefined}
          indeterminate={indeterminate}
          mix={[
            props.readOnly && on('click', (event) => event.preventDefault()),
            onCheckedChange &&
              on<HTMLInputElement, 'change'>('change', (event) => {
                onCheckedChange(event.currentTarget.checked, event)
              }),
            mix,
          ]}
        />
        <span class="rf-checkbox-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path class="rf-checkbox-check" d="M6 12l4 4 8-8" pathLength="1" />
            <path class="rf-checkbox-dash" d="M6 12h12" />
          </svg>
        </span>
        {label != null && <span class="rf-choice-label">{label}</span>}
      </Root>
    )
  }
}
