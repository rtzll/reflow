import { SidebarPlaygroundExample } from './sidebar-demos.tsx'
import { CarouselExample } from './carousel-example.tsx'
import { questionPlayground } from './question-example-data.ts'
import { RequestFormExample } from './request-form-example.tsx'
import { DropdownPlayground } from './dropdown-example.tsx'
import { BreadcrumbDemo } from './breadcrumb-example.tsx'
import { SegmentedControlDemo } from './segmented-control-example.tsx'
import { paletteCommands, paletteGroups, paletteSuggestions } from './component-demos.tsx'
import { SoundCombobox } from './sound-combobox.tsx'
import { playCopySuccess } from './showcase-sound.ts'
import {
  datePickerBooked,
  datePickerPresets,
  datePickerToday,
  accordionItems,
  cardItems,
  badgeColors,
  checkboxFruit,
  radioOptions,
  componentOptions,
  inputMessagePrompts,
} from './component-example-data.ts'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import {
  Accordion,
  AskUserQuestions,
  Badge,
  Button,
  Calendar,
  Card,
  CardDescription,
  CardGroup,
  CardHeader,
  CardMedia,
  CardTitle,
  ChatMessage,
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  CommandMenu,
  DatePicker,
  Dialog,
  Dropdown,
  Field,
  Icon,
  Input,
  InputCopy,
  InputField,
  InputGroup,
  InputMessage,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  ThinkingIndicator,
  ThinkingSteps,
  ThinkingStepDetails,
  Tooltip,
  type BadgeColor,
  type ButtonVariant,
  type ColorFormat,
} from '@rtzll/reflow'
import { BannerExample, bannerDefaults, bannerStatuses } from './banner-example.tsx'

export type PlaygroundValues = Record<string, string | boolean>
interface Control {
  name: string
  label: string
  options?: readonly string[]
  initial: string | boolean
}
const choice = (name: string, label: string, options: readonly string[]): Control => ({
  name,
  label,
  options,
  initial: options[0],
})
const toggle = (name: string, label: string, initial = false): Control => ({
  name,
  label,
  initial,
})
const size = choice('size', 'Size', ['default', 'compact'])
const disabled = toggle('disabled', 'Disabled')
const label = (initial: string): Control => ({
  name: 'label',
  label: 'Label',
  initial,
})

