import {
  Banner,
  BannerAction,
  Button,
  BannerActions,
  BannerDescription,
  BannerTitle,
  type BannerStatus,
} from '@rtzll/reflow'
import { on, ref, type Handle, type RemixNode } from 'remix/component'

export const bannerStatuses = ['default', 'info', 'success', 'warning', 'error'] as const
const messages: Record<
  BannerStatus,
  { title: string; description: string; primary: string; secondary: string; ghost: string }
> = {
  default: {
    title: 'A new update is available',
    description: '5 statuses, 2 contrasts and a dismiss that collapses its height.',
    primary: 'Read the docs',
    secondary: 'Changelog',
    ghost: 'Not now',
  },
  info: {
    title: 'Your workspace is ready',
    description: 'Invite your team and start your first project.',
    primary: 'Copy invite link',
    secondary: "What's new",
    ghost: 'Later',
  },
  success: {
    title: 'Your changes are saved',
    description: 'Everyone in the workspace can see the latest version.',
    primary: 'Open the docs',
    secondary: 'Add more',
    ghost: 'Share',
  },
  warning: {
    title: 'Your storage is nearly full',
    description: 'Remove unused attachments to make room for new files.',
    primary: 'Manage storage',
    secondary: 'Read the guide',
    ghost: 'Ignore',
  },
  error: {
    title: "Couldn't save your changes",
    description: 'Check your connection and try again.',
    primary: 'Retry',
    secondary: 'Status page',
    ghost: 'Report issue',
  },
}

export const bannerDefaults = {
  variant: 'inline',
  status: 'success',
  contrast: 'low',
  description: true,
  primary: true,
  secondary: true,
  ghost: false,
  dismissible: true,
}

export function bannerFragment(values: Record<string, string | boolean>) {
  const { title, description, primary, secondary, ghost } = messages[values.status as BannerStatus]
  const actions = [
    values.primary && `    <BannerAction variant="primary">${primary}</BannerAction>`,
    values.secondary && `    <BannerAction>${secondary}</BannerAction>`,
    values.ghost && `    <BannerAction variant="ghost">${ghost}</BannerAction>`,
  ].filter(Boolean)
  const attributes = [
    values.variant === 'fixed' && 'variant="fixed"',
    values.status !== 'default' && `status="${values.status}"`,
    values.contrast === 'high' && 'contrast="high"',
    values.dismissible && 'dismissible',
  ]
    .filter(Boolean)
    .join(' ')
  return [
    `<Banner${attributes ? ` ${attributes}` : ''}>`,
    `  <BannerTitle>${title}</BannerTitle>`,
    values.description && `  <BannerDescription>${description}</BannerDescription>`,
    ...(actions.length ? ['  <BannerActions>', ...actions, '  </BannerActions>'] : []),
    '</Banner>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function BannerSkeleton(handle: Handle<{ widths: number[] }>) {
  return () => (
    <div class="banner-skeleton" aria-hidden="true">
      {handle.props.widths.map((width, index) => (
        <span key={index} style={{ width: `${width}%` }} />
      ))}
    </div>
  )
}

export function BannerMockPage(handle: Handle<{ children: RemixNode; height?: number }>) {
  return () => (
    <div class="banner-mock-page" style={{ height: `${handle.props.height ?? 280}px` }}>
      <div class="banner-mock-header" aria-hidden="true">
        <span />
        <div>
          <span />
          <span />
          <span />
        </div>
        <span />
      </div>
      {handle.props.children}
      <div class="banner-mock-scroll">
        <BannerSkeleton
          widths={[33, 92, 84, 88, 60, 95, 78, 86, 70, 50, 90, 82, 94, 66, 88, 74, 58]}
        />
      </div>
    </div>
  )
}

export function BannerPreview(handle: Handle) {
  let open = true
  let copyLabel = messages.info.primary
  let restore: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(restore), { once: true })

  function dismiss() {
    open = false
    copyLabel = messages.info.primary
    handle.update()
    clearTimeout(restore)
    restore = setTimeout(() => {
      open = true
      handle.update()
    }, 1200)
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText('https://example.com/invite/demo')
      copyLabel = 'Copied'
    } catch {
      copyLabel = 'Copy failed'
    }
    if (!handle.signal.aborted) handle.update()
  }

  const { title, description, ghost } = messages.info
  return () => (
    <div style={{ width: 'min(100%, 440px)' }}>
      <Banner status="info" dismissible open={open} onDismiss={dismiss}>
        <BannerTitle>{title}</BannerTitle>
        <BannerDescription>{description}</BannerDescription>
        <BannerActions>
          <BannerAction variant="primary" mix={on('click', copyCommand)}>
            {copyLabel}
          </BannerAction>
          <BannerAction variant="ghost" mix={on('click', dismiss)}>
            {ghost}
          </BannerAction>
        </BannerActions>
      </Banner>
    </div>
  )
}

export function BannerExample(handle: Handle<{ values?: Record<string, string | boolean> }>) {
  let open = true
  // Holds the inline page at the tallest height it has had while the banner was
  // open, so a dismiss never shrinks it and re-centres the preview.
  let hold: HTMLElement | undefined
  let held = 0
  let heldWidth = 0
  let heldKey = ''
  const holder = ref<HTMLDivElement>((element, signal) => {
    hold = element
    const page = element.firstElementChild as HTMLElement
    const observer = new ResizeObserver(() => {
      if (!open) return
      const height = page.offsetHeight
      held = page.offsetWidth !== heldWidth ? height : Math.max(held, height)
      heldWidth = page.offsetWidth
      element.style.minHeight = `${held}px`
    })
    observer.observe(page)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })
  const dismiss = () => {
    open = false
    handle.update()
  }
  return () => {
    const values = handle.props.values ?? bannerDefaults
    const key = JSON.stringify(values)
    if (key !== heldKey) {
      heldKey = key
      held = 0
      if (hold) hold.style.minHeight = ''
    }
    const status = values.status as BannerStatus
    const variant = values.variant === 'fixed' ? 'fixed' : 'inline'
    const { title, description, primary, secondary, ghost } = messages[status]
    const notice = (
      <Banner
        variant={variant}
        status={status}
        contrast={values.contrast === 'high' ? 'high' : 'low'}
        dismissible={Boolean(values.dismissible)}
        open={open}
        onDismiss={dismiss}
      >
        <BannerTitle>{title}</BannerTitle>
        {values.description && <BannerDescription>{description}</BannerDescription>}
        {(values.primary || values.secondary || values.ghost) && (
          <BannerActions>
            {values.primary && <BannerAction variant="primary">{primary}</BannerAction>}
            {values.secondary && <BannerAction>{secondary}</BannerAction>}
            {values.ghost && <BannerAction variant="ghost">{ghost}</BannerAction>}
          </BannerActions>
        )}
      </Banner>
    )
    const page =
      variant === 'fixed' ? (
        <BannerMockPage>{notice}</BannerMockPage>
      ) : (
        <div class="banner-specimen-hold" mix={holder}>
          <div class="banner-specimen">
            <BannerSkeleton widths={[45]} />
            {notice}
            <BannerSkeleton widths={[85, 60]} />
          </div>
        </div>
      )
    return (
      <>
        {page}
        {!open && (
          <div class="banner-show-again">
            <Button
              variant="ghost"
              size="compact"
              mix={on('click', () => {
                open = true
                handle.update()
              })}
            >
              Show banner
            </Button>
          </div>
        )}
      </>
    )
  }
}
