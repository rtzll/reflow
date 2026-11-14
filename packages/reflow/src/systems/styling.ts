import type { Props } from 'remix/component'

// The size scale and class handling every component's props share.

/** The two densities every control comes in. */
export type ControlSize = 'default' | 'compact'

export function classList(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export type StyledProps<Tag extends keyof JSX.IntrinsicElements> = Omit<
  Props<Tag>,
  'class' | 'className'
> & {
  class?: string
  className?: string
}
