import { Spinner } from './spinner.tsx'
import { Icon, type IconName } from './icon.tsx'
import { on, ref } from 'remix/component'
import type { Handle, MixInput, Props, RemixNode } from 'remix/component'
import { jsx } from 'remix/component/jsx-runtime'
import { fluidHover } from './interactive.tsx'
import { Tooltip } from './overlays.tsx'
import { statusIcon } from './status-icon.tsx'
import { badgeColors } from './colors.ts'

export type ControlSize = 'default' | 'compact'
export type ButtonSize = ControlSize | 'icon' | 'icon-compact'
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'

type ButtonAppearance = {
  active?: boolean
  class?: string
  className?: string
  disabled?: boolean
  leadingIcon?: RemixNode
  loading?: boolean
  size?: ButtonSize
  trailingIcon?: RemixNode
  variant?: ButtonVariant
}

export type ButtonProps = ButtonAppearance &
  (
    | (Omit<Props<'button'>, keyof ButtonAppearance> & { href?: undefined })
    | Omit<Extract<Props<'a'>, { href: string }>, keyof ButtonAppearance>
  )

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const props = handle.props
    const classNames = classList('rf-button', props.class, props.className)
    const variant = props.variant ?? 'primary'
    const disabled = props.disabled || props.loading
    const iconOnly = props.size === 'icon' || props.size === 'icon-compact'
    const leading = iconOnly ? undefined : props.leadingIcon
    const trailing = iconOnly ? undefined : props.trailingIcon
    const content = (
      <>
        <span class="rf-button-content">
          {leading && (
            <span class="rf-button-icon" aria-hidden="true">
              {leading}
            </span>
          )}
          <span class="rf-button-label">{props.children}</span>
          {trailing && (
            <span class="rf-button-icon" aria-hidden="true">
              {trailing}
            </span>
          )}
        </span>
        {props.loading && <Spinner class="rf-button-spinner" />}
      </>
    )

    const appearance = {
      class: classNames,
      'data-slot': 'button',
      'data-variant': variant,
      'data-size': props.size,
      'data-active': props.active || undefined,
      'data-leading': Boolean(leading) || undefined,
      'data-trailing': Boolean(trailing) || undefined,
      'aria-busy': props.loading || undefined,
    }

    if (props.href !== undefined) {
      const {
        active,
        class: classProp,
        className,
        disabled: isDisabled,
        leadingIcon,
        loading,
        size,
        trailingIcon,
        variant,
        children,
        href,
        mix,
        ...anchorProps
      } = props

      return disabled ? (
        <a {...anchorProps} {...appearance} role="link" aria-disabled="true">
          {content}
        </a>
      ) : (
        <a {...anchorProps} {...appearance} href={href} mix={mix}>
          {content}
        </a>
      )
    }

    const {
      active,
      class: classProp,
      className,
      disabled: isDisabled,
      leadingIcon,
      loading,
      size,
      trailingIcon,
      variant: variantProp,
      children,
      href,
      type = 'button',
      ...buttonProps
    } = props

    return (
      <button {...buttonProps} {...appearance} type={type} disabled={disabled}>
        {content}
      </button>
    )
  }
}

