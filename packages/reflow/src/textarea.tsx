import type { Handle } from 'remix/component'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'

export type TextareaProps = StyledProps<'textarea'> & {
  size?: ControlSize
  autoResize?: boolean
}

export function Textarea(handle: Handle<TextareaProps>) {
  return () => {
    const {
      class: classProp,
      className,
      autoResize = true,
      rows = 3,
      size,
      style,
      ...props
    } = handle.props
    const rowCount = Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : 3
    const rowStyle =
      typeof style === 'string'
        ? `--rf-textarea-rows:${rowCount};${style}`
        : { '--rf-textarea-rows': rowCount, ...style }

    return (
      <textarea
        {...props}
        class={classList('rf-input', 'rf-textarea', classProp, className)}
        rows={rowCount}
        style={rowStyle}
        data-slot="textarea"
        data-size={size}
        data-autoresize={autoResize || undefined}
      />
    )
  }
}
