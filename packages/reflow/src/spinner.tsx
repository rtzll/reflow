import type { Handle } from 'remix/component'

export interface SpinnerProps {
  /** Name standalone loading. Omit when surrounding content describes the work. */
  label?: string
  /** Width and height in CSS units. Defaults to the current icon size. */
  size?: string
  class?: string
}

export function Spinner(handle: Handle<SpinnerProps>) {
  return () => {
    const { label, size, class: className } = handle.props
    return (
      <svg
        class={className ? `rf-spinner ${className}` : 'rf-spinner'}
        data-slot="spinner"
        viewBox="0 0 16 16"
        fill="none"
        role={label ? 'status' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        style={size ? { inlineSize: size, blockSize: size } : undefined}
      >
        <g>
          <circle
            cx="8"
            cy="8"
            r="6.25"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            pathLength="100"
            transform="rotate(-90 8 8)"
          />
        </g>
      </svg>
    )
  }
}