function classList(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type StyledProps<Tag extends keyof JSX.IntrinsicElements> = Omit<
  Props<Tag>,
  'class' | 'className'
> & {
  class?: string
  className?: string
}

export type BadgeColor = keyof typeof badgeColors
export type BadgeProps = Omit<StyledProps<'span'>, 'color' | 'style'> & {
  color?: BadgeColor
  size?: ControlSize
  variant?: 'solid' | 'dot'
  style?: Record<string, string | number | undefined>
}

export function Badge(handle: Handle<BadgeProps>) {
  return () => {
    const {
      class: classProp,
      className,
      color = 'gray',
      size,
      variant = 'solid',
      style,
      children,
      ...props
    } = handle.props

    return (
      <span
        {...props}
        class={classList('rf-badge', classProp, className)}
        data-slot="badge"
        data-color={color}
        data-size={size}
        data-variant={variant}
        style={{ '--rf-badge-color': badgeColors[color], ...style }}
      >
        {variant === 'dot' && <span class="rf-badge-dot" aria-hidden="true" />}
        <span class="rf-badge-label">{children}</span>
      </span>
    )
  }
}

export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

export type FieldProps = Omit<StyledProps<'div'>, 'children'> & {
  children: RemixNode | ((control: FieldControlProps) => RemixNode)
  controlId?: string
  label?: RemixNode
  description?: RemixNode
  error?: RemixNode
  orientation?: 'vertical' | 'horizontal' | 'responsive'
}

export function Field(handle: Handle<FieldProps>) {
  return () => {
    const {
      class: classProp,
      className,
      children,
      controlId = handle.id + '-control',
      label,
      description,
      error,
      orientation = 'vertical',
      ...props
    } = handle.props
    const rawInvalid = (props as Record<string, unknown>)['data-invalid']
    const invalid = error || (rawInvalid != null && rawInvalid !== false && rawInvalid !== 'false')
    const structured = label != null || description != null || error != null
    const descriptionId = description ? handle.id + '-description' : undefined
    const errorId = error ? handle.id + '-error' : undefined
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ')

    return (
      <div
        {...props}
        class={classList('rf-field', classProp, className)}
        data-slot="field"
        data-orientation={orientation}
        data-invalid={invalid ? 'true' : undefined}
      >
        {!structured ? (
          typeof children === 'function' ? (
            children({ id: controlId, 'aria-invalid': invalid ? true : undefined })
          ) : (
            children
          )
        ) : (
          <>
            {label && <FieldLabel for={controlId}>{label}</FieldLabel>}
            <FieldContent>
              {typeof children === 'function'
                ? children({
                    id: controlId,
                    'aria-describedby': describedBy || undefined,
                    'aria-invalid': error ? true : undefined,
                  })
                : children}
              {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
              {error && <FieldError id={errorId}>{error}</FieldError>}
            </FieldContent>
          </>
        )}
      </div>
    )
  }
}

export function FieldLabel(handle: Handle<StyledProps<'label'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <label
        {...props}
        class={classList('rf-field-label', classProp, className)}
        data-slot="field-label"
      />
    )
  }
}

export function FieldContent(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-field-content', classProp, className)}
        data-slot="field-content"
      />
    )
  }
}

export function FieldTitle(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-field-title', classProp, className)}
        data-slot="field-title"
      />
    )
  }
}

export function FieldDescription(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <p
        {...props}
        class={classList('rf-field-description', classProp, className)}
        data-slot="field-description"
      />
    )
  }
}

export function FieldError(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, children, ...props } = handle.props
    return (
      <p
        role="alert"
        {...props}
        class={classList('rf-field-error', classProp, className)}
        data-slot="field-error"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.25"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3.5m0 2.5h.01" />
        </svg>
        {children}
      </p>
    )
  }
}

export function FieldGroup(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-field-group', classProp, className)}
        data-slot="field-group"
      />
    )
  }
}

export function FieldSeparator(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, children, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-field-separator', classProp, className)}
        data-slot="field-separator"
        role={children == null ? 'separator' : undefined}
        data-content={children ? 'true' : undefined}
      >
        {children != null && children !== false && <span>{children}</span>}
      </div>
    )
  }
}

export type FieldSetProps = StyledProps<'fieldset'> & {
  legend?: RemixNode
  legendVariant?: 'legend' | 'label'
}

export function FieldSet(handle: Handle<FieldSetProps>) {
  return () => {
    const {
      class: classProp,
      className,
      legend,
      legendVariant = 'legend',
      children,
      ...props
    } = handle.props
    return (
      <fieldset
        {...props}
        class={classList('rf-fieldset', classProp, className)}
        data-slot="fieldset"
      >
        {legend && <legend data-variant={legendVariant}>{legend}</legend>}
        <FieldGroup>{children}</FieldGroup>
      </fieldset>
    )
  }
}

