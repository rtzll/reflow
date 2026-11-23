import { Dropdown } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

// Placeholder models and effort levels for the showcase. A real app passes
// its own.
export const models = ['Model one', 'Model two', 'Model three'] as const
export const efforts = ['Light', 'Balanced', 'Thorough'] as const

export interface ModelPickerProps {
  defaultModel?: string
  defaultEffort?: string
  onChange?: (choice: { model: string; effort: string }) => void
}

/**
 * A ghost Dropdown that picks a model, with the effort level in a submenu.
 * The trigger names the model and, quieter, the effort. Composed from
 * Dropdown's radio rows and submenus; it is an example, not a component.
 */
export function ModelPicker(handle: Handle<ModelPickerProps>) {
  let model = handle.props.defaultModel ?? models[0]
  let effort = handle.props.defaultEffort ?? efforts[1]
  return () => (
    <Dropdown
      label={`${model}, ${effort}`}
      variant="ghost"
      size="compact"
      align="end"
      side="top"
      triggerContent={
        <span class="model-picker-trigger">
          <span>{model}</span>
          <span class="model-picker-effort">{effort}</span>
        </span>
      }
      items={[
        ...models.map((name) => ({
          group: 'Model',
          value: `model:${name}`,
          label: name,
          type: 'radio' as const,
          checked: model === name,
        })),
        {
          value: 'effort',
          label: 'Effort',
          separatorBefore: true,
          children: efforts.map((level) => ({
            value: `effort:${level}`,
            label: level,
            type: 'radio' as const,
            checked: effort === level,
          })),
        },
      ]}
      onSelect={(value) => {
        const [kind, choice] = value.split(':')
        if (kind === 'model') model = choice
        else if (kind === 'effort') effort = choice
        else return
        handle.props.onChange?.({ model, effort })
        handle.update()
      }}
    />
  )
}
