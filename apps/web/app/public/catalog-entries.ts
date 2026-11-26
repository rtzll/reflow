export const components = [
  ['accordion', 'Accordion'],
  ['alert-dialog', 'AlertDialog'],
  ['ask-user-questions', 'AskUserQuestions'],
  ['avatar', 'Avatar'],
  ['badge', 'Badge'],
  ['banner', 'Banner'],
  ['bar-chart', 'BarChart'],
  ['breadcrumb', 'Breadcrumb'],
  ['button', 'Button'],
  ['calendar', 'Calendar'],
  ['card', 'Card'],
  ['carousel', 'Carousel'],
  ['carousel-dots', 'CarouselDots'],
  ['chat-layout', 'ChatLayout'],
  ['chat-message', 'ChatMessage'],
  ['chat-outline', 'ChatOutline'],
  ['checkbox', 'Checkbox'],
  ['checkbox-group', 'CheckboxGroup'],
  ['citation', 'Citation'],
  ['code-block', 'CodeBlock'],
  ['color-picker', 'ColorPicker'],
  ['combobox', 'Combobox'],
  ['command-menu', 'CommandMenu'],
  ['comment-thread', 'CommentThread'],
  ['confirmation', 'Confirmation'],
  ['context-menu', 'ContextMenu'],
  ['data-table', 'DataTable'],
  ['date-picker', 'DatePicker'],
  ['diagram', 'Diagram'],
  ['dialog', 'Dialog'],
  ['diff-view', 'DiffView'],
  ['drawer', 'Drawer'],
  ['dropdown', 'Dropdown'],
  ['empty-state', 'EmptyState'],
  ['field', 'Field'],
  ['file-changes', 'FileChanges'],
  ['file-input', 'FileInput'],
  ['file-thumbnail', 'FileThumbnail'],
  ['file-tree', 'FileTree'],
  ['filter-bar', 'FilterBar'],
  ['hover-card', 'HoverCard'],
  ['input', 'Input'],
  ['input-copy', 'InputCopy'],
  ['input-group', 'InputGroup'],
  ['input-message', 'InputMessage'],
  ['kbd', 'Kbd'],
  ['line-chart', 'LineChart'],
  ['log-viewer', 'LogViewer'],
  ['markdown', 'Markdown'],
  ['markdown-editor', 'MarkdownEditor'],
  ['metric-card', 'MetricCard'],
  ['number-field', 'NumberField'],
  ['object-inspector', 'ObjectInspector'],
  ['pagination', 'Pagination'],
  ['pipeline-graph', 'PipelineGraph'],
  ['popover', 'Popover'],
  ['progress', 'Progress'],
  ['queued-stack', 'QueuedStack'],
  ['radio-group', 'RadioGroup'],
  ['reaction-bar', 'ReactionBar'],
  ['resizable', 'Resizable'],
  ['segmented-control', 'SegmentedControl'],
  ['select', 'Select'],
  ['sidebar', 'Sidebar'],
  ['skeleton', 'Skeleton'],
  ['slider', 'Slider'],
  ['sparkline', 'Sparkline'],
  ['spinner', 'Spinner'],
  ['status-strip', 'StatusStrip'],
  ['switch', 'Switch'],
  ['table', 'Table'],
  ['tabs', 'Tabs'],
  ['task-list', 'TaskList'],
  ['terminal', 'Terminal'],
  ['textarea', 'Textarea'],
  ['thinking-indicator', 'ThinkingIndicator'],
  ['thinking-steps', 'ThinkingSteps'],
  ['time-field', 'TimeField'],
  ['time-grid', 'TimeGrid'],
  ['timeline', 'Timeline'],
  ['toaster', 'Toaster'],
  ['tool-calls', 'ToolCalls'],
  ['toolbar', 'Toolbar'],
  ['tooltip', 'Tooltip'],
  ['tree', 'Tree'],
  ['trigger-menu', 'TriggerMenu'],
  ['waterfall', 'Waterfall'],
] as const

export type ComponentSlug = (typeof components)[number][0]
export type ComponentName = (typeof components)[number][1]

/** Specialist entry points for components outside the root `@rtzll/reflow` barrel. */
export const specialistModules: Partial<Record<ComponentName, string>> = {
  Diagram: '@rtzll/reflow/diagrams',
  DiffView: '@rtzll/reflow/diffs',
  FileTree: '@rtzll/reflow/trees',
  Markdown: '@rtzll/reflow/markdown',
  MarkdownEditor: '@rtzll/reflow/markdown',
}

const nameBySlug = new Map<string, string>(components)

export function componentName(slug: string): string {
  return nameBySlug.get(slug) ?? slug[0].toUpperCase() + slug.slice(1)
}

export function componentModule(name: string): string {
  return specialistModules[name as ComponentName] ?? '@rtzll/reflow'
}

export function groupComponentImports(names: readonly string[]): string[] {
  const byModule = new Map<string, string[]>()
  for (const name of names) {
    const mod = componentModule(name)
    const list = byModule.get(mod)
    if (list) list.push(name)
    else byModule.set(mod, [name])
  }
  const core = byModule.get('@rtzll/reflow')
  const imports: string[] = []
  if (core && core.length > 0) {
    imports.push(`import { ${core.join(', ')} } from '@rtzll/reflow'`)
  }
  for (const [mod, list] of byModule) {
    if (mod === '@rtzll/reflow' || list.length === 0) continue
    imports.push(`import { ${list.join(', ')} } from '${mod}'`)
  }
  return imports
}

export const systems = [
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
