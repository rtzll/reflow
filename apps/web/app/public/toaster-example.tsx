import { Button, Toaster, toast, type ToasterPosition, type ToastStatus } from '@rtzll/reflow'
import { clientEntry, on, type Handle } from 'remix/component'

export interface SiteToasterOptions {
  position: ToasterPosition
  expand: boolean
  closeButton: boolean
  size?: 'default' | 'compact'
}

const defaults: SiteToasterOptions = { position: 'bottom-right', expand: false, closeButton: false }
let options = defaults
const subscribers = new Set<() => void>()

/** The docs examples and the playground arrange the site's one Toaster. */
export function setSiteToaster(next: Partial<SiteToasterOptions>) {
  const merged = { ...options, ...next }
  if (
    (Object.keys(merged) as (keyof SiteToasterOptions)[]).every(
      (key) => merged[key] === options[key],
    )
  )
    return
  options = merged
  for (const update of subscribers) update()
}

/** The showcase's Toaster, placed once on every page. */
export const SiteToaster = clientEntry(import.meta.url, function SiteToaster(handle: Handle) {
  const update = () => void handle.update()
  subscribers.add(update)
  handle.signal.addEventListener('abort', () => subscribers.delete(update), { once: true })
  return () => (
    <Toaster
      position={options.position}
      expand={options.expand}
      closeButton={options.closeButton}
      size={options.size}
    />
  )
})

// Bottom right first: it is the default.
export const toasterPositions: readonly ToasterPosition[] = [
  'bottom-right',
  'bottom-center',
  'bottom-left',
  'top-right',
  'top-center',
  'top-left',
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function upload() {
  return wait(1600).then(() => 'roadmap.pdf')
}

function raise(
  status: ToastStatus | 'action' | 'promise' | 'description',
  withDescription = false,
) {
  const description = withDescription ? 'Monday, November 9 at 9:41' : undefined
  switch (status) {
    case 'success':
      return toast.success('Changes saved', { description })
    case 'info':
      return toast.info('A new version is available', { description })
    case 'warning':
      return toast.warning('Storage is almost full', { description })
    case 'error':
      return toast.error('Could not send the message', { description })
    case 'loading':
    case 'promise':
      return toast.promise(upload, {
        loading: 'Uploading roadmap.pdf…',
        success: (name) => `Uploaded ${name}`,
        error: 'Upload failed',
      })
    case 'action':
      return toast('Conversation archived', {
        description,
        action: { label: 'Undo', onClick: () => toast('Conversation restored') },
      })
    case 'description':
      return toast('Event created', { description: 'Monday, November 9 at 9:41' })
    default:
      return toast('Event created', { description })
  }
}

export interface ToasterDemoProps {
  variant: string
  size?: 'default' | 'compact'
  position?: ToasterPosition
  status?: string
  description?: boolean
  action?: boolean
  closeButton?: boolean
  expand?: boolean
}

/** The Toaster docs demos, gallery card and playground. Toasts appear in the site's Toaster. */
export function ToasterDemo(handle: Handle<ToasterDemoProps>) {
  let chosen: ToasterPosition = 'bottom-right'
  return () => {
    const { variant, size } = handle.props
    const button = (
      label: string,
      run: () => void,
      variant: 'secondary' | 'primary' = 'secondary',
    ) => (
      <Button variant={variant} size={size} mix={on('click', run)}>
        {label}
      </Button>
    )
    const arranged = (next: Partial<SiteToasterOptions>, run: () => void) => () => {
      setSiteToaster({ ...defaults, size, ...next })
      run()
    }
    switch (variant) {
      case 'status':
        return (
          <div class="example-row">
            {button(
              'Success',
              arranged({}, () => raise('success')),
            )}
            {button(
              'Info',
              arranged({}, () => raise('info')),
            )}
            {button(
              'Warning',
              arranged({}, () => raise('warning')),
            )}
            {button(
              'Error',
              arranged({}, () => raise('error')),
            )}
          </div>
        )
      case 'description':
        return button(
          'Show toast',
          arranged({}, () => raise('description')),
        )
      case 'action':
        return button(
          'Archive',
          arranged({}, () => raise('action')),
        )
      case 'promise':
        return button(
          'Upload',
          arranged({}, () => raise('promise')),
        )
      case 'close-button':
        return button(
          'Show toast',
          arranged({ closeButton: true }, () => raise('default', true)),
        )
      case 'expand':
        return button(
          'Show three',
          arranged({ expand: true }, () => {
            raise('default', true)
            raise('success', true)
            raise('info', true)
          }),
        )
      case 'position':
        return (
          <div class="example-row example-toaster-positions">
            {toasterPositions.map((position) =>
              button(
                position,
                arranged({ position }, () => toast(`Toast at ${position}`)),
              ),
            )}
          </div>
        )
      case 'gallery':
        return (
          <div class="example-toaster-card">
            <fieldset class="example-toaster-screen">
              <legend class="site-sr-only">Position</legend>
              {toasterPositions.map((position) => (
                <label key={position} data-position={position}>
                  <input
                    type="radio"
                    name={`${handle.id}-position`}
                    value={position}
                    checked={chosen === position}
                    mix={on('change', () => {
                      chosen = position
                      void handle.update()
                      setSiteToaster({ ...defaults, position })
                      toast(`Toasts appear ${position.replace('-', ' ')}`)
                    })}
                  />
                  <span class="site-sr-only">{position.replace('-', ' ')}</span>
                </label>
              ))}
            </fieldset>
            <div class="example-toaster-actions">
              {button(
                'Show toast',
                arranged({ position: chosen }, () => raise('default', true)),
                'primary',
              )}
              {button(
                'Success',
                arranged({ position: chosen }, () => raise('success')),
              )}
              {button(
                'Undo',
                arranged({ position: chosen }, () => raise('action')),
              )}
              {button(
                'Promise',
                arranged({ position: chosen }, () => raise('promise')),
              )}
            </div>
          </div>
        )
      case 'playground':
        return button(
          'Show toast',
          arranged(
            {
              position: handle.props.position ?? 'bottom-right',
              closeButton: Boolean(handle.props.closeButton),
              expand: Boolean(handle.props.expand),
            },
            () => {
              const status = (handle.props.status ?? 'default') as ToastStatus
              if (handle.props.action) raise('action', handle.props.description)
              else raise(status, handle.props.description)
            },
          ),
          'primary',
        )
      default:
        return button(
          'Show toast',
          arranged({}, () => toast('Event created')),
          'primary',
        )
    }
  }
}
