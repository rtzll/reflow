import { Icon, type IconName } from './icon.tsx'
import { on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import { jsx } from 'remix/component/jsx-runtime'
import { fluidHover } from './systems/fluid-hover.ts'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'
import { type ButtonProps, Button } from './button.tsx'

export type CardGroupProps = Omit<StyledProps<'div'>, 'style'> & {
  orientation?: 'card' | 'inline'
  columns?: number
  border?: 'none' | 'outlined'
  separated?: boolean
  fluidHover?: boolean
  style?: Record<string, string | number | undefined>
}

function cardGroupItems(children: RemixNode, columns: number, separated: boolean): RemixNode {
  if (separated) return children
  const items: Exclude<RemixNode, RemixNode[]>[] = []
  function collect(node: RemixNode) {
    if (Array.isArray(node)) node.forEach(collect)
    else if (node != null && typeof node !== 'boolean' && node !== '') items.push(node)
  }
  collect(children)
  const isSelected = (index: number) => {
    const item = items[index]
    return (
      item != null && typeof item === 'object' && item.type === Card && item.props.selected === true
    )
  }

  return items.map((item, index) => {
    if (item == null || typeof item !== 'object' || item.type !== Card) return item
    const right = index + 1
    const below = index + columns
    return jsx(
      Card,
      {
        ...item.props,
        'data-divider-right':
          (right < items.length && right % columns !== 0 && !isSelected(right)) || undefined,
        'data-divider-below': (below < items.length && !isSelected(below)) || undefined,
      },
      item.key,
    )
  })
}

export function CardGroup(handle: Handle<CardGroupProps>) {
  return () => {
    const {
      class: classProp,
      className,
      orientation = 'card',
      columns = 1,
      border = 'none',
      separated = false,
      fluidHover: hover = true,
      style,
      children,
      mix,
      ...props
    } = handle.props
    const count = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1

    return (
      <div
        {...props}
        class={classList('rf-card-group', classProp, className)}
        data-slot="card-group"
        data-orientation={orientation}
        data-border={border}
        data-separated={separated || undefined}
        style={{ '--rf-card-columns': count, ...style }}
        mix={[hover && fluidHover({ axis: count > 1 ? 'both' : 'y', fastHover: true }), mix]}
      >
        {hover && (
          <span class="rf-highlight rf-card-highlight" aria-hidden="true" data-rf-hover-layer />
        )}
        {cardGroupItems(children, count, separated)}
      </div>
    )
  }
}

type CardInteraction =
  | { href: string; label: string; onClick?: never }
  | { href?: never; label: string; onClick: (event: MouseEvent) => void }
  | { href?: never; label?: never; onClick?: never }

export type CardProps = StyledProps<'div'> &
  CardInteraction & {
    disabled?: boolean
    selected?: boolean
    dismissible?: boolean
    dismissOnHover?: boolean
    /** Prevent the click default to handle the dismissal externally. */
    onDismiss?: (event: MouseEvent) => void
    size?: ControlSize
    border?: 'none' | 'outlined'
  }

export function Card(handle: Handle<CardProps>) {
  let dismissed = false

  return () => {
    if (dismissed) return null
    const {
      class: classProp,
      className,
      href,
      label,
      onClick,
      disabled,
      selected,
      dismissible,
      dismissOnHover = true,
      onDismiss,
      size,
      border,
      children,
      ...props
    } = handle.props
    const interactive = Boolean(href || onClick)
    const parts: RemixNode[] = []
    ;(function collect(node: RemixNode) {
      if (Array.isArray(node)) node.forEach(collect)
      else if (node != null && typeof node !== 'boolean' && node !== '') parts.push(node)
    })(children)
    const isImage = (node: RemixNode) =>
      node != null && typeof node === 'object' && 'type' in node && node.type === CardImage
    const image = parts.find(isImage)
    const body = image ? (
      <>
        {image}
        <div class="rf-card-body">{parts.filter((part) => part !== image)}</div>
      </>
    ) : (
      children
    )

    return (
      <div
        {...props}
        class={classList('rf-card', classProp, className)}
        data-slot="card"
        data-dismissible={dismissible || undefined}
        data-size={size}
        data-border={border}
        data-selected={selected || undefined}
        data-rf-hover-item={interactive || undefined}
        aria-disabled={disabled || undefined}
      >
        {selected && <span class="rf-card-fill" aria-hidden="true" />}
        {href && !disabled && <a class="rf-card-target" href={href} aria-label={label} />}
        {onClick && (
          <button
            class="rf-card-target"
            type="button"
            aria-label={label}
            disabled={disabled}
            mix={on<HTMLButtonElement, 'click'>('click', onClick)}
          />
        )}
        {body}
        {dismissible && (
          <Button
            class="rf-card-dismiss"
            variant="ghost"
            size="icon-compact"
            data-on-hover={dismissOnHover || undefined}
            aria-label="Dismiss"
            mix={on('click', (event) => {
              onDismiss?.(event)
              if (event.defaultPrevented) return
              dismissed = true
              handle.update()
            })}
          >
            <Icon name="x" />
          </Button>
        )}
      </div>
    )
  }
}

export function CardHeader(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-card-header', classProp, className)}
        data-slot="card-header"
      />
    )
  }
}