type SizedInput<PropsType> = PropsType extends object
  ? Omit<PropsType, 'size' | 'class' | 'className'> & {
      size?: ControlSize
      class?: string
      className?: string
    }
  : never

export type InputProps = SizedInput<Props<'input'>>

function stepNumberInput(event: MouseEvent, direction: 1 | -1) {
  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLButtonElement)) return
  const input = trigger.closest("[data-slot='input-number']")?.querySelector('input')
  if (!input || input.disabled || input.readOnly) return

  const before = input.value
  if (input.step === 'any') {
    const min = input.min === '' ? -Infinity : Number(input.min)
    const max = input.max === '' ? Infinity : Number(input.max)
    input.value = String(Math.min(max, Math.max(min, (Number(input.value) || 0) + direction)))
  } else if (direction === 1) input.stepUp()
  else input.stepDown()

  if (input.value !== before) {
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export function Input(handle: Handle<InputProps>) {
  const fileState = ref((element, signal) => {
    if (!(element instanceof HTMLInputElement)) return
    const sync = () => element.toggleAttribute('data-has-file', Boolean(element.files?.length))
    element.addEventListener('change', sync, { signal })
    element.form?.addEventListener('reset', () => queueMicrotask(sync), { signal })
    sync()
  })

  return () => {
    const { class: classProp, className, size, ...props } = handle.props
    const isFile = props.type === 'file'
    const input = (
      <input
        {...props}
        class={classList('rf-input', classProp, className)}
        data-slot="input"
        data-size={size}
        mix={[props.mix, isFile && fileState]}
      />
    )

    if (isFile) {
      return (
        <span class="rf-input-with-icon" data-slot="input-file" data-size={size}>
          {input}
          <Icon name="file" class="rf-input-file-icon" />
        </span>
      )
    }

    if (props.type === 'number') {
      return (
        <span class="rf-input-with-icon" data-slot="input-number" data-size={size}>
          {input}
          <span class="rf-input-steppers">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                tabIndex={-1}
                aria-label={direction === 1 ? 'Increase' : 'Decrease'}
                disabled={props.disabled || props.readOnly}
                mix={[
                  on('mousedown', (event) => event.preventDefault()),
                  on('click', (event) => stepNumberInput(event, direction)),
                ]}
              >
                <Icon name={direction === 1 ? 'plus' : 'minus'} />
              </button>
            ))}
          </span>
        </span>
      )
    }

    return input
  }
}

export type TextareaProps = StyledProps<'textarea'> & {
  size?: ControlSize
  autoResize?: boolean
}

export function Textarea(handle: Handle<TextareaProps>) {
  return () => {
    const {
      class: classProp,
      className,
      autoResize = true,
      rows = 3,
      size,
      style,
      ...props
    } = handle.props
    const rowCount = Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : 3
    const rowStyle =
      typeof style === 'string'
        ? `--rf-textarea-rows:${rowCount};${style}`
        : { '--rf-textarea-rows': rowCount, ...style }

    return (
      <textarea
        {...props}
        class={classList('rf-input', 'rf-textarea', classProp, className)}
        rows={rowCount}
        style={rowStyle}
        data-slot="textarea"
        data-size={size}
        data-autoresize={autoResize || undefined}
      />
    )
  }
}

type ChoiceProps = Omit<StyledProps<'input'>, 'size' | 'type' | 'role' | 'children'> & {
  size?: ControlSize
  label?: RemixNode
  onCheckedChange?: (checked: boolean, event: Event) => void
}

export type CheckboxProps = ChoiceProps
export type SwitchProps = Omit<ChoiceProps, 'indeterminate'>

