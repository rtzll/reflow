import type { Handle, Props } from 'remix/component'
import { jsx } from 'remix/component/jsx-runtime'
import { defaultIcons } from './icon-data.ts'

export type IconName = keyof typeof defaultIcons
export type IconNode = readonly [tag: string, attributes: Readonly<Record<string, string | number>>]

export function renderIconNodes(nodes: readonly IconNode[]) {
  return nodes.map(([tag, attributes], index) => jsx(tag as 'path', attributes, index))
}

/** Decorative SVG with a local default; the showcase can opt in to alternate symbols. */
export function Icon(
  handle: Handle<
    Omit<Props<'svg'>, 'children' | 'name'> & {
      name: IconName
      size?: number
    }
  >,
) {
  return () => {
    const { name, size = 16, ...props } = handle.props
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        {...props}
        aria-hidden="true"
        focusable="false"
        data-rf-icon={name}
      >
        <g
          data-rf-icon-default
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {renderIconNodes(defaultIcons[name])}
        </g>
        {['tabler', 'phosphor', 'hugeicons'].map((family) => (
          <use
            key={family}
            data-rf-icon-family={family}
            display="none"
            href={`#rf-icon-${family}-${name}`}
            width="24"
            height="24"
          />
        ))}
      </svg>
    )
  }
}
