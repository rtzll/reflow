import { advancedExamples } from '../advanced-demos.tsx'
import {
  cardBasicCode,
  cardCompositionCode,
  cardGridCode,
  cardOutlinedCode,
  cardSelectedCode,
  cardSeparatedCode,
} from '../card-example-code.ts'
import { carouselExampleCode } from '../carousel-example.tsx'
import { chatAvatar } from '../chat-example.tsx'
import {
  accordionItems,
  badgeColorNames,
  badgeGenres,
  composerTriggers,
  markdownFence,
  markdownTable,
  multipleAccordionItems,
  rowHighlightAccordionItems,
  standaloneAccordionItems,
} from '../component-example-data.ts'
import { questionCode, questionExample } from '../question-example-data.ts'

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
  'alert-dialog': [
    demo(
      'Leave without saving',
      'leave',
      `let editing = true
function setEditing(open: boolean) {
  editing = open
  void handle.update()
}

<div>
  {editing ? <>
    <Textarea aria-label="Project notes" defaultValue="Review the release notes." />
    <AlertDialog trigger="Leave editor" title="Leave without saving?"
      description="Your unsaved changes will be discarded." cancelLabel="Keep editing"
      confirmLabel="Leave" onConfirm={() => setEditing(false)} />
  </> : <Button mix={on('click', () => setEditing(true))}>Reopen editor</Button>}
</div>`,
      'Escape and Keep editing dismiss the dialog. Backdrop clicks keep it open.',
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
      'The active dot shows progress through the slide. Hover the slides or move keyboard focus into the carousel to pause. Play resumes from the same spot, even while the button has focus.',
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
      'Anchored replies',
      'anchor',
      `<ChatLayout scroll="anchor" busy={streaming} composer={composer}>\n  {messages}\n</ChatLayout>`,
      'Send a message: it glides to the top of the view with the previous one peeking above, and the reply grows below it without moving it. busy keeps screen readers from announcing the reply in pieces.',
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
      `<CommandVariants variant="basic" />`,
      'Type to filter, press ↓ ↑ to move, Enter to run. Rows come from items, grouped by group.',
    ),
    demo(
      'Descriptions, shortcuts, disabled rows',
      'descriptions',
      `<CommandVariants variant="descriptions" />`,
      'Type clipboard to find Copy page link. Its shortcut works while focus is in the menu. Arrow keys skip the disabled export.',
    ),
    demo(
      'Suggestions',
      'groups',
      `<CommandVariants variant="groups" />`,
      '3 suggested rows lead until you type 1 letter, then the groups take over.',
    ),
    demo(
      'Tabs',
      'filters',
      `<CommandVariants variant="filters" />`,
      'Click a tab or press ← →, and the rows follow. Controls hug the end of the row beneath the field.',
    ),
    demo(
      'Filters',
      'controls',
      `<CommandVariants variant="controls" />`,
      'A compact, borderless row under the field for selects or ghost buttons; the list divider closes it.',
    ),
    demo(
      'Dialog and trigger shortcut',
      'dialog',
      `<CommandVariants variant="dialog" />`,
      'Press the combo anywhere on the page. A pick or Escape closes it.',
    ),
    demo(
      'Footer hints',
      'footer',
      `<CommandVariants variant="footer" />`,
      'Hints follow the menu: ← → with tabs, Esc in a dialog, and ↵ named after the highlighted row.',
    ),
    demo(
      'Custom rows',
      'custom',
      `<CommandVariants variant="custom" />`,
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
      `<InputMessage files={files} onFilesChange={setFiles} maxFiles={4} pasteAsFile={1000} voice
  onSend={({ text, files }) => send(text, files)} />`,
      'Images show a thumbnail; other files show their name and type. Remove one, use the attachment button, drop files onto the composer, paste a long text, or record a voice note.',
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
      'Model picker',
      'right',
      `<InputMessage attachments={false} rightActions={
  <Dropdown label="Model one, Balanced" variant="ghost" items={[
    { value: 'one', label: 'Model one', type: 'radio', checked: true, badge: <Badge size="compact">Default</Badge> },
    { value: 'two', label: 'Model two', type: 'radio' },
    { value: 'effort', label: 'Effort', hint: effort, separatorBefore: true,
      note: 'More effort answers more thoroughly, but takes longer.',
      children: efforts.map((level) => ({ value: level, label: level, type: 'radio', checked: effort === level })) },
    { value: 'quick', label: 'Quick replies', type: 'switch', checked: quick, separatorBefore: true },
  ]} onSelect={choose} />
} onSend={sendMessage} />`,
      'The right slot holds a Dropdown: models with badges, the effort level in a submenu that explains it, and a switch row.',
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
  confirmation: [
    demo(
      'Basic',
      'basic',
      `<Confirmation\n  icon={<Icon name="cpu" />}\n  title="Run pnpm build?"\n  description="Builds the library and the showcase into dist/."\n  onApprove={run}\n  onDeny={skip}\n/>`,
      'Approve or Deny gives way to the answer in the same place, at the same height. Keyboard focus moves to the answer, and the answer is announced; the question itself is not.',
    ),
    demo(
      'A risky action',
      'warning',
      `<Confirmation\n  status="warning"\n  title="Delete 3 branches?"\n  description="…will be removed from origin."\n  approveLabel="Delete"\n  denyLabel="Keep"\n  approvedLabel="Deleted"\n  deniedLabel="Kept"\n/>`,
      'Banner’s status, contrast and size pass through. Name the buttons after the action.',
    ),
    demo(
      'In a form',
      'form',
      `<form>\n  <Confirmation name="send" title="Send the weekly summary to the team?" />\n  <Button type="submit">Submit</Button>\n</form>`,
      'With name, the answer submits as approved or denied. Unanswered, the field is absent.',
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
  markdown: [
    demo(
      'Pipe table',
      'table',
      `<Markdown source={${JSON.stringify(markdownTable)}} />`,
      'A delimiter row creates column headings. Colons in the delimiter control alignment.',
    ),
    demo(
      'Images',
      'images',
      `<Markdown source={reply} images />\n\n// Or decide per source:\n<Markdown\n  source={reply}\n  images={(src) => src.startsWith('https://cdn.example.com/')}\n/>`,
      'Images are links by default, so rendering loads nothing: an image URL in generated text could send data to whoever serves it. images loads same-site images; a function decides for each source. Refused images stay links.',
    ),
    demo(
      'Fenced code',
      'code',
      `<Markdown source={${JSON.stringify(markdownFence)}} />`,
      'A fence renders a CodeBlock with its language and copy action. An open fence stays readable while more text arrives.',
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
  'bar-chart': [
    demo(
      'Build timings',
      'timings',
      `<BarChart\n  label="Build timings"\n  items={stages}\n  formatValue={(seconds) => seconds + ' s'}\n  onSelect={inspect}\n/>`,
      'Hover or focus a bar to read its value; arrow keys move between bars.',
    ),
    demo(
      'Negative values',
      'negative',
      `<BarChart label="Daily balance" items={balance} formatValue={(value) => value + ' h'} />`,
      'The axis spans the data with zero on a round step, and bars below zero hang from the zero line.',
    ),
    demo(
      'Stacked, horizontal',
      'stacked',
      `<BarChart\n  label="Lines changed by package"\n  items={packages}\n  series={[\n    { id: 'added', label: 'Added' },\n    { id: 'removed', label: 'Removed' },\n  ]}\n  layout="stacked"\n  orientation="horizontal"\n/>`,
      'Each item gives values, one per series. Stacked, positive values pile one way and negative ones the other; grouped, they sit side by side. Rows suit long labels, and Up and Down move between them.',
    ),
  ],
  'time-grid': [
    demo(
      'Bookings',
      'bookings',
      `<TimeGrid\n  label="Studio bookings"\n  days={['Friday']}\n  events={bookings}\n  startMinute={540}\n  endMinute={780}\n  stepMinutes={30}\n  onCreate={book}\n  onEventChange={move}\n/>`,
      'Pause over open time to see the start time, then drag to book it. Drag an event to move it or its bottom edge to resize it.',
    ),
    demo(
      'All-day and overnight',
      'week',
      `const events = [\n  { id: 'freeze', title: 'Code freeze', day: 0, start: 0, duration: 0, allDay: true, span: 2 },\n  { id: 'release', title: 'Release day', day: 2, start: 0, duration: 0, allDay: true },\n  { id: 'migration', title: 'Database migration', day: 0, start: 1320, duration: 300 },\n]\n\n<TimeGrid label="Release week" days={days} events={events} onCreate={create} onEventChange={update} />`,
      'All-day events sit in a strip above the hours and can span days; arrows or a sideways drag move them by a day. The migration starts at 22:00 and continues in Tuesday’s column until 03:00.',
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
      'Nested',
      'nested',
      `<Drawer trigger="Filters" title="Filters">\n  <Drawer trigger="Choose a color" title="Color">…</Drawer>\n</Drawer>`,
      'A drawer can open another: the one behind steps back and comes forward again as the front one is dragged away or closed. Escape closes only the front drawer.',
    ),
    demo(
      'Snap points',
      'snap',
      `<Drawer\n  trigger="Route"\n  title="Lisbon to Porto"\n  snapPoints={[0.4, 0.9]}\n  scaleBackground\n>\n  <ol>…</ol>\n</Drawer>`,
      'Opens at 40% of the screen and expands to 90%: drag the panel, flick it, or press the handle or its arrow keys. Below the top point a drag resizes it instead of scrolling. scaleBackground pushes the element marked data-rf-drawer-background back.',
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
    demo('With Icons', 'icons', `<ProjectTabs icons />`),
    demo('Active Label', 'active-label', `<ProjectTabs activeLabel />`),
    demo('Underline', 'underline', `<ProjectTabs variant="underline" />`),
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
