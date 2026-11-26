export const components = [
  ['accordion', 'Accordion'],
  ['activity-heatmap', 'ActivityHeatmap'],
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
  ['code-browser', 'CodeBrowser'],
  ['color-picker', 'ColorPicker'],
  ['combobox', 'Combobox'],
  ['command-menu', 'CommandMenu'],
  ['comment-thread', 'CommentThread'],
  ['confirmation', 'Confirmation'],
  ['context-menu', 'ContextMenu'],
  ['copy-chip', 'CopyChip'],
  ['cycle-overview', 'CycleOverview'],
  ['data-table', 'DataTable'],
  ['date-picker', 'DatePicker'],
  ['diagram', 'Diagram'],
  ['dialog', 'Dialog'],
  ['diff-minimap', 'DiffMinimap'],
  ['diff-stat', 'DiffStat'],
  ['diff-view', 'DiffView'],
  ['drawer', 'Drawer'],
  ['dropdown', 'Dropdown'],
  ['empty-state', 'EmptyState'],
  ['estimate-pill', 'EstimatePill'],
  ['field', 'Field'],
  ['file-changes', 'FileChanges'],
  ['file-input', 'FileInput'],
  ['file-thumbnail', 'FileThumbnail'],
  ['file-tree', 'FileTree'],
  ['filter-bar', 'FilterBar'],
  ['floating-action-bar', 'FloatingActionBar'],
  ['grouped-list', 'GroupedList'],
  ['hover-card', 'HoverCard'],
  ['inline-edit', 'InlineEdit'],
  ['inline-property-picker', 'InlinePropertyPicker'],
  ['input', 'Input'],
  ['input-copy', 'InputCopy'],
  ['input-group', 'InputGroup'],
  ['input-message', 'InputMessage'],
  ['kanban-board', 'KanbanBoard'],
  ['kbd', 'Kbd'],
  ['label-picker', 'LabelPicker'],
  ['line-chart', 'LineChart'],
  ['log-viewer', 'LogViewer'],
  ['markdown', 'Markdown'],
  ['markdown-editor', 'MarkdownEditor'],
  ['matrix-grid', 'MatrixGrid'],
  ['merge-queue', 'MergeQueue'],
  ['merge-readiness', 'MergeReadiness'],
  ['metadata-list', 'MetadataList'],
  ['metric-card', 'MetricCard'],
  ['number-field', 'NumberField'],
  ['object-inspector', 'ObjectInspector'],
  ['pagination', 'Pagination'],
  ['pipeline-graph', 'PipelineGraph'],
  ['popover', 'Popover'],
  ['priority-indicator', 'PriorityIndicator'],
  ['progress', 'Progress'],
  ['progress-ring', 'ProgressRing'],
  ['proportion-bar', 'ProportionBar'],
  ['queued-stack', 'QueuedStack'],
  ['quick-create-bar', 'QuickCreateBar'],
  ['radio-group', 'RadioGroup'],
  ['reaction-bar', 'ReactionBar'],
  ['relation-list', 'RelationList'],
  ['relative-time', 'RelativeTime'],
  ['resizable', 'Resizable'],
  ['roadmap-timeline', 'RoadmapTimeline'],
  ['saved-view-tabs', 'SavedViewTabs'],
  ['segmented-control', 'SegmentedControl'],
  ['select', 'Select'],
  ['shortcut-sheet', 'ShortcutSheet'],
  ['sidebar', 'Sidebar'],
  ['size-delta', 'SizeDelta'],
  ['skeleton', 'Skeleton'],
  ['slider', 'Slider'],
  ['sparkline', 'Sparkline'],
  ['spinner', 'Spinner'],
  ['split-button', 'SplitButton'],
  ['stack-graph', 'StackGraph'],
  ['status-icon', 'StatusIcon'],
  ['status-strip', 'StatusStrip'],
  ['sub-issue-list', 'SubIssueList'],
  ['switch', 'Switch'],
  ['table', 'Table'],
  ['tabs', 'Tabs'],
  ['task-list', 'TaskList'],
  ['terminal', 'Terminal'],
  ['test-report', 'TestReport'],
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
  ['triage-queue', 'TriageQueue'],
  ['trigger-menu', 'TriggerMenu'],
  ['view-options-popover', 'ViewOptionsPopover'],
  ['virtual-list', 'VirtualList'],
  ['waterfall', 'Waterfall'],
] as const

export type ComponentSlug = (typeof components)[number][0]
export type ComponentName = (typeof components)[number][1]

export const componentGroups = [
  { id: 'forms-inputs', label: 'Forms & Inputs' },
  { id: 'actions-overlays', label: 'Actions & Overlays' },
  { id: 'layout-navigation', label: 'Layout & Navigation' },
  { id: 'display-feedback', label: 'Display & Feedback' },
  { id: 'data-visualization', label: 'Data & Visualization' },
  { id: 'code-ci', label: 'Code & CI' },
  { id: 'projects-planning', label: 'Projects & Planning' },
  { id: 'ai-chat', label: 'AI & Chat' },
] as const

export type ComponentGroupId = (typeof componentGroups)[number]['id']

