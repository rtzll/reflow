import { Badge, Dropdown } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

// Placeholder models and effort levels for the showcase. A real app passes
// its own.
export const models = ['Model one', 'Model two', 'Model three'] as const
export const efforts = ['Light', 'Balanced', 'Thorough'] as const

// Tags beside some choices: the usual model and effort, and a costlier model.
const modelBadges: Partial<Record<(typeof models)[number], [string, 'gray' | 'amber']>> = {
  'Model one': ['Default', 'gray'],
  'Model three': ['Uses more credits', 'amber'],
}
const recommendedEffort = 'Balanced'

export interface ModelChoice {
  model: string
  effort: string
  quick: boolean
}

export interface ModelPickerProps {
  defaultModel?: string
  defaultEffort?: string
  onChange?: (choice: ModelChoice) => void
}

/**
 * A ghost Dropdown that picks a model, its effort level in a submenu that
 * explains the choice, and a switch for quicker replies. The trigger names
 * the model and, quieter, the effort. Composed from Dropdown's radio rows,
 * badges, hints, submenu notes and switch rows; it is an example, not a
 * component.
 */
export function ModelPicker(handle: Handle<ModelPickerProps>) {
  let model = handle.props.defaultModel ?? models[0]
  let effort = handle.props.defaultEffort ?? recommendedEffort
  let quick = false
  return () => (
    <Dropdown
      label={`${model}, ${effort}${quick ? ', quick replies' : ''}`}
      variant="ghost"
      size="compact"
      align="end"
      side="top"
      triggerContent={
        <span class="model-picker-trigger">
          <span>{model}</span>
          <span class="model-picker-effort">{quick ? `${effort} · Quick` : effort}</span>
        </span>
      }
      items={[
        ...models.map((name) => {
          const badge = modelBadges[name]
          return {
            value: `model:${name}`,
            label: name,
            type: 'radio' as const,
            checked: model === name,
            badge: badge && (
              <Badge size="compact" color={badge[1]}>
                {badge[0]}
              </Badge>
            ),
          }
        }),
        {
          value: 'effort',
          label: 'Effort',
          hint: effort,
          separatorBefore: true,
          note: 'More effort answers more thoroughly, but takes longer.',
          children: efforts.map((level) => ({
            value: `effort:${level}`,
            label: level,
            type: 'radio' as const,
            checked: effort === level,
            badge:
              level === recommendedEffort ? <Badge size="compact">Recommended</Badge> : undefined,
          })),
        },
        {
          value: 'quick',
          label: 'Quick replies',
          type: 'switch' as const,
          checked: quick,
          separatorBefore: true,
        },
      ]}
      onSelect={(value, checked) => {
        const [kind, choice] = value.split(':')
        if (kind === 'model') model = choice
        else if (kind === 'effort') effort = choice
        else if (kind === 'quick') quick = checked ?? !quick
        else return
        handle.props.onChange?.({ model, effort, quick })
        handle.update()
      }}
    />
  )
}
