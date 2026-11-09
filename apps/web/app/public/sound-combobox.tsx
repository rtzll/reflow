import { Combobox, type ComboboxProps } from '@rtzll/reflow'
import { play } from 'cuelume'
import type { Handle } from 'remix/component'

export function SoundCombobox(
  handle: Handle<Omit<ComboboxProps, 'value' | 'values' | 'onValueChange' | 'onValuesChange'>>,
) {
  let chipCount = handle.props.defaultValues?.length ?? 0
  let selected = handle.props.defaultValue ?? null

  return () => (
    <Combobox
      {...handle.props}
      onValueChange={(value) => {
        if (value !== null && value !== selected) play('select', { emphasis: 'subtle' })
        selected = value
      }}
      onValuesChange={(values) => {
        if (values.length !== chipCount) {
          play(values.length > chipCount ? 'select' : 'close', { emphasis: 'subtle' })
          chipCount = values.length
        }
      }}
    />
  )
}
