import { Button, Icon, Input, InputCopy, Popover, type PopoverPlacement } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

function DimensionFields(handle: Handle<{ size?: 'default' | 'compact' }>) {
  return () => (
    <div class="doc-popover-fields">
      <label>
        <span>Width</span>
        <Input name="width" defaultValue="100%" size={handle.props.size} />
      </label>
      <label>
        <span>Height</span>
        <Input name="height" defaultValue="auto" size={handle.props.size} />
      </label>
    </div>
  )
}

export interface PopoverDemoProps {
  variant: string
  size?: 'default' | 'compact'
  placement?: PopoverPlacement
  title?: boolean
}

/** The Popover docs demos and playground: every panel is a real Reflow Popover. */
export function PopoverDemo(handle: Handle<PopoverDemoProps>) {
  let open = false
  let applied = 'Nothing applied yet'
  return () => {
    const { variant, size } = handle.props
    switch (variant) {
      case 'title':
        return (
          <Popover
            title="Share this page"
            description="Anyone with the link can view it."
            trigger="Share"
            size={size}
          >
            <InputCopy label="Link" value="https://reflow.example/docs/popover" size={size} />
          </Popover>
        )
      case 'placement':
        return (
          <div class="doc-demo-row">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <Popover
                key={side}
                label={`Opens ${side}`}
                trigger={side}
                placement={side}
                size={size}
              >
                <p class="doc-popover-note">Opens on the {side}.</p>
              </Popover>
            ))}
          </div>
        )
      case 'trigger':
        return (
          <Popover
            title="Display"
            size={size}
            placement="bottom-end"
            renderTrigger={(trigger) => (
              <Button variant="ghost" size="icon" aria-label="Display settings" {...trigger}>
                <Icon name="settings" />
              </Button>
            )}
          >
            <DimensionFields size={size} />
          </Popover>
        )
      case 'controlled':
        return (
          <div class="doc-demo-stack">
            <Popover
              title="Dimensions"
              trigger="Dimensions"
              open={open}
              size={size}
              onOpenChange={(next) => {
                open = next
                void handle.update()
              }}
            >
              <form
                class="doc-popover-form"
                mix={on<HTMLFormElement, 'submit'>('submit', (event) => {
                  event.preventDefault()
                  const data = new FormData(event.currentTarget)
                  applied = `Applied ${data.get('width')} × ${data.get('height')}`
                  open = false
                  void handle.update()
                })}
              >
                <DimensionFields size={size} />
                <div class="doc-popover-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size={size}
                    mix={on('click', () => {
                      open = false
                      void handle.update()
                    })}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size={size}>
                    Apply
                  </Button>
                </div>
              </form>
            </Popover>
            <output class="doc-demo-feedback">{applied}</output>
          </div>
        )
      case 'compact':
        return (
          <Popover label="Dimensions" trigger="Dimensions" size="compact">
            <DimensionFields size="compact" />
          </Popover>
        )
      case 'playground':
        return (
          <Popover
            label="Dimensions"
            title={handle.props.title ? 'Dimensions' : undefined}
            description={handle.props.title ? 'Set the size of the selected frame.' : undefined}
            trigger="Dimensions"
            placement={handle.props.placement}
            size={size}
          >
            <DimensionFields size={size} />
          </Popover>
        )
      default:
        return (
          <Popover label="Dimensions" trigger="Dimensions" size={size}>
            <DimensionFields size={size} />
          </Popover>
        )
    }
  }
}
