import { bannerFragment } from './banner-example.tsx'
import {
  checkboxFruit,
  radioOptions,
  componentOptions,
  inputMessagePrompts,
} from './component-example-data.ts'
import { carouselExampleCode } from './carousel-example.tsx'
import { questionCode, questionPlayground } from './question-example-data.ts'
import { requestFormCode } from './request-form-example.tsx'
import { cardPlaygroundCode } from './card-example-code.ts'
import { accordionItems } from './component-example-data.ts'
import { questionSettings, type PlaygroundValues } from './doc-playground.tsx'

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
    if (slug === 'tabs')
      setup.push(
        `const items = ['Home', 'Inbox', 'Settings'].map((label) => ({ value: label.toLowerCase(), label, panel: <p>{label}</p> }))`,
      )
    else if (slug === 'accordion')
      setup.push(`const items = ${JSON.stringify(accordionItems, null, 2)}`)
    else
      setup.push(
        `const items = ['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({ value: label.toLowerCase(), label }))`,
      )
  }
  if (uses('commands'))
    setup.push(
      `const commands = [\n  { value: 'new', label: 'New project', group: 'Actions' },\n  { value: 'settings', label: 'Settings', group: 'Pages' },\n  { value: 'search', label: 'Search files', group: 'Actions' },\n]`,
    )
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
  if (uses('runCommand'))
    setup.push(`const runCommand = (value: string) => { console.log('Selected', value) }`)
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
  if (/\bAskUserAnswer\b/.test(combined)) components.push('type AskUserAnswer')
  const indentation = (value: string, spaces: number) =>
    value
      .split('\n')
      .map((line) => ' '.repeat(spaces) + line)
      .join('\n')
  return `import { ${components.join(', ')} } from '@rtzll/reflow'\nimport { type Handle${combined.includes('on(') ? ', on' : ''} } from 'remix/component'\n\nexport function Example(handle: Handle) {\n${setup.length ? indentation(setup.join('\n\n'), 2) + '\n\n' : ''}  return () => (\n    <>\n${indentation(markup, 6)}\n    </>\n  )\n}`
}

export function playgroundFragment(slug: string, values: PlaygroundValues): string {
  if (slug === 'dropdown') return dropdownPlaygroundCode(values)
  if (slug === 'date-picker') return datePickerPlaygroundCode(values)
  const names: Record<string, string> = {
    'ask-user-questions': 'AskUserQuestions',
    'carousel-dots': 'CarouselDots',
    'chat-message': 'ChatMessage',
    'checkbox-group': 'CheckboxGroup',
    'color-picker': 'ColorPicker',
    'command-menu': 'CommandMenu',
    'date-picker': 'DatePicker',
    'input-copy': 'InputCopy',
    'input-group': 'InputGroup',
    'input-message': 'InputMessage',
    'radio-group': 'RadioGroup',
    'segmented-control': 'SegmentedControl',
    'thinking-indicator': 'ThinkingIndicator',
    'thinking-steps': 'ThinkingSteps',
  }
  const name = names[slug] ?? slug[0].toUpperCase() + slug.slice(1)
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
    case 'carousel-dots':
      return carouselExampleCode(Number(values.count), Boolean(values.autoplay))
    case 'chat-message':
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
      return `<CommandMenu items={commands}${values.modal ? ' trigger="Open command menu"' : ''}${values.filters ? " filters={['Actions', 'Go to', 'Help']}" : ''} suggestions={['calendar', 'new-file', 'settings']} />`
    case 'dialog':
      return `${opening} modal={${values.modal}} title="Create teamspace" trigger="Open dialog" />`
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
      return `${opening} value="pnpm install remix @remix-run/ui" />`
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
      return `${opening} label="Navigation" items={items} />`
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
