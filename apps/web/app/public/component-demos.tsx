import type { ExampleImages } from '../assets.ts'
import { SettingsDialogExample } from './settings-dialog-example.tsx'
import { BannerMockPage, bannerStatuses } from './banner-example.tsx'
import { ChatExample, chatAvatar } from './chat-example.tsx'
import { CarouselExample, carouselExampleCode } from './carousel-example.tsx'
import { questionCode, questionExample } from './question-example-data.ts'
import {
  datePickerBooked,
  datePickerOffset,
  datePickerPresets,
  datePickerToday,
  accordionItems,
  multipleAccordionItems,
  rowHighlightAccordionItems,
  standaloneAccordionItems,
  cardItems,
  cardBanner,
  cardThumb,
  badgeGenres,
  badgeColorNames,
  componentOptions,
  composerTriggers,
  inputMessagePrompts,
} from './component-example-data.ts'
import {
  advancedExamples,
  ControlledQuestions,
  RichThinkingSteps,
  WorkspaceSidebar,
} from './advanced-demos.tsx'
import { SidebarDemo } from './sidebar-demos.tsx'
import {
  cardBasicCode,
  cardCompositionCode,
  cardGridCode,
  cardOutlinedCode,
  cardSelectedCode,
  cardSeparatedCode,
} from './card-example-code.ts'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { DropdownDemo } from './dropdown-example.tsx'
import { BreadcrumbDemo } from './breadcrumb-example.tsx'
import { SegmentedControlDemo } from './segmented-control-example.tsx'
import { PopoverDemo } from './popover-example.tsx'
import { ToasterDemo } from './toaster-example.tsx'
import { DrawerDemo } from './drawer-example.tsx'
import { CodeBlockDemo } from './code-block-example.tsx'
import { CitationDemo } from './citation-example.tsx'
import { AvatarDemo } from './avatar-example.tsx'
import { ChatLayoutDemo } from './chat-layout-example.tsx'
import { ResizableDemo } from './resizable-example.tsx'
import { CarouselDemo } from './carousel-demo.tsx'
import { HoverCardDemo } from './hover-card-example.tsx'
import { SoundCombobox } from './sound-combobox.tsx'
import { playCopySuccess } from './showcase-sound.ts'
import {
  Accordion,
  AskUserQuestions,
  Badge,
  Banner,
  BannerAction,
  BannerActions,
  BannerDescription,
  BannerTitle,
  Button,
  Calendar,
  Card,
  CardButton,
  CardFeature,
  CardImage,
  CardMedia,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardGroup,
  CardTitle,
  ChatMessage,
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  CommandMenu,
  CommandShortcut,
  DatePicker,
  Dialog,
  Dropdown,
  FileInput,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  FieldContent,
  FieldSet,
  Icon,
  type IconName,
  type CommandItem,
  Input,
  InputCopy,
  InputField,
  InputGroup,
  Progress,
  NumberField,
  InputMessage,
  RadioGroup,
  Select,
  Sidebar,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  ThinkingIndicator,
  ThinkingSteps,
  Tooltip,
  type ButtonVariant,
} from '@rtzll/reflow'

export interface DocumentationExample {
  title: string
  variant: string
  code: string
  description?: string
}

function demo(
  title: string,
  variant: string,
  code: string,
  description?: string,
): DocumentationExample {
  return { title, variant, code, description }
}

export { paletteGroups, paletteSuggestions, paletteCommands } from './palette-example-data.tsx'
import { paletteGroups, paletteSuggestions, paletteCommands } from './palette-example-data.tsx'

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
).map(([label, icon]) => ({ value: label.toLowerCase(), label, icon: <Icon name={icon} /> }))

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
const fruitCode = `const options = ['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({\n  value: label.toLowerCase(), label,\n}))`
const iconCode = `const icon = <svg width="16" height="16" viewBox="0 0 24 24"\n  fill="none" stroke="currentColor" stroke-width="1.5">\n  <path d="M12 5v14M5 12h14" />\n</svg>`

function badgeExampleCode(
  samples: readonly (readonly [string, string])[],
  variants: readonly string[],
) {
  return variants
    .map(
      (variant) =>
        '<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>\n' +
        samples
          .map(
            ([color, text]) =>
              `  <Badge color="${color}"${variant === 'dot' ? ' variant="dot"' : ''}>${text}</Badge>`,
          )
          .join('\n') +
        '\n</div>',
    )
    .join('\n')
}

