import type { Handle } from 'remix/component'
import { badgeColors } from './systems/colors.ts'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'

export type BadgeColor = keyof typeof badgeColors
export type BadgeProps = Omit<StyledProps<'span'>, 'color' | 'style'> & {
  color?: BadgeColor
  size?: ControlSize
  variant?: 'solid' | 'dot'
  style?: Record<string, string | number | undefined>
}

export function Badge(handle: Handle<BadgeProps>) {
  return () => {
    const {
      class: classProp,
      className,
      color = 'gray',
      size,
      variant = 'solid',
      style,
      children,
      ...props
    } = handle.props

    return (
      <span
        {...props}
        class={classList('rf-badge', classProp, className)}
        data-slot="badge"
        data-color={color}
        data-size={size}
        data-variant={variant}
        style={{ '--rf-badge-color': badgeColors[color], ...style }}
      >
        {variant === 'dot' && <span class="rf-badge-dot" aria-hidden="true" />}
        <span class="rf-badge-label">{children}</span>
      </span>
    )
  }
}
