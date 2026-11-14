import type { Handle } from 'remix/component'

export interface SkeletonProps {
  /** Inline size in CSS units. Defaults to the available width. */
  width?: string
  /** Block size in CSS units. Defaults to one line of text. */
  height?: string
  shape?: 'rounded' | 'circle'
  /** Disable the shimmer. The user's reduced motion preference always wins. */
  animate?: boolean
  class?: string
}

/** A decorative placeholder. Set aria-busy on the content region while it loads. */
export function Skeleton(handle: Handle<SkeletonProps>) {
  return () => {
    const { width, height, shape, animate = true, class: className } = handle.props
    return (
      <span
        class={className ? `rf-skeleton ${className}` : 'rf-skeleton'}
        data-slot="skeleton"
        data-shape={shape}
        data-animate={animate || undefined}
        aria-hidden="true"
        style={{ inlineSize: width, blockSize: height }}
      />
    )
  }
}