export const componentExamples: Record<string, readonly DocumentationExample[]> = {
  accordion: [
    demo(
      'Standalone',
      'standalone',
      `<Accordion defaultValue="item-1" items={${JSON.stringify(standaloneAccordionItems, null, 2)}} />`,
    ),
    demo(
      'Single Expand',
      'single',
      `<Accordion defaultValue="item-1" items={${JSON.stringify(accordionItems, null, 2)}} />`,
      'Opening a section closes the previous section.',
    ),
    demo(
      'Multi Expand',
      'multiple',
      `<Accordion type="multiple" defaultValue={['item-1', 'item-3']} items={${JSON.stringify(multipleAccordionItems, null, 2)}} />`,
      'Several sections can stay open together.',
    ),
    demo(
      'Row highlight',
      'separated',
      `<Accordion defaultValue="item-1" highlight="trigger" items={${JSON.stringify(rowHighlightAccordionItems, null, 2)}} />`,
      'Only the hovered trigger is highlighted; the open panel keeps the page surface.',
    ),
  ],
  'ask-user-questions': [
    demo('Example', 'example', questionCode(questionExample('example'))),
    demo('Multiple questions', 'multiple', questionCode(questionExample('multiple'))),
    demo('Multi-select', 'multi-select', questionCode(questionExample('multi-select'))),
    demo('With other', 'other', questionCode(questionExample('other'))),
    demo('Free text', 'text', questionCode(questionExample('text'))),
    demo('Free text validation', 'validation', questionCode(questionExample('validation'))),
    demo('Skippable', 'skippable', questionCode(questionExample('skippable'))),
    demo('Chip on left', 'chip-left', questionCode(questionExample('chip-left'))),
    demo('Stacked layout', 'stacked', questionCode(questionExample('stacked'))),
    ...advancedExamples['ask-user-questions'],
  ],
  badge: [
    demo('Solid', 'solid', badgeExampleCode(badgeGenres, ['solid'])),
    demo('Dot', 'dot', badgeExampleCode(badgeGenres, ['dot'])),
    demo('Colors', 'colors', badgeExampleCode(badgeColorNames, ['solid', 'dot'])),
  ],
  breadcrumb: [
    demo(
      'Basic',
      'basic',
      `<Breadcrumb items={[\n  { label: 'Home', href: '/' },\n  { label: 'Components', href: '/docs' },\n  { label: 'Breadcrumb' },\n]} />`,
      'Every step shares one hover; the separator is part of each step, so the highlight never goes dark between them.',
    ),
    demo(
      'With icons',
      'icons',
      `<Breadcrumb items={[\n  { label: 'Home', href: '/', icon: <Icon name="home" /> },\n  { label: 'Projects', href: '/projects', icon: <Icon name="folder" /> },\n  { label: 'Q3 report.pdf', icon: <Icon name="file" /> },\n]} />`,
    ),
    demo(
      'Long step name',
      'long',
      `<Breadcrumb items={[\n  { label: 'Home', href: '/' },\n  { label: 'Quarterly planning and roadmap reviews', href: '/planning' },\n  { label: 'Engineering hiring plan for the second half of the year' },\n]} />`,
      'A link stops at 12rem and truncates; the current page takes the room that is left. Hover or focus a cut step for its full name.',
    ),
    demo(
      'Dropdown on a step',
      'menu',
      `<Breadcrumb openOnHover items={[\n  { label: 'Home', href: '/' },\n  { label: section, onMenuSelect: setSection, menu: sections.map((name) => ({\n    value: name, label: name, type: 'radio', checked: name === section,\n  })) },\n  { label: 'Breadcrumb' },\n]} />`,
      'Rest on Components to open its siblings. The chevron turns down to say the step opens a menu.',
    ),
    demo(
      'Open on click',
      'click',
      `<Breadcrumb items={[home, { label: section, menu: siblings, onMenuSelect: setSection }, page]} />`,
      'Leave openOnHover off and step menus open on click, the Dropdown default.',
    ),
    demo(
      'Collapse on overflow',
      'collapse',
      `<Breadcrumb collapse openOnHover items={steps} />`,
      'Drag the corner to narrow the trail. Middle steps fold into an ellipsis menu; the first step, the last link and the page stay.',
    ),
    demo(
      'Custom separator',
      'separator',
      `<Breadcrumb separator={<span>/</span>} items={steps} />`,
    ),
  ],
  banner: [
    demo(
      'Statuses',
      'statuses',
      `<Banner status="info"><BannerTitle>Info</BannerTitle></Banner>\n<Banner status="info" contrast="high"><BannerTitle>Info</BannerTitle></Banner>`,
      'Five statuses and two contrasts. Low colors the icon and high tints the whole banner.',
    ),
    demo(
      'Actions',
      'actions',
      `<Banner status="info">\n  <BannerTitle>Enjoying Reflow?</BannerTitle>\n  <BannerActions>\n    <BannerAction variant="primary">Star on GitHub</BannerAction>\n    <BannerAction>Share</BannerAction>\n    <BannerAction variant="ghost">Later</BannerAction>\n  </BannerActions>\n</Banner>`,
      'Actions follow a one-line title and wrap beneath a description.',
    ),
    demo(
      'Fixed',
      'fixed',
      `<Banner variant="fixed" status="warning" dismissible>\n  <BannerTitle>Registry maintenance tonight at 22:00 UTC</BannerTitle>\n  <BannerActions><BannerAction>Details</BannerAction></BannerActions>\n</Banner>`,
      'The notice sits beneath the header while the content scrolls.',
    ),
    demo(
      'Custom icon',
      'custom-icon',
      `<Banner icon={<Icon name="bell" />}>\n  <BannerTitle>3 new components since your last visit</BannerTitle>\n</Banner>`,
    ),
  ],
  button: [
    demo(
      'Variants',
      'variants',
      `<Button variant="primary">Primary</Button>\n<Button variant="secondary">Secondary</Button>\n<Button variant="tertiary">Tertiary</Button>\n<Button variant="ghost">Ghost</Button>\n<Button variant="destructive">Delete</Button>`,
    ),
    demo(
      'With Icons',
      'icons',
      `${iconCode}\n\n<Button leadingIcon={icon}>Create</Button>\n<Button variant="secondary" trailingIcon={icon}>Next</Button>\n<Button size="icon" aria-label="Search">{searchIcon}</Button>`,
    ),
    demo(
      'Loading & Disabled',
      'loading',
      `<Button loading>Click me</Button>\n<Button variant="secondary" loading>Saving</Button>\n<Button disabled>Disabled</Button>`,
      'The first button starts a brief loading state when clicked.',
    ),
    demo('Sizes', 'sizes', `<Button>Default</Button>\n<Button size="compact">Compact</Button>`),
  ],
  calendar: [
    demo('Single', 'single', `<Calendar defaultMonth="2026-11-01" defaultValue="2026-11-12" />`),
    demo(
      'Range',
      'range',
      `<Calendar mode="range" numberOfMonths={2} defaultMonth="2026-11-01" />`,
    ),
    demo(
      'Stacked months',
      'stacked',
      `<Calendar mode="range" numberOfMonths={2} orientation="vertical" defaultMonth="2026-11-01" />`,
    ),
    demo(
      'Booked and unavailable',
      'booked',
      `<Calendar mode="range" defaultMonth="2026-11-01" min="2026-11-06"\n  booked={['2026-11-12', '2026-11-13', '2026-11-14']}\n  isDateDisabled={(date) => new Date(date).getUTCDay() === 0} />`,
    ),
    demo(
      'Weekday availability',
      'available',
      `<Calendar defaultMonth="2026-11-01" isDateDisabled={(date) => [0, 6].includes(new Date(date).getUTCDay())} />`,
    ),
    demo(
      'Cell size',
      'size',
      `const nightlyRate = (date: string) => 99 + (Number(date.slice(-2)) * 7 % 10) * 10

<Calendar cellSize={56} defaultMonth="2026-11-01" dayDetail={(date) => {
  const rate = nightlyRate(date)
  return <span style={{ color: rate <= 119 ? 'var(--rf-success)' : undefined }}>${'\$'}{rate}</span>
}} />`,
    ),
    demo(
      'Week numbers',
      'weeks',
      `<Calendar showWeekNumbers weekStartsOn={1} defaultMonth="2026-11-01" />`,
    ),
  ],
  card: [
    demo('Basic', 'basic', cardBasicCode),
    demo('Grid: 2-D fluid hover', 'grid', cardGridCode),
    demo('Outlined group', 'outlined', cardOutlinedCode),
    demo('Separated tiles', 'separated', cardSeparatedCode),
    demo('Fully yours: compose anything', 'composition', cardCompositionCode),
    demo('Selected', 'selected', cardSelectedCode),
  ],
  'carousel-dots': [
    demo('Static', 'static', carouselExampleCode()),
    demo(
      'Autoplay',
      'autoplay',
      carouselExampleCode(4, true),
      'Hover the slide to pause its progress.',
    ),
  ],
  resizable: [
    demo(
      'Stacked panes',
      'vertical',
      `<Resizable orientation="vertical" label="Resize conversation" defaultValue={65}
  first={<div>Conversation</div>} second={<aside>Sources</aside>} />`,
      'Use the up and down arrows to resize a vertical stack. Home and End move to the bounds.',
    ),
  ],
  'file-input': [
    demo(
      'Image attachment',
      'image',
      `<FileInput label="Cover image" name="cover" accept="image/*" maxSize={2_000_000} required />`,
      'Pick, drop, or paste an image up to 2 MB. The chosen file is available through FormData.',
    ),
  ],
  'trigger-menu': [
    demo(
      'In a composer',
      'composer',
      `const triggers = ${JSON.stringify(composerTriggers, null, 2)}

<InputMessage triggers={triggers} attachments={false} onSend={({ text }) => console.log(text)} />`,
      'Type @ to mention a person or / to insert a command. Enter chooses the highlighted suggestion while the menu is open.',
    ),
  ],
  progress: [
    demo(
      'Indeterminate',
      'indeterminate',
      `<Progress label="Preparing files" />`,
      'Omit the value while the amount of work is unknown.',
    ),
  ],
  'number-field': [
    demo(
      'Decimal steps',
      'decimal',
      `<NumberField label="Hours" name="hours" min={0} max={24} step={0.25} defaultValue={1.5} description="Log time in quarter hours." />`,
      'Use the arrow keys or step buttons to adjust the value.',
    ),
  ],
  carousel: [
    demo(
      'Basic',
      'basic',
      `<Carousel label="Highlights" slideLabels={titles}>\n  {slides.map((slide) => <Slide {...slide} />)}\n</Carousel>`,
      'Swipe, scroll with a trackpad or the arrow keys, or drag with a mouse; the slide snaps into place and the dots follow. Each slide reads as its name and place, such as “Shared hover, 2 of 4”.',
    ),
    demo(
      'Several in view',
      'several',
      `<Carousel label="Highlights" style={{ '--rf-carousel-slide': 'calc((100% - 24px) / 3)' }}>\n  {slides}\n</Carousel>`,
      'Set --rf-carousel-slide for the slides’ width and --rf-carousel-gap for the space between them.',
    ),
    demo(
      'Centered',
      'center',
      `<Carousel label="Highlights" align="center" defaultIndex={1}>{slides}</Carousel>`,
      'Slides rest in the middle with their neighbours peeking in.',
    ),
    demo(
      'Autoplay',
      'autoplay',
      `<Carousel label="Highlights" autoplay={{ duration: 3000 }}>{slides}</Carousel>`,
      'The dots time it and show its progress. It pauses while pointed at or focused, and its button stops it, as the carousel pattern asks.',
    ),
    demo(
      'Linked slides',
      'links',
      `<Carousel label="Articles">\n  {articles.map((article) => <a href={article.href}>…</a>)}\n</Carousel>`,
      'A drag that ends over a link does not follow it; a click does.',
    ),
  ],
  'chat-layout': [
    demo(
      'A live conversation',
      'basic',
      `<ChatLayout composer={<InputMessage onSend={send} />}>\n  {messages.map((message) => (\n    <ChatMessage role={message.role}>{message.text}</ChatMessage>\n  ))}\n</ChatLayout>`,
      'Send a message and watch the reply stream in: the transcript stays on the newest message while you are there.',
    ),
    demo(
      'Long history',
      'history',
      `<ChatLayout composer={composer}>{history}</ChatLayout>`,
      'The transcript opens at the newest message. Scroll back and it leaves you there, with a button back to the latest; it reads New messages once something arrives.',
    ),
    demo(
      'Empty state',
      'empty',
      `<ChatLayout\n  empty={<p>Start a conversation</p>}\n  composer={composer}\n>\n  {messages}\n</ChatLayout>`,
    ),
    demo(
      'With a header',
      'header',
      `<ChatLayout\n  header={<ChatHeader title="Design chat" people={people} />}\n  composer={composer}\n>\n  {messages}\n</ChatLayout>`,
    ),
  ],
  'chat-message': [
    demo(
      'Roles',
      'roles',
      `<ChatMessage role="user" animate={false}>Right-aligned accent bubble.</ChatMessage>
<ChatMessage role="assistant" animate={false}>Left-aligned, no background.</ChatMessage>`,
    ),
    demo(
      'Attachments',
      'attachments',
      `const avatar = ${JSON.stringify(chatAvatar)}

<ChatMessage role="user" animate={false} attachments={[{ name: 'avatar.svg', previewUrl: avatar }]}>
  Can you use this as my new avatar?
</ChatMessage>
<ChatMessage role="assistant" animate={false}>Looks great — it’ll crop cleanly into the circle.</ChatMessage>`,
    ),
    demo(
      'System messages',
      'system',
      `<ChatMessage role="system" icon={<Icon name="clock" />} time="Yesterday 6:08 PM">
  Conversation resumed
</ChatMessage>
<ChatMessage role="user">Can you tighten the intro?</ChatMessage>
<ChatMessage
  role="system"
  icon={<Icon name="cpu" />}
  actions={<Button size="compact" variant="ghost">Undo</Button>}
>
  Switched to a faster model
</ChatMessage>`,
      'Events in the conversation, such as a model switch or a resumed session, sit between messages as a quiet centred line. Their time and actions stay in view.',
    ),
  ],
  checkbox: [
    demo(
      'With a description',
      'description',
      `<Field description="One email a month, never more.">
  {(control) => <Checkbox {...control} label="Product updates" defaultChecked />}
</Field>`,
    ),
    demo(
      'Invalid and disabled',
      'states',
      `<Field error="Required to join the event">
  {(control) => <Checkbox {...control} label="I agree to the code of conduct" />}
</Field>
<Checkbox label="Managed by your admin" disabled defaultChecked />
<Checkbox label="Mixed selection" indeterminate />`,
    ),
  ],
  'checkbox-group': [
    demo(
      'With descriptions',
      'descriptions',
      `<CheckboxGroup label="Notifications" options={[\n  { value: 'email', label: 'Email', description: 'Updates in your inbox' },\n  { value: 'push', label: 'Push', description: 'Notifications on your device' },\n]} />`,
    ),
    demo(
      'Controlled selection',
      'controlled',
      `<CheckboxGroup label="Features" options={options}\n  value={selected} onValueChange={setSelected} />`,
    ),
  ],
  'color-picker': [
    demo('Default', 'default', `<ColorPicker defaultValue="#6B97FF" />`),
    demo(
      'Popover',
      'popover',
      `<ColorPicker variant="popover" triggerLabel="Fill" defaultValue="#6B97FF" />`,
    ),
    demo(
      'With Swatches',
      'swatches',
      `<ColorPicker defaultValue="#6B97FF" swatches={['#000000', '#FFFFFF', '#FF3B30', '#F0F0F0', '#E5E5E5', '#D0D0D0', 'rgba(0,0,0,0.5)']} />`,
    ),
    demo('OKLCH Format', 'oklch', `<ColorPicker defaultFormat="oklch" defaultValue="#6B97FF" />`),
    demo(
      'Controlled',
      'controlled',
      `<ColorPicker value={color} onValueChange={setColor} />\n<output>{color}</output>`,
    ),
    demo(
      'Removable Trigger',
      'removable',
      `{fill ? (
  <ColorPicker variant="popover" triggerLabel="Fill" triggerShowRemove
    onTriggerRemove={() => setFill('')} value={fill} onValueChange={setFill} />
) : <Button mix={on('click', () => setFill('#6B97FF'))}>+ Add fill</Button>}`,
    ),
    demo(
      'Eyedropper Support',
      'eyedropper',
      `<ColorPicker defaultValue="#6B97FF" />`,
      'The eyedropper uses the native window.EyeDropper API (Chromium-based browsers). It is automatically hidden in browsers that do not support it.',
    ),
  ],
  combobox: [
    demo(
      'Basic',
      'basic',
      `<Combobox label="Framework" options={frameworks} placeholder="Select a framework…" />`,
    ),
    demo(
      'With icons',
      'icons',
      `<Combobox label="View" leadingIcon={<Icon name="search" />} options={views} placeholder="Jump to view…" />`,
    ),
    demo(
      'Multiple selection',
      'multiple',
      `<Combobox label="Frameworks" options={frameworks} multiple defaultValues={['next', 'astro']} />`,
    ),
    demo(
      'Create from the query',
      'create',
      `<Combobox label="Components" options={components} multiple creatable onCreate={saveComponent} />`,
    ),
    demo(
      'Hide picked rows',
      'hide',
      `<Combobox label="Components" options={components} multiple hideSelected defaultValues={['button', 'combobox']} />`,
    ),
    demo(
      'Variants',
      'variants',
      `<Combobox label="Bordered" options={frameworks} variant="bordered" />
<Combobox label="Ghost" options={frameworks} variant="ghost" />`,
    ),
    demo(
      'Long list',
      'long',
      `<Combobox label="Timezone" options={timezones} />`,
      'Filter the list, then use the arrow keys and Enter to choose an option.',
    ),
    demo(
      'Error & disabled',
      'error',
      `<Combobox label="Framework" options={frameworks} error />
<Combobox label="Framework" options={frameworks} placeholder="Disabled" disabled />`,
    ),
  ],
  'command-menu': [
    demo(
      'Basic',
      'basic',
      `<CommandMenu items={commands} onSelect={runCommand} />`,
      'Type to filter, press ↓ ↑ to move, Enter to run. Rows come from items, grouped by group.',
    ),
    demo(
      'Descriptions, shortcuts, disabled rows',
      'descriptions',
      `<CommandMenu items={[\n  { value: 'new-file', label: 'New file', description: 'Blank document', shortcut: 'mod+n', keywords: ['create'] },\n  { value: 'settings', label: 'Settings', shortcut: 'mod+,' },\n  { value: 'export', label: 'Export as PDF', description: 'Pro plan', disabled: true },\n]} onSelect={runCommand} />`,
      '3 more fields per row: description, shortcut caps, and disabled, which the arrows skip. Type clipboard: keywords match too.',
    ),
    demo(
      'Suggestions',
      'groups',
      `<CommandMenu items={commands} suggestions={['calendar', 'new-file', 'settings']} suggestionsLabel="Recent" onSelect={runCommand} />`,
      '3 suggested rows lead until you type 1 letter, then the groups take over.',
    ),
    demo(
      'Tabs',
      'filters',
      `<CommandMenu filters={['Actions', 'Go to', 'Help']} items={commands} onSelect={runCommand} />`,
      'Click a tab or press ← →, and the rows follow. Controls hug the end of the row beneath the field.',
    ),
    demo(
      'Filters',
      'controls',
      `<CommandMenu items={commands} controls={<>\n  <Select variant="ghost" label="Type" options={types} />\n  <Select variant="ghost" label="Sort" options={sorts} />\n</>} onSelect={runCommand} />`,
      'A compact, borderless row under the field for selects or ghost buttons; the list divider closes it.',
    ),
    demo(
      'Dialog and trigger shortcut',
      'dialog',
      `<CommandMenu trigger={<>Open <CommandShortcut keys="mod+p" /></>} shortcut="mod+p" suggestions={['calendar', 'new-file', 'settings']} items={commands} onSelect={runCommand} />`,
      'Press the combo anywhere on the page. A pick or Escape closes it.',
    ),
    demo(
      'Footer hints',
      'footer',
      `<CommandMenu items={commands} filters={['Actions', 'Go to', 'Help']} suggestions={['calendar', 'new-file', 'settings']} footer onSelect={runCommand} />`,
      'Hints follow the menu: ← → with tabs, Esc in a dialog, and ↵ named after the highlighted row.',
    ),
    demo(
      'Custom rows',
      'custom',
      `<CommandMenu items={commands} renderItem={(item) => (\n  <><span>{item.label}</span><span>{item.group}</span></>\n)} onSelect={runCommand} />`,
      'renderItem replaces the row content; the icon and caps stay in your hands.',
    ),
  ],
  'date-picker': [
    demo(
      'Date',
      'date',
      `<DatePicker label="Start date" />`,
      'Opens on the selected day, or today. Pick one and it closes.',
    ),
    demo(
      'Range with presets',
      'presets',
      `<DatePicker label="Travel dates" mode="range" numberOfMonths={2}\n  presets={[\n    { label: 'Next 7 days', value: { start: today, end: in6Days } },\n    { label: 'Next 14 days', value: { start: today, end: in13Days } },\n    { label: 'Next 30 days', value: { start: today, end: in29Days } },\n    { label: 'This weekend', value: { start: saturday, end: sunday } },\n  ]} />`,
      'Pick a start and an end, or a preset. It closes once the end is set.',
    ),
    demo(
      'Date and time',
      'time',
      `<DatePicker label="Meeting" variant="ghost" timeRange\n  defaultValue={today} defaultTime="11:00" defaultEndTime="12:45" />`,
      'Type 1130 or 11:30am, or arrow through the slots. Changing the start preserves the duration.',
    ),
    demo(
      'One time',
      'timeStep',
      `<DatePicker label="Deadline" time />`,
      'time takes one time instead. Type a time or choose a slot.',
    ),
    demo(
      'Booked days',
      'booked',
      `<DatePicker label="Stay dates" mode="range" numberOfMonths={2} placeholder="Check in → check out"\n  booked={[in3Days, in4Days, in5Days, in11Days, in12Days]} min={today} />`,
      'booked marks nights, min closes past days.',
    ),
  ],
  dialog: [
    demo(
      'Sizes',
      'sizes',
      `<Dialog size="sm" title="Small dialog" trigger="Small" />\n<Dialog size="lg" title="Large dialog" trigger="Large" />\n<Dialog size="xl" title="Extra large dialog" trigger="Extra large" />`,
    ),
    demo(
      'With a sidebar',
      'sidebar',
      `<Dialog size="xl" title="Settings" trigger="Open settings" flush>\n  <Sidebar sections={sections} defaultWidth={208} fixed>\n    <Field label="Workspace"><Input defaultValue="Studio" /></Field>\n  </Sidebar>\n</Dialog>`,
    ),
  ],
  dropdown: [
    demo(
      'Basic',
      'inline',
      `const items = [
  { value: 'Teamspaces', label: 'Teamspaces', icon: <Icon name="square-library" /> },
  { value: 'Recents', label: 'Recents', icon: <Icon name="clock" /> },
  { value: 'Favorites', label: 'Favorites', icon: <Icon name="star" /> },
  { value: 'Shared', label: 'Shared', icon: <Icon name="users" /> },
  { value: 'Private', label: 'Private', icon: <Icon name="lock" /> },
].map((item) => ({ ...item, type: 'radio', checked: selected === item.value }))

<Dropdown inline label="Library" items={items}
  onSelect={(value) => setSelected(selected === value ? null : value)} />`,
    ),
    demo(
      'Groups',
      'groups',
      `<Dropdown inline label="Settings" items={[
  { value: 'Email', label: 'Email', group: 'Account', icon: <Icon name="mail" /> },
  { value: 'Notifications', label: 'Notifications', group: 'Account', icon: <Icon name="bell" /> },
  { value: 'Privacy', label: 'Privacy', group: 'Account', icon: <Icon name="shield" /> },
  { value: 'General', label: 'General', group: 'Appearance', separatorBefore: true, icon: <Icon name="settings" /> },
  { value: 'Theme', label: 'Theme', group: 'Appearance', icon: <Icon name="palette" /> },
  { value: 'Display', label: 'Display', group: 'Appearance', icon: <Icon name="monitor" /> },
]} />`,
      'Group labels and separators come from group and separatorBefore.',
    ),
    demo(
      'Triggered menu',
      'triggered',
      `<Dropdown label="Open menu" variant="ghost" chevron={false}
  items={items} onSelect={setView} />`,
      'The same menu behind a trigger: pass label, variant and items.',
    ),
    demo(
      'Open on hover',
      'hover',
      `<Dropdown label="Recent" variant="ghost" openOnHover items={recent} onSelect={open} />`,
      'Rest the pointer on the trigger to preview the menu; it closes when the pointer leaves both. Click to keep it open.',
    ),
    demo(
      'Submenus',
      'submenus',
      `<Dropdown label="Q3 report.pdf" variant="ghost" chevron={false} items={[
  { value: 'move', label: 'Move to', icon: <Icon name="folder" />,
    children: ['Inbox', 'Design', 'Engineering', 'Marketing', 'Archive'].map((name) => ({ value: name, label: name })) },
  { value: 'share', label: 'Share', icon: <Icon name="link" />, children: [
    { value: 'copy', label: 'Copy link', icon: <Icon name="link" /> },
    { value: 'email', label: 'Email', icon: <Icon name="mail" /> },
  ] },
  { value: 'rename', label: 'Rename', icon: <Icon name="pencil" /> },
]} />`,
      'Hover Move to, then cut across Share to its submenu: the highlight stays on Move to until you stop on another row.',
    ),
    demo(
      'Multiple selection',
      'multiple',
      `<Dropdown label="Status" variant="ghost" chevron={false}
  items={statuses.map((name) => ({ value: name, label: name, type: 'checkbox', checked: picked.includes(name) }))}
  onSelect={toggle} />`,
      'Checkbox rows with type: "checkbox".',
    ),
    demo(
      'Searchable menu',
      'search',
      `<Dropdown label={language} variant="ghost" searchable
  searchPlaceholder="Search languages" emptyMessage="No languages found"
  items={languages.map((name) => ({ value: name, label: name, type: 'radio', checked: language === name }))}
  onSelect={setLanguage} />`,
      'Type to filter, arrow down to a row, press Enter.',
    ),
    demo(
      'Searchable multiple selection',
      'search-multiple',
      `<Dropdown label={\`Labels · \${labels.length}\`} variant="ghost" chevron={false}
  searchable searchPlaceholder="Search labels" emptyMessage="No labels found"
  items={names.map((name) => ({ value: name, label: name, type: 'checkbox', checked: labels.includes(name) }))}
  onSelect={toggle} />`,
      'Search and checkbox rows together.',
    ),
    demo(
      'Create from the query',
      'create',
      `<Dropdown label={\`Components · \${used.length}\`} variant="ghost" chevron={false}
  creatable searchPlaceholder="Search components" emptyMessage="No components found"
  items={components.map((name) => ({ value: name, label: name, type: 'checkbox', checked: used.includes(name) }))}
  onCreate={addComponent} onSelect={toggle} />`,
      'An extra row appears when nothing matches the query.',
    ),
  ],
  field: [
    demo(
      'Input',
      'input',
      `<Field label="Username" description="Choose a unique username for your account.">
  {(control) => <Input {...control} placeholder="ada" />}
</Field>`,
    ),
    demo(
      'Textarea',
      'textarea',
      `<Field label="Feedback" description="It grows with your text.">
  {(control) => <Textarea {...control} placeholder="What worked, what didn't?" />}
</Field>`,
    ),
    demo(
      'Select',
      'select',
      `const options = ['Design', 'Engineering', 'Research'].map((label) => ({ value: label, label }))

<Field label="Department" description="Where you spend most of your week.">
  {(control) => <Select {...control} label="Department" options={options} placeholder="Choose a department" />}
</Field>`,
    ),
    demo(
      'Checkbox',
      'checkbox',
      `<FieldSet legend="Notify me about" legendVariant="label">
  <Field orientation="horizontal">
    <Checkbox id="replies" defaultChecked />
    <FieldLabel for="replies">Replies to my comments</FieldLabel>
  </Field>
  <Field orientation="horizontal">
    <Checkbox id="mentions" />
    <FieldContent>
      <FieldLabel for="mentions">Mentions</FieldLabel>
      <FieldDescription>Only from people in your workspace.</FieldDescription>
    </FieldContent>
  </Field>
</FieldSet>`,
    ),
    demo(
      'Choice card',
      'choice-card',
      `<FieldGroup>
  <FieldLabel for="kubernetes">
    <Field orientation="horizontal">
      <Checkbox id="kubernetes" defaultChecked />
      <FieldContent>
        <FieldTitle>Kubernetes</FieldTitle>
        <FieldDescription>Run GPU workloads on a K8s cluster.</FieldDescription>
      </FieldContent>
    </Field>
  </FieldLabel>
  <FieldLabel for="vm">
    <Field orientation="horizontal">
      <Checkbox id="vm" />
      <FieldContent>
        <FieldTitle>Virtual machine</FieldTitle>
        <FieldDescription>Access a cluster to run GPU workloads.</FieldDescription>
      </FieldContent>
    </Field>
  </FieldLabel>
</FieldGroup>`,
    ),
    demo(
      'Fieldset',
      'fieldset',
      `<FieldSet legend="Address">
  <FieldDescription>We need your address to deliver your order.</FieldDescription>
  <Field label="Street address">{(control) => <Input {...control} placeholder="123 Main St" />}</Field>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
    <Field label="City">{(control) => <Input {...control} placeholder="Paris" />}</Field>
    <Field label="Postal code">{(control) => <Input {...control} placeholder="75001" />}</Field>
  </div>
</FieldSet>`,
    ),
    demo(
      'Validation and errors',
      'error',
      `<Field label="Work email address" error="Enter a valid email address">
  {(control) => <Input {...control} type="email" defaultValue="ada@anthropic" />}
</Field>`,
    ),
    demo(
      'Horizontal',
      'horizontal',
      `const options = [{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]

<FieldGroup>
  <Field orientation="horizontal">
    <FieldContent>
      <FieldLabel for="language">Language</FieldLabel>
      <FieldDescription>Used across the app and in emails.</FieldDescription>
    </FieldContent>
    <Select id="language" label="Language" placeholder="Pick one" options={options} />
  </Field>
</FieldGroup>`,
    ),
    demo(
      'Separator',
      'separator',
      `<FieldGroup>
  <Field label="Work email">{(control) => <Input {...control} type="email" placeholder="you@company.com" />}</Field>
  <FieldSeparator>Or continue with</FieldSeparator>
  <Button variant="secondary">Continue with SSO</Button>
</FieldGroup>`,
    ),
  ],
  input: [
    demo(
      'With Field',
      'field',
      `<Field label="Email" description="Use your work email.">\n  {(control) => <Input {...control} type="email" placeholder="you@company.com" />}\n</Field>`,
    ),
    demo(
      'Invalid',
      'invalid',
      `<Input aria-label="Email" aria-invalid="true" defaultValue="invalid email" />`,
    ),
    demo(
      'Disabled',
      'disabled',
      `<Input aria-label="Email" defaultValue="you@company.com" disabled />`,
    ),
    demo(
      'Types',
      'types',
      `<Input type="password" aria-label="Password" placeholder="Password" />\n<Input type="number" aria-label="Seats" placeholder="Seats" min="1" />\n<Input type="file" aria-label="Attachment" />`,
    ),
    demo(
      'With a button',
      'button',
      `<form>\n  <Input type="email" aria-label="Email" placeholder="Email" required />\n  <Button type="submit">Subscribe</Button>\n</form>`,
    ),
  ],
  'input-copy': [
    demo(
      'With Label',
      'label',
      `<InputCopy label="Install command" value="pnpm add remix @remix-run/ui @remix-run/component" />`,
    ),
    demo(
      'Button Variant',
      'button',
      `<InputCopy variant="button" value="pnpm add remix @remix-run/ui @remix-run/component" />`,
    ),
    demo(
      'Left Aligned',
      'left',
      `<InputCopy align="left" value="pnpm add remix @remix-run/ui @remix-run/component" />\n<InputCopy variant="button" align="left" value="pnpm add remix @remix-run/ui @remix-run/component" />`,
    ),
    demo(
      'Disabled',
      'disabled',
      `<InputCopy label="Invite code" value="ABCD-1234-EFGH" disabled />`,
    ),
    demo(
      'Copy Callback',
      'callback',
      `<InputCopy label="Share link" value="https://reflow.example/r/input-copy" onCopy={() => count++} />`,
    ),
  ],
  'input-group': [
    demo(
      'Multiple Fields',
      'multiple',
      `<InputGroup>\n  <InputField label="Name" placeholder="Your name" />\n  <InputField label="Email" type="email" placeholder="you@example.com" icon={mailIcon} />\n</InputGroup>`,
    ),
    demo(
      'Error State',
      'error',
      `<InputGroup>\n  <InputField label="Email" type="email" icon={mailIcon} error="Please enter a valid email address." defaultValue="bad@" />\n</InputGroup>`,
    ),
  ],
  'input-message': [
    demo('Basic', 'basic', `<InputMessage attachments={false} onSend={sendMessage} />`),
    demo(
      'Suggestions',
      'suggestions',
      `<InputMessage placeholderSuggestion="Why is every other input box so stiff?" suggestions={prompts} onSend={sendMessage} />`,
      'Press Tab in the empty composer to accept the ghost prompt, or use ArrowDown and Enter to pick one from the list.',
    ),
    demo(
      'Attachments',
      'attachments',
      `<InputMessage attachments maxFiles={3} onSend={({ text, files }) => send(text, files)} />`,
      'Use the attachment button or drop files onto the composer.',
    ),
    demo(
      'Queued messages',
      'streaming',
      `<InputMessage status={status} onStop={stopResponse} transitionMessages onSend={sendMessage} />`,
    ),
    demo(
      'Left Slot Only',
      'left',
      `<InputMessage attachments={false} actions={<Button variant="ghost">Attach context</Button>} onSend={sendMessage} />`,
    ),
    demo(
      'Right Slot Only',
      'right',
      `<InputMessage attachments={false} rightActions={<Dropdown label="Sonnet 4.6" items={models} />} onSend={sendMessage} />`,
    ),
    demo(
      'Suggested messages',
      'suggested-messages',
      `<InputMessage suggestions={['Summarize this document', 'Plan my next project']} onSend={sendMessage} />`,
      'Use ArrowUp and ArrowDown to choose a suggestion, then Enter to accept it.',
    ),

    demo(
      'Message history',
      'history',
      `<InputMessage history={['Draft a plan', 'Review the design']} onSend={sendMessage} />`,
      'Press ArrowUp in an empty composer to recall a previous message.',
    ),
    demo(
      'Custom actions',
      'actions',
      `<InputMessage actions={<Button variant="ghost" size="compact">Attach context</Button>}\n  onSend={sendMessage} />`,
    ),
    demo(
      'Send Handler',
      'send',
      `<InputMessage onSend={async ({ text, files }) => {\n  await saveMessage(text, files)\n}} />`,
    ),
    demo('Disabled', 'disabled', `<InputMessage disabled onSend={sendMessage} />`),
  ],
  'hover-card': [
    demo(
      'Basic',
      'basic',
      `<HoverCard renderTrigger={(trigger) => (\n  <a href="/u/reflow" {...trigger}>@reflow</a>\n)}>\n  <Profile user={user} />\n</HoverCard>`,
      'Rest the pointer on the name, or tab to it. Move into the card to use it; it closes shortly after the pointer leaves both, or on Escape.',
    ),
    demo(
      'Link preview',
      'link',
      `<p>Reflow is built on <HoverCard renderTrigger={(trigger) => (\n  <a href="https://remix.run" {...trigger}>Remix 3</a>\n)}>\n  <LinkPreview url="https://remix.run" />\n</HoverCard>.</p>`,
      'The trigger stays an ordinary link: a click or a tap follows it.',
    ),
    demo(
      'Placement',
      'placement',
      `<HoverCard placement="top" renderTrigger={(trigger) => (\n  <a href="/u/reflow" {...trigger}>@reflow</a>\n)}>…</HoverCard>`,
    ),
    demo(
      'Instant',
      'instant',
      `<HoverCard openDelay={0} closeDelay={100} renderTrigger={(trigger) => (\n  <a href="/u/reflow" {...trigger}>@reflow</a>\n)}>…</HoverCard>`,
      'Without the open delay the card follows the pointer at once. The default 500ms waits for intent.',
    ),
    demo(
      'Compact',
      'compact',
      `<HoverCard size="compact" renderTrigger={(trigger) => (\n  <a href="/u/reflow" {...trigger}>@reflow</a>\n)}>…</HoverCard>`,
    ),
  ],
  popover: [
    demo(
      'Basic',
      'basic',
      `<Popover label="Dimensions" trigger="Dimensions">\n  <Input name="width" defaultValue="100%" />\n  <Input name="height" defaultValue="auto" />\n</Popover>`,
      'A click opens the panel and moves focus to its first field; Escape or a click outside closes it and returns focus to the trigger.',
    ),
    demo(
      'Title and description',
      'title',
      `<Popover title="Share this page" description="Anyone with the link can view it." trigger="Share">\n  <InputCopy label="Link" value={url} />\n</Popover>`,
      'A visible title names the panel; without one, pass label.',
    ),
    demo(
      'Placement',
      'placement',
      `<Popover label="Details" trigger="Top" placement="top">…</Popover>`,
      'The panel flips to the other side when there is no room.',
    ),
    demo(
      'Custom trigger',
      'trigger',
      `<Popover title="Display" placement="bottom-end" renderTrigger={(trigger) => (\n  <Button variant="ghost" size="icon" aria-label="Display settings" {...trigger}>\n    <Icon name="settings" />\n  </Button>\n)}>…</Popover>`,
    ),
    demo(
      'Controlled',
      'controlled',
      `<Popover title="Dimensions" trigger="Dimensions" open={open} onOpenChange={setOpen}>\n  <form onSubmit={apply}>…</form>\n</Popover>`,
      'Close the panel from your own actions, such as Apply and Cancel.',
    ),
    demo(
      'Compact',
      'compact',
      `<Popover label="Dimensions" trigger="Dimensions" size="compact">…</Popover>`,
    ),
  ],
  avatar: [
    demo(
      'Images and initials',
      'basic',
      `<Avatar name="Alex Morgan" src={photo} size={40} />\n<Avatar name="Ada Lovelace" size={40} />\n<Avatar name="Broken Image" src={missing} size={40} />`,
      'Without an image, or while it loads, or if it fails, the initials show on a colour picked from the name, the same every time.',
    ),
    demo(
      'Sizes',
      'sizes',
      `<Avatar name="Ada Lovelace" size={20} />\n<Avatar name="Ada Lovelace" size={32} />\n<Avatar name="Ada Lovelace" size={56} />`,
    ),
    demo(
      'Shapes and colours',
      'shapes',
      `<Avatar name="Ada Lovelace" src={photo} />\n<Avatar name="Reflow" shape="square" color="accent" />\n<Avatar name="Build Agent" shape="square" color="indigo" />`,
      'Square suits teams, organisations and agents.',
    ),
    demo(
      'Status',
      'status',
      `<Avatar name="Grace Hopper" status="online" />\n<Avatar name="Grace Hopper" status="away" />`,
      'The status is part of the avatar’s name: “Grace Hopper (away)”.',
    ),
    demo(
      'Group',
      'group',
      `<AvatarGroup avatars={editors} label="Editors" />`,
      'Each avatar names itself in a tooltip; past max, a count names the rest. Pointing at the row spreads it apart.',
    ),
    demo(
      'Group sizes',
      'group-sizes',
      `<AvatarGroup avatars={editors} max={3} size={24} />\n<AvatarGroup avatars={editors} size={40} shape="square" />`,
    ),
  ],
  citation: [
    demo(
      'Basic',
      'basic',
      `<p>\n  Good design is unobtrusive and honest.\n  <Citation index={1} sources={rams} /> It makes clear what you can do\n  and what just happened.\n  <Citation index={2} sources={norman} />\n</p>`,
      'The chip links to its source and previews it while the pointer rests on it or focus is on it. Its accessible name says what it cites, not only its number.',
    ),
    demo(
      'Several sources',
      'multiple',
      `<Citation index={1} sources={[rams, norman, laws]} />`,
      'One chip can cite several sources; they take the numbers that follow, and the preview lists each.',
    ),
    demo(
      'Site names',
      'site',
      `<Citation variant="site" sources={rams} />\n<Citation variant="site" sources={[laws, norman]} />`,
      'Show the site instead of a number, with a count of the rest.',
    ),
    demo(
      'Icons',
      'icons',
      `const sources = [{ ...rams, icon: <img src={favicon} alt="" /> }]`,
      'Sources show a globe unless they bring their own icon.',
    ),
    demo(
      'In a reply',
      'chat',
      `<ChatMessage role="assistant">\n  Mostly that you stop noticing it.\n  <Citation index={1} sources={rams} /> It lets you do what you came to do…\n  <Citation index={2} sources={[norman, laws]} />\n</ChatMessage>`,
    ),
  ],
  'code-block': [
    demo(
      'Basic',
      'basic',
      `import { CodeBlock } from '@rtzll/reflow'\nimport { highlight } from '@rtzll/reflow/highlight'\n\n// In a route handler, so the page arrives highlighted.\nconst code = await highlight(source, { lang: 'tsx' })\n\n<CodeBlock code={code} filename="route.tsx" />`,
      'Highlight where the code is known, ideally in a route handler: the page arrives highlighted and the browser loads no highlighter. Install shiki and @shikijs/transformers to use @rtzll/reflow/highlight; everything else in Reflow works without them.',
    ),
    demo(
      'Line marks',
      'notation',
      `const code = await highlight(\n  \`let sum = 0 // [!code --]\nlet sum = items.length ? 0 : Number.NaN // [!code ++]\nfor (const item of items) sum += item.price // [!code highlight]\nreturn sum // [!code warning]\`,\n  { lang: 'ts' },\n)`,
      'Comments in the code mark lines as added, removed, highlighted, or carrying an error or warning, and leave the code. [!code word:name] marks a word.',
    ),
    demo(
      'Focus',
      'focus',
      `const source = \`const code = await highlight(source) // [!code focus]\``,
      'Focused lines keep the eye; the rest blur until the reader points at or focuses the block.',
    ),
    demo(
      'Line numbers',
      'line-numbers',
      `<CodeBlock code={code} filename="code-block.css" lineNumbers startLine={42} />`,
      'Numbers sit in a gutter that selection and copying skip.',
    ),
    demo(
      'Any language',
      'languages',
      `await highlight(source, { lang: 'python' })`,
      'Every language Shiki bundles loads on first use; unknown ones render as plain text.',
    ),
    demo(
      'Long code',
      'folded',
      `<CodeBlock code={code} filename="highlight.ts" lineNumbers maxLines={8} />`,
      'Folds behind a Show all button past maxLines.',
    ),
    demo('Wrapping', 'wrap', `<CodeBlock code={code} language="md" wrap />`),
    demo(
      'Other themes',
      'themes',
      `await highlight(source, {\n  lang: 'ts',\n  themes: { light: 'github-light', dark: 'github-dark' },\n})`,
      'Reflow’s own theme takes its colours from CSS variables and follows the accent; any Shiki theme, or a light and dark pair, works too.',
    ),
    demo(
      'Without highlighting',
      'plain',
      `<CodeBlock code={'pnpm add shiki @shikijs/transformers'} language="bash" />`,
      'Plain code needs nothing but Reflow.',
    ),
  ],
  drawer: [
    demo(
      'Basic',
      'basic',
      `<Drawer\n  trigger="Filters"\n  title="Filters"\n  description="Narrow the results."\n  footer={(close) => <Button mix={on('click', close)}>Apply</Button>}\n>\n  <SegmentedControl label="Sort by" options={sorts} fill />\n  <Switch label="In stock only" defaultChecked />\n</Drawer>`,
      'Drag the panel down, flick it, press Escape or click the backdrop to close it; focus returns to the trigger.',
    ),
    demo(
      'Sides',
      'sides',
      `<Drawer side="top" trigger="Top" title="Announcement">…</Drawer>\n<Drawer side="right" trigger="Right" title="Details">…</Drawer>\n<Drawer side="bottom" trigger="Bottom" title="Filters">…</Drawer>\n<Drawer side="left" trigger="Left" title="Mailboxes">…</Drawer>`,
      'Top and bottom drawers show a handle; side drawers show a close button. Each closes with a drag toward its edge.',
    ),
    demo(
      'Navigation',
      'navigation',
      `<Drawer side="left" trigger="Mailboxes" title="Mailboxes">\n  <nav aria-label="Mail">…</nav>\n</Drawer>`,
    ),
    demo(
      'Scrolling content',
      'scrolling',
      `<Drawer trigger="Release notes" title="Release notes">\n  <ol>…</ol>\n</Drawer>`,
      'Long content scrolls inside the panel; a drag only takes over once the content is back at its start.',
    ),
    demo(
      'Not dismissible',
      'required',
      `<Drawer\n  trigger="Accept terms"\n  title="Terms of service"\n  dismissible={false}\n  footer={(close) => <Button mix={on('click', close)}>Accept</Button>}\n>…</Drawer>`,
      'Escape, the backdrop and drags leave it open; close it from your own action.',
    ),
  ],
  toaster: [
    demo(
      'Basic',
      'basic',
      `// Once, near the root of the app:\n<Toaster />\n\n// Anywhere:\ntoast('Event created')`,
      'Place one Toaster in the app and raise toasts with toast() from anywhere: no provider, and nothing renders on the server.',
    ),
    demo(
      'Status',
      'status',
      `toast.success('Changes saved')\ntoast.info('A new version is available')\ntoast.warning('Storage is almost full')\ntoast.error('Could not send the message')`,
      'Status toasts share Banner’s icons and colors.',
    ),
    demo(
      'Description',
      'description',
      `toast('Event created', { description: 'Monday, November 9 at 9:41' })`,
    ),
    demo(
      'Action',
      'action',
      `toast('Conversation archived', {\n  action: { label: 'Undo', onClick: restore },\n})`,
      'The toast closes after its action runs, unless the handler calls event.preventDefault().',
    ),
    demo(
      'Promise',
      'promise',
      `toast.promise(upload(file), {\n  loading: 'Uploading roadmap.pdf…',\n  success: (name) => \`Uploaded \${name}\`,\n  error: 'Upload failed',\n})`,
      'One toast follows the promise from loading to its outcome.',
    ),
    demo(
      'Position',
      'position',
      `<Toaster position="top-center" />`,
      'Six positions: the three top and the three bottom ones. Swipes dismiss toward the nearest edge.',
    ),
    demo(
      'Expanded',
      'expand',
      `<Toaster expand />`,
      'Spread out from the start, instead of piling until pointed at or focused.',
    ),
    demo(
      'Close button',
      'close-button',
      `<Toaster closeButton />`,
      'Swipes, Escape and Alt+T work without it; the button helps where those are hard to discover.',
    ),
  ],
  'radio-group': [
    demo(
      'With descriptions',
      'descriptions',
      `<RadioGroup label="Plan" options={[\n  { value: 'free', label: 'Free', description: 'For personal projects' },\n  { value: 'pro', label: 'Pro', description: 'For growing teams' },\n]} defaultValue="free" />`,
    ),
    demo(
      'Horizontal',
      'horizontal',
      `<RadioGroup label="Size" orientation="horizontal" options={options} />`,
    ),
  ],
  'segmented-control': [
    demo(
      'Basic',
      'basic',
      `<SegmentedControl label="Period" options={[\n  { value: 'day', label: 'Day' },\n  { value: 'week', label: 'Week' },\n  { value: 'month', label: 'Month' },\n  { value: 'year', label: 'Year' },\n]} />`,
      'Without a value or default, the first option is selected: a segmented control is never empty.',
    ),
    demo(
      'With icons',
      'icons',
      `<SegmentedControl label="View" options={[\n  { value: 'list', label: 'List', icon: <Icon name="menu" /> },\n  { value: 'board', label: 'Board', icon: <Icon name="square-library" /> },\n  { value: 'calendar', label: 'Calendar', icon: <Icon name="calendar" /> },\n]} />`,
    ),
    demo(
      'Icon only',
      'icon-only',
      `<SegmentedControl label="Theme" defaultValue="system" options={[\n  { value: 'light', label: 'Light', icon: <Icon name="sun" />, iconOnly: true },\n  { value: 'dark', label: 'Dark', icon: <Icon name="moon" />, iconOnly: true },\n  { value: 'system', label: 'System', icon: <Icon name="monitor" />, iconOnly: true },\n]} />`,
      'The label stays for screen readers and shows in a tooltip on hover.',
    ),
    demo(
      'Fill width',
      'fill',
      `<SegmentedControl label="Period" fill options={periods} />`,
      'Stretches to its container with equal-width segments.',
    ),
    demo(
      'Compact',
      'compact',
      `<SegmentedControl label="Period" size="compact" options={periods} />`,
    ),
    demo(
      'Disabled option',
      'disabled',
      `<SegmentedControl label="Period" options={periods.map((option) => ({\n  ...option,\n  disabled: option.value === 'year',\n}))} />`,
    ),
    demo(
      'In a form',
      'form',
      `<form>\n  <SegmentedControl label="Period" name="period" options={periods} />\n  <Button type="submit">Apply</Button>\n</form>`,
      'Each segment is a native radio, so the value submits with the form and resets with it. Arrow keys move the selection.',
    ),
    demo(
      'Controlled',
      'controlled',
      `<SegmentedControl label="Period" options={periods}\n  value={period} onValueChange={setPeriod} />`,
    ),
  ],
  select: [
    demo(
      'Variants',
      'variants',
      `${fruitCode}\n\n<Select label="Bordered" options={options} variant="bordered" />\n<Select label="Ghost" options={options} variant="ghost" />`,
    ),
    demo(
      'With Icons',
      'icons',
      `${fruitCode}\n\n<Select label="Fruit" options={options.map(option => ({ ...option, icon }))} />`,
    ),
    demo(
      'Groups',
      'groups',
      `<Select label="Settings" placeholder="Settings…" options={[\n  { value: 'profile', label: 'Profile', group: 'Account' },\n  { value: 'email', label: 'Email', group: 'Account' },\n  { value: 'notifications', label: 'Notifications', group: 'Preferences' },\n  { value: 'privacy', label: 'Privacy', group: 'Preferences' },\n]} />`,
    ),
    demo('Scrollable List', 'long', `<Select label="Timezone" options={timezones} />`),
    demo(
      'Error State',
      'error',
      `<Field label="Role" error="Please select a role to continue.">\n  {(control) => <Select {...control} label="Role" placeholder="Select a role…" options={roles} />}\n</Field>`,
    ),
    demo(
      'Disabled',
      'disabled',
      `${fruitCode}\n\n<Select label="Fruit" options={options} defaultValue="apple" disabled />`,
    ),
  ],
  sidebar: [
    demo(
      'Layouts',
      'layouts',
      `<Sidebar variant="floating" sections={sections} header={<WorkspaceMenu />} footer={<UserMenu />} searchable>\n  Workspace content\n</Sidebar>`,
      '3 layout options: default, floating to elevate the sidebar in a higher surface, inset to make your content stand out.',
    ),
    demo(
      'Nesting',
      'nesting',
      `<Sidebar sections={[{ label: 'Recent', items: [\n  { label: 'Today', defaultExpanded: true, children: [\n    { label: 'API guidelines', href: '#api-guidelines' },\n  ] },\n]}]}>Workspace content</Sidebar>`,
      '2 levels of nesting, one section level and one parent level. A row without an href folds its children.',
    ),
    demo(
      'Actions & badges',
      'badges',
      `<Sidebar sections={[{ label: 'Threads', items: [\n  { label: 'Summarise the Q3 board deck', href: '#q3', status: 'active', badge: '12', actions: <Dropdown label="Actions" variant="ghost" items={items} /> },\n]}]}>Workspace content</Sidebar>`,
      'Status dots on threads, counts, and a hover-revealed action on every row.',
    ),
    demo(
      'Header & footer',
      'header',
      `// The header and footer rows are Dropdowns with a bare sidebar-row trigger.
const workspaceMenu = (
  <Dropdown label="Switch workspace" variant="bare" triggerClass="rf-sidebar-row"
    items={['Aurora AI', 'Northwind', 'Contoso'].map((name) => ({
      value: name, label: name, type: 'radio', checked: name === workspace,
    }))}
    onSelect={setWorkspace}
    triggerContent={<>
      <span class="rf-sidebar-tile" aria-hidden="true">{workspace[0]}</span>
      <span class="rf-sidebar-row-name">{workspace}</span>
      <Icon name="chevron-down" />
    </>} />
)

const userMenu = (
  <Dropdown label="Open user menu" variant="bare" triggerClass="rf-sidebar-row" side="top"
    items={[
      { value: 'profile', label: 'Profile', icon: <Icon name="users" /> },
      { value: 'settings', label: 'Settings', icon: <Icon name="settings" /> },
      { value: 'logout', label: 'Log out', icon: <Icon name="chevron-left" /> },
    ]}
    onSelect={runAccountAction}
    triggerContent={<>
      <img class="rf-sidebar-avatar" src={user.avatar} width="20" height="20" alt="" />
      <span class="rf-sidebar-row-name rf-sidebar-row-plain">{user.name}</span>
      <span class="rf-sidebar-row-trailing" aria-hidden="true"><Icon name="chevrons-up-down" /></span>
    </>} />
)

<Sidebar sections={sections} header={workspaceMenu} footer={userMenu} searchable>
  Workspace content
</Sidebar>`,
      'The workspace switcher and user menu are Dropdowns in the header and footer slots. Copy them as a starting point for your own.',
    ),
    demo(
      'Callouts',
      'callout',
      `<Sidebar sections={sections} callout={<Banner><BannerTitle>Aurora 2 is here</BannerTitle></Banner>}>\n  Workspace content\n</Sidebar>`,
    ),
    demo(
      'Resize, collapse & peek',
      'resize',
      `<Sidebar variant="inset" peek="hover" sections={sections} defaultWidth={256} minWidth={160} maxWidth={360}>\n  Drag the edge to resize, click it to collapse.\n</Sidebar>`,
      'Drag the edge to resize, click it or press [ to collapse. Reveal the collapsed rail on hover or click.',
    ),
    demo(
      'Inside a dialog',
      'dialog',
      `<Dialog size="xl" title="Settings" trigger="Open settings" flush>\n  <Sidebar fixed defaultWidth={208} sections={sections}>Settings panel</Sidebar>\n</Dialog>`,
    ),
    demo(
      'No icon rail version?',
      'comparison',
      `<Sidebar peek="hover" sections={sections}>Content</Sidebar>`,
      'Collapsed navigation reveals full labels and nesting on demand. The icon-only collapsed mode is intentionally unsupported.',
    ),
    demo(
      'Functional and perfectly aligned',
      'alignment',
      `<Sidebar header={<HeaderActions />} footer={<FooterActions />} sections={sections}>Content</Sidebar>`,
      'Guides are measured from the rendered header, footer, and action icons.',
    ),
    ...advancedExamples['sidebar'],
  ],
  slider: [
    demo('Range', 'range', `<Slider defaultValue={[25, 75]} />`),
    demo(
      'Steps',
      'steps',
      `<Slider defaultValue={50} step={25} showSteps />\n<Slider defaultValue={50} step={10} showSteps />`,
    ),
    demo(
      'Non-uniform Steps',
      'nonuniform',
      `<Slider label="Rating" steps={[0.1, 0.5, 0.7, 1.1, 1.3]} defaultValue={0.7} formatValue={(value) => value + ' A'} showSteps />`,
    ),
    demo(
      'Value Display',
      'positions',
      `<Slider label="Volume" defaultValue={40} valuePosition="left" />\n<Slider label="Volume" defaultValue={60} valuePosition="right" />\n<Slider defaultValue={50} valuePosition="tooltip" />`,
    ),
    demo(
      'Format',
      'format',
      `<Slider size="compact" label="Opacity" defaultValue={75} formatValue={(value) => value + '%'} />`,
    ),
    demo('Disabled', 'disabled', `<Slider size="compact" defaultValue={50} disabled />`),
    demo(
      'Default',
      'default',
      `<Slider size="default" label="Roundness" min={0} max={4} defaultValue={2} />`,
    ),
    demo(
      'Default — Scrubber',
      'scrubber',
      `<Slider size="default" label="Volume" variant="scrubber" defaultValue={50} formatValue={(value) => value + '%'} />`,
    ),
    demo(
      'Default — Format',
      'default-format',
      `const labels = ['Off', 'Low', 'Medium', 'High', 'Ultra']\n\n<Slider size="default" label="Quality" min={0} max={4} defaultValue={2} formatValue={(value) => labels[value]} />`,
    ),
    demo(
      'Default — Disabled',
      'default-disabled',
      `<Slider size="default" label="Roundness" min={0} max={4} defaultValue={2} disabled />`,
    ),
  ],
  switch: [
    demo('Disabled', 'disabled', `<Switch label="Disabled option" disabled />`),
    demo(
      'Controlled',
      'controlled',
      `<Switch label="Notifications" checked={enabled} onCheckedChange={setEnabled} />`,
    ),
  ],
  table: [
    demo(
      'Empty',
      'empty',
      `<Table>\n  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>\n  <TableBody><TableEmpty colSpan={2} title="No members yet" description="People you invite show up here." action={<Button variant="secondary" size="compact">Invite people</Button>} /></TableBody>\n</Table>`,
    ),
    demo(
      'Selected rows',
      'selected',
      `<TableRow selected><TableCell>Alice</TableCell><TableCell>Engineer</TableCell></TableRow>`,
    ),
  ],
  tabs: [
    demo(
      'With Icons',
      'icons',
      `<Tabs label="Navigation" items={[\n  { value: 'home', label: 'Home', icon: homeIcon },\n  { value: 'inbox', label: 'Inbox', icon: inboxIcon },\n  { value: 'settings', label: 'Settings', icon: settingsIcon },\n]} />`,
    ),
    demo('Active Label', 'active-label', `<Tabs activeLabel label="Navigation" items={items} />`),
    demo('Underline', 'underline', `<Tabs variant="underline" label="Workspace" items={items} />`),
  ],
  textarea: [
    demo(
      'With Field',
      'field',
      `<Field label="Message" description="Tell us what you have in mind.">\n  {(control) => <Textarea {...control} rows={3} />}\n</Field>`,
    ),
    demo(
      'Invalid',
      'invalid',
      `<Field label="Bio" error="Write at least 20 characters">\n  {(control) => <Textarea {...control} defaultValue="Hi" />}\n</Field>`,
    ),
    demo(
      'Disabled',
      'disabled',
      `<Textarea aria-label="Message" defaultValue="You can't edit this message." disabled />`,
    ),
    demo(
      'With a button',
      'button',
      `<form>\n  <Textarea aria-label="Message" placeholder="Type your message" required />\n  <Button type="submit">Send message</Button>\n</form>`,
    ),
  ],
  'thinking-indicator': [
    demo(
      'Custom labels',
      'labels',
      `<ThinkingIndicator labels={['Researching', 'Reading', 'Writing']} interval={2500} />`,
    ),
    demo(
      'Text only',
      'text',
      `<ThinkingIndicator showIcon={false} labels={['Thinking', 'Working']} />`,
    ),
  ],
  'thinking-steps': [
    demo(
      'Minimal',
      'minimal',
      `<ThinkingSteps label="Thinking" variant="timeline" steps={[\n  { value: 'command', title: 'Ran a command' },\n  { value: 'done', title: 'Done' },\n]} />`,
      'A pair of steps with dot markers.',
    ),
    demo(
      'Streaming',
      'streaming',
      `<ThinkingSteps label="Thinking" variant="timeline" steps={steps} />`,
      'Replay to watch each stage become active and complete.',
    ),
    demo(
      'Custom content',
      'custom-content',
      `<ThinkingSteps label="Release checks" heading={<strong>Release checks · 2 passed</strong>} defaultOpen>
  <ul>
    <li>Build verified</li>
    <li>Browser smoke test passed</li>
  </ul>
</ThinkingSteps>`,
      'Use your own heading and body inside the same disclosure.',
    ),
    ...advancedExamples['thinking-steps'],
    demo(
      'Full Example',
      'full',
      `<ThinkingSteps label="Research Agent" variant="timeline" steps={steps} />`,
    ),
  ],
  tooltip: [
    demo(
      'Basic',
      'basic',
      `<Tooltip content="Save your changes" renderTrigger={(props) => <Button {...props}>Hover me</Button>} />`,
    ),
    demo(
      'Placement',
      'placement',
      `<Tooltip side="top" content="Top" renderTrigger={(props) => <Button {...props}>Top</Button>} />\n<Tooltip side="right" content="Right" renderTrigger={(props) => <Button {...props}>Right</Button>} />\n<Tooltip side="bottom" content="Bottom" renderTrigger={(props) => <Button {...props}>Bottom</Button>} />\n<Tooltip side="left" content="Left" renderTrigger={(props) => <Button {...props}>Left</Button>} />`,
    ),
    demo(
      'Rich Content',
      'rich',
      `<Tooltip\n  content={<span class="tooltip-rich"><span class="tooltip-rich-title">Keyboard shortcut</span><span class="tooltip-rich-hint">⌘ + S</span></span>}\n  renderTrigger={(props) => <Button {...props}>Save</Button>} />`,
    ),
    demo(
      'Follow cursor',
      'cursor',
      `<Tooltip followCursor="x" side="top" content="Following x" renderTrigger={(props) => <div {...props}>Move along me</div>} />\n<Tooltip followCursor="y" side="right" content="Following y" renderTrigger={(props) => <div {...props}>Move along me</div>} />`,
    ),
    demo(
      'Delay',
      'delay',
      `<Tooltip delayDuration={0} content="Instant" renderTrigger={(props) => <Button {...props}>No delay</Button>} />\n<Tooltip delayDuration={500} content="Slow" renderTrigger={(props) => <Button {...props}>500ms delay</Button>} />`,
    ),
  ],
}