export const playgroundControls: Record<string, readonly Control[]> = {
  accordion: [
    choice('expand', 'Expand', ['one or none', 'one at a time', 'any number']),
    toggle('highlightExpanded', 'Highlight expanded', true),
    disabled,
  ],
  'ask-user-questions': [
    choice('count', 'Questions', ['3', '2', '1']),
    toggle('freeText', 'Free text'),
    toggle('multiline', 'Multiline', true),
    toggle('multiSelect', 'Multi-select'),
    toggle('allowOther', 'Other answer'),
    toggle('skippable', 'Skippable', true),
    choice('layout', 'Layout', ['inline', 'stacked']),
    choice('chipPosition', 'Chip position', ['right', 'left']),
  ],
  badge: [
    choice('variant', 'Variant', ['solid', 'dot']),
    choice('color', 'Color', ['violet', ...badgeColors.filter((color) => color !== 'violet')]),
    label('Fiction'),
    size,
  ],
  banner: [
    choice('variant', 'Variant', ['inline', 'fixed']),
    { ...choice('status', 'Status', bannerStatuses), initial: bannerDefaults.status },
    choice('contrast', 'Contrast', ['low', 'high']),
    toggle('description', 'Description', bannerDefaults.description),
    toggle('primary', 'Primary action', bannerDefaults.primary),
    toggle('secondary', 'Secondary action', bannerDefaults.secondary),
    toggle('ghost', 'Ghost action', bannerDefaults.ghost),
    toggle('dismissible', 'Dismissible', bannerDefaults.dismissible),
  ],
  button: [
    choice('variant', 'Variant', ['primary', 'secondary', 'tertiary', 'ghost', 'destructive']),
    size,
    label('Get started'),
    toggle('iconOnly', 'Icon only'),
    toggle('leadingIcon', 'Leading icon'),
    toggle('trailingIcon', 'Trailing icon'),
    toggle('active', 'Active'),
    toggle('loading', 'Loading'),
    disabled,
  ],
  calendar: [
    choice('mode', 'Mode', ['range', 'single']),
    choice('numberOfMonths', 'Months', ['2', '1']),
    choice('orientation', 'Layout', ['horizontal', 'vertical']),
    toggle('showWeekNumbers', 'Week numbers'),
    choice('weekStartsOn', 'Week starts', ['0', '1']),
  ],
  card: [
    choice('orientation', 'Layout', ['card', 'inline']),
    choice('columns', 'Columns', ['2', '1', '3']),
    choice('border', 'Border', ['none', 'outlined']),
    toggle('separated', 'Separated'),
    toggle('fluidHover', 'Fluid hover', true),
    toggle('media', 'Icon wells', true),
    toggle('description', 'Description', true),
    toggle('selected', 'Selection'),
  ],
  'carousel-dots': [
    choice('count', 'Slides', ['4', '3', '5', '7', '10']),
    toggle('autoplay', 'Autoplay'),
  ],
  'chat-message': [
    choice('role', 'Role', ['user', 'assistant']),
    size,
    toggle('animate', 'Animate', true),
    toggle('attachments', 'Attachments'),
  ],
  checkbox: [
    label('Accept terms and conditions'),
    toggle('checked', 'Checked'),
    toggle('indeterminate', 'Mixed'),
    disabled,
    size,
  ],
  'checkbox-group': [
    choice('orientation', 'Layout', ['vertical', 'horizontal']),
    toggle('hideLabel', 'Hide label', true),
    disabled,
  ],
  'color-picker': [
    choice('format', 'Format', ['hex', 'rgb', 'hsl', 'oklch']),
    choice('variant', 'Variant', ['inline', 'popover']),
    toggle('hideEyedropper', 'Hide eyedropper'),
    disabled,
  ],
  combobox: [
    choice('variant', 'Variant', ['bordered', 'ghost']),
    toggle('multiple', 'Multiple', true),
    toggle('creatable', 'Create options'),
    toggle('hideSelected', 'Hide picked'),
    toggle('error', 'Error'),
    disabled,
    size,
  ],
  'command-menu': [
    toggle('modal', 'Dialog'),
    toggle('filters', 'Filters', true),
    toggle('descriptions', 'Descriptions', true),
  ],
  'date-picker': [
    choice('variant', 'Design', ['ghost', 'outline']),
    choice('mode', 'Mode', ['Date', 'Range']),
    choice('time', 'Time', ['Start → end', 'None', 'One time']),
    choice('timeStep', 'Time step', ['15', '30', '60']),
    choice('hourCycle', 'Clock', ['12', '24']),
    toggle('presets', 'Presets'),
    toggle('clearable', 'Clearable'),
    choice('months', 'Months', ['2', '1']),
    choice('orientation', 'Orientation', ['auto', 'horizontal', 'vertical']),
    choice('days', 'Days', ['All open', 'Booked + past']),
    toggle('weekNumbers', 'Week numbers'),
    choice('size', 'Size', ['default', 'compact']),
    disabled,
  ],
  dialog: [
    choice('size', 'Size', ['sm', 'lg', 'xl']),
    choice('position', 'Position', ['center', 'top']),
    toggle('modal', 'Modal', true),
    toggle('showCloseButton', 'Close button', true),
    toggle('dismissOnBackdrop', 'Backdrop dismiss', true),
  ],
  breadcrumb: [
    choice('separator', 'Separator', ['chevron', 'slash']),
    toggle('icons', 'Icons'),
    size,
  ],
  dropdown: [
    choice('mode', 'Mode', ['Menu', 'Inline panel']),
    choice('selection', 'Selection', ['Single', 'Multiple', 'Actions']),
    toggle('search', 'Search'),
    toggle('creatable', 'Create from query'),
    toggle('icons', 'Icons', true),
    toggle('groups', 'Groups'),
    toggle('disabledRow', 'Disabled row'),
    toggle('submenu', 'Submenu', true),
  ],
  field: [
    choice('orientation', 'Layout', ['vertical', 'horizontal', 'responsive']),
    toggle('description', 'Description', true),
    toggle('error', 'Error'),
  ],
  input: [
    choice('type', 'Type', ['text', 'email', 'password', 'number']),
    disabled,
    toggle('invalid', 'Invalid'),
    size,
  ],
  'input-copy': [
    choice('variant', 'Variant', ['icon', 'button']),
    choice('align', 'Action', ['right', 'left']),
    disabled,
    size,
  ],
  'input-group': [toggle('multiple', 'Multiple fields', true), toggle('error', 'Error')],
  'input-message': [
    toggle('attachments', 'Attachments', true),
    toggle('suggestion', 'Tab suggestion', true),
    toggle('suggestedPrompts', 'Suggested prompts', true),
    disabled,
    size,
  ],
  'radio-group': [
    choice('orientation', 'Layout', ['vertical', 'horizontal']),
    toggle('hideLabel', 'Hide label', true),
    disabled,
  ],
  'segmented-control': [
    choice('content', 'Content', ['Text', 'Icons', 'Icon only']),
    toggle('fill', 'Fill width'),
    size,
    disabled,
  ],
  select: [choice('variant', 'Variant', ['bordered', 'ghost']), disabled, size],
  sidebar: [
    choice('variant', 'Variant', ['inset', 'default', 'floating']),
    toggle('searchable', 'Searchable', true),
    toggle('defaultCollapsed', 'Collapsed'),
    choice('peek', 'Collapsed behavior', ['none', 'hover', 'click']),
    choice('headerPrimary', 'Header primary element', ['dropdown', 'logo', 'none']),
    choice('headerStack', 'Header stacking', ['vertical', 'horizontal']),
    choice('headerActions', 'Header actions', ['1', '0', '2']),
    toggle('sectionsCollapsible', 'Collapsible sections', true),
    choice('sectionActions', 'Section actions', ['1', '0', '2', '3']),
    choice('rowKind', 'Primary row type', ['thread', 'menu']),
    toggle('nestedRows', 'Nested rows'),
    choice('rowActions', 'Primary row actions', ['1', '0', '2', '3']),
    toggle('rowBadges', 'Primary row badges'),
    toggle('childIcons', 'Nested row icons', true),
    choice('childActions', 'Nested row actions', ['1', '0', '2', '3']),
    toggle('childBadges', 'Nested row badges'),
    choice('footerPrimary', 'Footer primary element', ['dropdown', 'none']),
    choice('footerStack', 'Footer stacking', ['horizontal', 'vertical']),
    choice('footerActions', 'Footer actions', ['2', '0', '1']),
    choice('callout', 'Callout', ['none', 'inline', 'banner']),
    toggle('stackedCallouts', 'Stacked callouts'),
  ],
  slider: [
    choice('variant', 'Variant', ['pips', 'scrubber']),
    choice('step', 'Step', ['1', '5', '10', '25']),
    toggle('showSteps', 'Steps'),
    toggle('showValue', 'Value', true),
    choice('valuePosition', 'Value position', [
      'auto',
      'left',
      'right',
      'top',
      'bottom',
      'tooltip',
    ]),
    choice('size', 'Size', ['compact', 'default']),
    disabled,
  ],
  switch: [label('Notifications'), toggle('checked', 'Checked', true), disabled, size],
  table: [toggle('selected', 'Selected row'), toggle('hover', 'Row hover', true)],
  tabs: [
    choice('variant', 'Variant', ['pill', 'underline']),
    toggle('activeLabel', 'Active label'),
    size,
  ],
  textarea: [
    choice('rows', 'Rows', ['3', '5', '8']),
    toggle('autoResize', 'Auto resize', true),
    disabled,
    toggle('invalid', 'Invalid'),
    size,
  ],
  'thinking-indicator': [
    toggle('showIcon', 'Icon', true),
    choice('interval', 'Interval', ['4000', '2000', '1000']),
  ],
  'thinking-steps': [
    toggle('defaultOpen', 'Expanded', true),
    choice('status', 'Status', ['complete', 'active', 'pending']),
  ],
  tooltip: [
    choice('side', 'Placement', ['top', 'right', 'bottom', 'left']),
    choice('delayDuration', 'Delay', ['150', '0', '500', '1000']),
    toggle('followCursor', 'Follow cursor'),
  ],
}

