import { ref } from 'remix/component'

/**
 * Calls `reset` after the surrounding form resets, for controls whose value
 * lives in component state rather than in a native input: Select, Combobox,
 * Calendar, DatePicker, ColorPicker, Slider, FileInput and NumberField.
 *
 * It runs once the browser has restored the native inputs, and not when the
 * reset was cancelled. Mixed into a form control, it follows the control's
 * `form` attribute. Remix UI's primitives do not follow form resets.
 */
export function onFormReset(reset: () => void) {
  return ref((node, signal) => {
    // A form control follows its form attribute; anything else, its ancestor form.
    const form = 'form' in node ? (node as HTMLInputElement).form : node.closest('form')
    form?.addEventListener(
      'reset',
      (event) => {
        queueMicrotask(() => {
          if (!signal.aborted && !event.defaultPrevented) reset()
        })
      },
      { signal },
    )
  })
}