export function Checkbox(handle: Handle<CheckboxProps>) {
  return () => {
    const {
      class: classProp,
      className,
      size,
      label,
      mix,
      indeterminate,
      checked,
      defaultChecked,
      onCheckedChange,
      ...props
    } = handle.props

    const Root = label == null ? 'span' : 'label'
    return (
      <Root class={classList('rf-choice', 'rf-checkbox', classProp, className)} data-size={size}>
        <input
          {...props}
          {...(defaultChecked === undefined ? {} : { defaultChecked })}
          {...(checked === undefined ? {} : { checked })}
          type="checkbox"
          data-slot="checkbox"
          aria-checked={indeterminate ? 'mixed' : undefined}
          aria-readonly={props.readOnly || undefined}
          indeterminate={indeterminate}
          mix={[
            props.readOnly && on('click', (event) => event.preventDefault()),
            onCheckedChange &&
              on<HTMLInputElement, 'change'>('change', (event) => {
                onCheckedChange(event.currentTarget.checked, event)
              }),
            mix,
          ]}
        />
        <span class="rf-checkbox-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path class="rf-checkbox-check" d="M6 12l4 4 8-8" pathLength="1" />
            <path class="rf-checkbox-dash" d="M6 12h12" />
          </svg>
        </span>
        {label != null && <span class="rf-choice-label">{label}</span>}
      </Root>
    )
  }
}

export function Switch(handle: Handle<SwitchProps>) {
  let pointer:
    | {
        id: number
        startX: number
        startOffset: number
        scale: number
        travel: number
        offset?: number
        track: HTMLElement
      }
    | undefined
  let nextChecked: boolean | undefined

  function clearDrag() {
    pointer?.track.removeAttribute('data-dragging')
    pointer?.track.style.removeProperty('--rf-switch-position')
    pointer = undefined
  }

  return () => {
    const {
      class: classProp,
      className,
      size,
      label,
      mix,
      checked,
      defaultChecked,
      onCheckedChange,
      ...props
    } = handle.props
    const Root = label == null ? 'span' : 'label'

    return (
      <Root class={classList('rf-choice', 'rf-switch', classProp, className)} data-size={size}>
        <input
          {...props}
          {...(defaultChecked === undefined ? {} : { defaultChecked })}
          {...(checked === undefined ? {} : { checked })}
          type="checkbox"
          role="switch"
          data-slot="switch"
          aria-readonly={props.readOnly || undefined}
          mix={[
            on<HTMLInputElement, 'pointerdown'>('pointerdown', (event) => {
              nextChecked = undefined
              if (!event.isPrimary || event.button !== 0 || props.readOnly) return

              const track = event.currentTarget.nextElementSibling
              if (!(track instanceof HTMLElement)) return
              const thumb = track.firstElementChild
              if (!(thumb instanceof HTMLElement)) return
              const bounds = track.getBoundingClientRect()
              if (event.clientX < bounds.left || event.clientX > bounds.right) return

              const scale = bounds.width / track.offsetWidth || 1
              const pressSize =
                parseFloat(getComputedStyle(track).getPropertyValue('--rf-switch-press-size')) || 0
              pointer = {
                id: event.pointerId,
                startX: event.clientX,
                // Start at the painted position, including during an interrupted toggle.
                startOffset:
                  (thumb.getBoundingClientRect().left - bounds.left) / scale - thumb.offsetLeft,
                scale,
                travel: Math.max(0, track.offsetWidth - track.offsetHeight - pressSize),
                track,
              }
              event.currentTarget.setPointerCapture(event.pointerId)
            }),
            on<HTMLInputElement, 'pointermove'>('pointermove', (event) => {
              if (!pointer || event.pointerId !== pointer.id) return
              const delta = event.clientX - pointer.startX
              if (pointer.offset === undefined && Math.abs(delta) < 2) return
              pointer.offset = Math.min(
                pointer.travel,
                Math.max(0, pointer.startOffset + delta / pointer.scale),
              )
              pointer.track.style.setProperty('--rf-switch-position', pointer.offset + 'px')
              pointer.track.setAttribute('data-dragging', '')
            }),
            on<HTMLInputElement, 'pointerup'>('pointerup', (event) => {
              if (!pointer || event.pointerId !== pointer.id) return
              if (pointer.offset !== undefined) nextChecked = pointer.offset > pointer.travel / 2
              clearDrag()
            }),
            on('lostpointercapture', clearDrag),
            on('pointercancel', clearDrag),
            on<HTMLInputElement, 'click'>('click', (event) => {
              const desired = nextChecked
              nextChecked = undefined
              // The checkbox's native activation toggles its value before click.
              // Cancel that toggle when the drag settled on the current value.
              if (
                props.readOnly ||
                (event.detail > 0 &&
                  desired !== undefined &&
                  event.currentTarget.checked !== desired)
              ) {
                event.preventDefault()
              }
            }),
            onCheckedChange &&
              on<HTMLInputElement, 'change'>('change', (event) => {
                onCheckedChange(event.currentTarget.checked, event)
              }),
            mix,
          ]}
        />
        <span class="rf-switch-track" aria-hidden="true">
          <span class="rf-switch-thumb" />
        </span>
        {label != null && <span class="rf-choice-label">{label}</span>}
      </Root>
    )
  }
}

