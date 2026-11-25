import {
  Button,
  Checkbox,
  CheckboxGroup,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  FileInput,
  Icon,
  Input,
  InputCopy,
  InputField,
  InputGroup,
  NumberField,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Textarea,
  type ButtonVariant,
  type IconName,
} from '@rtzll/reflow'
import { on, type Handle, type RemixNode } from 'remix/component'
import { componentOptions } from '../component-example-data.ts'
import { SegmentedControlDemo } from '../segmented-control-example.tsx'
import { playCopySuccess } from '../showcase-sound.ts'
import { SoundCombobox } from '../sound-combobox.tsx'

export const formDemoSlugs = new Set([
  'button',
  'checkbox',
  'checkbox-group',
  'combobox',
  'field',
  'file-input',
  'input',
  'input-copy',
  'input-group',
  'number-field',
  'radio-group',
  'segmented-control',
  'select',
  'slider',
  'switch',
  'textarea',
])

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'solid', label: 'SolidStart' },
  { value: 'qwik', label: 'Qwik City' },
]

const views = (
  [
    ['Shared with me', 'message-circle'],
    ['Starred', 'check'],
    ['Recent', 'calendar'],
    ['Private', 'lock'],
    ['Inbox', 'mail'],
  ] as const
).map(([label, name]) => ({ value: label.toLowerCase(), label, icon: <Icon name={name} /> }))

const fruits = [
  'Apple',
  'Banana',
  'Cherry',
  'Grape',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Strawberry',
]

function icon(name: IconName = 'plus') {
  return <Icon name={name} />
}

