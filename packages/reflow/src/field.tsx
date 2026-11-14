import type { Handle, RemixNode } from 'remix/component'
import { classList, type StyledProps } from './systems/styling.ts'

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