export type BannerStatus = 'default' | 'info' | 'success' | 'warning' | 'error'

export type BannerProps = StyledProps<'div'> & {
  status?: BannerStatus
  contrast?: 'low' | 'high'
  variant?: 'inline' | 'fixed'
  size?: ControlSize
  icon?: RemixNode
  dismissible?: boolean
  dismissLabel?: string
  open?: boolean
  onDismiss?: () => void
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Where keyboard focus goes when a banner holding it closes, as in the
 *  reference: the first focusable element after it, else the last before it. */
function focusNeighbour(banner: Element) {
  const candidates = Array.from(
    banner.ownerDocument.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((node) => !banner.contains(node) && !node.closest('[inert]') && node.checkVisibility())
  const after = candidates.find(
    (node) => banner.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
  )
  const before = candidates
    .filter((node) => banner.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING)
    .pop()
  ;(after ?? before)?.focus({ preventScroll: true })
}

export function Banner(handle: Handle<BannerProps>) {
  let dismissed = false
  let root: Element | null = null
  let wasVisible = true
  // Set when the dismiss button held focus, so the close hands it on.
  let handOff = false
  const rootRef = ref((node) => {
    root = node
  })

  return () => {
    const {
      class: classProp,
      className,
      status = 'default',
      contrast = 'low',
      variant = 'inline',
      size,
      icon,
      dismissible,
      dismissLabel = 'Dismiss',
      open,
      onDismiss,
      role,
      children,
      ...props
    } = handle.props
    const visible = open ?? !dismissed
    if (wasVisible && !visible && handOff) {
      handOff = false
      handle.queueTask(() => {
        if (root) focusNeighbour(root)
      })
    }
    if (visible) handOff = false
    wasVisible = visible

    return (
      <div
        class="rf-banner-collapse"
        data-open={visible ? 'true' : 'false'}
        data-variant={variant}
        mix={rootRef}
      >
        <div class="rf-banner-overflow" inert={!visible} aria-hidden={!visible || undefined}>
          <div
            {...props}
            class={classList('rf-banner', classProp, className)}
            data-slot="banner"
            data-size={size}
            data-status={status}
            data-contrast={contrast}
            role={role ?? (status === 'error' || status === 'warning' ? 'alert' : 'status')}
          >
            <span class="rf-banner-icon" aria-hidden="true">
              {icon ?? statusIcon(status)}
            </span>
            <div class="rf-banner-content">{children}</div>
            {dismissible && (
              <button
                type="button"
                class="rf-banner-dismiss"
                aria-label={dismissLabel}
                mix={on('click', (event) => {
                  handOff = event.currentTarget === document.activeElement
                  onDismiss?.()
                  if (open === undefined) {
                    dismissed = true
                    handle.update()
                  }
                })}
              >
                <Icon name="x" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export function BannerTitle(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <p
        {...props}
        class={classList('rf-banner-title', classProp, className)}
        data-slot="banner-title"
      />
    )
  }
}

export function BannerDescription(handle: Handle<StyledProps<'p'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <p
        {...props}
        class={classList('rf-banner-description', classProp, className)}
        data-slot="banner-description"
      />
    )
  }
}

export function BannerActions(handle: Handle<StyledProps<'div'>>) {
  return () => {
    const { class: classProp, className, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-banner-actions', classProp, className)}
        data-slot="banner-actions"
      />
    )
  }
}

export function BannerAction(handle: Handle<ButtonProps>) {
  return () => <Button variant="secondary" size="compact" {...handle.props} />
}

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

export type TableProps = StyledProps<'table'> & {
  size?: ControlSize
  fluidHover?: boolean
}

export function Table(handle: Handle<TableProps>) {
  return () => {
    const { class: classProp, className, size, fluidHover: hover = true, ...props } = handle.props
    return (
      <div
        class="rf-table-container"
        data-size={size}
        data-row-hover={hover || undefined}
        mix={hover && fluidHover({ fastHover: true })}
      >
        {hover && (
          <span class="rf-highlight rf-table-highlight" aria-hidden="true" data-rf-hover-layer />
        )}
        <table {...props} class={classList('rf-table', classProp, className)} data-slot="table" />
      </div>
    )
  }
}

export function TableHeader(handle: Handle<Props<'thead'>>) {
  return () => <thead {...handle.props} data-slot="table-header" />
}

export function TableBody(handle: Handle<Props<'tbody'>>) {
  return () => <tbody {...handle.props} data-slot="table-body" />
}

export type TableRowProps = StyledProps<'tr'> & { selected?: boolean; hover?: boolean }

export function TableRow(handle: Handle<TableRowProps>) {
  return () => {
    const { class: classProp, className, selected, hover = true, ...props } = handle.props
    return (
      <tr
        {...props}
        class={classList('rf-table-row', classProp, className)}
        data-slot="table-row"
        data-rf-hover-item={hover || undefined}
        data-selected={selected || undefined}
      />
    )
  }
}

export function TableHead(handle: Handle<Props<'th'>>) {
  return () => <th scope="col" {...handle.props} data-slot="table-head" />
}

export function TableCell(handle: Handle<Props<'td'>>) {
  return () => <td {...handle.props} data-slot="table-cell" />
}

export type TableEmptyProps = {
  colSpan: number
  title?: RemixNode
  description?: RemixNode
  action?: RemixNode
}

export function TableEmpty(handle: Handle<TableEmptyProps>) {
  return () => {
    const { colSpan, title = 'No results', description, action } = handle.props
    return (
      <tr data-slot="table-empty">
        <td colSpan={colSpan} class="rf-table-empty-cell" data-slot="table-cell">
          <div class="rf-table-empty">
            <span class="rf-table-empty-title">{title}</span>
            {description && <span class="rf-table-empty-description">{description}</span>}
            {action && <div class="rf-table-empty-action">{action}</div>}
          </div>
        </td>
      </tr>
    )
  }
}

export type InputCopyProps = Omit<StyledProps<'div'>, 'children'> & {
  value: string
  label?: string
  onCopy?: () => void
  disabled?: boolean
  variant?: 'icon' | 'button'
  align?: 'left' | 'right'
  size?: ControlSize
}

export function InputCopy(handle: Handle<InputCopyProps>) {
  let state: 'idle' | 'copied' | 'error' = 'idle'
  // "idle" = normal tooltip behaviour, "copied" = forced open, "suppressed" = forced closed.
  let tooltipState: 'idle' | 'copied' | 'suppressed' = 'idle'
  let tooltipVisible = false
  let tooltipWasVisible = false
  // The glyph lags the state by one exit: the old one shrinks out, then the
  // new one grows in (a wait-mode swap on the fast tier).
  let glyph: 'idle' | 'copied' | 'error' = 'idle'
  let glyphKey = 0
  let phase: 'exit' | 'enter' | undefined
  let request = 0
  let reset: ReturnType<typeof setTimeout> | undefined
  let swapTimer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(reset)
      clearTimeout(swapTimer)
    },
    { once: true },
  )

  function swap() {
    clearTimeout(swapTimer)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      glyph = state
      glyphKey++
      phase = undefined
      handle.update()
      return
    }
    phase = 'exit'
    handle.update()
    swapTimer = setTimeout(() => {
      glyph = state
      glyphKey++
      phase = 'enter'
      handle.update()
    }, 115)
  }

  async function copy() {
    const { value, disabled } = handle.props
    if (disabled) return

    const operation = ++request
    clearTimeout(reset)
    let copied = false
    try {
      await navigator.clipboard.writeText(value)
      copied = true
    } catch {
      // The value becomes selectable when browser clipboard access is unavailable.
    }

    if (handle.signal.aborted || operation !== request) return
    state = copied ? 'copied' : 'error'
    // The tooltip says "Copied" only if it was showing when the press began;
    // a click never summons a tooltip the user was not reading.
    tooltipState = tooltipWasVisible ? 'copied' : 'suppressed'
    swap()
    reset = setTimeout(() => {
      state = 'idle'
      // Stay closed until the pointer leaves and returns, so the tooltip does
      // not reopen as "Copy to clipboard" under a resting cursor.
      tooltipState = 'suppressed'
      swap()
    }, 2000)

    if (copied) handle.props.onCopy?.()
  }

  return () => {
    const {
      class: classProp,
      className,
      value,
      label,
      disabled,
      onCopy,
      size,
      variant = 'icon',
      align = 'right',
      ...props
    } = handle.props
    const valueId = handle.id + '-value'
    const buttonLabel = label ? 'Copy ' + label : 'Copy value'
    const feedback = state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : 'Copy'
    const action = (
      <span class="rf-copy-action" aria-hidden="true">
        <span class="rf-copy-glyph" key={glyphKey} data-glyph={glyph} data-phase={phase}>
          {glyph === 'idle' ? (
            <Icon name="copy" size={14} />
          ) : (
            <svg viewBox="2 4 20 16" width="14" height="14" fill="none" data-result>
              <path
                d={glyph === 'copied' ? 'M6 12L10 16L18 8' : 'M9 9L15 15M15 9L9 15'}
                pathLength="1"
              />
            </svg>
          )}
          {variant === 'button' && (
            <span class="rf-copy-feedback">
              <span aria-hidden="true">Copied</span>
              <span>{glyph === 'error' ? 'Failed' : glyph === 'copied' ? 'Copied' : 'Copy'}</span>
            </span>
          )}
        </span>
      </span>
    )

    return (
      <div
        {...props}
        class={classList('rf-input-copy', classProp, className)}
        data-slot="input-copy"
        data-size={size}
        data-state={state}
        data-align={align}
        data-disabled={disabled || undefined}
      >
        {label && <span class="rf-copy-label">{label}</span>}
        {(() => {
          const row = (extra?: { 'aria-describedby': string; mix: MixInput }) => (
            <button
              type="button"
              class="rf-copy-row"
              aria-label={
                state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : buttonLabel
              }
              aria-describedby={extra ? valueId + ' ' + extra['aria-describedby'] : valueId}
              disabled={disabled}
              mix={[
                // Captured before the tooltip closes on press.
                on('pointerdown', () => {
                  tooltipWasVisible = tooltipVisible
                }),
                on('pointerenter', () => {
                  if (tooltipState === 'suppressed') {
                    tooltipState = 'idle'
                    handle.update()
                  }
                }),
                on('pointerleave', () => {
                  if (tooltipState === 'copied') {
                    tooltipState = 'suppressed'
                    handle.update()
                  }
                }),
                on('click', copy),
                ...(extra ? [extra.mix] : []),
              ]}
            >
              {align === 'left' && action}
              <span id={valueId} class="rf-copy-value">
                <mark>{value}</mark>
              </span>
              {align === 'right' && action}
            </button>
          )
          return variant === 'icon' ? (
            <Tooltip
              content={
                tooltipState === 'idle'
                  ? 'Copy to clipboard'
                  : state === 'error'
                    ? 'Copy failed'
                    : 'Copied'
              }
              open={
                tooltipState === 'copied' ? true : tooltipState === 'suppressed' ? false : undefined
              }
              onOpenChange={(open) => {
                tooltipVisible = open
              }}
              delayDuration={500}
              sideOffset={2}
              renderTrigger={row}
            />
          ) : (
            row()
          )
        })()}
        <span class="rf-basic-sr-only" role="status">
          {state === 'idle' ? '' : feedback}
        </span>
      </div>
    )
  }
}