export function CardTitle(handle: Handle<StyledProps<'h3'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <h3
        {...props}
        class={classList('rf-card-title', classProp, className)}
        data-slot="card-title"
      />
    )
  }
}

export function CardDescription(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <p
        {...props}
        class={classList('rf-card-description', classProp, className)}
        data-slot="card-description"
      />
    )
  }
}

export function CardContent(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-card-content', classProp, className)}
        data-slot="card-content"
      />
    )
  }
}

export function CardFooter(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-card-footer', classProp, className)}
        data-slot="card-footer"
      />
    )
  }
}

export function CardAction(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-card-action', classProp, className)}
        data-slot="card-action"
      />
    )
  }
}

export function CardMedia(
  handle: Handle<
    StyledProps<'div'> & {
      treatment?: 'icon'
      logo?: string | readonly [string, string]
      logoAlt?: string
      logoSize?: number
    }
  >,
) {
  return () => {
    const {
      class: classProp,
      className,
      treatment,
      logo,
      logoAlt = '',
      logoSize = 22,
      children,
      ...props
    } = handle.props
    const logos = logo === undefined ? [] : typeof logo === 'string' ? [logo] : [...logo]
    return (
      <div
        {...props}
        class={classList('rf-card-media', classProp, className)}
        data-slot="card-media"
        data-treatment={logo === undefined ? treatment : 'logo'}
      >
        {logos.length > 0
          ? logos.map((src, index) => (
              <span class="rf-card-logo" key={index}>
                {index > 0 && <i aria-hidden="true" />}
                <img
                  src={src}
                  alt={logoAlt}
                  width={logoSize}
                  height={logoSize}
                  style={{ width: logoSize + 'px', height: logoSize + 'px' }}
                />
              </span>
            ))
          : children}
      </div>
    )
  }
}

export type CardFeatureProps = StyledProps<'div'> & {
  icon?: IconName
  title: string
  description?: string
}

export function CardFeature(handle: Handle<CardFeatureProps>) {
  return () => {
    const { class: classProp, className, icon, title, description, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-card-feature', classProp, className)}
        data-slot="card-feature"
      >
        {icon && <Icon name={icon} />}
        <div>
          <span class="rf-card-feature-title">{title}</span>
          {description && <span class="rf-card-feature-description">{description}</span>}
        </div>
      </div>
    )
  }
}

export type CardImageProps = Omit<StyledProps<'img'>, 'role' | 'alt'> & { alt: string }

export function CardImage(handle: Handle<CardImageProps>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <img
        {...props}
        class={classList('rf-card-image', classProp, className)}
        data-slot="card-image"
      />
    )
  }
}

export function CardEyebrow(handle: Handle<StyledProps<'span'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <span
        {...props}
        class={classList('rf-card-eyebrow', classProp, className)}
        data-slot="card-eyebrow"
      />
    )
  }
}

export function CardButton(handle: Handle<ButtonProps>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <Button
        {...props}
        class={classList('rf-card-button', classProp, className)}
        variant={props.variant ?? 'ghost'}
        size={props.size}
      />
    )
  }
}
