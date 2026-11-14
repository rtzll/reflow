import { createMixin, on } from 'remix/component'
import * as popover from '@remix-run/ui/popover'

/**
 * Places a Select or Combobox popup below the start of its field, and with
 * `matchField` gives it the field's width as `--rf-picker-field-width`. Remix
 * UI's popover anchors to the trigger it is given, which for these pickers is
 * an inner part of the field.
 */
export const positionPickerPopup = createMixin<HTMLElement, [matchField?: boolean]>((handle) => {
  const context = handle.context.get(popover.Context)
  return (matchField) =>
    on<HTMLElement, 'beforetoggle'>(
      'beforetoggle',
      (event) => {
        if (event.newState !== 'open' || !context.anchor) return
        const { target } = context.anchor
        const field =
          matchField && target instanceof HTMLElement
            ? target.closest<HTMLElement>('.rf-picker-field')
            : null
        if (field) {
          event.currentTarget.style.setProperty('--rf-picker-field-width', `${field.offsetWidth}px`)
        }
        context.anchor = {
          target: field ?? target,
          options: { placement: 'bottom-start', offset: 6 },
        }
      },
      true,
    )
})