export function FormDemos(handle: Handle<{ slug: string; variant: string }>) {
  let selections = ['email']
  let output = ''
  let copyCount = 0
  let enabled = false
  let loading = false
  let timeout: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true })

  const say = (value: string) => {
    output = value
    handle.update()
  }
  const loadingClick = on<HTMLButtonElement, 'click'>('click', () => {
    loading = true
    handle.update()
    timeout = setTimeout(() => {
      loading = false
      handle.update()
    }, 1500)
  })

  return () => {
    const { slug, variant } = handle.props
    const options = fruits.map((label) => ({ value: label.toLowerCase(), label }))
    const formSubmit = on<HTMLFormElement, 'submit'>('submit', (event) => {
      event.preventDefault()
      say('Thanks. Your message has been received.')
    })
    const feedback = (
      <output class="doc-demo-feedback" aria-live="polite">
        {output}
      </output>
    )
    const width = (children: RemixNode, wide = false) => (
      <div class={wide ? 'doc-demo-wide' : 'doc-demo-column'}>{children}</div>
    )

    switch (slug) {
      case 'button':
        if (variant === 'variants')
          return (
            <div class="doc-demo-stack">
              <div class="doc-demo-row">
                {(
                  ['primary', 'secondary', 'tertiary', 'ghost', 'destructive'] as ButtonVariant[]
                ).map((value) => (
                  <Button key={value} variant={value}>
                    {value === 'destructive' ? 'Delete' : value[0].toUpperCase() + value.slice(1)}
                  </Button>
                ))}
              </div>
              <div class="doc-demo-stack">
                {(
                  ['primary', 'secondary', 'tertiary', 'ghost', 'destructive'] as ButtonVariant[]
                ).map((value) => (
                  <Button key={value} variant={value} style={{ width: '100%' }}>
                    {value === 'destructive' ? 'Delete' : value[0].toUpperCase() + value.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )
        if (variant === 'icons')
          return (
            <div class="doc-demo-row">
              <Button leadingIcon={icon()}>Create</Button>
              <Button variant="secondary" trailingIcon={icon('arrow-right')}>
                Next
              </Button>
              <Button size="icon" aria-label="Search">
                {icon('search')}
              </Button>
            </div>
          )
        if (variant === 'loading')
          return (
            <div class="doc-demo-row">
              <Button loading={loading} mix={loadingClick}>
                Click me
              </Button>
              <Button variant="secondary" loading>
                Saving
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          )
        return (
          <div class="doc-demo-row">
            <Button>Default</Button>
            <Button size="compact">Compact</Button>
          </div>
        )
      case 'checkbox':
        return width(
          variant === 'description' ? (
            <Field description="One email a month, never more.">
              {(control) => <Checkbox {...control} label="Product updates" defaultChecked />}
            </Field>
          ) : (
            <div class="doc-demo-stack">
              <Field error="Required to join the event">
                {(control) => <Checkbox {...control} label="I agree to the code of conduct" />}
              </Field>
              <Checkbox label="Managed by your admin" disabled defaultChecked />
              <Checkbox label="Mixed selection" indeterminate />
            </div>
          ),
        )
      case 'checkbox-group':
        return width(
          <>
            <CheckboxGroup
              label="Notifications"
              options={[
                {
                  value: 'email',
                  label: 'Email',
                  description: variant === 'descriptions' ? 'Updates in your inbox' : undefined,
                },
                {
                  value: 'push',
                  label: 'Push',
                  description:
                    variant === 'descriptions' ? 'Notifications on your device' : undefined,
                },
              ]}
              value={variant === 'controlled' ? selections : undefined}
              onValueChange={(value) => {
                selections = value
                handle.update()
              }}
            />
            {variant === 'controlled' && (
              <output class="doc-demo-feedback">
                Selected · {selections.join(', ') || 'none'}
              </output>
            )}
          </>,
        )
      case 'combobox': {
        const components = variant === 'create' || variant === 'hide'
        const multiple = variant === 'multiple' || components
        const choices =
          variant === 'icons'
            ? views
            : variant === 'long'
              ? Intl.supportedValuesOf('timeZone').map((label) => ({ value: label, label }))
              : components
                ? componentOptions
                : frameworks
        const label =
          variant === 'icons'
            ? 'View'
            : variant === 'long'
              ? 'Timezone'
              : components
                ? 'Components'
                : 'Framework'
        return width(
          <div class="doc-demo-stack">
            <div class={variant === 'error' || variant === 'variants' ? 'doc-demo-row' : undefined}>
              <div>
                <SoundCombobox
                  label={label}
                  options={choices}
                  multiple={multiple}
                  leadingIcon={variant === 'icons' ? <Icon name="search" /> : undefined}
                  placeholder={
                    variant === 'icons'
                      ? 'Jump to view…'
                      : variant === 'long'
                        ? 'Select a timezone…'
                        : components
                          ? 'Add components…'
                          : 'Select a framework…'
                  }
                  defaultValues={
                    multiple ? (components ? ['button', 'combobox'] : ['next', 'astro']) : undefined
                  }
                  error={variant === 'error'}
                  hideSelected={variant === 'hide'}
                  creatable={variant === 'create'}
                  onCreate={(value) => say(`Created ${value}`)}
                />
                {variant === 'error' && (
                  <p class="doc-combobox-error">Pick a framework to continue.</p>
                )}
              </div>
              {variant === 'error' && (
                <SoundCombobox
                  label="Disabled framework"
                  options={frameworks}
                  placeholder="Disabled"
                  disabled
                />
              )}
              {variant === 'variants' && (
                <SoundCombobox
                  label="Ghost framework"
                  options={frameworks}
                  placeholder="Select a framework…"
                  variant="ghost"
                />
              )}
            </div>
            {feedback}
          </div>,
        )
      }
      case 'select': {
        if (variant === 'groups')
          return width(
            <Select
              label="Settings"
              placeholder="Settings…"
              options={[
                { value: 'profile', label: 'Profile', group: 'Account', icon: icon('circle') },
                { value: 'email', label: 'Email', group: 'Account', icon: icon('mail') },
                {
                  value: 'notifications',
                  label: 'Notifications',
                  group: 'Preferences',
                  icon: icon('bell'),
                },
                { value: 'privacy', label: 'Privacy', group: 'Preferences', icon: icon('shield') },
              ]}
            />,
          )
        if (variant === 'error')
          return width(
            <Field label="Role" error="Please select a role to continue.">
              {(control) => (
                <Select
                  {...control}
                  label="Role"
                  placeholder="Select a role…"
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                />
              )}
            </Field>,
          )
        const choices =
          variant === 'long'
            ? Intl.supportedValuesOf('timeZone').map((label) => ({ value: label, label }))
            : options.map((option) => ({
                ...option,
                icon: variant === 'icons' ? icon('droplet') : undefined,
              }))
        return width(
          <div class="doc-demo-stack">
            <Select
              label={variant === 'long' ? 'Timezone' : 'Fruit'}
              options={choices}
              disabled={variant === 'disabled'}
              defaultValue={variant === 'disabled' ? 'apple' : undefined}
              placeholder="Select a fruit…"
              onValueChange={(value) => say(value ?? '')}
            />
            {variant === 'variants' && <Select label="Ghost" variant="ghost" options={options} />}
            {feedback}
          </div>,
        )
      }
      case 'file-input':
        return width(
          <FileInput
            label="Cover image"
            name="cover"
            accept="image/*"
            maxSize={2_000_000}
            required
          />,
        )
      case 'number-field':
        return (
          <div style={{ width: 'min(100%, 240px)' }}>
            <NumberField
              label="Hours"
              name="hours"
              min={0}
              max={24}
              step={0.25}
              defaultValue={1.5}
              description="Log time in quarter hours."
            />
          </div>
        )
      case 'segmented-control':
        return <SegmentedControlDemo variant={variant} />
      case 'field': {
        const fw = (children: RemixNode, wide = false) => (
          <div class={wide ? 'doc-demo-field-wide' : 'doc-demo-field'}>{children}</div>
        )
        if (variant === 'select')
          return fw(
            <Field label="Department" description="Where you spend most of your week.">
              {(control) => (
                <Select
                  {...control}
                  label="Department"
                  placeholder="Choose a department"
                  options={['Design', 'Engineering', 'Research'].map((label) => ({
                    value: label,
                    label,
                  }))}
                />
              )}
            </Field>,
          )
        if (variant === 'horizontal')
          return fw(
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="field-language">Language</FieldLabel>
                  <FieldDescription>Used across the app and in emails.</FieldDescription>
                </FieldContent>
                <Select
                  id="field-language"
                  label="Language"
                  placeholder="Pick one"
                  defaultValue="English"
                  options={['English', 'Français'].map((label) => ({ value: label, label }))}
                />
              </Field>
            </FieldGroup>,
            true,
          )
        if (variant === 'choice-card')
          return fw(
            <FieldGroup>
              <FieldLabel for="field-kubernetes">
                <Field orientation="horizontal">
                  <Checkbox id="field-kubernetes" defaultChecked />
                  <FieldContent>
                    <FieldTitle>Kubernetes</FieldTitle>
                    <FieldDescription>Run GPU workloads on a K8s cluster.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel for="field-vm">
                <Field orientation="horizontal">
                  <Checkbox id="field-vm" />
                  <FieldContent>
                    <FieldTitle>Virtual machine</FieldTitle>
                    <FieldDescription>Access a cluster to run GPU workloads.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </FieldGroup>,
          )
        if (variant === 'separator')
          return fw(
            <FieldGroup>
              <Field label="Work email">
                {(control) => <Input {...control} type="email" placeholder="you@company.com" />}
              </Field>
              <FieldSeparator>Or continue with</FieldSeparator>
              <Button
                variant="secondary"
                mix={on('click', () => say('Continue with your organization’s sign-in.'))}
              >
                Continue with SSO
              </Button>
              {feedback}
            </FieldGroup>,
          )
        if (variant === 'checkbox')
          return fw(
            <FieldSet legend="Notify me about" legendVariant="label">
              <Field orientation="horizontal">
                <Checkbox id="field-replies" defaultChecked />
                <FieldLabel for="field-replies">Replies to my comments</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="field-mentions" />
                <FieldContent>
                  <FieldLabel for="field-mentions">Mentions</FieldLabel>
                  <FieldDescription>Only from people in your workspace.</FieldDescription>
                </FieldContent>
              </Field>
            </FieldSet>,
          )
        if (variant === 'fieldset')
          return fw(
            <FieldSet legend="Address">
              <FieldDescription>We need your address to deliver your order.</FieldDescription>
              <Field label="Street address">
                {(control) => <Input {...control} placeholder="123 Main St" />}
              </Field>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '16px',
                }}
              >
                <Field label="City">
                  {(control) => <Input {...control} placeholder="Paris" />}
                </Field>
                <Field label="Postal code">
                  {(control) => <Input {...control} placeholder="75001" />}
                </Field>
              </div>
            </FieldSet>,
          )
        if (variant === 'textarea')
          return fw(
            <Field label="Feedback" description="It grows with your text.">
              {(control) => <Textarea {...control} placeholder="What worked, what didn't?" />}
            </Field>,
          )
        if (variant === 'error')
          return fw(
            <Field label="Work email address" error="Enter a valid email address">
              {(control) => <Input {...control} type="email" defaultValue="ada@anthropic" />}
            </Field>,
          )
        return fw(
          <Field label="Username" description="Choose a unique username for your account.">
            {(control) => <Input {...control} placeholder="ada" />}
          </Field>,
        )
      }
      case 'input':
      case 'textarea': {
        const text = slug === 'textarea'
        if (variant === 'field')
          return width(
            <Field
              label={text ? 'Message' : 'Email'}
              description={text ? 'Tell us what you have in mind.' : 'Use your work email.'}
            >
              {(props) =>
                text ? (
                  <Textarea {...props} rows={3} />
                ) : (
                  <Input {...props} type="email" placeholder="you@company.com" />
                )
              }
            </Field>,
          )
        if (text && variant === 'invalid')
          return width(
            <Field label="Bio" error="Write at least 20 characters">
              {(control) => <Textarea {...control} defaultValue="Hi" />}
            </Field>,
          )
        if (variant === 'types')
          return width(
            <div class="doc-demo-stack">
              <Input type="password" aria-label="Password" placeholder="Password" />
              <Input type="number" aria-label="Seats" placeholder="Seats" min="1" />
              <Input type="file" aria-label="Attachment" />
            </div>,
          )
        if (variant === 'button')
          return width(
            <form
              class="doc-demo-stack"
              style={text ? undefined : { flexDirection: 'row' }}
              mix={formSubmit}
            >
              {text ? (
                <Textarea aria-label="Message" placeholder="Type your message" required />
              ) : (
                <Input type="email" aria-label="Email" placeholder="you@company.com" required />
              )}
              <Button type="submit">{text ? 'Send message' : 'Subscribe'}</Button>
              {feedback}
            </form>,
          )
        return width(
          text ? (
            <Textarea
              aria-label="Message"
              aria-invalid={variant === 'invalid' || undefined}
              disabled={variant === 'disabled'}
              placeholder="Your message"
              defaultValue={variant === 'disabled' ? "You can't edit this message." : undefined}
            />
          ) : (
            <Input
              aria-label="Email"
              aria-invalid={variant === 'invalid' || undefined}
              disabled={variant === 'disabled'}
              defaultValue={variant === 'invalid' ? 'invalid email' : 'you@company.com'}
            />
          ),
        )
      }
      case 'input-copy': {
        const command = 'pnpm add remix @remix-run/ui @remix-run/component'
        const narrow = (children: RemixNode) => <div class="doc-demo-copy">{children}</div>
        if (variant === 'left')
          return (
            <div class="doc-demo-copy doc-demo-stack">
              <InputCopy align="left" value={command} onCopy={playCopySuccess} />
              <InputCopy variant="button" align="left" value={command} onCopy={playCopySuccess} />
            </div>
          )
        if (variant === 'disabled')
          return narrow(<InputCopy label="Invite code" value="ABCD-1234-EFGH" disabled />)
        if (variant === 'callback')
          return (
            <div class="doc-demo-copy doc-demo-stack">
              <InputCopy
                label="Share link"
                value="https://reflow.example/r/input-copy"
                onCopy={() => {
                  playCopySuccess()
                  copyCount++
                  handle.update()
                }}
              />
              <p class="doc-demo-copy-count">
                Copied {copyCount} {copyCount === 1 ? 'time' : 'times'}
              </p>
            </div>
          )
        return narrow(
          <InputCopy
            label={variant === 'label' ? 'Install command' : undefined}
            value={command}
            onCopy={playCopySuccess}
            variant={variant === 'button' ? 'button' : 'icon'}
          />,
        )
      }
      case 'input-group':
        return width(
          <InputGroup>
            {variant === 'multiple' && <InputField label="Name" placeholder="Your name" />}
            <InputField
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={icon('mail')}
              error={variant === 'error' ? 'Please enter a valid email address.' : undefined}
              defaultValue={variant === 'error' ? 'bad@' : undefined}
            />
          </InputGroup>,
        )
      case 'radio-group':
        return width(
          <RadioGroup
            label={variant === 'horizontal' ? 'Size' : 'Plan'}
            orientation={variant === 'horizontal' ? 'horizontal' : 'vertical'}
            defaultValue="free"
            options={[
              {
                value: 'free',
                label: variant === 'horizontal' ? 'Small' : 'Free',
                description: variant === 'descriptions' ? 'For personal projects' : undefined,
              },
              {
                value: 'pro',
                label: variant === 'horizontal' ? 'Medium' : 'Pro',
                description: variant === 'descriptions' ? 'For growing teams' : undefined,
              },
              {
                value: 'team',
                label: variant === 'horizontal' ? 'Large' : 'Team',
                description: variant === 'descriptions' ? 'For your organization' : undefined,
              },
            ]}
          />,
        )
      case 'slider':
        switch (variant) {
          case 'range':
            return <Slider defaultValue={[25, 75]} />
          case 'steps':
            return (
              <div class="doc-slider-steps">
                <Slider defaultValue={50} step={25} showSteps />
                <Slider defaultValue={50} step={10} showSteps />
              </div>
            )
          case 'nonuniform':
            return (
              <Slider
                label="Rating"
                steps={[0.1, 0.5, 0.7, 1.1, 1.3]}
                defaultValue={0.7}
                formatValue={(value) => value + ' A'}
                showSteps
              />
            )
          case 'positions':
            return (
              <div class="doc-slider-positions">
                <Slider label="Volume" defaultValue={40} valuePosition="left" />
                <Slider label="Volume" defaultValue={60} valuePosition="right" />
                <Slider defaultValue={50} valuePosition="tooltip" />
              </div>
            )
          case 'format':
            return (
              <Slider
                size="compact"
                label="Opacity"
                defaultValue={75}
                formatValue={(value) => value + '%'}
              />
            )
          case 'disabled':
            return <Slider size="compact" defaultValue={50} disabled />
          case 'scrubber':
            return (
              <Slider
                size="default"
                label="Volume"
                variant="scrubber"
                defaultValue={50}
                formatValue={(value) => value + '%'}
              />
            )
          case 'default-format': {
            const labels = ['Off', 'Low', 'Medium', 'High', 'Ultra']
            return (
              <Slider
                size="default"
                label="Quality"
                min={0}
                max={4}
                defaultValue={2}
                formatValue={(value) => labels[value]}
              />
            )
          }
          default:
            return (
              <Slider
                size="default"
                label="Roundness"
                min={0}
                max={4}
                defaultValue={2}
                disabled={variant === 'default-disabled'}
              />
            )
        }
      case 'switch':
        return variant === 'disabled' ? (
          <Switch label="Disabled option" disabled />
        ) : (
          <div class="doc-demo-stack">
            <Switch
              label="Notifications"
              checked={enabled}
              onCheckedChange={(value) => {
                enabled = value
                handle.update()
              }}
            />
            <output class="doc-demo-feedback">
              Notifications {enabled ? 'enabled' : 'disabled'}
            </output>
          </div>
        )
    }
    return null
  }
}