export function questionSettings(values: PlaygroundValues) {
  return {
    count: Number(values.count),
    freeText: Boolean(values.freeText),
    multiline: Boolean(values.multiline),
    multiSelect: Boolean(values.multiSelect),
    allowOther: Boolean(values.allowOther),
    skippable: Boolean(values.skippable),
    layout: values.layout === 'stacked' ? ('stacked' as const) : ('inline' as const),
    chipPosition: values.chipPosition === 'left' ? ('left' as const) : ('right' as const),
  }
}

export function initialPlayground(slug: string): PlaygroundValues {
  return Object.fromEntries(
    (playgroundControls[slug] ?? []).map((control) => [control.name, control.initial]),
  )
}

export const PlaygroundControls = clientEntry(
  import.meta.url,
  function PlaygroundControls(handle: Handle<{ slug: string; name: string }>) {
    let values = initialPlayground(handle.props.slug)
    let ready = false
    const synchronize = ref((_element, signal) => {
      ready = true
      handle.update()
      window.addEventListener(
        'reflow:playground',
        ((event: CustomEvent<{ slug: string; values: PlaygroundValues; avatar: string }>) => {
          if (event.detail.slug === handle.props.slug && event.detail.values !== values) {
            values = event.detail.values
            handle.update()
          }
        }) as EventListener,
        { signal },
      )
    })
    function update(name: string, value: string | boolean) {
      values = { ...values, [name]: value }
      window.dispatchEvent(
        new CustomEvent('reflow:playground', {
          detail: { slug: handle.props.slug, values },
        }),
      )
      handle.update()
    }
    function reset() {
      values = initialPlayground(handle.props.slug)
      window.dispatchEvent(
        new CustomEvent('reflow:playground', {
          detail: { slug: handle.props.slug, values },
        }),
      )
      handle.update()
    }
    // A component without playground settings shows no empty panel.
    return () =>
      playgroundControls[handle.props.slug] ? (
        <section
          class="doc-playground-controls"
          mix={synchronize}
          aria-label={`${handle.props.name} playground settings`}
        >
          <div class="doc-playground-heading">
            <h2>Playground variant</h2>
            <button
              type="button"
              class="site-icon-button"
              title="Reset playground"
              aria-label="Reset playground"
              disabled={!ready}
              mix={on('click', reset)}
            >
              <Icon name="rotate-ccw" />
            </button>
          </div>
          <h3>{handle.props.name}</h3>
          {(playgroundControls[handle.props.slug] ?? []).map((control) => (
            <label class="doc-playground-setting" key={control.name}>
              <span>{control.label}</span>
              {typeof control.initial === 'boolean' ? (
                <Switch
                  aria-label={control.label}
                  disabled={
                    !ready ||
                    (handle.props.slug === 'sidebar' &&
                      ((control.name === 'nestedRows' && values.rowKind !== 'menu') ||
                        (['childIcons', 'childBadges'].includes(control.name) &&
                          !(values.rowKind === 'menu' && values.nestedRows)) ||
                        (control.name === 'stackedCallouts' && values.callout === 'none')))
                  }
                  size="compact"
                  checked={Boolean(values[control.name])}
                  onCheckedChange={(value) => update(control.name, value)}
                />
              ) : control.options ? (
                <select
                  aria-label={control.label}
                  disabled={
                    !ready ||
                    (handle.props.slug === 'sidebar' &&
                      control.name === 'childActions' &&
                      !(values.rowKind === 'menu' && values.nestedRows))
                  }
                  value={String(values[control.name])}
                  mix={on<HTMLSelectElement, 'change'>('change', (event) =>
                    update(control.name, event.currentTarget.value),
                  )}
                >
                  {control.options.map((option) => (
                    <option value={option} key={option}>
                      {option[0].toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label={control.label}
                  disabled={
                    !ready ||
                    (handle.props.slug === 'sidebar' &&
                      control.name === 'childActions' &&
                      !(values.rowKind === 'menu' && values.nestedRows))
                  }
                  value={String(values[control.name])}
                  mix={on<HTMLInputElement, 'input'>('input', (event) =>
                    update(control.name, event.currentTarget.value),
                  )}
                />
              )}
            </label>
          ))}
        </section>
      ) : null
  },
)

export function PlaygroundExample(
  handle: Handle<{ slug: string; values: PlaygroundValues; avatar: string }>,
) {
  let selection = cardItems[0].title as string
  let slide = 0
  let externalColorFormat: ColorFormat | undefined
  let previewColorFormat: ColorFormat = 'hex'
  const composerMessages = [
    { text: 'Make my input box feel less stiff', attachments: [] as { name: string }[] },
  ]
  const icon = <Icon name="menu" />
  return () => {
    const { slug, values: v } = handle.props
    const options = ['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({
      value: label.toLowerCase(),
      label,
    }))
    const density = v.size === 'compact' ? 'compact' : 'default'
    const disabled = Boolean(v.disabled)
    const content = <p>Build thoughtful interfaces with fluid motion.</p>
    switch (slug) {
      case 'button':
        return (
          <Button
            variant={v.variant as ButtonVariant}
            size={v.iconOnly ? (density === 'compact' ? 'icon-compact' : 'icon') : density}
            aria-label={v.iconOnly ? String(v.label).trim() || 'Get started' : undefined}
            leadingIcon={v.leadingIcon ? <Icon name="plus" /> : undefined}
            trailingIcon={v.trailingIcon ? <Icon name="arrow-right" /> : undefined}
            active={Boolean(v.active)}
            disabled={disabled}
            loading={Boolean(v.loading)}
          >
            {v.iconOnly ? <Icon name="plus" /> : String(v.label)}
          </Button>
        )
      case 'badge':
        return (
          <Badge
            variant={v.variant === 'dot' ? 'dot' : 'solid'}
            color={v.color as BadgeColor}
            size={density}
          >
            {String(v.label)}
          </Badge>
        )
      case 'banner':
        return <BannerExample values={v} />
      case 'accordion': {
        const props = {
          items: accordionItems,
          disabled,
          highlight: v.highlightExpanded ? ('item' as const) : ('trigger' as const),
        }
        return (
          <div class="doc-demo-column">
            {v.expand === 'any number' ? (
              <Accordion key="multiple" {...props} type="multiple" defaultValue={['item-1']} />
            ) : (
              <Accordion
                key={String(v.expand)}
                {...props}
                defaultValue="item-1"
                collapsible={v.expand !== 'one at a time'}
              />
            )}
          </div>
        )
      }
      case 'ask-user-questions':
        return (
          <div class="example-questions">
            <AskUserQuestions
              key={JSON.stringify(v)}
              questions={questionPlayground(questionSettings(v))}
            />
          </div>
        )
      case 'calendar':
        return (
          <Calendar
            defaultMonth="2026-11-01"
            mode={v.mode === 'range' ? 'range' : 'single'}
            numberOfMonths={v.numberOfMonths === '2' ? 2 : 1}
            orientation={v.orientation === 'vertical' ? 'vertical' : 'horizontal'}
            showWeekNumbers={Boolean(v.showWeekNumbers)}
            weekStartsOn={v.weekStartsOn === '1' ? 1 : 0}
          />
        )
      case 'card': {
        const inline = v.orientation === 'inline'
        const columns = inline ? 1 : Number(v.columns)
        return (
          <CardGroup
            class="doc-demo-wide"
            orientation={inline ? 'inline' : 'card'}
            columns={columns}
            border={v.border === 'outlined' ? 'outlined' : 'none'}
            separated={Boolean(v.separated)}
            fluidHover={Boolean(v.fluidHover)}
          >
            {cardItems.slice(0, columns === 3 ? 6 : 4).map(({ icon, title, description }) => {
              const media = v.media && (
                <CardMedia treatment="icon">
                  <Icon name={icon} size={18} />
                </CardMedia>
              )
              return (
                <Card
                  key={title}
                  label={title}
                  selected={Boolean(v.selected) && selection === title}
                  onClick={() => {
                    selection = title
                    handle.update()
                  }}
                >
                  {inline && media}
                  <CardHeader>
                    {!inline && media}
                    <CardTitle>{title}</CardTitle>
                    {v.description && <CardDescription>{description}</CardDescription>}
                  </CardHeader>
                </Card>
              )
            })}
          </CardGroup>
        )
      }
      case 'carousel-dots':
        return <CarouselExample count={Number(v.count)} autoplay={Boolean(v.autoplay)} />
      case 'chat-message':
        return (
          <ChatMessage
            role={v.role === 'assistant' ? 'assistant' : 'user'}
            size={density}
            animate={Boolean(v.animate)}
            attachments={
              v.attachments ? [{ name: 'design-notes.md', detail: 'Markdown · 2 KB' }] : undefined
            }
          >
            Can we make the interaction feel more fluid?
          </ChatMessage>
        )
      case 'checkbox':
        return (
          <Checkbox
            label={String(v.label)}
            defaultChecked={Boolean(v.checked)}
            indeterminate={Boolean(v.indeterminate)}
            disabled={disabled}
            size={density}
          />
        )
      case 'switch':
        return (
          <Switch
            label={String(v.label)}
            defaultChecked={Boolean(v.checked)}
            disabled={disabled}
            size={density}
          />
        )
      case 'checkbox-group':
      case 'radio-group':
        return (
          <div class="example-checklist">
            {slug === 'checkbox-group' ? (
              <CheckboxGroup
                label="Fruit"
                options={checkboxFruit}
                defaultValue={['apples']}
                orientation={v.orientation === 'horizontal' ? 'horizontal' : 'vertical'}
                hideLabel={Boolean(v.hideLabel)}
                disabled={disabled}
              />
            ) : (
              <RadioGroup
                label="Options"
                options={radioOptions}
                defaultValue="0"
                orientation={v.orientation === 'horizontal' ? 'horizontal' : 'vertical'}
                hideLabel={Boolean(v.hideLabel)}
                disabled={disabled}
              />
            )}
          </div>
        )
      case 'color-picker':
        if (externalColorFormat !== v.format) {
          externalColorFormat = v.format as ColorFormat
          previewColorFormat = externalColorFormat
        }
        return (
          <ColorPicker
            format={previewColorFormat}
            onFormatChange={(format) => {
              previewColorFormat = format
              handle.update()
            }}
            variant={v.variant === 'popover' ? 'popover' : 'inline'}
            triggerLabel="Fill"
            placement="right-start"
            swatches={[]}
            hideEyedropper={Boolean(v.hideEyedropper)}
            disabled={disabled}
          />
        )
      case 'combobox':
        return (
          <div class="example-combobox">
            <SoundCombobox
              label="Components"
              placeholder={v.multiple ? 'Add components…' : 'Pick a component…'}
              options={componentOptions}
              emptyMessage="No component found."
              variant={v.variant === 'ghost' ? 'ghost' : 'bordered'}
              multiple={Boolean(v.multiple)}
              defaultValues={['button', 'combobox']}
              creatable={Boolean(v.creatable)}
              hideSelected={Boolean(v.hideSelected)}
              error={Boolean(v.error)}
              disabled={disabled}
              size={density}
            />
          </div>
        )
      case 'select':
        return (
          <Select
            label="Fruit"
            options={options}
            variant={v.variant === 'ghost' ? 'ghost' : 'bordered'}
            disabled={disabled}
            size={density}
          />
        )
      case 'command-menu':
        return (
          <div class="doc-command-palette">
            <CommandMenu
              trigger={v.modal ? 'Open command menu' : undefined}
              shortcut={false}
              footer
              filters={v.filters ? paletteGroups : undefined}
              suggestions={paletteSuggestions}
              items={
                v.descriptions
                  ? paletteCommands
                  : paletteCommands.map((item) => ({ ...item, description: undefined }))
              }
            />
          </div>
        )
      case 'date-picker': {
        const range = v.mode === 'Range'
        const timeRange = !range && v.time === 'Start → end'
        const oneTime = !range && v.time === 'One time'
        const today = datePickerToday()
        return (
          <DatePicker
            key={`${v.mode}-${v.time}`}
            label="Choose dates"
            mode={range ? 'range' : 'single'}
            variant={v.variant === 'outline' ? 'outline' : 'ghost'}
            time={oneTime}
            step={Number(v.timeStep ?? 15)}
            hourCycle={v.hourCycle === '24' ? 24 : 12}
            timeRange={timeRange}
            defaultTime="11:00"
            defaultEndTime="12:45"
            defaultValue={range ? undefined : today}
            presets={range && v.presets ? datePickerPresets(today) : undefined}
            clearable={Boolean(v.clearable)}
            numberOfMonths={v.months === '1' ? 1 : 2}
            orientation={
              v.orientation === 'auto' ? undefined : (v.orientation as 'horizontal' | 'vertical')
            }
            showWeekNumbers={Boolean(v.weekNumbers)}
            booked={v.days === 'Booked + past' ? datePickerBooked(today) : undefined}
            min={v.days === 'Booked + past' ? today : undefined}
            size={v.size === 'compact' ? 'compact' : 'default'}
            disabled={disabled}
          />
        )
      }
      case 'dialog':
        return (
          <Dialog
            title="Create teamspace"
            trigger="Open dialog"
            size={v.size === 'xl' ? 'xl' : v.size === 'lg' ? 'lg' : 'sm'}
            position={v.position === 'top' ? 'top' : 'center'}
            modal={Boolean(v.modal)}
            showCloseButton={Boolean(v.showCloseButton)}
            dismissOnBackdrop={Boolean(v.dismissOnBackdrop)}
            description="Add a new teamspace to organize your projects and collaborate with your team."
            footer={(close) => <Button mix={on('click', close)}>Create</Button>}
          />
        )
      case 'segmented-control':
        return (
          <SegmentedControlDemo
            variant="playground"
            size={density}
            content={String(v.content)}
            fill={Boolean(v.fill)}
            disabled={Boolean(v.disabled)}
          />
        )
      case 'breadcrumb':
        return (
          <BreadcrumbDemo
            variant="playground"
            size={density}
            separator={v.separator === 'slash' ? 'slash' : 'chevron'}
            icons={Boolean(v.icons)}
          />
        )
      case 'dropdown':
        return (
          <DropdownPlayground
            mode={v.mode === 'Inline panel' ? 'inline' : 'menu'}
            selection={String(v.selection ?? 'Single')
              .toLowerCase()
              .replace('actions', 'none')}
            search={Boolean(v.search)}
            creatable={Boolean(v.creatable)}
            icons={Boolean(v.icons)}
            groups={Boolean(v.groups)}
            disabledRow={Boolean(v.disabledRow)}
            submenu={Boolean(v.submenu)}
          />
        )
      case 'field':
        return (
          <RequestFormExample
            orientation={
              v.orientation === 'horizontal'
                ? 'horizontal'
                : v.orientation === 'responsive'
                  ? 'responsive'
                  : 'vertical'
            }
            description={Boolean(v.description)}
            error={Boolean(v.error)}
          />
        )
      case 'input':
        return (
          <Input
            {...(v.type === 'email'
              ? { type: 'email' as const }
              : v.type === 'password'
                ? { type: 'password' as const }
                : v.type === 'number'
                  ? { type: 'number' as const }
                  : { type: 'text' as const })}
            aria-label="Input"
            placeholder="Enter a value"
            disabled={disabled}
            aria-invalid={Boolean(v.invalid) || undefined}
            size={density}
          />
        )
      case 'input-copy':
        return (
          <InputCopy
            value="pnpm install remix @remix-run/ui"
            onCopy={playCopySuccess}
            variant={v.variant === 'button' ? 'button' : 'icon'}
            align={v.align === 'left' ? 'left' : 'right'}
            disabled={disabled}
            size={density}
          />
        )
      case 'input-group':
        return (
          <InputGroup>
            {v.multiple && <InputField label="Name" placeholder="Your name" />}
            <InputField
              label="Email"
              placeholder="you@company.com"
              icon={<Icon name="mail" />}
              error={v.error ? 'Enter a valid email address.' : undefined}
            />
          </InputGroup>
        )
      case 'input-message':
        return (
          <div class="doc-composer-preview">
            <div
              class="doc-composer-transcript"
              id={`${handle.id}-conversation`}
              role="log"
              aria-label="Conversation"
            >
              {composerMessages.map(({ text, attachments }, index) => (
                <ChatMessage key={index} role="user" attachments={attachments} animate={index > 0}>
                  {text}
                </ChatMessage>
              ))}
            </div>
            <InputMessage
              attachments={Boolean(v.attachments)}
              suggestions={v.suggestedPrompts ? inputMessagePrompts : undefined}
              placeholderSuggestion={
                v.suggestion ? 'Why is every other input box so stiff?' : undefined
              }
              history={composerMessages.map(({ text }) => text).filter(Boolean)}
              minRows={2}
              disabled={disabled}
              size={density}
              onSend={({ text, files }) => {
                composerMessages.push({ text, attachments: files.map(({ name }) => ({ name })) })
                handle.queueTask(() => {
                  const transcript = document.getElementById(`${handle.id}-conversation`)
                  if (transcript) transcript.scrollTop = transcript.scrollHeight
                })
                handle.update()
              }}
            />
          </div>
        )
      case 'sidebar':
        return <SidebarPlaygroundExample values={v} avatar={handle.props.avatar} />
      case 'slider':
        return (
          <Slider
            label={density === 'compact' ? undefined : 'Volume'}
            defaultValue={25}
            variant={v.variant === 'scrubber' ? 'scrubber' : 'pips'}
            step={Number(v.step)}
            showSteps={v.showSteps ? true : undefined}
            showValue={v.showValue ? undefined : false}
            valuePosition={
              v.valuePosition === 'auto'
                ? undefined
                : (v.valuePosition as 'left' | 'right' | 'top' | 'bottom' | 'tooltip')
            }
            size={density}
            disabled={disabled}
          />
        )
      case 'table':
        return (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow selected={Boolean(v.selected)} hover={Boolean(v.hover)}>
                <TableCell>Alice</TableCell>
                <TableCell>Engineer</TableCell>
              </TableRow>
              <TableRow hover={Boolean(v.hover)}>
                <TableCell>Bob</TableCell>
                <TableCell>Designer</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )
      case 'tabs':
        return (
          <div class="doc-demo-wide">
            <Tabs
              label="Navigation"
              variant={v.variant === 'underline' ? 'underline' : 'pill'}
              activeLabel={Boolean(v.activeLabel)}
              size={density}
              items={['Teamspaces', 'Recents', 'Favorites', 'Shared'].map((label) => ({
                value: label.toLowerCase(),
                label,
                panel: <p>{label} content goes here.</p>,
              }))}
            />
          </div>
        )
      case 'textarea':
        return (
          <Textarea
            aria-label="Message"
            placeholder="Type your message here."
            rows={Number(v.rows)}
            autoResize={Boolean(v.autoResize)}
            disabled={disabled}
            aria-invalid={Boolean(v.invalid) || undefined}
            size={density}
          />
        )
      case 'thinking-indicator':
        return <ThinkingIndicator showIcon={Boolean(v.showIcon)} interval={Number(v.interval)} />
      case 'thinking-steps':
        return (
          <div class="doc-thinking-timeline">
            <ThinkingSteps
              label="Thinking"
              variant="timeline"
              defaultOpen={Boolean(v.defaultOpen)}
              steps={[
                {
                  value: 'search',
                  title: 'Searched the web',
                  icon: <Icon name="search" />,
                  status: 'complete',
                },
                {
                  value: 'sources',
                  title: 'Read 3 sources',
                  icon: <Icon name="globe" />,
                  status: 'complete',
                  content: (
                    <ThinkingStepDetails
                      summary="Explored 6 files"
                      details={[
                        'accordion.tsx',
                        'icon-context.tsx',
                        'badge.tsx',
                        'use-fluid-hover.ts',
                        'components.ts',
                        'postbuild-registry.mjs',
                      ].map((name) => `Read ${name}`)}
                    />
                  ),
                },
                {
                  value: 'done',
                  title: 'Done',
                  icon: <Icon name="check" />,
                  status: v.status === 'active' || v.status === 'pending' ? v.status : 'complete',
                },
              ]}
            />
          </div>
        )
      case 'tooltip':
        return (
          <Tooltip
            side={v.side as 'top' | 'right' | 'bottom' | 'left'}
            delayDuration={Number(v.delayDuration)}
            followCursor={Boolean(v.followCursor)}
            content="Save your changes"
            renderTrigger={(props) => <Button {...props}>Hover me</Button>}
          />
        )
    }
    return null
  }
}
