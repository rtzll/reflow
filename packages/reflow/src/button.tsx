import { Spinner } from './spinner.tsx'
import type { Handle, Props, RemixNode } from 'remix/component'
import { type ControlSize, classList } from './systems/styling.ts'

export type ButtonSize = ControlSize | 'icon' | 'icon-compact'
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'

type ButtonAppearance = {
  active?: boolean
  class?: string
  className?: string
  disabled?: boolean
  leadingIcon?: RemixNode
  loading?: boolean
  size?: ButtonSize
  trailingIcon?: RemixNode
  variant?: ButtonVariant
}

export type ButtonProps = ButtonAppearance &
  (
    | (Omit<Props<'button'>, keyof ButtonAppearance> & { href?: undefined })
    | Omit<Extract<Props<'a'>, { href: string }>, keyof ButtonAppearance>
  )

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const props = handle.props
    const classNames = classList('rf-button', props.class, props.className)
    const variant = props.variant ?? 'primary'
    const disabled = props.disabled || props.loading
    const iconOnly = props.size === 'icon' || props.size === 'icon-compact'
    const leading = iconOnly ? undefined : props.leadingIcon
    const trailing = iconOnly ? undefined : props.trailingIcon
    const content = (
      <>
        <span class="rf-button-content">
          {leading && (
            <span class="rf-button-icon" aria-hidden="true">
              {leading}
            </span>
          )}
          <span class="rf-button-label">{props.children}</span>
          {trailing && (
            <span class="rf-button-icon" aria-hidden="true">
              {trailing}
            </span>
          )}
        </span>
        {props.loading && <Spinner class="rf-button-spinner" />}
      </>
    )

    const appearance = {
      class: classNames,
      'data-slot': 'button',
      'data-variant': variant,
      'data-size': props.size,
      'data-active': props.active || undefined,
      'data-leading': Boolean(leading) || undefined,
      'data-trailing': Boolean(trailing) || undefined,
      'aria-busy': props.loading || undefined,
    }

    if (props.href !== undefined) {
      const {
        active,
        class: classProp,
        className,
        disabled: isDisabled,
        leadingIcon,
        loading,
        size,
        trailingIcon,
        variant,
        children,
        href,
        mix,
        ...anchorProps
      } = props

      return disabled ? (
        <a {...anchorProps} {...appearance} role="link" aria-disabled="true">
          {content}
        </a>
      ) : (
        <a {...anchorProps} {...appearance} href={href} mix={mix}>
          {content}
        </a>
      )
    }

    const {
      active,
      class: classProp,
      className,
      disabled: isDisabled,
      leadingIcon,
      loading,
      size,
      trailingIcon,
      variant: variantProp,
      children,
      href,
      type = 'button',
      ...buttonProps
    } = props

    return (
      <button {...buttonProps} {...appearance} type={type} disabled={disabled}>
        {content}
      </button>
    )
  }
}
