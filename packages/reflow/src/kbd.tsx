import { ref, type Handle, type RemixNode } from 'remix/component'
import { formatShortcut, isMacPlatform } from './behaviors/shortcut.ts'
import { classList, type ControlSize } from './systems/styling.ts'

export interface KbdProps {
  /** A shortcut string such as `"mod+k"` or a sequence such as `["g", "i"]`. */
  keys?: string | readonly string[]
  /** Single keycap content when `keys` is omitted. */
  children?: RemixNode
  /** Pin `"mac"` or `"other"` modifier labels instead of detecting after mount. */
  platform?: 'mac' | 'other'
  /** `"subtle"` uses a quiet tinted fill; `"outline"` adds a bordered keycap edge. */
  variant?: 'subtle' | 'outline'
  size?: ControlSize
  /** Optional visual separator placed between keycaps, such as `"then"`. */
  separator?: RemixNode
  class?: string
}

/** Displays a single key or a platform-aware shortcut chord as keycaps. */
export function Kbd(handle: Handle<KbdProps>) {
  let detectedMac = false
  const mount = ref((_node, signal) => {
    if (handle.props.platform !== undefined || !isMacPlatform()) return
    detectedMac = true
    void handle.update()
    signal.addEventListener(
      'abort',
      () => {
        detectedMac = false
      },
      { once: true },
    )
  })

  return () => {
    const {
      keys,
      children,
      platform,
      variant = 'subtle',
      size,
      separator,
      class: classProp,
    } = handle.props

    if (keys === undefined) {
      return (
        <kbd class={classList('rf-kbd', classProp)} data-variant={variant} data-size={size}>
          {children}
        </kbd>
      )
    }

    const mac = platform ? platform === 'mac' : detectedMac
    const list = typeof keys === 'string' ? [keys] : keys
    const caps = list.flatMap((entry) => formatShortcut(entry, mac))

    return (
      <span
        class={classList('rf-kbd-group', classProp)}
        data-variant={variant}
        data-size={size}
        mix={mount}
      >
        {caps.map((cap, index) => (
          <>
            {index > 0 && separator != null && (
              <span class="rf-kbd-sep" aria-hidden="true">
                {separator}
              </span>
            )}
            <kbd key={`${index}-${cap}`} class="rf-kbd">
              {cap}
            </kbd>
          </>
        ))}
      </span>
    )
  }
}
