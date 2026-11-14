import { on } from 'remix/component'
import type { Handle } from 'remix/component'
import { classList } from './systems/styling.ts'
import type { CheckboxProps } from './checkbox.tsx'

export type SwitchProps = Omit<CheckboxProps, 'indeterminate'>

export function Switch(handle: Handle<SwitchProps>) {
  let pointer:
    | {
        id: number
        startX: number
        startOffset: number
        scale: number
        travel: number
        offset?: number
        track: HTMLElement
      }
    | undefined
  let nextChecked: boolean | undefined

  function clearDrag() {
    pointer?.track.removeAttribute('data-dragging')
    pointer?.track.style.removeProperty('--rf-switch-position')
    pointer = undefined
  }

  return () => {
    const {
      class: classProp,
      className,
      size,
      label,
      mix,
      checked,
      defaultChecked,
      onCheckedChange,
      ...props
    } = handle.props
    const Root = label == null ? 'span' : 'label'

    return (
      <Root class={classList('rf-choice', 'rf-switch', classProp, className)} data-size={size}>
        <input
          {...props}
          {...(defaultChecked === undefined ? {} : { defaultChecked })}
          {...(checked === undefined ? {} : { checked })}
          type="checkbox"
          role="switch"
          data-slot="switch"
          aria-readonly={props.readOnly || undefined}
          mix={[
            on<HTMLInputElement, 'pointerdown'>('pointerdown', (event) => {
              nextChecked = undefined
              if (!event.isPrimary || event.button !== 0 || props.readOnly) return

              const track = event.currentTarget.nextElementSibling
              if (!(track instanceof HTMLElement)) return
              const thumb = track.firstElementChild
              if (!(thumb instanceof HTMLElement)) return
              const bounds = track.getBoundingClientRect()
              if (event.clientX < bounds.left || event.clientX > bounds.right) return

              const scale = bounds.width / track.offsetWidth || 1
              const pressSize =
                parseFloat(getComputedStyle(track).getPropertyValue('--rf-switch-press-size')) || 0
              pointer = {
                id: event.pointerId,
                startX: event.clientX,
                // Start at the painted position, including during an interrupted toggle.
                startOffset:
                  (thumb.getBoundingClientRect().left - bounds.left) / scale - thumb.offsetLeft,
                scale,
                travel: Math.max(0, track.offsetWidth - track.offsetHeight - pressSize),
                track,
              }
              event.currentTarget.setPointerCapture(event.pointerId)
            }),
            on<HTMLInputElement, 'pointermove'>('pointermove', (event) => {
              if (!pointer || event.pointerId !== pointer.id) return
              const delta = event.clientX - pointer.startX
              if (pointer.offset === undefined && Math.abs(delta) < 2) return
              pointer.offset = Math.min(
                pointer.travel,
                Math.max(0, pointer.startOffset + delta / pointer.scale),
              )
              pointer.track.style.setProperty('--rf-switch-position', pointer.offset + 'px')
              pointer.track.setAttribute('data-dragging', '')
            }),
            on<HTMLInputElement, 'pointerup'>('pointerup', (event) => {
              if (!pointer || event.pointerId !== pointer.id) return
              if (pointer.offset !== undefined) nextChecked = pointer.offset > pointer.travel / 2
              clearDrag()
            }),
            on('lostpointercapture', clearDrag),
            on('pointercancel', clearDrag),
            on<HTMLInputElement, 'click'>('click', (event) => {
              const desired = nextChecked
              nextChecked = undefined
              // The checkbox's native activation toggles its value before click.
              // Cancel that toggle when the drag settled on the current value.
              if (
                props.readOnly ||
                (event.detail > 0 &&
                  desired !== undefined &&
                  event.currentTarget.checked !== desired)
              ) {
                event.preventDefault()
              }
            }),
            onCheckedChange &&
              on<HTMLInputElement, 'change'>('change', (event) => {
                onCheckedChange(event.currentTarget.checked, event)
              }),
            mix,
          ]}
        />
        <span class="rf-switch-track" aria-hidden="true">
          <span class="rf-switch-thumb" />
        </span>
        {label != null && <span class="rf-choice-label">{label}</span>}
      </Root>
    )
  }
}