function icon(name: IconName = 'plus') {
  return <Icon name={name} />
}

export function ComponentDemo(
  handle: Handle<{ slug: string; variant: string; images: ExampleImages }>,
) {
  let selection = 'free'
  let promoDismissed = false
  let selections = ['email']
  let output = ''
  let copyCount = 0
  let enabled = false
  let loading = false
  let color = '#6B97FF'
  let paletteType = 'all'
  let paletteSort = 'default'
  let fill = '#6B97FF'
  let streaming = true
  let lastQueuedId: string | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(timeout), {
    once: true,
  })
  const say = (value: string) => {
    output = value
    handle.update()
  }
  const select = (value: string) => {
    selection = value
    handle.update()
  }
  const toggle = (value: string) => {
    selections = selections.includes(value)
      ? selections.filter((item) => item !== value)
      : [...selections, value]
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
    const { slug, variant, images } = handle.props
    if (slug === 'ask-user-questions' && variant === 'controlled') return <ControlledQuestions />
    if (slug === 'thinking-steps' && ['streaming-text', 'images', 'rich'].includes(variant))
      return <RichThinkingSteps variant={variant} previewImage={images.thinkingPreview} />
    if (slug === 'sidebar' && variant === 'workspace') return <WorkspaceSidebar />
    const options = fruits.map((label) => ({
      value: label.toLowerCase(),
      label,
    }))
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
      case 'badge': {
        const samples = variant === 'colors' ? badgeColorNames : badgeGenres
        const treatments =
          variant === 'colors'
            ? (['solid', 'dot'] as const)
            : ([variant === 'dot' ? 'dot' : 'solid'] as const)
        return (
          <div class="doc-demo-stack">
            {treatments.map((treatment) => (
              <div class="doc-demo-row" key={treatment}>
                {samples.map(([color, text]) => (
                  <Badge key={color} color={color} variant={treatment}>
                    {text}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        )
      }
      case 'banner': {
        if (variant === 'fixed')
          return (
            <BannerMockPage height={300}>
              <Banner variant="fixed" status="warning" dismissible>
                <BannerTitle>Registry maintenance tonight at 22:00 UTC</BannerTitle>
                <BannerActions>
                  <BannerAction>Details</BannerAction>
                </BannerActions>
              </Banner>
            </BannerMockPage>
          )
        if (variant === 'custom-icon')
          return (
            <div class="banner-action-examples">
              <Banner icon={<Icon name="bell" />}>
                <BannerTitle>3 new components since your last visit</BannerTitle>
              </Banner>
            </div>
          )
        if (variant === 'statuses')
          return (
            <div class="banner-statuses">
              {(['low', 'high'] as const).map((contrast) => (
                <div class="banner-status-column" key={contrast}>
                  <small>{contrast === 'low' ? 'Low contrast' : 'High contrast'}</small>
                  {bannerStatuses.map((status) => (
                    <Banner key={status} status={status} contrast={contrast}>
                      <BannerTitle>{status[0].toUpperCase() + status.slice(1)}</BannerTitle>
                    </Banner>
                  ))}
                </div>
              ))}
            </div>
          )
        return (
          <div class="banner-action-examples">
            <Banner status="info">
              <BannerTitle>Enjoying Reflow?</BannerTitle>
              <BannerActions>
                <BannerAction variant="primary">Star on GitHub</BannerAction>
                <BannerAction>Share</BannerAction>
                <BannerAction variant="ghost">Later</BannerAction>
              </BannerActions>
            </Banner>
            <Banner status="info">
              <BannerTitle>The registry has new components</BannerTitle>
              <BannerDescription>
                Run the install command again to pull the latest versions.
              </BannerDescription>
              <BannerActions>
                <BannerAction variant="primary">Copy command</BannerAction>
                <BannerAction>What's new</BannerAction>
                <BannerAction variant="ghost">Later</BannerAction>
              </BannerActions>
            </Banner>
          </div>
        )
      }
      case 'accordion':
        return variant === 'standalone' ? (
          <div class="doc-accordion-standalone">
            <Accordion defaultValue="item-1" items={standaloneAccordionItems} />
          </div>
        ) : variant === 'multiple' ? (
          <Accordion
            type="multiple"
            defaultValue={['item-1', 'item-3']}
            items={multipleAccordionItems}
          />
        ) : variant === 'separated' ? (
          <Accordion defaultValue="item-1" highlight="trigger" items={rowHighlightAccordionItems} />
        ) : (
          <Accordion defaultValue="item-1" items={accordionItems} />
        )
      case 'ask-user-questions':
        return width(
          <>
            <AskUserQuestions
              questions={questionExample(variant)}
              onComplete={(answers) =>
                say(
                  `Saved ${Object.keys(answers).length} ${Object.keys(answers).length === 1 ? 'answer' : 'answers'}.`,
                )
              }
            />
            {feedback}
          </>,
          true,
        )
      case 'calendar': {
        const calendarToday = datePickerToday()
        const calendarMonth = `${calendarToday.slice(0, 8)}01`
        if (variant === 'size')
          return (
            <div class="doc-calendar-prices">
              <Calendar
                defaultMonth={calendarMonth}
                defaultValue={calendarToday}
                cellSize={56}
                dayDetail={(date) => {
                  const rate = 99 + ((Number(date.slice(-2)) * 7) % 10) * 10
                  return (
                    <span style={{ color: rate <= 119 ? 'var(--rf-success)' : undefined }}>
                      ${rate}
                    </span>
                  )
                }}
              />
            </div>
          )
        return (
          <Calendar
            defaultMonth={calendarMonth}
            mode={
              variant === 'range' || variant === 'stacked' || variant === 'booked'
                ? 'range'
                : 'single'
            }
            numberOfMonths={variant === 'range' || variant === 'stacked' ? 2 : 1}
            orientation={variant === 'stacked' ? 'vertical' : 'horizontal'}
            defaultValue={variant === 'single' || variant === 'weeks' ? calendarToday : undefined}
            showWeekNumbers={variant === 'weeks'}
            weekStartsOn={variant === 'weeks' ? 1 : 0}
            min={variant === 'booked' ? calendarToday : undefined}
            booked={
              variant === 'booked'
                ? [4, 5, 6, 12, 19, 20].map((days) => datePickerOffset(calendarToday, days))
                : undefined
            }
            isDateDisabled={
              variant === 'booked'
                ? (value) => new Date(value).getUTCDay() === 0
                : variant === 'available'
                  ? (value) => [0, 6].includes(new Date(value).getUTCDay())
                  : undefined
            }
          />
        )
      }
      case 'card': {
        const frame = (maxWidth: string, children: RemixNode) => (
          <div style={{ width: '100%', maxWidth }}>{children}</div>
        )
        const features = cardItems.slice(0, 4)
        const title = (item: { title: string; description: string }) => (
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
        )
        if (variant === 'composition') {
          if (promoDismissed)
            return (
              <button
                type="button"
                class="doc-demo-restore"
                mix={on('click', () => {
                  promoDismissed = false
                  handle.update()
                })}
              >
                Restore card
              </button>
            )
          return frame(
            '300px',
            <Card
              border="outlined"
              dismissible
              onDismiss={() => {
                promoDismissed = true
                handle.update()
              }}
            >
              <CardImage src={cardBanner} alt="" />
              <CardHeader>
                <CardTitle>Meet the new Card component</CardTitle>
              </CardHeader>
              <CardContent class="doc-card-features">
                <CardFeature
                  icon="paintbrush"
                  title="Always pixel-perfect"
                  description="Renders your design exactly — token-driven and crisp in light and dark, at any radius"
                />
                <CardFeature
                  icon="square-library"
                  title="Stacked, inline, or grid"
                  description="One compositional API — borderless by default, with separated tiles or a shared frame"
                />
              </CardContent>
              <CardFooter>
                <CardButton variant="primary">Get started</CardButton>
                <CardButton variant="ghost">Learn more</CardButton>
              </CardFooter>
            </Card>,
          )
        }
        if (variant === 'grid')
          return frame(
            '560px',
            <CardGroup columns={2} border="outlined" separated>
              {features.map((item) => (
                <Card key={item.title} label={item.title} onClick={() => {}}>
                  <CardImage src={cardBanner} alt="" />
                  {title(item)}
                  <CardFooter>
                    <CardButton variant="primary">Get started</CardButton>
                    <CardButton variant="secondary">Learn more</CardButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>,
          )
        if (variant === 'outlined')
          return frame(
            '520px',
            <CardGroup orientation="inline" border="outlined">
              {features.map((item) => (
                <Card key={item.title} label={item.title} onClick={() => {}}>
                  <CardMedia logo={cardThumb} />
                  {title(item)}
                  <CardFooter>
                    <CardButton variant="primary">Get started</CardButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>,
          )
        if (variant === 'separated')
          return frame(
            '560px',
            <CardGroup orientation="inline" separated>
              {features.map((item) => (
                <Card key={item.title} label={item.title} onClick={() => {}}>
                  <CardImage src={cardBanner} alt="" />
                  {title(item)}
                  <CardFooter>
                    <CardButton variant="primary">Get started</CardButton>
                    <CardButton variant="secondary">Learn more</CardButton>
                    <CardButton>Connect</CardButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>,
          )
        if (variant === 'selected')
          return frame(
            '520px',
            <CardGroup orientation="inline">
              {features.map((item) => (
                <Card
                  key={item.title}
                  label={item.title}
                  selected={
                    selection === item.title ||
                    (selection === 'free' && item.title === features[1].title)
                  }
                  onClick={() => select(item.title)}
                >
                  <CardMedia treatment="icon">
                    <Icon name={item.icon} size={18} />
                  </CardMedia>
                  {title(item)}
                </Card>
              ))}
            </CardGroup>,
          )
        return frame(
          '520px',
          <CardGroup orientation="inline">
            {features.map((item) => (
              <Card key={item.title} label={item.title} onClick={() => {}}>
                <CardMedia treatment="icon">
                  <Icon name={item.icon} size={18} />
                </CardMedia>
                {title(item)}
                <CardFooter>
                  <CardButton>Connect</CardButton>
                </CardFooter>
              </Card>
            ))}
          </CardGroup>,
        )
      }
      case 'carousel-dots':
        return <CarouselExample autoplay={variant === 'autoplay'} />
      case 'chat-message':
        return (
          <ChatExample
            variant={
              variant === 'attachments' ? 'attachments' : variant === 'system' ? 'system' : 'roles'
            }
          />
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
      case 'color-picker':
        if (variant === 'removable') {
          return fill ? (
            <ColorPicker
              value={fill}
              variant="popover"
              triggerLabel="Fill"
              triggerShowRemove
              onTriggerRemove={() => {
                fill = ''
                handle.update()
              }}
              onValueChange={(value) => {
                fill = value
                handle.update()
              }}
            />
          ) : (
            <Button
              variant="tertiary"
              mix={on('click', () => {
                fill = '#6B97FF'
                handle.update()
              })}
            >
              + Add fill
            </Button>
          )
        }
        return (
          <div class="doc-demo-stack">
            <ColorPicker
              {...(variant === 'controlled' ? { value: color } : { defaultValue: '#6B97FF' })}
              onValueChange={(value) => {
                color = value
                handle.update()
              }}
              variant={variant === 'popover' ? 'popover' : 'inline'}
              triggerLabel="Fill"
              defaultFormat={variant === 'oklch' ? 'oklch' : 'hex'}
              swatches={
                variant === 'swatches'
                  ? [
                      '#000000',
                      '#FFFFFF',
                      '#FF3B30',
                      '#F0F0F0',
                      '#E5E5E5',
                      '#D0D0D0',
                      'rgba(0,0,0,0.5)',
                    ]
                  : undefined
              }
            />
            {variant === 'controlled' && <output class="doc-demo-feedback">{color}</output>}
          </div>
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
        const Control = Select
        const choices =
          variant === 'long'
            ? Intl.supportedValuesOf('timeZone').map((label) => ({
                value: label,
                label,
              }))
            : options.map((option) => ({
                ...option,
                icon: variant === 'icons' ? icon('droplet') : undefined,
              }))
        return width(
          <div class="doc-demo-stack">
            <Control
              label={variant === 'long' ? 'Timezone' : 'Fruit'}
              options={choices}
              disabled={variant === 'disabled'}
              defaultValue={variant === 'disabled' ? 'apple' : undefined}
              placeholder="Select a fruit…"
              onValueChange={(value) => say(value ?? '')}
            />
            {variant === 'variants' && <Control label="Ghost" variant="ghost" options={options} />}
            {feedback}
          </div>,
        )
      }
      case 'command-menu': {
        const plain = variant === 'basic'
        const rows =
          variant === 'controls'
            ? paletteCommands
                .filter((item) => paletteType === 'all' || item.group === paletteType)
                .toSorted((a, b) => (paletteSort === 'az' ? a.label.localeCompare(b.label) : 0))
            : plain
              ? paletteCommands.map(({ description, shortcut, ...item }) => item)
              : paletteCommands
        return width(
          <div class="doc-command-palette" data-dialog={variant === 'dialog' || undefined}>
            <CommandMenu
              items={rows}
              suggestions={
                ['dialog', 'groups', 'footer'].includes(variant) ? paletteSuggestions : undefined
              }
              suggestionsLabel={variant === 'groups' ? 'Recent' : undefined}
              footer={variant === 'footer' ? true : undefined}
              renderItem={
                variant === 'custom'
                  ? (item) => (
                      <>
                        <span>{item.label}</span>
                        <span>{item.group}</span>
                      </>
                    )
                  : undefined
              }
              filters={['filters', 'footer'].includes(variant) ? paletteGroups : undefined}
              controls={
                variant === 'controls' ? (
                  <>
                    <Select
                      variant="ghost"
                      size="compact"
                      label="Type"
                      value={paletteType}
                      options={[
                        { value: 'all', label: 'All types' },
                        ...paletteGroups.map((group) => ({ value: group, label: group })),
                      ]}
                      onValueChange={(value) => {
                        paletteType = value ?? 'all'
                        handle.update()
                      }}
                    />
                    <Select
                      variant="ghost"
                      size="compact"
                      label="Sort"
                      value={paletteSort}
                      options={[
                        { value: 'default', label: 'Default order' },
                        { value: 'az', label: 'A to Z' },
                      ]}
                      onValueChange={(value) => {
                        paletteSort = value ?? 'default'
                        handle.update()
                      }}
                    />
                  </>
                ) : undefined
              }
              trigger={
                variant === 'dialog' ? (
                  <>
                    Open <CommandShortcut keys="mod+p" />
                  </>
                ) : undefined
              }
              shortcut={variant === 'dialog' ? 'mod+p' : false}
              onSelect={say}
            />
            {feedback}
          </div>,
          true,
        )
      }
      case 'date-picker': {
        const today = datePickerToday()
        const range = ['presets', 'booked'].includes(variant)
        return (
          <DatePicker
            label={
              variant === 'booked'
                ? 'Stay dates'
                : range
                  ? 'Travel dates'
                  : variant === 'time'
                    ? 'Meeting'
                    : variant === 'timeStep'
                      ? 'Deadline'
                      : 'Start date'
            }
            variant={variant === 'time' ? 'ghost' : 'outline'}
            mode={range ? 'range' : 'single'}
            numberOfMonths={range ? 2 : 1}
            timeRange={variant === 'time'}
            time={variant === 'timeStep'}
            defaultTime="11:00"
            defaultEndTime="12:45"
            defaultValue={variant === 'time' ? today : undefined}
            presets={variant === 'presets' ? datePickerPresets(today) : undefined}
            placeholder={variant === 'booked' ? 'Check in → check out' : undefined}
            booked={variant === 'booked' ? datePickerBooked(today) : undefined}
            min={variant === 'booked' ? today : undefined}
          />
        )
      }
      case 'dialog':
        if (variant === 'sizes')
          return (
            <div class="doc-demo-row">
              {(['sm', 'lg', 'xl'] as const).map((size, position) => (
                <Dialog
                  key={size}
                  size={size}
                  title={['Small dialog', 'Large dialog', 'Extra large dialog'][position]}
                  trigger={['Small', 'Large', 'Extra large'][position]}
                  description={
                    [
                      '400px: a confirmation, 1 field, a short message.',
                      '540px: a short form, or a longer confirmation.',
                      '880px: 2 columns, a table, or a sidebar beside a panel.',
                    ][position]
                  }
                  footer={(close) => (
                    <Button variant="ghost" mix={on('click', close)}>
                      Close
                    </Button>
                  )}
                />
              ))}
            </div>
          )
        return <SettingsDialogExample />
      case 'hover-card':
        return <HoverCardDemo variant={variant} />
      case 'popover':
        return <PopoverDemo variant={variant} />
      case 'toaster':
        return <ToasterDemo variant={variant} />
      case 'drawer':
        return <DrawerDemo variant={variant} />
      case 'code-block':
        return <CodeBlockDemo variant={variant} samples={images.code} />
      case 'citation':
        return <CitationDemo variant={variant} />
      case 'chat-layout':
        return <ChatLayoutDemo variant={variant} />
      case 'resizable':
        return <ResizableDemo orientation="vertical" />
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
      case 'trigger-menu':
        return (
          <div class="example-composer">
            <InputMessage
              triggers={composerTriggers}
              attachments={false}
              placeholder="Type @ or /"
              onSend={({ text }) => say(text)}
            />
            {output && <ChatMessage role="user">{output}</ChatMessage>}
          </div>
        )
      case 'progress':
        return (
          <div style={{ width: 'min(100%, 280px)' }}>
            <Progress label="Preparing files" />
          </div>
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
      case 'carousel':
        return <CarouselDemo variant={variant} />
      case 'avatar':
        return <AvatarDemo variant={variant} image={images.sidebarAvatar} />
      case 'segmented-control':
        return <SegmentedControlDemo variant={variant} />
      case 'breadcrumb':
        return <BreadcrumbDemo variant={variant} />
      case 'dropdown':
        return <DropdownDemo variant={variant} />
      case 'field':
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
      case 'input-message':
        return (
          <div class="doc-demo-composer">
            <>
              <InputMessage
                suggestions={
                  variant === 'suggested-messages'
                    ? ['Summarize this document', 'Plan my next project']
                    : variant === 'suggestions'
                      ? inputMessagePrompts
                      : undefined
                }
                history={variant === 'history' ? ['Draft a plan', 'Review the design'] : undefined}
                status={variant === 'streaming' && streaming ? 'streaming' : 'idle'}
                onStop={() => {
                  streaming = false
                  handle.update()
                }}
                placeholderSuggestion={
                  variant === 'suggestions' ? 'Why is every other input box so stiff?' : undefined
                }
                attachments={!['basic', 'left', 'right'].includes(variant)}
                rightActions={
                  variant === 'right' ? (
                    <Dropdown
                      label={selection === 'free' ? 'Sonnet 4.6' : selection}
                      variant="ghost"
                      items={['Sonnet 4.6', 'Opus 4.6'].map((label) => ({ value: label, label }))}
                      onSelect={select}
                    />
                  ) : undefined
                }
                maxFiles={3}
                disabled={variant === 'disabled'}
                actions={
                  variant === 'actions' || variant === 'left' ? (
                    <Button
                      variant="ghost"
                      size="compact"
                      mix={on('click', () => say('Workspace context attached.'))}
                    >
                      Attach context
                    </Button>
                  ) : undefined
                }
                transitionMessages={variant === 'streaming'}
                onSend={async ({ text, files, queuedId }) => {
                  if (variant === 'send') await new Promise((resolve) => setTimeout(resolve, 800))
                  output = text || `${files.length} attachments sent.`
                  lastQueuedId = queuedId
                  await handle.update()
                }}
              />
              {output && (
                <ChatMessage role="user" transitionId={lastQueuedId} animate={!lastQueuedId}>
                  {output}
                </ChatMessage>
              )}
            </>
          </div>
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
      case 'sidebar': {
        if (variant !== 'dialog')
          return <SidebarDemo variant={variant} avatar={images.sidebarAvatar} />
        return <SettingsDialogExample />
      }
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
      case 'table':
        return (
          <div class="doc-demo-fill">
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variant === 'empty' ? (
                  <TableEmpty
                    colSpan={3}
                    title="No members yet"
                    description="People you invite show up here."
                    action={
                      <Button variant="secondary" size="compact">
                        Invite people
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <TableRow selected={variant === 'selected'}>
                      <TableCell>Alice</TableCell>
                      <TableCell>Engineer</TableCell>
                      <TableCell>Active</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bob</TableCell>
                      <TableCell>Designer</TableCell>
                      <TableCell>Away</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carol</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell>Active</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )
      case 'tabs':
        return (
          <div class="doc-demo-fill">
            <Tabs
              label="Navigation"
              activeLabel={variant === 'active-label'}
              variant={variant === 'underline' ? 'underline' : 'pill'}
              items={['Teamspaces', 'Recents', 'Favorites', 'Shared'].map((label, position) => ({
                value: label.toLowerCase(),
                label,
                panel: <p class="example-note example-tab-note">{label} content goes here.</p>,
                icon:
                  variant !== 'underline' && variant !== 'basic'
                    ? icon((['square-library', 'clock', 'star', 'users'] as const)[position])
                    : undefined,
              }))}
            />
          </div>
        )
      case 'thinking-indicator':
        return (
          <ThinkingIndicator
            showIcon={variant !== 'text'}
            labels={
              variant === 'labels' ? ['Researching', 'Reading', 'Writing'] : ['Thinking', 'Working']
            }
            interval={2500}
          />
        )
      case 'thinking-steps': {
        if (variant === 'custom-content') {
          return (
            <ThinkingSteps
              label="Release checks"
              heading={<strong>Release checks · 2 passed</strong>}
              defaultOpen
            >
              <ul>
                <li>Build verified</li>
                <li>Browser smoke test passed</li>
              </ul>
            </ThinkingSteps>
          )
        }
        if (variant === 'minimal') {
          return (
            <ThinkingSteps
              label="Thinking"
              variant="timeline"
              steps={[
                { value: 'command', title: 'Ran a command' },
                { value: 'done', title: 'Done' },
              ]}
            />
          )
        }
        return <RichThinkingSteps variant={variant} previewImage={images.thinkingPreview} />
      }
      case 'tooltip':
        if (variant === 'placement')
          return (
            <div class="doc-demo-row">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <Tooltip
                  key={side}
                  side={side}
                  content={side[0].toUpperCase() + side.slice(1)}
                  renderTrigger={(props) => (
                    <Button {...props} variant="secondary">
                      {side[0].toUpperCase() + side.slice(1)}
                    </Button>
                  )}
                />
              ))}
            </div>
          )
        if (variant === 'cursor')
          return (
            <div class="doc-tooltip-follow">
              <Tooltip
                followCursor="x"
                side="top"
                content="Following x"
                renderTrigger={(props) => (
                  <div {...props} class="doc-tooltip-follow-x" tabIndex={0}>
                    Move along me
                  </div>
                )}
              />
              <Tooltip
                followCursor="y"
                side="right"
                content="Following y"
                renderTrigger={(props) => (
                  <div {...props} class="doc-tooltip-follow-y" tabIndex={0}>
                    <span>Move along me</span>
                  </div>
                )}
              />
            </div>
          )
        if (variant === 'delay')
          return (
            <div class="doc-demo-row">
              <Tooltip
                delayDuration={0}
                content="Instant"
                renderTrigger={(props) => (
                  <Button {...props} variant="secondary">
                    No delay
                  </Button>
                )}
              />
              <Tooltip
                delayDuration={500}
                content="Slow"
                renderTrigger={(props) => (
                  <Button {...props} variant="secondary">
                    500ms delay
                  </Button>
                )}
              />
            </div>
          )
        return (
          <Tooltip
            content={
              variant === 'cursor' ? (
                'Following your pointer'
              ) : variant === 'rich' ? (
                <span class="tooltip-rich">
                  <span class="tooltip-rich-title">Keyboard shortcut</span>
                  <span class="tooltip-rich-hint">⌘ + S</span>
                </span>
              ) : (
                'Save your changes'
              )
            }
            renderTrigger={(props) => (
              <Button {...props}>{variant === 'rich' ? 'Save' : 'Hover me'}</Button>
            )}
          />
        )
    }
    return null
  }
}
