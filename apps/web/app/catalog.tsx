import { bannerDefaults, bannerFragment } from './public/banner-example.tsx'
import { conversationCode } from './public/chat-example.tsx'
import { accordionItems, checkboxFruit, radioOptions } from './public/component-example-data.ts'
import { cardPlaygroundCode } from './public/card-example-code.ts'
import { questionCode, questionPlayground } from './public/question-example-data.ts'
import { requestFormCode } from './public/request-form-example.tsx'
import { carouselExampleCode } from './public/carousel-example.tsx'
import { triggerMenuCode } from './public/component-example-data.ts'
import { SystemPage } from './public/system-page.tsx'
import { SkillPage } from './public/skill-page.tsx'
import { Example } from './public/examples.tsx'
import type { CodeSamples } from './public/code-block-example.tsx'
import type { ShowcaseComponent } from './ui/site.tsx'

const previews: Record<string, Pick<ShowcaseComponent, 'description' | 'code' | 'props'>> = {
  accordion: {
    description: 'Expandable sections with arrow-key navigation and a shared hover highlight.',
    code: `const items = ${JSON.stringify(accordionItems, null, 2)}\n\n<Accordion defaultValue="item-1" items={items} />`,
  },
  'ask-user-questions': {
    description: 'A guided flow with choices, custom answers, skipping, and back navigation.',
    code: questionCode(questionPlayground()),
  },
  avatar: {
    description:
      'A picture or initials for a person, team or agent, alone or in an overlapping group.',
    code: `<Avatar name="Ada Lovelace" src={photo} status="online" />\n<AvatarGroup avatars={editors} max={4} />`,
  },
  pagination: {
    description: 'Previous, next, and numbered links for navigating page-based results.',
    code: `<Pagination page={2} pageCount={3} href={(page) => \`/?teamPage=\${page}#team-table\`} />`,
  },
  toolbar: {
    description:
      'A labeled row or column of action controls with one tab stop and arrow-key navigation.',
    code: `<Toolbar label="Button variants">
  <Button>Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="tertiary">Tertiary</Button>
  <Button variant="ghost">Ghost</Button>
</Toolbar>`,
  },
  spinner: {
    description: 'An indeterminate loading indicator shared by Button and Toaster.',
    code: `<Spinner label="Loading results" size="24px" />`,
  },
  skeleton: {
    description: 'Decorative placeholders that reserve space for content while it loads.',
    code: `<Table aria-label="Team members" aria-busy="true">
  <TableHeader>
    <TableRow hover={false}>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody aria-hidden="true">
    {[0, 1, 2].map((row) => (
      <TableRow key={row} hover={false}>
        <TableCell><Skeleton width="60%" /></TableCell>
        <TableCell><Skeleton width="78%" /></TableCell>
        <TableCell><Skeleton width="60%" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
  },
  badge: {
    description: 'A compact label with solid and dot treatments.',
    code: `<Badge color="violet">Fiction</Badge>\n<Badge color="amber">Science</Badge>\n<Badge color="green">Philosophy</Badge>\n<Badge color="blue">History</Badge>\n<Badge color="rose">Poetry</Badge>`,
  },
  banner: {
    description:
      'A status notice with an icon, a title, an optional description and up to three actions.',
    code: bannerFragment(bannerDefaults),
  },
  breadcrumb: {
    description:
      'A trail of links to the current page with a shared hover, step menus, and collapse on overflow.',
    code: `<Breadcrumb items={[\n  { label: 'Home', href: '/' },\n  { label: 'Components', href: '/docs' },\n  { label: 'Breadcrumb' },\n]} />`,
  },
  calendar: {
    description:
      'An accessible calendar for selecting one date or a range, with month navigation and optional week numbers.',
    code: `<Calendar label="Choose travel dates" mode="range" numberOfMonths={2} defaultMonth="2026-11-01" />`,
  },
  card: {
    description:
      'Composable content cards with optional selection and a shared highlight across a grid.',
    code: cardPlaygroundCode({
      orientation: 'card',
      columns: '2',
      border: 'none',
      separated: false,
      fluidHover: true,
      media: true,
      description: true,
      selected: false,
    }),
  },
  'alert-dialog': {
    description: 'A modal confirmation that gives the safer action initial focus.',
    code: `<AlertDialog trigger="Delete draft" title="Delete this draft?" description="This permanently removes the draft." confirmLabel="Delete draft" onConfirm={() => console.log('Deleted')} />`,
  },
  resizable: {
    description: 'Split two panes and adjust their space with the pointer or keyboard.',
    code: `<Resizable label="Resize conversation" defaultValue={65} min={40} max={75}
  first={<div>Conversation</div>} second={<aside>Sources</aside>} />`,
  },
  'file-input': {
    description:
      'Pick, drop, or paste files, with type and size limits and native form submission.',
    code: `<FileInput label="Documents" name="documents" accept=".pdf,.txt" maxFiles={3} multiple />`,
  },
  'trigger-menu': {
    description: 'Suggestions at the caret for mentions, commands, and other text triggers.',
    code: triggerMenuCode,
  },
  progress: {
    description: 'A labeled progress bar for work with a known total or an unknown duration.',
    code: `<Progress label="Uploading files" value={7} max={12} showValue />`,
  },
  'number-field': {
    description:
      'A labeled numeric field with native validation, step buttons, and optional drag-to-scrub.',
    code: `<NumberField label="Guests" name="guests" min={1} max={12} defaultValue={2} scrub />`,
  },
  carousel: {
    description:
      'Slides on a native scroll container that snaps, drags with momentum, and autoplays through its dots.',
    code: `<Carousel label="Highlights" slideLabels={titles}>\n  {slides.map((slide) => <Slide {...slide} />)}\n</Carousel>`,
  },
  'carousel-dots': {
    description:
      'A set of slide controls with a moving hover surface and optional progress animation.',
    code: carouselExampleCode(),
  },
  'chat-layout': {
    description:
      'The conversation screen: a transcript that stays on the newest message, with the composer docked below.',
    code: `<ChatLayout composer={<InputMessage onSend={send} />}>\n  {messages.map((message) => <ChatMessage role={message.role}>{message.text}</ChatMessage>)}\n</ChatLayout>`,
  },
  'chat-message': {
    description: 'A chat message with user or assistant alignment and optional attachments.',
    code: conversationCode,
  },
  checkbox: {
    description: 'A native form checkbox with a drawn checkmark and an indeterminate state.',
    code: `<Checkbox label="Accept terms and conditions" />`,
  },
  'checkbox-group': {
    description: 'Multi-select options with a fluid highlight and adjacent selected surfaces.',
    code: `const options = ${JSON.stringify(checkboxFruit)}\n\n<CheckboxGroup label="Fruit" hideLabel defaultValue={['apples']} options={options} />`,
  },
  'color-picker': {
    description:
      'A saturation and brightness surface with hue, opacity, swatches and a typed color value.',
    code: `<ColorPicker name="accent" defaultValue="#6B97FF" />`,
  },
  combobox: {
    description: 'An editable field that filters and selects from a list of options.',
    code: `<Combobox label="Component" name="component" options={[\n  { value: 'button', label: 'Button' },\n  { value: 'tabs', label: 'Tabs' },\n]} />`,
  },
  'command-menu': {
    description: 'Filter and invoke grouped actions with pointer or keyboard navigation.',
    code: `<CommandMenu items={commands} onSelect={runCommand} trigger="Open commands" />`,
  },
  'date-picker': {
    description: 'A date field with an anchored calendar and local ISO date values.',
    code: `<DatePicker label="Start date" name="start" min="2026-11-01" />`,
  },
  dialog: {
    description: 'A native modal dialog with focus return and animated presentation.',
    code: `<Dialog title="Edit profile" trigger="Open dialog">\n  <Input aria-label="Display name" />\n</Dialog>`,
  },
  field: {
    description:
      'A label, form control, help text, and error with associated accessible descriptions.',
    code: requestFormCode(),
  },
  citation: {
    description:
      'An inline source chip in generated text that links to the source and previews it.',
    code: `<p>\n  Good design is unobtrusive.\n  <Citation index={1} sources={{ title: 'Ten principles for good design', href }} />\n</p>`,
  },
  'code-block': {
    description:
      'Code with its filename, a copy button, line numbers and line marks, highlighted for any language by Shiki.',
    code: `import { highlight } from '@rtzll/reflow/highlight'\n\nconst code = await highlight(source, { lang: 'tsx' })\n\n<CodeBlock code={code} filename="Button.tsx" />`,
  },
  drawer: {
    description: 'A panel that slides in from an edge and closes with a drag or a flick.',
    code: `<Drawer trigger="Filters" title="Filters" footer={(close) => <Button mix={on('click', close)}>Apply</Button>}>\n  <Switch label="In stock only" />\n</Drawer>`,
  },
  'hover-card': {
    description: 'A preview card for a link or a name, shown while the pointer rests on it.',
    code: `<HoverCard renderTrigger={(trigger) => <a href="/u/reflow" {...trigger}>@reflow</a>}>\n  <p>Fluid components for Remix.</p>\n</HoverCard>`,
  },
  input: {
    description: 'A native single-line form control with shared sizes and focus styling.',
    code: `<Input name="displayName" aria-label="Display name" />`,
  },
  'input-copy': {
    description: 'A read-only field with clipboard action and feedback.',
    code: `<InputCopy label="Invite link" value="https://reflow.example/invite" />`,
  },
  'input-group': {
    description: 'Related input fields with a shared hover surface and validation messages.',
    code: `<InputGroup>\n  <InputField label="Name" name="name" />\n  <InputField label="Email" name="email" type="email" />\n</InputGroup>`,
  },
  'input-message': {
    description: 'A message composer with an expanding text area, attachments, and a send action.',
    code: `<InputMessage onSend={({ text, files }) => send(text, files)} />`,
  },
  'radio-group': {
    description: 'A native group of exclusive choices with a shared highlight.',
    code: `const options = ${JSON.stringify(radioOptions)}\n\n<RadioGroup label="Options" hideLabel defaultValue="0" options={options} />`,
  },
  'segmented-control': {
    description:
      'One choice from a short row of options, with a raised thumb that glides between them.',
    code: `<SegmentedControl label="Period" options={[\n  { value: 'day', label: 'Day' },\n  { value: 'week', label: 'Week' },\n  { value: 'month', label: 'Month' },\n]} />`,
  },
  select: {
    description:
      'A form-aware menu for selecting one option, with keyboard navigation and typeahead.',
    code: `<Select label="Role" name="role" options={[\n  { value: 'viewer', label: 'Viewer' },\n  { value: 'editor', label: 'Editor' },\n]} defaultValue="viewer" />`,
  },
  sidebar: {
    description:
      'Resizable workspace navigation with collapsible sections and a modal drawer on small screens.',
    code: `<Sidebar sections={sections} activeHref="/overview" searchable>\n  <p>Workspace content</p>\n</Sidebar>`,
  },
  slider: {
    description: 'A numeric slider with optional pips, editable values and range selection.',
    code: `<Slider label="Volume" min={0} max={100} step={10} defaultValue={50} showSteps showValue />`,
  },
  switch: {
    description: 'A native switch with an animated thumb and label.',
    code: `<Switch label="Notifications" name="notifications" defaultChecked />`,
  },
  table: {
    description: 'Semantic table elements with a fluid highlight across rows.',
    code: `<Table>\n  <TableBody><TableRow><TableCell>Workspace</TableCell></TableRow></TableBody>\n</Table>`,
  },
  textarea: {
    description: 'A multi-line form control that can grow with its content.',
    code: `<Textarea name="notes" aria-label="Notes" autoResize />`,
  },
  'thinking-indicator': {
    description: 'A working status with an animated icon and rotating visual label.',
    code: `<ThinkingIndicator labels={['Thinking…', 'Refining…']} />`,
  },
  toaster: {
    description: 'Brief notifications raised from anywhere with toast(), stacked in a corner.',
    code: `<Toaster />\n\ntoast.success('Changes saved', { description: 'Monday at 9:41' })`,
  },
  popover: {
    description: 'A panel anchored to a trigger for filters, inline settings, or sharing.',
    code: `<Popover label="Dimensions" trigger="Dimensions">\n  <Input name="width" defaultValue="100%" />\n</Popover>`,
  },
  'queued-stack': {
    description: 'Reorder, remove, and send messages from a compact queue.',
    code: `<QueuedStack\n  messages={[{ id: 'q1', content: 'Summarise the Q3 board deck' }]}\n  onOrderChange={reorder}\n  onRemove={remove}\n  onSend={send}\n/>`,
  },
  'thinking-steps': {
    description: 'Expandable progress steps with visible and accessible status labels.',
    code: `<ThinkingSteps steps={[\n  { value: 'review', title: 'Compare states', content: 'Check focus behavior.', status: 'active' },\n]} />`,
  },
  tooltip: {
    description: 'An anchored description available by pointer and keyboard focus.',
    code: `<Tooltip content="More information" renderTrigger={(props) => (\n  <Button {...props}>Hover me</Button>\n)} />`,
  },
  button: {
    description:
      'A button with a weight shift on hover, a surface that contracts on press, and a loading state.',
    code: `import { Button } from '@rtzll/reflow'\n\n<Button variant="primary">Save changes</Button>`,
    props: [
      {
        name: 'variant',
        type: "'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'",
        description: 'Visual treatment.',
        defaultValue: 'primary',
      },
      {
        name: 'loading',
        type: 'boolean',
        description: 'Shows progress and prevents repeat activation.',
        defaultValue: 'false',
      },
      { name: 'href', type: 'string', description: 'Renders the control as a link.' },
    ],
  },
  tabs: {
    description:
      'Switch between related views using a moving selection indicator and arrow-key navigation.',
    code: `import { Tabs } from '@rtzll/reflow'\n\n<Tabs label="Workspace" defaultValue="item-1" items={[\n  { value: 'overview', label: 'Overview', panel: <p>Overview</p> },\n  { value: 'activity', label: 'Activity', panel: <p>Activity</p> },\n]} />`,
    props: [
      { name: 'items', type: 'TabItem[]', description: 'Tab labels and panel contents.' },
      { name: 'defaultValue', type: 'string', description: 'Initially selected tab.' },
      { name: 'value', type: 'string', description: 'Selected tab in controlled mode.' },
    ],
  },
  dropdown: {
    description: 'An anchored action menu with a shared hover highlight and keyboard navigation.',
    code: `import { Dropdown } from '@rtzll/reflow'\n\n<Dropdown label="Options" items={[\n  { value: 'rename', label: 'Rename' },\n  { value: 'archive', label: 'Archive' },\n]} onSelect={(value) => console.log(value)} />`,
    props: [
      { name: 'label', type: 'RemixNode', description: 'Visible trigger label.' },
      { name: 'items', type: 'DropdownItem[]', description: 'Available menu actions.' },
      {
        name: 'onSelect',
        type: '(value: string) => void',
        description: 'Called when an action is chosen.',
      },
    ],
  },
}

const components = [
  ['accordion', 'Accordion'],
  ['alert-dialog', 'AlertDialog'],
  ['ask-user-questions', 'AskUserQuestions'],
  ['avatar', 'Avatar'],
  ['badge', 'Badge'],
  ['banner', 'Banner'],
  ['breadcrumb', 'Breadcrumb'],
  ['button', 'Button'],
  ['calendar', 'Calendar'],
  ['card', 'Card'],
  ['carousel', 'Carousel'],
  ['carousel-dots', 'CarouselDots'],
  ['chat-layout', 'ChatLayout'],
  ['chat-message', 'ChatMessage'],
  ['checkbox', 'Checkbox'],
  ['checkbox-group', 'CheckboxGroup'],
  ['citation', 'Citation'],
  ['code-block', 'CodeBlock'],
  ['color-picker', 'ColorPicker'],
  ['combobox', 'Combobox'],
  ['command-menu', 'CommandMenu'],
  ['date-picker', 'DatePicker'],
  ['dialog', 'Dialog'],
  ['drawer', 'Drawer'],
  ['dropdown', 'Dropdown'],
  ['field', 'Field'],
  ['file-input', 'FileInput'],
  ['hover-card', 'HoverCard'],
  ['input', 'Input'],
  ['input-copy', 'InputCopy'],
  ['input-group', 'InputGroup'],
  ['input-message', 'InputMessage'],
  ['number-field', 'NumberField'],
  ['pagination', 'Pagination'],
  ['popover', 'Popover'],
  ['progress', 'Progress'],
  ['queued-stack', 'QueuedStack'],
  ['radio-group', 'RadioGroup'],
  ['resizable', 'Resizable'],
  ['segmented-control', 'SegmentedControl'],
  ['select', 'Select'],
  ['sidebar', 'Sidebar'],
  ['skeleton', 'Skeleton'],
  ['slider', 'Slider'],
  ['spinner', 'Spinner'],
  ['switch', 'Switch'],
  ['table', 'Table'],
  ['tabs', 'Tabs'],
  ['textarea', 'Textarea'],
  ['thinking-indicator', 'ThinkingIndicator'],
  ['thinking-steps', 'ThinkingSteps'],
  ['toaster', 'Toaster'],
  ['toolbar', 'Toolbar'],
  ['tooltip', 'Tooltip'],
  ['trigger-menu', 'TriggerMenu'],
] as const

const systems = [
  [
    'fluid-hover',
    'Fluid Hover',
    'Use a single moving surface to preview the item under the pointer.',
  ],
  [
    'motion',
    'Motion',
    'Shared timing and spring curves keep transitions consistent between components.',
  ],
  ['reveal', 'Reveal', 'Play a short entrance when content reaches the viewport.'],
  [
    'scrollbars',
    'Scrollbars',
    'Use a thin scrollbar with native scrolling and a visible focus outline.',
  ],
  ['sizes', 'Sizes', 'Default and compact sizes share the same control scale.'],
  ['skill', 'Skill', 'Teach your coding agent the components and the craft behind them.'],
  [
    'surfaces',
    'Surfaces',
    'Eight levels let controls and overlays sit on distinguishable surfaces.',
  ],
  [
    'typography',
    'Typography',
    'Shared type roles and variable font axes give text a consistent rhythm.',
  ],
] as const

export const catalog: readonly ShowcaseComponent[] = [
  ...components.map(([slug, name]) => {
    const details = previews[slug]
    if (!details) return { slug, name, description: '' }
    return { slug, name, ...details, preview: <Example slug={slug} /> }
  }),
  ...systems.map(([slug, name, description]) => ({
    slug,
    name,
    description,
    category: 'system',
    preview: slug === 'skill' ? <SkillPage /> : <SystemPage slug={slug} />,
  })),
]

export function galleryCatalog(
  avatar: string,
  gallery = false,
  samples?: CodeSamples,
  query?: URLSearchParams,
) {
  return catalog.map((component) =>
    component.preview == null
      ? component
      : {
          ...component,
          preview: (
            <Example
              slug={component.slug}
              showcase
              gallery={gallery}
              avatar={avatar}
              teamPage={
                component.slug === 'table' ? (query?.get('teamPage') ?? undefined) : undefined
              }
              search={component.slug === 'table' ? (query?.get('q') ?? undefined) : undefined}
              code={component.slug === 'code-block' ? samples?.card : undefined}
            />
          ),
        },
  )
}
