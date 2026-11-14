import { ref, type Handle } from 'remix/component'
import type { BadgeColor } from './badge.tsx'
import { badgeColors } from './systems/colors.ts'

export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline'

export interface AvatarProps {
  /** Who or what it shows: the accessible name, and the source of the initials. */
  name: string
  /** An image. Until it loads, or if it fails, the initials show. */
  src?: string
  /** Width and height in pixels. Default 32. */
  size?: number
  shape?: 'circle' | 'square'
  /** The initials' colour. Defaults to one picked from the name, the same every time. */
  color?: BadgeColor
  /** A dot in the corner, named with the avatar. */
  status?: AvatarStatus
  /** Hides the avatar from assistive technology, for when the name is shown beside it. */
  decorative?: boolean
  class?: string
}

// Hues far enough apart to tell neighbours in a group apart, legible on
// both themes.
const autoColors: BadgeColor[] = [
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'violet',
  'pink',
]

// FNV-1a, which spreads similar names evenly.
function pickColor(name: string): BadgeColor {
  let hash = 0x811c9dc5
  for (const char of name.trim().toLowerCase()) {
    hash ^= char.codePointAt(0)!
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return autoColors[hash % autoColors.length]!
}

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = (word: string | undefined) =>
    Array.from(word ?? '').find((char) => /[\p{L}\p{N}]/u.test(char)) ?? ''
  const letters = first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : '')
  return letters.toLocaleUpperCase()
}

/**
 * A picture or the initials of a person, team or agent. The initials sit
 * on a colour picked from the name, so the same name always looks the same;
 * an image covers them once it loads, and they show again if it fails. A
 * status dot is named with the avatar. Mark it decorative when the name is
 * already written beside it.
 */
export function Avatar(handle: Handle<AvatarProps>) {
  // A failed image hands back to the initials, even if it failed before hydration.
  const image = ref((node, signal) => {
    if (!(node instanceof HTMLImageElement)) return
    const root = node.closest('.rf-avatar')
    const fail = () => root?.setAttribute('data-image', 'error')
    node.addEventListener('error', fail, { signal })
    node.addEventListener('load', () => root?.removeAttribute('data-image'), { signal })
    if (node.complete && node.naturalWidth === 0 && node.getAttribute('src')) fail()
  })

  return () => {
    const { name, src, size = 32, shape = 'circle', status, decorative } = handle.props
    const color = handle.props.color ?? pickColor(name)
    const label = status ? `${name} (${status})` : name
    return (
      <span
        class={handle.props.class ? `rf-avatar ${handle.props.class}` : 'rf-avatar'}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
        data-shape={shape}
        data-color={color}
        style={{ '--rf-avatar-size': `${size}px`, '--rf-avatar-color': badgeColors[color] }}
      >
        <span class="rf-avatar-initials" aria-hidden="true">
          {initials(name)}
        </span>
        {src && <img class="rf-avatar-image" src={src} alt="" mix={image} />}
        {status && <span class="rf-avatar-status" data-status={status} aria-hidden="true" />}
      </span>
    )
  }
}
