import { componentName, groupComponentImports } from './catalog-entries.ts'
import { teamTableCode } from './team-table-example.tsx'
import { projectFileMenuCode } from './project-tree-example.tsx'
import { bannerFragment } from './banner-example.tsx'
import {
  accordionItems,
  markdownNote,
  checkboxFruit,
  radioOptions,
  componentOptions,
  inputMessagePrompts,
} from './component-example-data.ts'
import { carouselExampleCode } from './carousel-example.tsx'
import { questionCode, questionPlayground } from './question-example-data.ts'
import { requestFormCode } from './request-form-example.tsx'
import { cardPlaygroundCode } from './card-example-code.ts'
import { initialPlayground, questionSettings, type PlaygroundValues } from './doc-playground.tsx'

const sharedPlaygroundDefaults = new Set([
  'bar-chart',
  'time-grid',
  'color-picker',
  'combobox',
  'command-menu',
  'dialog',
  'tabs',
  'context-menu',
  'data-table',
  'date-picker',
  'dropdown',
  'input-message',
  'sidebar',
  'slider',
  'thinking-steps',
  'toaster',
  'drawer',
  'markdown',
  'code-block',
  'citation',
  'confirmation',
  'avatar',
  'chat-layout',
  'progress',
  'carousel',
  'file-tree',
  'diagram',
  'log-viewer',
  'waterfall',
  'pipeline-graph',
  'status-strip',
  'filter-bar',
  'reaction-bar',
  'markdown-editor',
  'sparkline',
  'metric-card',
  'line-chart',
  'object-inspector',
])

export function defaultPreviewValues(slug: string, variant?: string) {
  if (!variant && sharedPlaygroundDefaults.has(slug)) return initialPlayground(slug)
}

export function previewCode(
  props: { slug: string; variant?: string; code: string; source?: string },
  playground: PlaygroundValues | undefined,
) {
  const fragment = playground ? playgroundFragment(props.slug, playground) : props.code
  const source =
    props.slug === 'command-menu' && !props.variant
      ? props.source?.split('// The detailed examples')[0].trimEnd()
      : props.source
  return source
    ? source +
        (playground || props.variant
          ? '\n\nexport function Example() {\n  return () => (\n    ' + fragment + '\n  )\n}'
          : '')
    : documentationCode(props.slug, fragment)
}

