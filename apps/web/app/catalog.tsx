import { components, systems } from './public/catalog-entries.ts'
import { bannerDefaults, bannerFragment } from './public/banner-example.tsx'
import { conversationCode } from './public/chat-example.tsx'
import {
  accordionItems,
  checkboxFruit,
  markdownNote,
  radioOptions,
} from './public/component-example-data.ts'
import { cardPlaygroundCode } from './public/card-example-code.ts'
import { questionCode, questionPlayground } from './public/question-example-data.ts'
import { requestFormCode } from './public/request-form-example.tsx'
import { carouselExampleCode } from './public/carousel-example.tsx'
import { triggerMenuCode } from './public/component-example-data.ts'
import { teamTableCode } from './public/team-table-example.tsx'
import { projectFileMenuCode } from './public/project-tree-example.tsx'
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
    description:
      'Browse the component directory five records at a time. Each page has a shareable URL.',
  },
  'data-table': {
    description:
      'Filter, sort, and page through records. Open a row’s actions from its menu button or with a right-click.',
    code: teamTableCode(),
  },
  'context-menu': {
    description:
      'Right-click a file or press Shift+F10 to open it or copy its name or relative path.',
    code: projectFileMenuCode(),
  },
  tree: {
    description:
      'Browse and select from a hierarchy with expandable branches and keyboard navigation.',
    code: `const files = [
  { value: 'app', label: 'app', children: [{ value: 'example', label: 'code-block-example.tsx' }] },
  { value: 'readme', label: 'README.md' },
]

<Tree label="Project files" items={files} defaultExpanded={['app']}
  defaultValue="readme" onValueChange={(file) => console.log(file)} />`,
  },
  toolbar: {
    description:
      'Wrap lines, show line numbers, or copy the selected file. Tab into the toolbar and use the arrow keys to move between actions.',
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
  'bar-chart': {
    description: 'Compare values on a zero baseline and inspect a category by pointer or keyboard.',
    code: '<BuildTimings showAxes={true} />',
  },
  'time-grid': {
    description:
      'Book a time slot, move an appointment, or change its duration using the pointer or keyboard.',
    code: '<StudioBookings stepMinutes={30} />',
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
    description: 'Confirm deletion of a named teamspace, with Cancel focused first.',
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
  'chat-outline': {
    description:
      'A menu of the turns in a conversation that marks the one in view and jumps to the one chosen.',
    code: `<ChatLayout\n  header={<ChatOutline items={turns.map((turn) => ({ id: turn.id, label: turn.text }))} />}\n  composer={<InputMessage onSend={send} />}\n>\n  {messages.map((message) => (\n    <ChatMessage id={message.id} role={message.role}>{message.text}</ChatMessage>\n  ))}\n</ChatLayout>`,
  },
  'tool-calls': {
    description:
      "One quiet line for an assistant's tool calls that opens to each call, and shows the one running.",
    code: `<ToolCalls\n  calls={[\n    { id: '1', label: 'Read the brief' },\n    { id: '2', label: 'Ran a command', detail: <code>pnpm test</code> },\n  ]}\n  startedAt={started}\n  endedAt={ended}\n/>`,
  },
  'task-list': {
    description: "A plan's steps, each done, in progress with a spinner, or not started.",
    code: `<TaskList\n  label="Plan"\n  progress\n  tasks={[\n    { id: 'outline', label: 'Outline the story', status: 'done' },\n    { id: 'draft', label: 'Draft the opening', status: 'active' },\n    { id: 'proof', label: 'Proof the captions' },\n  ]}\n/>`,
  },
  'file-changes': {
    description:
      'A card that sums up an edit: the files changed, lines added and removed, and actions.',
    code: `<FileChanges\n  files={[\n    { path: 'src/cover.ts', added: 48, removed: 6, href: '/diff/cover' },\n    { path: 'src/captions.ts', added: 12, removed: 9 },\n  ]}\n  actions={<Button size="compact" variant="secondary">View changes</Button>}\n/>`,
  },
  kbd: {
    description:
      'Keycaps for a single key, a platform-aware shortcut chord, or a multi-key sequence.',
    code: `<Kbd keys="mod+k" />\n<Kbd keys={['g', 'i']} separator="then" variant="outline" />\n<Kbd variant="outline">Esc</Kbd>`,
  },
  'time-field': {
    description:
      'A wall-clock time combobox with flexible parsing, step slots, durations, and form submission.',
    code: `<TimeField label="Start time" name="start" defaultValue="09:30" step={15} />\n<TimeField label="End time" name="end" after="09:30" defaultValue="11:00" end />`,
  },
  'diff-view': {
    description:
      'Unified and side-by-side code diffs powered by @pierre/diffs, with syntax highlighting, intraline changes, line selection, and inline annotations.',
    code: `import { DiffView } from '@rtzll/reflow/diffs'\n\n<DiffView\n  filename="src/cache.ts"\n  diff={unifiedDiff}\n  viewToggle\n/>`,
  },
  'file-tree': {
    description:
      'Virtualized, path-first file tree powered by @pierre/trees, with automatic folder compaction, git status badges, colored row decorations, and zero-flash Declarative Shadow DOM SSR.',
    code: `import { FileTree } from '@rtzll/reflow/trees'\n\n<FileTree\n  paths={['packages/reflow/src/diffs.tsx', 'packages/reflow/src/trees.tsx']}\n  gitStatus={[{ path: 'packages/reflow/src/trees.tsx', status: 'added' }]}\n  size="compact"\n/>`,
  },
  diagram: {
    description:
      'Themeable Mermaid diagrams rendered to SVG by Pele, adapting live to Reflow themes, accents, and fonts with zero-flash SSR and Markdown fence integration.',
    code: `import { Diagram } from '@rtzll/reflow/diagrams'\n\n<Diagram\n  title="SSR pipeline"\n  code={'flowchart LR\\n  SSR --> DSD[Shadow DOM] --> Hydrate'}\n  copyable\n  showSourceToggle\n/>`,
  },
  'empty-state': {
    description:
      'A quiet centered placeholder for empty views or zero-match filters, with an icon tile, description, and recovery actions.',
    code: `import { Button, EmptyState, Icon } from '@rtzll/reflow'\n\n<EmptyState\n  surface="outlined"\n  icon={<Icon name="search" size={18} />}\n  title="No matching files"\n  description="Clear the filter to inspect all changed files."\n  actions={<Button size="compact" variant="secondary">Clear filter</Button>}\n/>`,
  },
  timeline: {
    description:
      'A vertical connected stream of commits, review events, and check runs with semantic markers and detail blocks.',
    code: `import { Badge, Icon, Timeline } from '@rtzll/reflow'\n\n<Timeline\n  label="Review activity"\n  items={[\n    { id: '1', icon: <Icon name="file" size={12} />, title: 'Pushed 2 commits', meta: <Badge size="compact">a84c1bb</Badge>, timestamp: '14m ago' },\n    { id: '2', tone: 'success', icon: <Icon name="check" size={12} />, title: 'All checks passed', timestamp: '9m ago' },\n  ]}\n/>`,
  },
  terminal: {
    description:
      'Monospace command and CI log output in CodeBlock’s quiet frame, with ANSI color rendering, filtering, follow-tail scrolling, and plain-text copy.',
    code: `import { Terminal } from '@rtzll/reflow'\n\n<Terminal\n  command="pnpm verify"\n  status="passed"\n  exitCode={0}\n  searchable\n  output={['\\x1b[32m✓\\x1b[0m All checks passed']}\n/>`,
  },
  'comment-thread': {
    description:
      'Threaded review discussions with avatars, code suggestion blocks, inline replies, and spring-collapsed Resolve/Reopen states.',
    code: `import { CommentThread } from '@rtzll/reflow'\n\n<CommentThread\n  context="src/diffs-ssr.ts:144"\n  comments={[{ id: '1', author: { name: 'Noah' }, timestamp: '12m ago', body: 'Strip leading a/ and b/ prefixes.' }]}\n  onReply={appendReply}\n  onResolvedChange={setResolved}\n/>`,
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
    description:
      'Find a project command and run it with Enter or a click. Open the Tree docs, copy the current URL, or switch themes.',
  },
  'date-picker': {
    description: 'A date field with an anchored calendar and local ISO date values.',
    code: `<DatePicker label="Start date" name="start" min="2026-11-01" />`,
  },
  dialog: {
    description: 'Create a named teamspace and see it appear in the list.',
  },
  field: {
    description:
      'A label, form control, help text, and error with associated accessible descriptions.',
    code: requestFormCode(),
  },
  confirmation: {
    description:
      'A yes or no question before something runs, such as an agent’s tool call, answered in place.',
    code: `<Confirmation\n  title="Run pnpm build?"\n  description="Builds the library and the showcase into dist/."\n  onApprove={run}\n  onDeny={skip}\n/>`,
  },
  citation: {
    description:
      'An inline source chip in generated text that links to the source and previews it.',
    code: `<p>\n  Good design is unobtrusive.\n  <Citation index={1} sources={{ title: 'Ten principles for good design', href }} />\n</p>`,
  },
  markdown: {
    description:
      'Render Markdown notes and streaming replies with semantic headings, lists, pipe tables, and copyable code.',
    code: `<Markdown source={${JSON.stringify(markdownNote)}} />`,
  },
  'code-block': {
    description:
      'Code with its filename, a copy button, line numbers and line marks, highlighted for any language by Shiki.',
    code: `import { highlight } from '@rtzll/reflow/highlight'\n\nconst code = await highlight(source, { lang: 'tsx' })\n\n<CodeBlock code={code} filename="Button.tsx" />`,
  },
  drawer: {
    description:
      'A panel that slides in from an edge. Use snap points for a bottom sheet that opens partway.',
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
  'file-thumbnail': {
    description:
      'A file shown as an image preview, or as a card with its name and type when it has none.',
    code: `<FileThumbnail file={file} />\n<FileThumbnail file={{ name: 'notes.md' }} size={64} />`,
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
      'Explore a project’s files, recent activity, and members. Use the arrow keys to focus a tab and Enter to open its panel.',
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
  diff?: string,
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
              query={
                ['data-table', 'pagination'].includes(component.slug)
                  ? query?.size
                    ? '?' + query.toString()
                    : ''
                  : undefined
              }
              code={component.slug === 'code-block' ? samples?.card : undefined}
              diff={component.slug === 'diff-view' ? diff : undefined}
            />
          ),
        },
  )
}