export type InputGroupProps = StyledProps<'div'> & {
  size?: ControlSize
}

export function InputGroup(handle: Handle<InputGroupProps>) {
  return () => {
    const { class: classProp, className, size, mix, children, ...props } = handle.props
    return (
      <div
        {...props}
        class={classList('rf-input-group', classProp, className)}
        data-slot="input-group"
        data-size={size}
        mix={[fluidHover({ nearest: true }), mix]}
      >
        {children}
      </div>
    )
  }
}

type InputFieldAttributes<Input> = Input extends object
  ? Omit<Input, 'children' | 'id'> & {
      id?: string
      label: string
      labelHidden?: boolean
      description?: RemixNode
      error?: RemixNode
      icon?: RemixNode
      onChange?: (value: string, event: Event) => void
    }
  : never

export type InputFieldProps = InputFieldAttributes<InputProps>

export function InputField(handle: Handle<InputFieldProps>) {
  return () => {
    const {
      class: classProp,
      className,
      id,
      label,
      labelHidden,
      description,
      error,
      icon,
      onChange,
      mix,
      'aria-describedby': describedBy,
      'aria-invalid': invalid,
      ...props
    } = handle.props

    return (
      <Field
        class={classList('rf-input-field', classProp, className)}
        aria-disabled={props.disabled || undefined}
        controlId={id}
        label={labelHidden ? <span class="rf-basic-sr-only">{label}</span> : label}
        description={description}
        error={error}
      >
        {(control) => (
          <div
            class="rf-input-field-control"
            data-rf-hover-item
            aria-disabled={props.disabled || undefined}
            mix={on<HTMLDivElement, 'mousedown'>('mousedown', (event) => {
              // A click anywhere on the row (icon, padding) focuses the input.
              const input = event.currentTarget.querySelector('input')
              if (!input || event.target === input) return
              event.preventDefault()
              input.focus()
            })}
          >
            {icon && (
              <span class="rf-input-field-icon" aria-hidden="true">
                {icon}
              </span>
            )}
            <Input
              {...props}
              {...control}
              aria-describedby={
                [describedBy, control['aria-describedby']].filter(Boolean).join(' ') || undefined
              }
              aria-invalid={control['aria-invalid'] ?? invalid}
              mix={[
                onChange &&
                  on<HTMLInputElement, 'input'>('input', (event) => {
                    onChange(event.currentTarget.value, event)
                  }),
                mix,
              ]}
            />
          </div>
        )}
      </Field>
    )
  }
}
