import { Button, Icon, SegmentedControl, type SegmentedControlOption } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

export const periodOptions: SegmentedControlOption[] = ['Day', 'Week', 'Month', 'Year'].map(
  (label) => ({ value: label.toLowerCase(), label }),
)

const viewOptions: SegmentedControlOption[] = [
  { value: 'list', label: 'List', icon: <Icon name="menu" /> },
  { value: 'board', label: 'Board', icon: <Icon name="square-library" /> },
  { value: 'calendar', label: 'Calendar', icon: <Icon name="calendar" /> },
]

const themeOptions: SegmentedControlOption[] = [
  { value: 'light', label: 'Light', icon: <Icon name="sun" />, iconOnly: true },
  { value: 'dark', label: 'Dark', icon: <Icon name="moon" />, iconOnly: true },
  { value: 'system', label: 'System', icon: <Icon name="monitor" />, iconOnly: true },
]

export interface SegmentedControlDemoProps {
  variant: string
  size?: 'default' | 'compact'
  content?: string
  fill?: boolean
  disabled?: boolean
}

/** The SegmentedControl docs demos and playground: every control is a real Reflow SegmentedControl. */
export function SegmentedControlDemo(handle: Handle<SegmentedControlDemoProps>) {
  let period = 'week'
  let submitted: string | undefined
  return () => {
    const { variant, size } = handle.props
    switch (variant) {
      case 'compact':
        return <SegmentedControl label="Period" options={periodOptions} size="compact" />
      case 'icons':
        return <SegmentedControl label="View" options={viewOptions} size={size} />
      case 'icon-only':
        return (
          <SegmentedControl
            label="Theme"
            options={themeOptions}
            defaultValue="system"
            size={size}
          />
        )
      case 'fill':
        return (
          <div class="doc-demo-segmented-fill">
            <SegmentedControl label="Period" options={periodOptions} fill size={size} />
          </div>
        )
      case 'disabled':
        return (
          <SegmentedControl
            label="Period"
            size={size}
            options={periodOptions.map((option) => ({
              ...option,
              disabled: option.value === 'year',
            }))}
          />
        )
      case 'form':
        return (
          <form
            class="doc-demo-segmented-form"
            mix={on<HTMLFormElement, 'submit'>('submit', (event) => {
              event.preventDefault()
              submitted = String(new FormData(event.currentTarget).get('period'))
              void handle.update()
            })}
          >
            <SegmentedControl label="Period" name="period" options={periodOptions} size={size} />
            <Button type="submit" variant="secondary" size={size}>
              Apply
            </Button>
            <output class="doc-demo-feedback">{submitted ? `Applied: ${submitted}` : ''}</output>
          </form>
        )
      case 'controlled':
        return (
          <div class="doc-demo-segmented-form">
            <SegmentedControl
              label="Period"
              options={periodOptions}
              value={period}
              size={size}
              onValueChange={(next) => {
                period = next
                void handle.update()
              }}
            />
            <Button
              variant="ghost"
              size={size}
              mix={on('click', () => {
                period = 'week'
                void handle.update()
              })}
            >
              Back to week
            </Button>
            <output class="doc-demo-feedback">Showing {period}</output>
          </div>
        )
      case 'playground': {
        const content = handle.props.content ?? 'Text'
        const options =
          content === 'Icons' ? viewOptions : content === 'Icon only' ? themeOptions : periodOptions
        const control = (
          <SegmentedControl
            label={content === 'Icon only' ? 'Theme' : content === 'Icons' ? 'View' : 'Period'}
            options={options}
            size={size}
            fill={handle.props.fill}
            disabled={handle.props.disabled}
          />
        )
        return handle.props.fill ? <div class="doc-demo-segmented-fill">{control}</div> : control
      }
      default:
        return <SegmentedControl label="Period" options={periodOptions} size={size} />
    }
  }
}