export const componentGroupBySlug: Record<ComponentSlug, ComponentGroupId> = {
  // Forms & Inputs (20)
  checkbox: 'forms-inputs',
  'checkbox-group': 'forms-inputs',
  'color-picker': 'forms-inputs',
  combobox: 'forms-inputs',
  'date-picker': 'forms-inputs',
  field: 'forms-inputs',
  'file-input': 'forms-inputs',
  'filter-bar': 'forms-inputs',
  'inline-edit': 'forms-inputs',
  input: 'forms-inputs',
  'input-copy': 'forms-inputs',
  'input-group': 'forms-inputs',
  'number-field': 'forms-inputs',
  'radio-group': 'forms-inputs',
  'segmented-control': 'forms-inputs',
  select: 'forms-inputs',
  slider: 'forms-inputs',
  switch: 'forms-inputs',
  textarea: 'forms-inputs',
  'time-field': 'forms-inputs',

  // Actions & Overlays (15)
  'alert-dialog': 'actions-overlays',
  button: 'actions-overlays',
  'command-menu': 'actions-overlays',
  'context-menu': 'actions-overlays',
  dialog: 'actions-overlays',
  drawer: 'actions-overlays',
  dropdown: 'actions-overlays',
  'floating-action-bar': 'actions-overlays',
  'hover-card': 'actions-overlays',
  popover: 'actions-overlays',
  'shortcut-sheet': 'actions-overlays',
  'split-button': 'actions-overlays',
  toolbar: 'actions-overlays',
  tooltip: 'actions-overlays',
  'trigger-menu': 'actions-overlays',

  // Layout & Navigation (11)
  accordion: 'layout-navigation',
  breadcrumb: 'layout-navigation',
  card: 'layout-navigation',
  carousel: 'layout-navigation',
  'carousel-dots': 'layout-navigation',
  pagination: 'layout-navigation',
  resizable: 'layout-navigation',
  sidebar: 'layout-navigation',
  tabs: 'layout-navigation',
  tree: 'layout-navigation',
  'virtual-list': 'layout-navigation',

  // Display & Feedback (16)
  avatar: 'display-feedback',
  badge: 'display-feedback',
  banner: 'display-feedback',
  'copy-chip': 'display-feedback',
  'empty-state': 'display-feedback',
  'file-thumbnail': 'display-feedback',
  kbd: 'display-feedback',
  'metadata-list': 'display-feedback',
  progress: 'display-feedback',
  'progress-ring': 'display-feedback',
  'reaction-bar': 'display-feedback',
  'relative-time': 'display-feedback',
  skeleton: 'display-feedback',
  spinner: 'display-feedback',
  timeline: 'display-feedback',
  toaster: 'display-feedback',

  // Data & Visualization (11)
  'activity-heatmap': 'data-visualization',
  'bar-chart': 'data-visualization',
  calendar: 'data-visualization',
  'data-table': 'data-visualization',
  diagram: 'data-visualization',
  'line-chart': 'data-visualization',
  'metric-card': 'data-visualization',
  'proportion-bar': 'data-visualization',
  sparkline: 'data-visualization',
  table: 'data-visualization',
  'time-grid': 'data-visualization',

  // Code & CI (19)
  'code-block': 'code-ci',
  'code-browser': 'code-ci',
  'comment-thread': 'code-ci',
  'diff-minimap': 'code-ci',
  'diff-stat': 'code-ci',
  'diff-view': 'code-ci',
  'file-tree': 'code-ci',
  'log-viewer': 'code-ci',
  'matrix-grid': 'code-ci',
  'merge-queue': 'code-ci',
  'merge-readiness': 'code-ci',
  'object-inspector': 'code-ci',
  'pipeline-graph': 'code-ci',
  'size-delta': 'code-ci',
  'stack-graph': 'code-ci',
  'status-strip': 'code-ci',
  terminal: 'code-ci',
  'test-report': 'code-ci',
  waterfall: 'code-ci',

  // Projects & Planning (15)
  'cycle-overview': 'projects-planning',
  'estimate-pill': 'projects-planning',
  'grouped-list': 'projects-planning',
  'inline-property-picker': 'projects-planning',
  'kanban-board': 'projects-planning',
  'label-picker': 'projects-planning',
  'priority-indicator': 'projects-planning',
  'quick-create-bar': 'projects-planning',
  'relation-list': 'projects-planning',
  'roadmap-timeline': 'projects-planning',
  'saved-view-tabs': 'projects-planning',
  'status-icon': 'projects-planning',
  'sub-issue-list': 'projects-planning',
  'triage-queue': 'projects-planning',
  'view-options-popover': 'projects-planning',

  // AI & Chat (15)
  'ask-user-questions': 'ai-chat',
  'chat-layout': 'ai-chat',
  'chat-message': 'ai-chat',
  'chat-outline': 'ai-chat',
  citation: 'ai-chat',
  confirmation: 'ai-chat',
  'file-changes': 'ai-chat',
  'input-message': 'ai-chat',
  markdown: 'ai-chat',
  'markdown-editor': 'ai-chat',
  'queued-stack': 'ai-chat',
  'task-list': 'ai-chat',
  'thinking-indicator': 'ai-chat',
  'thinking-steps': 'ai-chat',
  'tool-calls': 'ai-chat',
}

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