/** Expand documentation fragments into a complete native Remix component. */
export function documentationCode(slug: string, fragment: string): string {
  const clean = fragment.replace(/^import[^\n]*\n/gm, '').trim()
  const start = clean.startsWith('<') ? 0 : clean.search(/^<[A-Za-z]/m)
  if (start < 0) return fragment
  const declarations = clean.slice(0, start).trim()
  const markup = clean.slice(start).trim()
  const setup: string[] = declarations ? [declarations] : []
  const uses = (name: string) =>
    new RegExp(`\\b${name}\\b`).test(markup) &&
    !new RegExp(`\\b(?:const|let|function) ${name}\\b`).test(declarations)
  const options = `const options = ['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({ value: label.toLowerCase(), label }))`
  if (uses('options')) setup.push(options)
  if (uses('items') && /\{items\}|\bitems\.map/.test(markup)) {
    if (slug === 'accordion') setup.push(`const items = ${JSON.stringify(accordionItems, null, 2)}`)
    else
      setup.push(
        `const items = ['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({ value: label.toLowerCase(), label }))`,
      )
  }
  if (uses('sections'))
    setup.push(
      `const sections = [{ label: 'Workspace', items: [\n  { label: 'Inbox', href: '#inbox', badge: '3' },\n  { label: 'Projects', href: '#projects' },\n] }]`,
    )
  if (uses('timezones'))
    setup.push(
      `const timezones = Intl.supportedValuesOf('timeZone').map((label) => ({ value: label, label }))`,
    )
  if (uses('steps'))
    setup.push(
      `const steps = [\n  { value: 'search', title: 'Searching sources', content: 'Found four relevant pages.', status: 'complete' as const },\n  { value: 'analyze', title: 'Analyzing results', content: 'Comparing approaches.', status: 'active' as const },\n]`,
    )
  if (uses('questions'))
    setup.push(
      `const questions = [{ title: 'How will you use Reflow?', options: [{ title: 'Designer' }, { title: 'Engineer' }] }]`,
    )
  for (const name of ['icon', 'homeIcon', 'inboxIcon', 'settingsIcon']) {
    if (uses(name))
      setup.push(
        `const ${name} = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>`,
      )
  }
  if (uses('index') || uses('selectSlide'))
    setup.push(
      `let index = 0\nconst selectSlide = (value: number) => { index = value; handle.update() }`,
    )
  if (uses('selected') || uses('setSelected') || uses('toggleOption')) {
    setup.push(`let selected: string[] = []`)
    if (uses('setSelected'))
      setup.push(`const setSelected = (values: string[]) => { selected = values; handle.update() }`)
    if (uses('toggleOption'))
      setup.push(
        `const toggleOption = (value: string) => { selected = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]; handle.update() }`,
      )
  }
  if (uses('enabled') || uses('setEnabled'))
    setup.push(
      `let enabled = false\nconst setEnabled = (value: boolean) => { enabled = value; handle.update() }`,
    )
  if (uses('color') || uses('setColor'))
    setup.push(
      `let color = '#6B97FF'\nconst setColor = (value: string) => { color = value; handle.update() }`,
    )
  if (uses('plan') || uses('select'))
    setup.push(
      `let plan = 'free'\nconst select = (value: string) => { plan = value; handle.update() }`,
    )
  if (uses('setCopied'))
    setup.push(`const setCopied = (value: boolean) => { console.log('Copied', value) }`)
  if (uses('saveFruit'))
    setup.push(`const saveFruit = (value: string) => { console.log('Created', value) }`)
  if (uses('saveAnswers'))
    setup.push(
      `const saveAnswers = (answers: Record<string, AskUserAnswer>) => { console.log(answers) }`,
    )
  if (uses('sendMessage'))
    setup.push(
      `const sendMessage = ({ text, files }: ComposerMessage) => { console.log(text, files) }`,
    )
  if (uses('send'))
    setup.push(
      `const send = (text: string, files: readonly File[]) => { console.log(text, files) }`,
    )
  if (uses('saveMessage'))
    setup.push(
      `const saveMessage = async (text: string, files: readonly File[]) => { console.log(text, files) }`,
    )
  if (uses('stopResponse'))
    setup.push(`const stopResponse = () => { console.log('Response stopped') }`)
  const combined = `${setup.join('\n\n')}\n${markup}`
  const components = [
    ...new Set([...combined.matchAll(/<([A-Z]\w*)\b/g)].map((match) => match[1])),
  ].filter((name) => name !== 'Record' && name !== 'MainContent')
  if (/\bComposerMessage\b/.test(combined)) components.push('type ComposerMessage')
  if (/\btoast[.(]/.test(combined)) components.push('toast')
  if (/\bAskUserAnswer\b/.test(combined)) components.push('type AskUserAnswer')
  const indentation = (value: string, spaces: number) =>
    value
      .split('\n')
      .map((line) => ' '.repeat(spaces) + line)
      .join('\n')
  // Specialist entry points load only where they are used.
  const imports = groupComponentImports(components)
  return `${imports.join('\n')}\nimport { type Handle${/\bon\(/.test(combined) ? ', on' : ''} } from 'remix/component'\n\nexport function Example(handle: Handle) {\n${setup.length ? indentation(setup.join('\n\n'), 2) + '\n\n' : ''}  return () => (\n    <>\n${indentation(markup, 6)}\n    </>\n  )\n}`
}

export function playgroundFragment(slug: string, values: PlaygroundValues): string {
  if (slug === 'markdown')
    return `<Markdown source={${JSON.stringify(markdownNote)}} size="${values.size}" />`
  if (slug === 'data-table') return teamTableCode(Number(values.pageSize))
  if (slug === 'context-menu')
    return projectFileMenuCode(values.size === 'compact' ? 'compact' : 'default')
  if (slug === 'bar-chart') return `<BuildTimings showAxes={${Boolean(values.showAxes)}} />`
  if (slug === 'time-grid') return `<StudioBookings stepMinutes={${Number(values.stepMinutes)}} />`
  if (slug === 'dropdown') return dropdownPlaygroundCode(values)
  if (slug === 'date-picker') return datePickerPlaygroundCode(values)
  const name = componentName(slug)
  const synthetic = new Set([
    'filters',
    'descriptions',
    'modal',
    'presets',
    'suggestion',
    'suggestedPrompts',
    'invalid',
  ])
  const props = Object.entries(values)
    .filter(
      ([key]) =>
        !synthetic.has(key) &&
        !(slug === 'date-picker' && key === 'time') &&
        !(slug === 'field' && ['description', 'error'].includes(key)) &&
        !(
          slug === 'button' && ['label', 'iconOnly', 'leadingIcon', 'trailingIcon'].includes(key)
        ) &&
        !(slug === 'badge' && key === 'label') &&
        !(slug === 'card') &&
        !(slug === 'table') &&
        !(
          slug === 'sidebar' && !['variant', 'searchable', 'defaultCollapsed', 'peek'].includes(key)
        ) &&
        !(slug === 'input-group') &&
        !(
          slug === 'slider' &&
          ((key === 'valuePosition' && values.valuePosition === 'auto') ||
            (key === 'showSteps' && !values.showSteps) ||
            (key === 'showValue' && values.showValue))
        ) &&
        !(slug === 'date-picker' && key === 'time') &&
        !(slug === 'carousel-dots' && key === 'autoplay') &&
        !(slug === 'chat-message' && key === 'attachments'),
    )
    .map(([key, value]) => {
      if (slug === 'button' && key === 'size' && values.iconOnly)
        return value === 'compact' ? 'size="icon-compact"' : 'size="icon"'
      const prop =
        slug === 'accordion' && key === 'multiple'
          ? 'type'
          : slug === 'color-picker' && key === 'format'
            ? 'defaultFormat'
            : key
      if (slug === 'accordion' && key === 'multiple')
        return `type="${value ? 'multiple' : 'single'}"`
      if (typeof value === 'boolean') return `${prop}={${value}}`
      if (
        [
          'count',
          'numberOfMonths',
          'weekStartsOn',
          'rows',
          'step',
          'interval',
          'delayDuration',
        ].includes(key)
      )
        return `${prop}={${value}}`
      return /["<>&\n]/.test(value)
        ? `${prop}={${JSON.stringify(value)}}`
        : `${prop}=${JSON.stringify(value)}`
    })
    .join(' ')
  const opening = `<${name}${props ? ' ' + props : ''}`
  switch (slug) {
    case 'button': {
      const label = JSON.stringify(String(values.label))
      if (values.iconOnly) {
        const accessibleLabel = JSON.stringify(String(values.label).trim() || 'Get started')
        return `${opening} aria-label={${accessibleLabel}}><Icon name="plus" /></Button>`
      }
      const leading = values.leadingIcon ? ' leadingIcon={<Icon name="plus" />}' : ''
      const trailing = values.trailingIcon ? ' trailingIcon={<Icon name="arrow-right" />}' : ''
      return `${opening}${leading}${trailing}>{${label}}</Button>`
    }
    case 'badge':
      return `${opening}>{${JSON.stringify(String(values.label))}}</${name}>`
    case 'banner':
      return bannerFragment(values)
    case 'accordion':
      return `<Accordion ${values.expand === 'any number' ? 'type="multiple" defaultValue={["item-1"]}' : `defaultValue="item-1" collapsible={${values.expand !== 'one at a time'}}`} highlight="${values.highlightExpanded ? 'item' : 'trigger'}" disabled={${values.disabled}} items={items} />`
    case 'ask-user-questions':
      return questionCode(questionPlayground(questionSettings(values)))
    case 'calendar':
      return `${opening} defaultMonth="2026-11-01" />`
    case 'card':
      return cardPlaygroundCode(values)
    case 'progress':
      return `<Progress label="Uploading files"${values.indeterminate ? '' : ' value={7} max={12}'}${values.showValue ? ' showValue' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'carousel-dots':
      return carouselExampleCode(Number(values.count), Boolean(values.autoplay))
    case 'chat-message':
      if (values.role === 'system')
        return `${opening} icon={<Icon name="cpu" />}>Switched to a faster model</ChatMessage>`
      return `${opening}${values.attachments ? ' attachments={[{ name: "design-notes.md", detail: "Markdown · 2 KB" }]}' : ''}>Can we make the interaction feel more fluid?</ChatMessage>`
    case 'checkbox':
    case 'switch':
      return `${opening.replace('checked=', 'defaultChecked=')} />`
    case 'checkbox-group':
      return `const options = ${JSON.stringify(checkboxFruit)}

${opening} label="Fruit" options={options} defaultValue={['apples']} />`
    case 'radio-group':
      return `const options = ${JSON.stringify(radioOptions)}

${opening} label="Options" options={options} defaultValue="0" />`
    case 'hover-card': {
      const placement =
        values.placement && values.placement !== 'bottom' ? ` placement="${values.placement}"` : ''
      const delay =
        values.openDelay && values.openDelay !== '500' ? ` openDelay={${values.openDelay}}` : ''
      const compact = values.size === 'compact' ? ' size="compact"' : ''
      return `<HoverCard${placement}${delay}${compact} renderTrigger={(trigger) => (\n  <a href="/u/reflow" {...trigger}>@reflow</a>\n)}>\n  <Profile user={user} />\n</HoverCard>`
    }
    case 'carousel': {
      const perView = Number(values.perView ?? 1)
      const props = [
        perView > 1
          ? `\n  style={{ '--rf-carousel-slide': 'calc((100% - ${(perView - 1) * 12}px) / ${perView})' }}`
          : '',
        values.align === 'center' ? '\n  align="center"' : '',
        values.autoplay ? '\n  autoplay={{ duration: 3000 }}' : '',
        values.dots === false ? '\n  dots={false}' : '',
        values.controls === false ? '\n  controls={false}' : '',
        values.size === 'compact' ? '\n  size="compact"' : '',
      ].join('')
      return `<Carousel\n  label="Highlights"\n  slideLabels={titles}${props}\n>\n  {slides.map((slide) => <Slide {...slide} />)}\n</Carousel>`
    }
    case 'chat-layout': {
      const header = values.header ? '\n  header={<ChatHeader title="Design chat" />}' : ''
      const compact = values.size === 'compact' ? ' size="compact"' : ''
      return `<ChatLayout${header}\n  empty={<p>Start a conversation</p>}\n  composer={<InputMessage${compact} onSend={send} />}\n>\n  {messages.map((message) => (\n    <ChatMessage role={message.role}${compact}>{message.text}</ChatMessage>\n  ))}\n</ChatLayout>`
    }
    case 'avatar': {
      const props = [
        values.image ? ' src={photo}' : '',
        values.size && values.size !== '32' ? ` size={${values.size}}` : '',
        values.shape === 'square' ? ' shape="square"' : '',
        values.status && values.status !== 'none' ? ` status="${values.status}"` : '',
      ].join('')
      return `<Avatar name="Ada Lovelace"${props} />`
    }
    case 'confirmation': {
      const props = [
        values.status === 'warning' ? '\n  status="warning"' : '',
        values.state === 'approved' || values.state === 'denied'
          ? `\n  state="${values.state}"`
          : '',
        values.size === 'compact' ? '\n  size="compact"' : '',
      ].join('')
      return `<Confirmation${props}\n  icon={<Icon name="cpu" />}\n  title="Run pnpm build?"\n  description="Builds the library and the showcase into dist/."\n  onApprove={run}\n  onDeny={skip}\n/>`
    }
    case 'citation': {
      const count = Number(values.count ?? 1)
      const sources =
        count === 1 ? 'rams' : `[${['rams', 'norman', 'laws'].slice(0, count).join(', ')}]`
      const props = [
        values.style === 'site' ? ' variant="site"' : ' index={1}',
        values.placement === 'bottom' ? ' placement="bottom"' : '',
        values.size === 'compact' ? ' size="compact"' : '',
      ].join('')
      return `<p>\n  Good design is unobtrusive: it lets you do what you came to do.\n  <Citation${props} sources={${sources}} />\n</p>`
    }
    case 'code-block': {
      const language = String(values.language ?? 'tsx')
      const extension =
        { tsx: 'tsx', css: 'css', bash: 'sh', json: 'json', python: 'py', rust: 'rs' }[language] ??
        language
      const props = [
        values.filename === false ? '' : ` filename="example.${extension}"`,
        values.lineNumbers ? ' lineNumbers' : '',
        values.wrap ? ' wrap' : '',
        values.copyable === false ? ' copyable={false}' : '',
        values.size === 'compact' ? ' size="compact"' : '',
      ].join('')
      return `const code = await highlight(source, { lang: '${language}' })\n\n<CodeBlock code={code}${props} />`
    }
    case 'drawer': {
      const side = values.side && values.side !== 'bottom' ? ` side="${values.side}"` : ''
      const vertical = !values.side || values.side === 'bottom' || values.side === 'top'
      const dismissible = values.dismissible === false ? ' dismissible={false}' : ''
      const handle =
        values.handle === (vertical && values.dismissible !== false)
          ? ''
          : ` handle={${Boolean(values.handle)}}`
      const close =
        Boolean(values.closeButton) === !vertical
          ? ''
          : ` showCloseButton={${Boolean(values.closeButton)}}`
      return `<Drawer trigger="Open drawer" title="Filters"${side}${handle}${close}${dismissible}>\n  <Switch label="In stock only" defaultChecked />\n</Drawer>`
    }
    case 'toaster': {
      const props = [
        values.position && values.position !== 'bottom-right'
          ? ` position="${values.position}"`
          : '',
        values.expand ? ' expand' : '',
        values.closeButton ? ' closeButton' : '',
        values.size === 'compact' ? ' size="compact"' : '',
      ].join('')
      const status = String(values.status ?? 'default')
      const call =
        status === 'loading'
          ? "toast.promise(upload(file), {\n  loading: 'Uploading roadmap.pdf…',\n  success: (name) => `Uploaded ${name}`,\n  error: 'Upload failed',\n})"
          : `${status === 'default' ? 'toast' : `toast.${status}`}('Event created'${
              values.description || values.action
                ? `, {${values.description ? "\n  description: 'Monday, November 9 at 9:41'," : ''}${
                    values.action ? "\n  action: { label: 'Undo', onClick: restore }," : ''
                  }\n}`
                : ''
            })`
      return `<Toaster${props} />\n\n${call}`
    }
    case 'popover': {
      const title = values.title
        ? ' title="Dimensions" description="Set the size of the selected frame."'
        : ' label="Dimensions"'
      const placement =
        values.placement && values.placement !== 'bottom' ? ` placement="${values.placement}"` : ''
      const compact = values.size === 'compact' ? ' size="compact"' : ''
      return `<Popover${title} trigger="Dimensions"${placement}${compact}>\n  <Input name="width" defaultValue="100%" />\n  <Input name="height" defaultValue="auto" />\n</Popover>`
    }
    case 'segmented-control': {
      const content = String(values.content ?? 'Text')
      const options =
        content === 'Icons'
          ? `[\n  { value: 'list', label: 'List', icon: <Icon name="menu" /> },\n  { value: 'board', label: 'Board', icon: <Icon name="square-library" /> },\n  { value: 'calendar', label: 'Calendar', icon: <Icon name="calendar" /> },\n]`
          : content === 'Icon only'
            ? `[\n  { value: 'light', label: 'Light', icon: <Icon name="sun" />, iconOnly: true },\n  { value: 'dark', label: 'Dark', icon: <Icon name="moon" />, iconOnly: true },\n  { value: 'system', label: 'System', icon: <Icon name="monitor" />, iconOnly: true },\n]`
            : `[\n  { value: 'day', label: 'Day' },\n  { value: 'week', label: 'Week' },\n  { value: 'month', label: 'Month' },\n  { value: 'year', label: 'Year' },\n]`
      const name = content === 'Icon only' ? 'Theme' : content === 'Icons' ? 'View' : 'Period'
      const extra = `${values.fill ? ' fill' : ''}${values.size === 'compact' ? ' size="compact"' : ''}${values.disabled ? ' disabled' : ''}`
      return `<SegmentedControl label="${name}"${extra} options={${options}} />`
    }
    case 'select':
      return `${opening} label="Fruit" options={options} />`
    case 'combobox':
      return `const components = ${JSON.stringify(componentOptions, null, 2)}

${opening} label="Components" placeholder="${values.multiple ? 'Add components…' : 'Pick a component…'}" emptyMessage="No component found." options={components}${values.multiple ? " defaultValues={['button', 'combobox']}" : ''} />`
    case 'color-picker':
      return `${opening} swatches={[]} triggerLabel="Fill" placement="right-start" />`
    case 'command-menu':
      return `<ProjectCommands modal={${values.modal}} filters={${values.filters}} descriptions={${values.descriptions}} />`
    case 'dialog':
      return `<TeamspacesExample size="${values.size}" position="${values.position}" modal={${values.modal}} showCloseButton={${values.showCloseButton}} dismissOnBackdrop={${values.dismissOnBackdrop}} />`
    case 'breadcrumb': {
      const compact = values.size === 'compact' ? ' size="compact"' : ''
      const separator = values.separator === 'slash' ? ' separator={<span>/</span>}' : ''
      const items = values.icons
        ? `[\n  { label: 'Home', href: '/', icon: <Icon name="home" /> },\n  { label: 'Projects', href: '/projects', icon: <Icon name="folder" /> },\n  { label: 'Q3 report.pdf', icon: <Icon name="file" /> },\n]`
        : `[\n  { label: 'Home', href: '/' },\n  { label: section, menu: sections.map((name) => ({ value: name, label: name, type: 'radio', checked: name === section })), onMenuSelect: setSection },\n  { label: 'Breadcrumb' },\n]`
      return `<Breadcrumb openOnHover${compact}${separator} items={${items}} />`
    }
    case 'dropdown':
      return `${opening} label={selectedLabel} items={items} onSelect={selectItem} />`
    case 'field':
      return requestFormCode({
        orientation:
          values.orientation === 'horizontal'
            ? 'horizontal'
            : values.orientation === 'responsive'
              ? 'responsive'
              : 'vertical',
        description: Boolean(values.description),
        error: Boolean(values.error),
      })
    case 'input':
      return `${opening} aria-label="Input"${values.invalid ? ' aria-invalid="true"' : ''} placeholder="Enter a value" />`
    case 'input-copy':
      return `${opening} value="${values.masked ? 'rf_live_98d4c1f7e2a0b6c39f2c' : 'pnpm install remix @remix-run/ui'}" />`
    case 'input-group':
      return `<InputGroup>${values.multiple ? '<InputField label="Name" placeholder="Your name" />' : ''}<InputField label="Email" placeholder="you@company.com"${values.error ? ' error="Enter a valid email address."' : ''} /></InputGroup>`
    case 'input-message': {
      const prompts = values.suggestedPrompts
        ? ` suggestions={${JSON.stringify(inputMessagePrompts)}}`
        : ''
      const hint = values.suggestion
        ? ' placeholderSuggestion="Why is every other input box so stiff?"'
        : ''
      return `${opening} history={['Make my input box feel less stiff']} minRows={2} onSend={sendMessage}${hint}${prompts} />`
    }
    case 'sidebar':
      return `const sections = [{ label: "Workspace", collapsible: ${Boolean(values.sectionsCollapsible)},${Number(values.sectionActions) ? ' actions: sectionActions,' : ''}
  items: [{ label: "${values.rowKind === 'menu' ? 'Projects' : 'Recent thread'}", href: "#work",${values.rowBadges ? ' badge: "3",' : ''}${Number(values.rowActions) ? ` actions: rowActions, actionCount: ${values.rowActions},` : ''}
    ${values.rowKind === 'menu' && values.nestedRows ? `children: [{ label: "Overview", href: "#overview",${values.childIcons ? ' icon: <Icon name="folder" />,' : ''}${values.childBadges ? ' badge: "2",' : ''}${Number(values.childActions) ? ` actions: childActions, actionCount: ${values.childActions},` : ''} }]` : ''} }]
}]
${opening} sections={sections}
  header={<div style={{ display: "flex", flexDirection: "${values.headerStack === 'horizontal' ? 'row' : 'column'}" }}>${values.headerPrimary === 'dropdown' ? '<WorkspaceMenu />' : values.headerPrimary === 'logo' ? '<span>Aurora AI</span>' : ''}${Number(values.headerActions) ? '{headerActions}' : ''}</div>}
  footer={<div style={{ display: "flex", flexDirection: "${values.footerStack === 'horizontal' ? 'row' : 'column'}" }}>${Number(values.footerActions) ? '{footerActions}' : ''}${values.footerPrimary === 'dropdown' ? '<UserMenu />' : ''}</div>}${
    values.callout !== 'none'
      ? `
  callout={<SidebarCalloutStack variant="${values.callout}" items={${values.stackedCallouts ? 'announcements' : 'announcements.slice(0, 1)'}} />}`
      : ''
  }>
  <div />
</Sidebar>`
    case 'slider':
      return `${opening}${values.size === 'compact' ? '' : ' label="Volume"'} defaultValue={25} />`
    case 'table':
      return `<Table><TableBody><TableRow selected={${values.selected}} hover={${values.hover}}><TableCell>Alice</TableCell><TableCell>Engineer</TableCell></TableRow></TableBody></Table>`
    case 'tabs':
      return `<ProjectTabs variant="${values.variant}" size="${values.size}" activeLabel={${values.activeLabel}} />`
    case 'textarea':
      return `${opening} aria-label="Message"${values.invalid ? ' aria-invalid="true"' : ''} placeholder="Type your message here." />`
    case 'thinking-steps':
      return `<ThinkingSteps label="Thinking" variant="timeline" defaultOpen={${values.defaultOpen}} steps={[
  { value: 'search', title: 'Searched the web', icon: <Icon name="search" />, status: 'complete' },
  { value: 'sources', title: 'Read 3 sources', icon: <Icon name="globe" />, status: 'complete', content: (
    <ThinkingStepDetails summary="Explored 6 files" details={files} />
  ) },
  { value: 'done', title: 'Done', icon: <Icon name="check" />, status: ${JSON.stringify(values.status)} },
]} />`
    case 'tooltip':
      return `${opening} content="Save your changes" renderTrigger={(props) => <Button {...props}>Hover me</Button>} />`
    case 'file-tree':
      return `<FileTree paths={paths} gitStatus={gitStatus}${values.flattenEmptyDirectories === false ? ' flattenEmptyDirectories={false}' : ''}${values.search ? ' search' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'diagram':
      return `<Diagram title="Zero-flash SSR pipeline" code={mermaidSource}${values.copyable === false ? ' copyable={false}' : ' copyable'}${values.showSourceToggle === false ? '' : ' showSourceToggle'}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'log-viewer':
      return `<LogViewer title="verify · chromium" status="failed" groups={groups}${values.showHistogram === false ? ' showHistogram={false}' : ''}${values.wrap ? ' wrap' : ''}${values.searchable === false ? ' searchable={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'waterfall':
      return `<Waterfall label="Release timing waterfall" spans={spans}${values.highlightCriticalPath === false ? ' highlightCriticalPath={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'pipeline-graph':
      return `<PipelineGraph label="Release workflow graph" jobs={jobs}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'status-strip':
      return `<StatusStrip label="Recent release runs" items={runs}${values.scaleHeight === false ? ' scaleHeight={false}' : ''}${values.showReadout ? ' showReadout' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'filter-bar':
      return `<FilterBar label="Filter discussions" defaultValue="status:open label:ssr" suggestions={suggestions}${values.showPresets === false ? '' : ' presets={presets}'}${values.clearable === false ? ' clearable={false}' : ''}${values.disabled ? ' disabled' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'reaction-bar':
      return `<ReactionBar label="Comment reactions" reactions={reactions}${values.allowAdd === false ? ' allowAdd={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} onToggle={toggleReaction} />`
    case 'markdown-editor':
      return `<MarkdownEditor label="Discussion reply" defaultMode="${values.defaultMode}"${values.allowSplit === false ? ' allowSplit={false}' : ''}${values.toolbar === false ? ' toolbar={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} onSubmit={postReply} />`
    case 'sparkline':
      return `<Sparkline label="Runner CPU" values={values} tone="${values.tone}"${values.fill === false ? ' fill={false}' : ''}${values.interactive ? ' interactive' : ''} />`
    case 'metric-card':
      return `<MetricCard label="p95 Build Time" value="3m 42s" delta="−18% vs 7d" deltaTone="positive"${values.showSparkline === false ? '' : " sparkline={{ values, tone: 'success' }}"}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'line-chart':
      return `<LineChart label="Edge Worker latency" labels={labels} series={series}${values.showGrid === false ? ' showGrid={false}' : ''}${values.showLegend === false ? ' showLegend={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'object-inspector':
      return `<ObjectInspector name="webhook" data={payload} expandLevel={${values.expandLevel}}${values.sortKeys ? ' sortKeys' : ''}${values.copyable === false ? ' copyable={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'code-browser':
      return `<CodeBrowser filename="packages/reflow/src/virtual-list.tsx" refName="main" code={source} blame={blame}${values.defaultShowBlame === false ? '' : ' defaultShowBlame'}${values.wrap ? ' wrap' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'merge-readiness':
      return `<MergeReadiness status="${values.status}" gates={gates}${values.defaultExpanded ? ' defaultExpanded' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'stack-graph':
      return `<StackGraph nodes={stack} currentId={currentId} onSelect={selectPr}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'test-report':
      return `<TestReport cases={cases}${values.defaultFilter && values.defaultFilter !== 'all' ? ` defaultFilter="${values.defaultFilter}"` : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'merge-queue':
      return `<MergeQueue entries={entries}${values.removable ? ' onRemove={dequeue}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'activity-heatmap':
      return `<ActivityHeatmap cells={cells} unit="commits" tone="${values.tone}"${values.showLegend === false ? ' showLegend={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'kanban-board':
      return `<KanbanBoard columns={${values.wipLimit === false ? 'columns' : 'columnsWithWipLimit'}} items={items} onMoveItem={moveItem}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'grouped-list':
      return `<GroupedList groups={groups} items={items}${values.showEmptyGroups === false ? ' showEmptyGroups={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'roadmap-timeline':
      return `<RoadmapTimeline items={initiatives} rangeStart="2026-01-01" rangeEnd="2026-06-30"${values.showToday === false ? '' : ' today="2026-03-18"'}${values.defaultZoom && values.defaultZoom !== 'months' ? ` defaultZoom="${values.defaultZoom}"` : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'cycle-overview':
      return `<CycleOverview title="Cycle 14" statuses={statuses}${values.showAssignees === false ? '' : ' assignees={assignees}'}${values.showBurndown === false ? '' : ' burndown={burndown}'}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'triage-queue':
      return `<TriageQueue items={incoming} onDecision={handleDecision}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'quick-create-bar':
      return `<QuickCreateBar assignees={assignees}${values.defaultPriority && values.defaultPriority !== 'medium' ? ` defaultPriority="${values.defaultPriority}"` : ''}${values.showCreateMore === false ? ' showCreateMore={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} onCreate={createIssue} />`
    case 'alert-dialog':
      return `<AlertDialog trigger="Revoke API key" title="Revoke production key?" description="Requests signed with this key will fail immediately." confirmLabel="Revoke key" confirmVariant="${values.confirmVariant}"${values.size === 'compact' ? ' triggerSize="compact"' : ''} onConfirm={revokeKey} />`
    case 'split-button':
      return `<SplitButton label="Squash and merge" variant="${values.variant}"${values.loading ? ' loading' : ''}${values.disabled ? ' disabled' : ''}${values.size === 'compact' ? ' size="compact"' : ''} items={mergeOptions} onClick={merge} onSelect={selectMode} />`
    case 'number-field':
      return `<NumberField label="Retry attempts" defaultValue={3} min={0} max={50} step={${values.step}}${values.scrub === false ? '' : ' scrub'}${values.disabled ? ' disabled' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'pagination':
      return `<Pagination page={page} pageCount={${values.pageCount}}${values.size === 'compact' ? ' size="compact"' : ''} onPageChange={setPage} />`
    case 'empty-state':
      return `<EmptyState title="No matching audit events" description="Clear your active filter facets."${values.surface === 'outlined' ? ' surface="outlined"' : ''}${values.showActions ? ' actions={<Button variant="secondary">Clear filters</Button>}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'inline-edit':
      return `<InlineEdit label="Document title" value={title}${values.disabled ? ' disabled' : ''}${values.size === 'compact' ? ' size="compact"' : ''} onCommit={setTitle} />`
    case 'copy-chip':
      return `<CopyChip value="3f1976a9b2c4e801d7"${values.shortDisplay ? ' display="3f1976a"' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'kbd':
      return `<Kbd keys="mod+shift+p" variant="${values.variant}" platform="${values.platform}"${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'skeleton':
      return `<Skeleton shape="${values.shape}" width="${values.shape === 'circle' ? '44px' : '100%'}" height="${values.shape === 'circle' ? '44px' : '14px'}"${values.animate === false ? ' animate={false}' : ''} />`
    case 'spinner':
      return `<Spinner label="Loading builds" size="${values.diameter}" />`
    case 'progress-ring':
      return `<ProgressRing label="Cycle completion" value={${values.value}} tone="${values.tone}" size={${values.diameter}} />`
    case 'proportion-bar':
      return `<ProportionBar label="Test outcomes" segments={segments} height={${values.height}}${values.showLegend === false ? ' showLegend={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'priority-indicator':
      return `<PriorityIndicator priority="${values.priority}"${values.showLabel ? ' showLabel' : ''} />`
    case 'status-icon':
      return `<StatusIcon status="${values.status}"${values.showLabel ? ' showLabel' : ''} />`
    case 'estimate-pill':
      return `<EstimatePill value={3} unit="${values.unit}"${values.readonly ? ' readonly' : ''}${values.size === 'compact' ? ' size="compact"' : ''} onChange={setEstimate} />`
    case 'diff-stat':
      return `<DiffStat added={142} removed={38} blocks={${values.blocks}}${values.showCounts === false ? ' showCounts={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'size-delta':
      return `<SizeDelta items={artifacts}${values.showTotal === false ? ' showTotal={false}' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'saved-view-tabs':
      return `<SavedViewTabs views={views} activeId={activeId}${values.size === 'compact' ? ' size="compact"' : ''} onSelect={setActiveId} onCreate={createView} />`
    case 'metadata-list':
      return `<MetadataList label="Pull request metadata" orientation="${values.orientation}" items={items}${values.size === 'compact' ? ' size="compact"' : ''} />`
    case 'file-input':
      return `<FileInput label="Attach diagnostic logs"${values.multiple ? ' multiple' : ''}${values.disabled ? ' disabled' : ''}${values.size === 'compact' ? ' size="compact"' : ''} />`
    default:
      return `${opening} />`
  }
}

function dropdownPlaygroundCode(values: PlaygroundValues): string {
  const inline = values.mode === 'Inline panel'
  const selection =
    values.selection === 'Multiple'
      ? 'multiple'
      : values.selection === 'Actions'
        ? 'none'
        : 'single'
  const search = !inline && Boolean(values.search)
  const groups = !search && Boolean(values.groups)
  const creatable = search && Boolean(values.creatable)
  const submenu = !inline && Boolean(values.submenu)
  const type = selection === 'single' ? "'radio'" : "'checkbox'"
  const rows = [
    ['Email', 'mail', 'Account'],
    ['Notifications', 'bell', 'Account'],
    ['Privacy', 'shield', 'Account'],
    ['General', 'settings', 'Appearance'],
    ['Theme', 'palette', 'Appearance'],
    ['Display', 'monitor', 'Appearance'],
  ]
  const lines = rows.map(([label, glyph, group], index) => {
    const fields = [`value: '${label}'`, `label: '${label}'`]
    if (values.icons) fields.push(`icon: <Icon name="${glyph}" />`)
    if (groups) fields.push(`group: '${group}'`)
    if (groups && index === 3) fields.push('separatorBefore: true')
    if (values.disabledRow && label === 'Privacy') fields.push('disabled: true')
    if (submenu && label === 'Theme')
      fields.push(
        `children: ['Light', 'Dark', 'System'].map((name) => ({ value: name, label: name, type: 'radio', checked: theme === name }))`,
      )
    else if (selection !== 'none')
      fields.push(
        `type: ${type}`,
        selection === 'single'
          ? `checked: selected === '${label}'`
          : `checked: picked.includes('${label}')`,
      )
    return `  { ${fields.join(', ')} },`
  })
  const label =
    selection === 'single'
      ? '{selected}'
      : selection === 'multiple'
        ? '{`Filters · ${picked.length}`}'
        : 'Open menu'
  const props = [
    inline ? 'inline' : '',
    `label=${label.startsWith('{') ? label : `"${label}"`}`,
    inline ? '' : 'variant="ghost"',
    search ? 'searchable' : '',
    creatable ? 'creatable onCreate={addRow}' : '',
    'items={items}',
    selection === 'none' ? '' : 'onSelect={select}',
  ]
    .filter(Boolean)
    .join('\n  ')
  return `const items = [\n${lines.join('\n')}\n]\n\n<Dropdown ${props} />`
}

function datePickerPlaygroundCode(values: PlaygroundValues): string {
  const range = values.mode === 'Range'
  const timeRange = !range && values.time === 'Start → end'
  const oneTime = !range && values.time === 'One time'
  const props = [
    ...(range ? ['mode="range"'] : []),
    ...(values.variant === 'outline' ? ['variant="outline"'] : ['variant="ghost"']),
    ...(oneTime ? ['time'] : []),
    ...(timeRange ? ['timeRange defaultTime="11:00" defaultEndTime="12:45"'] : []),
    ...(range ? [] : ['defaultValue={today}']),
    ...(range && values.presets ? ['presets={presets}'] : []),
    ...(values.clearable ? ['clearable'] : []),
    ...(values.months === '1' ? [] : ['numberOfMonths={2}']),
    ...(values.orientation !== 'auto' ? [`orientation="${values.orientation}"`] : []),
    ...(values.weekNumbers ? ['showWeekNumbers'] : []),
    ...(values.days === 'Booked + past' ? ['booked={booked}', 'min={today}'] : []),
    ...(values.size === 'compact' ? ['size="compact"'] : []),
    ...(values.disabled ? ['disabled'] : []),
  ]
  return `<DatePicker label="Choose dates" ${props.join(' ')} />`
}
