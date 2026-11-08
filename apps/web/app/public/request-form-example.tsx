import { on, type Handle } from 'remix/component'
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldSet,
  Input,
  Select,
  Textarea,
} from '@rtzll/reflow'

const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Public']
const options = stages.map((stage) => ({ value: stage, label: stage }))
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface RequestFormProps {
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  description?: boolean
  error?: boolean
}

export function RequestFormExample(handle: Handle<RequestFormProps>) {
  let errors: Partial<Record<'company' | 'email' | 'conduct', string>> = {}
  let sent = false

  return () => {
    const { orientation = 'vertical', description = true, error = false } = handle.props
    return (
      <form
        class="doc-request-form"
        noValidate
        mix={on<HTMLFormElement, 'submit'>('submit', (event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const email = String(data.get('email') ?? '').trim()
          errors = {}
          if (!String(data.get('company') ?? '').trim()) errors.company = 'Company is required'
          if (!email) errors.email = 'Work email is required'
          else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address'
          if (!data.has('conduct')) errors.conduct = 'Required to join the event'
          sent = Object.keys(errors).length === 0
          handle.update()
        })}
      >
        <FieldSet legend="Request to join">
          {description && (
            <FieldDescription>We read every request before the event.</FieldDescription>
          )}
          <Field label="Company *" orientation={orientation} error={errors.company}>
            {(control) => <Input {...control} name="company" required />}
          </Field>
          <Field
            label="Work email address *"
            orientation={orientation}
            error={errors.email ?? (error ? 'Enter a valid email address' : undefined)}
          >
            {(control) => (
              <Input
                {...control}
                type="email"
                name="email"
                placeholder="you@company.com"
                required
              />
            )}
          </Field>
          <Field label="What stage is your company at?" orientation={orientation}>
            {(control) => (
              <Select
                {...control}
                label="What stage is your company at?"
                name="stage"
                placeholder="Select an option"
                options={options}
              />
            )}
          </Field>
          <Field error={errors.conduct}>
            {(control) => (
              <Checkbox
                {...control}
                label="I agree to the code of conduct *"
                name="conduct"
                required
              />
            )}
          </Field>
          <Field label="Is there anything else you'd like us to know?" orientation={orientation}>
            {(control) => <Textarea {...control} name="notes" rows={3} />}
          </Field>
        </FieldSet>
        <Button type="submit">Request to Join</Button>
        {sent && (
          <p class="example-note" role="status">
            Request submitted.
          </p>
        )}
      </form>
    )
  }
}

export function requestFormCode({
  orientation = 'vertical',
  description = true,
  error = false,
}: RequestFormProps = {}) {
  const layout = orientation === 'vertical' ? '' : ` orientation="${orientation}"`
  return `const options = ${JSON.stringify(options)}
let errors: Partial<Record<'company' | 'email' | 'conduct', string>> = {}
let sent = false
const submit = on('submit', (event) => {
  event.preventDefault()
  const data = new FormData(event.currentTarget as HTMLFormElement)
  const email = String(data.get('email') ?? '').trim()
  errors = {}
  if (!String(data.get('company') ?? '').trim()) errors.company = 'Company is required'
  if (!email) errors.email = 'Work email is required'
  else if (!${emailPattern}.test(email)) errors.email = 'Enter a valid email address'
  if (!data.has('conduct')) errors.conduct = 'Required to join the event'
  sent = Object.keys(errors).length === 0
  handle.update()
})

<form noValidate mix={submit} style={{ display: 'grid', gap: '24px', width: 'min(100%, 384px)' }}>
  <FieldSet legend="Request to join">${description ? '\n    <FieldDescription>We read every request before the event.</FieldDescription>' : ''}
    <Field label="Company *"${layout} error={errors.company}>
      {(control) => <Input {...control} name="company" required />}
    </Field>
    <Field label="Work email address *"${layout} error={errors.email${error ? " ?? 'Enter a valid email address'" : ''}}>
      {(control) => <Input {...control} type="email" name="email" placeholder="you@company.com" required />}
    </Field>
    <Field label="What stage is your company at?"${layout}>
      {(control) => <Select {...control} label="What stage is your company at?" name="stage" placeholder="Select an option" options={options} />}
    </Field>
    <Field error={errors.conduct}>
      {(control) => <Checkbox {...control} label="I agree to the code of conduct *" name="conduct" required />}
    </Field>
    <Field label="Is there anything else you'd like us to know?"${layout}>
      {(control) => <Textarea {...control} name="notes" rows={3} />}
    </Field>
  </FieldSet>
  <Button type="submit">Request to Join</Button>
  {sent && <p role="status">Request submitted.</p>}
</form>`
}
