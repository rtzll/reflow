import { Icon } from './icon.tsx'
import { on, type Handle, type RemixNode } from 'remix/component'
import { Badge, type BadgeColor } from './badge.tsx'
import type { ControlSize } from './systems/styling.ts'
import { Accordion } from './accordion.tsx'

export interface ThinkingStep {
  value: string
  title: string
  description?: string
  content?: RemixNode
  icon?: RemixNode
  status?: 'pending' | 'active' | 'complete'
}

export interface ThinkingStepsProps {
  steps?: readonly ThinkingStep[]
  /** Custom disclosure heading. Keep its contents non-interactive. */
  heading?: RemixNode
  /** Custom disclosure body, in place of the generated steps. */
  children?: RemixNode
  defaultValue?: string
  label?: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'accordion' | 'timeline'
  size?: ControlSize
}

export function ThinkingSteps(handle: Handle<ThinkingStepsProps>) {
  let localOpen = handle.props.defaultOpen ?? handle.props.variant === 'timeline'
  return () => {
    const {
      steps = [],
      label,
      heading,
      children,
      open,
      onOpenChange,
      defaultValue,
      variant,
      size,
    } = handle.props
    const expanded = open ?? localOpen
    const timeline = variant === 'timeline'
    const list =
      children ??
      (timeline ? (
        <ol class="rf-thinking-timeline">
          {steps
            .filter((step) => step.status !== 'pending')
            .map((step) => (
              <li key={step.value} data-status={step.status ?? 'complete'}>
                <div class="rf-thinking-step-body">
                  <span class="rf-thinking-timeline-icon" aria-hidden="true">
                    {step.icon ?? <span class="rf-thinking-timeline-dot" />}
                  </span>
                  <div class="rf-thinking-timeline-row">
                    <span class="rf-thinking-timeline-title">
                      {step.title}
                      {step.status === 'active' && !step.title.endsWith('…') ? '…' : ''}
                    </span>
                    <span class="rf-basic-sr-only"> ({step.status ?? 'complete'})</span>
                    {step.description && (
                      <span class="rf-thinking-timeline-description">{step.description}</span>
                    )}
                    {step.content != null && (
                      <div class="rf-thinking-timeline-content">{step.content}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
        </ol>
      ) : (
        <Accordion
          defaultValue={defaultValue}
          items={steps.map((step) => ({
            ...step,
            content: step.content,
            title: (
              <span class="rf-step-title" data-status={step.status ?? 'pending'}>
                <span aria-hidden="true">{step.status === 'complete' ? '✓' : '○'}</span>
                {step.title}
                <span class="rf-basic-sr-only"> ({step.status ?? 'pending'})</span>
              </span>
            ),
          }))}
        />
      ))
    return label || heading != null ? (
      <details
        class="rf-thinking-steps rf-thinking-steps-disclosure"
        data-variant={variant}
        data-density={size}
        open={expanded}
      >
        <summary
          aria-label={heading != null ? label : undefined}
          mix={on('click', (event) => {
            event.preventDefault()
            if (open === undefined) localOpen = !expanded
            onOpenChange?.(!expanded)
            handle.update()
          })}
        >
          {heading ??
            (timeline ? (
              <span class="rf-thinking-disclosure-label">
                <span aria-hidden="true">{label}</span>
                <span>{label}</span>
              </span>
            ) : (
              label
            ))}
          <Icon name="chevron-right" />
        </summary>
        {list}
      </details>
    ) : (
      <div class="rf-thinking-steps" data-variant={variant} data-density={size}>
        {list}
      </div>
    )
  }
}

/** A step's secondary disclosure, with native keyboard and no-script behavior. */
export function ThinkingStepDetails(
  handle: Handle<{
    summary: string
    details?: readonly string[]
    defaultOpen?: boolean
    children?: RemixNode
  }>,
) {
  let open = handle.props.defaultOpen ?? false
  return () => {
    const { summary, details, children } = handle.props
    return (
      <details class="rf-thinking-step-details" open={open}>
        <summary
          mix={on('click', (event) => {
            event.preventDefault()
            open = !open
            handle.update()
          })}
        >
          {summary}
        </summary>
        {details && (
          <ul>
            {details.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        )}
        {children}
      </details>
    )
  }
}

export function ThinkingStepSources(handle: Handle<{ children: RemixNode }>) {
  return () => <div class="rf-thinking-step-sources">{handle.props.children}</div>
}

export function ThinkingStepSource(
  handle: Handle<{ children: RemixNode; href?: string; color?: BadgeColor; delay?: number }>,
) {
  return () => {
    const { children, href, color = 'gray', delay = 0 } = handle.props
    const badge = (
      <Badge size="compact" variant="solid" color={color}>
        {children}
      </Badge>
    )
    const style = { '--rf-thinking-part-delay': `${Math.max(0, delay)}ms` }
    return href ? (
      <a href={href} class="rf-thinking-step-source" style={style}>
        {badge}
      </a>
    ) : (
      <span class="rf-thinking-step-source" style={style}>
        {badge}
      </span>
    )
  }
}

export function ThinkingStepImage(
  handle: Handle<{
    src: string
    alt?: string
    caption?: string
    width?: number
    height?: number
    delay?: number
  }>,
) {
  return () => {
    const { src, alt = '', caption, width, height, delay = 0 } = handle.props
    return (
      <figure
        class="rf-thinking-step-image"
        style={{ '--rf-thinking-part-delay': `${Math.max(0, delay)}ms` }}
      >
        <img src={src} alt={alt} width={width} height={height} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    )
  }
}
