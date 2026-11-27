import { BuildTimings } from './build-timings.tsx'
import { StudioBookings } from './studio-bookings.tsx'
import { ProjectTabs } from './project-tabs.tsx'
import { TeamDirectory } from './team-table-example.tsx'
import { TeamspacesExample } from './teamspaces-example.tsx'
import { ProjectTreeExample } from './project-tree-example.tsx'
import { SidebarPlaygroundExample } from './sidebar-demos.tsx'
import { CarouselExample } from './carousel-example.tsx'
import { questionPlayground } from './question-example-data.ts'
import { RequestFormExample } from './request-form-example.tsx'
import { DropdownPlayground } from './dropdown-example.tsx'
import { BreadcrumbDemo } from './breadcrumb-example.tsx'
import { SegmentedControlDemo } from './segmented-control-example.tsx'
import { PopoverDemo } from './popover-example.tsx'
import { ToasterDemo, toasterPositions } from './toaster-example.tsx'
import { DrawerDemo } from './drawer-example.tsx'
import { CodeBlockDemo, codeLanguages, type CodeSamples } from './code-block-example.tsx'
import { CitationDemo } from './citation-example.tsx'
import { ConfirmationDemo } from './confirmation-example.tsx'
import { AvatarDemo } from './avatar-example.tsx'
import { ChatLayoutDemo } from './chat-layout-example.tsx'
import { CarouselDemo } from './carousel-demo.tsx'
import { HoverCardDemo } from './hover-card-example.tsx'
import { ProjectCommands } from './project-commands.tsx'
import { setShowcaseTheme } from './site-settings.ts'
import { SoundCombobox } from './sound-combobox.tsx'
import { playCopySuccess } from './showcase-sound.ts'
import {
  datePickerBooked,
  datePickerPresets,
  datePickerToday,
  markdownNote,
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
  ChatLayout,
  Accordion,
  AlertDialog,
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
  CopyChip,
  DatePicker,
  DiffStat,
  EmptyState,
  FileInput,
  Icon,
  Input,
  InputCopy,
  InputField,
  InputGroup,
  Kbd,
  MetadataList,
  NumberField,
  PriorityIndicator,
  Progress,
  ProgressRing,
  ProportionBar,
  InputMessage,
  RadioGroup,
  Select,
  SizeDelta,
  Skeleton,
  Slider,
  Spinner,
  SplitButton,
  StatusIcon,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  ThinkingIndicator,
  ThinkingSteps,
  ThinkingStepDetails,
  Tooltip,
  type BadgeColor,
  type ButtonVariant,
  type ColorFormat,
  type IssuePriority,
  type IssueStatusKind,
  type ProgressRingTone,
  type SparklineTone,
} from '@rtzll/reflow'
import { Markdown, type MarkdownEditorMode } from '@rtzll/reflow/markdown'
import type { FileTreeSsrPayload } from '@rtzll/reflow/trees'
import { BannerExample, bannerDefaults, bannerStatuses } from './banner-example.tsx'
import { DiagramExample } from './diagram-example.tsx'
import { FileTreeExample } from './file-tree-example.tsx'
import { LogViewerExample } from './log-viewer-example.tsx'
import { PipelineGraphExample } from './pipeline-graph-example.tsx'
import { StatusStripExample } from './status-strip-example.tsx'
import { WaterfallExample } from './waterfall-example.tsx'
import { FilterBarExample } from './filter-bar-example.tsx'
import { ReactionBarExample } from './reaction-bar-example.tsx'
import { MarkdownEditorExample } from './markdown-editor-example.tsx'
import { SparklineExample } from './sparkline-example.tsx'
import { MetricCardExample } from './metric-card-example.tsx'
import { LineChartExample } from './line-chart-example.tsx'
import { ObjectInspectorExample } from './object-inspector-example.tsx'
import {
  ActivityHeatmapExample,
  CodeBrowserExample,
  MergeQueueExample,
  MergeReadinessExample,
  StackGraphExample,
  TestReportExample,
} from './wave16-examples.tsx'
import {
  CycleOverviewExample,
  GroupedListExample,
  KanbanBoardExample,
  QuickCreateBarExample,
  RoadmapTimelineExample,
  TriageQueueExample,
} from './wave17-examples.tsx'
import {
  EstimatePillPlayground,
  InlineEditPlayground,
  PaginationPlayground,
  SavedViewTabsPlayground,
} from './core-playground-examples.tsx'

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
  markdown: [size],
  'data-table': [choice('pageSize', 'Rows per page', ['4', '8', '12'])],
  'context-menu': [size],
  progress: [
    toggle('indeterminate', 'Indeterminate'),
    toggle('showValue', 'Show percentage', true),
    size,
  ],
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
  'bar-chart': [toggle('showAxes', 'Show axis labels', true)],
  'time-grid': [choice('stepMinutes', 'Booking interval (minutes)', ['30', '15', '10'])],
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
    choice('role', 'Role', ['user', 'assistant', 'system']),
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
    toggle('masked', 'Masked secret'),
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
  'hover-card': [
    choice('placement', 'Placement', ['bottom', 'top', 'right', 'left']),
    choice('openDelay', 'Open delay', ['500', '200', '0']),
    size,
  ],
  popover: [
    choice('placement', 'Placement', ['bottom', 'top', 'right', 'left']),
    toggle('title', 'Title'),
    size,
  ],
  carousel: [
    choice('perView', 'In view', ['1', '2', '3']),
    choice('align', 'Align', ['start', 'center']),
    toggle('autoplay', 'Autoplay'),
    toggle('dots', 'Dots', true),
    toggle('controls', 'Buttons', true),
    size,
  ],
  'chat-layout': [toggle('header', 'Header'), toggle('empty', 'Start empty'), size],
  avatar: [
    choice('size', 'Size', ['32', '20', '24', '40', '56']),
    choice('shape', 'Shape', ['circle', 'square']),
    choice('status', 'Status', ['none', 'online', 'away', 'busy', 'offline']),
    toggle('image', 'Image'),
  ],
  confirmation: [
    choice('state', 'State', ['requested', 'approved', 'denied']),
    choice('status', 'Status', ['default', 'warning']),
    size,
  ],
  citation: [
    choice('style', 'Variant', ['number', 'site']),
    choice('count', 'Sources', ['1', '2', '3']),
    choice('placement', 'Placement', ['top', 'bottom']),
    size,
  ],
  'code-block': [
    choice('language', 'Language', [...codeLanguages]),
    toggle('filename', 'Filename', true),
    toggle('lineNumbers', 'Line numbers'),
    toggle('wrap', 'Wrap'),
    toggle('copyable', 'Copy button', true),
    size,
  ],
  drawer: [
    choice('side', 'Side', ['bottom', 'right', 'top', 'left']),
    toggle('handle', 'Handle', true),
    toggle('closeButton', 'Close button'),
    toggle('dismissible', 'Dismissible', true),
    size,
  ],
  toaster: [
    choice('position', 'Position', [...toasterPositions]),
    choice('status', 'Status', ['default', 'success', 'info', 'warning', 'error', 'loading']),
    toggle('description', 'Description', true),
    toggle('action', 'Action'),
    toggle('closeButton', 'Close button'),
    toggle('expand', 'Expand'),
    size,
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
  'file-tree': [
    choice('size', 'Size', ['compact', 'default']),
    toggle('flattenEmptyDirectories', 'Compact folders', true),
    toggle('search', 'Search bar'),
  ],
  diagram: [
    choice('size', 'Size', ['compact', 'default']),
    toggle('copyable', 'Copy button', true),
    toggle('showSourceToggle', 'Source toggle', true),
  ],
  'log-viewer': [
    choice('size', 'Size', ['compact', 'default']),
    toggle('showHistogram', 'Histogram', true),
    toggle('wrap', 'Wrap lines'),
    toggle('searchable', 'Search bar', true),
  ],
  waterfall: [
    choice('size', 'Size', ['compact', 'default']),
    toggle('highlightCriticalPath', 'Critical path', true),
  ],
  'pipeline-graph': [choice('size', 'Size', ['compact', 'default'])],
  'status-strip': [
    size,
    toggle('scaleHeight', 'Scale height', true),
    toggle('showReadout', 'Readout', true),
  ],
  'filter-bar': [
    size,
    toggle('showPresets', 'Presets', true),
    toggle('clearable', 'Clearable', true),
    disabled,
  ],
  'reaction-bar': [size, toggle('allowAdd', 'Add picker', true)],
  'markdown-editor': [
    size,
    choice('defaultMode', 'Mode', ['write', 'preview', 'split']),
    toggle('allowSplit', 'Split mode', true),
    toggle('toolbar', 'Toolbar', true),
  ],
  sparkline: [
    choice('tone', 'Tone', ['accent', 'info', 'success', 'warning', 'danger', 'neutral']),
    toggle('fill', 'Area fill', true),
    toggle('interactive', 'Interactive', true),
  ],
  'metric-card': [size, toggle('showSparkline', 'Sparkline', true)],
  'line-chart': [size, toggle('showGrid', 'Gridlines', true), toggle('showLegend', 'Legend', true)],
  'object-inspector': [
    size,
    choice('expandLevel', 'Expand depth', ['1', '0', '2', '3']),
    toggle('sortKeys', 'Sort keys'),
    toggle('copyable', 'Copy button', true),
  ],
  'code-browser': [
    size,
    toggle('defaultShowBlame', 'Blame gutter', true),
    toggle('wrap', 'Wrap lines'),
  ],
  'merge-readiness': [
    size,
    choice('status', 'Status', ['ready', 'blocked', 'pending', 'draft', 'merged']),
    toggle('defaultExpanded', 'Expand gates'),
  ],
  'stack-graph': [size],
  'test-report': [
    size,
    choice('defaultFilter', 'Filter', ['all', 'failed', 'flaky', 'passed', 'skipped']),
  ],
  'merge-queue': [size, toggle('removable', 'Dequeue button')],
  'activity-heatmap': [
    size,
    choice('tone', 'Tone', ['success', 'accent', 'warning', 'danger']),
    toggle('showLegend', 'Legend', true),
  ],
  'kanban-board': [size, toggle('wipLimit', 'WIP limit', true)],
  'grouped-list': [size, toggle('showEmptyGroups', 'Empty groups', true)],
  'roadmap-timeline': [
    size,
    choice('defaultZoom', 'Zoom', ['months', 'quarters', 'weeks']),
    toggle('showToday', 'Today line', true),
  ],
  'cycle-overview': [
    size,
    toggle('showAssignees', 'Workload', true),
    toggle('showBurndown', 'Burndown', true),
  ],
  'triage-queue': [size],
  'quick-create-bar': [
    size,
    choice('defaultPriority', 'Priority', ['medium', 'urgent', 'high', 'low', 'none']),
    toggle('showCreateMore', 'Create more', true),
  ],
  'alert-dialog': [
    choice('confirmVariant', 'Confirm style', ['destructive', 'primary', 'secondary']),
    size,
  ],
  'split-button': [
    choice('variant', 'Variant', ['primary', 'secondary', 'destructive']),
    toggle('loading', 'Loading'),
    disabled,
    size,
  ],
  'number-field': [
    choice('step', 'Step', ['1', '5', '10']),
    toggle('scrub', 'Label scrub', true),
    disabled,
    size,
  ],
  pagination: [choice('pageCount', 'Pages', ['7', '12', '3']), size],
  'empty-state': [
    choice('surface', 'Surface', ['plain', 'outlined']),
    toggle('showActions', 'Action button', true),
    size,
  ],
  'inline-edit': [disabled, size],
  'copy-chip': [toggle('shortDisplay', 'Short SHA display', true), size],
  kbd: [
    choice('variant', 'Variant', ['subtle', 'outline']),
    choice('platform', 'Platform', ['mac', 'other']),
    size,
  ],
  skeleton: [choice('shape', 'Shape', ['rounded', 'circle']), toggle('animate', 'Shimmer', true)],
  spinner: [choice('diameter', 'Diameter', ['16px', '24px', '32px'])],
  'progress-ring': [
    choice('tone', 'Tone', ['accent', 'success', 'warning', 'danger', 'info']),
    choice('value', 'Value', ['72', '35', '100']),
    choice('diameter', 'Diameter', ['44', '28', '60']),
  ],
  'proportion-bar': [
    toggle('showLegend', 'Legend', true),
    choice('height', 'Thickness', ['8', '12', '6']),
    size,
  ],
  'priority-indicator': [
    choice('priority', 'Priority', ['urgent', 'high', 'medium', 'low', 'none']),
    toggle('showLabel', 'Label', true),
  ],
  'status-icon': [
    choice('status', 'Status', [
      'in-progress',
      'backlog',
      'todo',
      'in-review',
      'done',
      'cancelled',
    ]),
    toggle('showLabel', 'Label', true),
  ],
  'estimate-pill': [choice('unit', 'Unit', ['pts', 'h']), toggle('readonly', 'Read-only'), size],
  'diff-stat': [choice('blocks', 'Blocks', ['5', '8']), toggle('showCounts', 'Counts', true), size],
  'size-delta': [toggle('showTotal', 'Total row', true), size],
  'saved-view-tabs': [toggle('dirty', 'Unsaved state'), size],
  'metadata-list': [choice('orientation', 'Layout', ['stacked', 'inline']), size],
  'file-input': [toggle('multiple', 'Multiple files', true), disabled, size],
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
  handle: Handle<{
    slug: string
    values: PlaygroundValues
    avatar: string
    samples?: CodeSamples
    fileTree?: FileTreeSsrPayload
    diagrams?: Record<string, string>
  }>,
) {
  let selection = cardItems[0].title as string
  let externalColorFormat: ColorFormat | undefined
  let previewColorFormat: ColorFormat = 'hex'
  const composerMessages = [
    { text: 'Make my input box feel less stiff', attachments: [] as { name: string }[] },
  ]
  return () => {
    const { slug, values: v } = handle.props
    const options = ['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({
      value: label.toLowerCase(),
      label,
    }))
    const density = v.size === 'compact' ? 'compact' : 'default'
    const disabled = Boolean(v.disabled)
    switch (slug) {
      case 'markdown':
        return <Markdown source={markdownNote} size={density} />
      case 'data-table':
        return <TeamDirectory pageSize={Number(v.pageSize)} />
      case 'context-menu':
        return <ProjectTreeExample size={density} />
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
      case 'bar-chart':
        return <BuildTimings showAxes={Boolean(v.showAxes)} />
      case 'time-grid':
        return <StudioBookings stepMinutes={Number(v.stepMinutes)} />
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
            role={v.role === 'assistant' || v.role === 'system' ? v.role : 'user'}
            size={density}
            animate={Boolean(v.animate)}
            icon={v.role === 'system' ? <Icon name="cpu" /> : undefined}
            attachments={
              v.attachments ? [{ name: 'design-notes.md', detail: 'Markdown · 2 KB' }] : undefined
            }
          >
            {v.role === 'system'
              ? 'Switched to a faster model'
              : 'Can we make the interaction feel more fluid?'}
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
          <ProjectCommands
            modal={Boolean(v.modal)}
            filters={Boolean(v.filters)}
            descriptions={Boolean(v.descriptions)}
            setTheme={setShowcaseTheme}
          />
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
          <TeamspacesExample
            size={v.size === 'xl' ? 'xl' : v.size === 'lg' ? 'lg' : 'sm'}
            position={v.position === 'top' ? 'top' : 'center'}
            modal={Boolean(v.modal)}
            showCloseButton={Boolean(v.showCloseButton)}
            dismissOnBackdrop={Boolean(v.dismissOnBackdrop)}
          />
        )
      case 'hover-card':
        return (
          <HoverCardDemo
            variant="playground"
            size={density}
            placement={String(v.placement) as 'bottom' | 'top' | 'right' | 'left'}
            openDelay={Number(v.openDelay)}
          />
        )
      case 'carousel':
        return (
          <CarouselDemo
            variant="playground"
            size={density}
            perView={Number(v.perView)}
            align={v.align === 'center' ? 'center' : 'start'}
            autoplay={Boolean(v.autoplay)}
            dots={Boolean(v.dots)}
            controls={Boolean(v.controls)}
          />
        )
      case 'chat-layout':
        return (
          <ChatLayoutDemo
            variant="playground"
            size={density}
            header={Boolean(v.header)}
            empty={Boolean(v.empty)}
          />
        )
      case 'avatar':
        return (
          <AvatarDemo
            variant="playground"
            image={handle.props.avatar}
            size={Number(v.size)}
            shape={v.shape === 'square' ? 'square' : 'circle'}
            status={String(v.status) as 'none'}
            withImage={Boolean(v.image)}
          />
        )
      case 'confirmation':
        return (
          <ConfirmationDemo
            variant="playground"
            size={density}
            status={v.status === 'warning' ? 'warning' : 'default'}
            state={v.state === 'approved' || v.state === 'denied' ? v.state : 'requested'}
          />
        )
      case 'citation':
        return (
          <CitationDemo
            variant="playground"
            size={density}
            style={v.style === 'site' ? 'site' : 'number'}
            count={Number(v.count)}
            placement={v.placement === 'bottom' ? 'bottom' : 'top'}
          />
        )
      case 'code-block':
        return (
          <CodeBlockDemo
            variant="playground"
            samples={handle.props.samples}
            size={density}
            language={String(v.language)}
            filename={Boolean(v.filename)}
            lineNumbers={Boolean(v.lineNumbers)}
            wrap={Boolean(v.wrap)}
            copyable={Boolean(v.copyable)}
          />
        )
      case 'drawer':
        return (
          <DrawerDemo
            variant="playground"
            size={density}
            side={String(v.side) as 'bottom' | 'right' | 'top' | 'left'}
            handle={Boolean(v.handle)}
            closeButton={Boolean(v.closeButton)}
            dismissible={Boolean(v.dismissible)}
          />
        )
      case 'toaster':
        return (
          <ToasterDemo
            variant="playground"
            size={density}
            position={String(v.position) as (typeof toasterPositions)[number]}
            status={String(v.status)}
            description={Boolean(v.description)}
            action={Boolean(v.action)}
            closeButton={Boolean(v.closeButton)}
            expand={Boolean(v.expand)}
          />
        )
      case 'popover':
        return (
          <PopoverDemo
            variant="playground"
            size={density}
            placement={String(v.placement) as 'bottom' | 'top' | 'right' | 'left'}
            title={Boolean(v.title)}
          />
        )
      case 'progress':
        return (
          <div style={{ width: 'min(100%, 280px)' }}>
            <Progress
              label="Uploading files"
              value={v.indeterminate ? undefined : 7}
              max={12}
              showValue={Boolean(v.showValue)}
              size={density}
            />
          </div>
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
            value={v.masked ? 'rf_live_98d4c1f7e2a0b6c39f2c' : 'pnpm install remix @remix-run/ui'}
            onCopy={playCopySuccess}
            variant={v.variant === 'button' ? 'button' : 'icon'}
            align={v.align === 'left' ? 'left' : 'right'}
            masked={Boolean(v.masked)}
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
          <ChatLayout
            class="doc-composer-preview"
            composer={
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
                  handle.update()
                }}
              />
            }
          >
            {composerMessages.map(({ text, attachments }, index) => (
              <ChatMessage key={index} role="user" attachments={attachments} animate={index > 0}>
                {text}
              </ChatMessage>
            ))}
          </ChatLayout>
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
          <ProjectTabs
            variant={v.variant === 'underline' ? 'underline' : 'pill'}
            activeLabel={Boolean(v.activeLabel)}
            size={density}
          />
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
      case 'file-tree':
        return (
          <FileTreeExample
            prerendered={handle.props.fileTree}
            size={density}
            flattenEmptyDirectories={Boolean(v.flattenEmptyDirectories)}
            search={Boolean(v.search)}
          />
        )
      case 'diagram':
        return (
          <DiagramExample
            prerendered={handle.props.diagrams}
            size={density}
            copyable={Boolean(v.copyable)}
            showSourceToggle={Boolean(v.showSourceToggle)}
          />
        )
      case 'log-viewer':
        return (
          <LogViewerExample
            size={density}
            showHistogram={Boolean(v.showHistogram)}
            wrap={Boolean(v.wrap)}
            searchable={Boolean(v.searchable)}
          />
        )
      case 'waterfall':
        return (
          <WaterfallExample
            size={density}
            highlightCriticalPath={Boolean(v.highlightCriticalPath)}
          />
        )
      case 'pipeline-graph':
        return <PipelineGraphExample size={density} />
      case 'status-strip':
        return (
          <StatusStripExample
            size={density}
            scaleHeight={Boolean(v.scaleHeight)}
            showReadout={Boolean(v.showReadout)}
          />
        )
      case 'filter-bar':
        return (
          <FilterBarExample
            size={density}
            showPresets={Boolean(v.showPresets)}
            clearable={Boolean(v.clearable)}
            disabled={disabled}
          />
        )
      case 'reaction-bar':
        return <ReactionBarExample size={density} allowAdd={Boolean(v.allowAdd)} />
      case 'markdown-editor':
        return (
          <MarkdownEditorExample
            key={String(v.defaultMode)}
            size={density}
            defaultMode={v.defaultMode as MarkdownEditorMode}
            allowSplit={Boolean(v.allowSplit)}
            toolbar={Boolean(v.toolbar)}
          />
        )
      case 'sparkline':
        return (
          <SparklineExample
            tone={v.tone as SparklineTone}
            fill={Boolean(v.fill)}
            interactive={Boolean(v.interactive)}
          />
        )
      case 'metric-card':
        return <MetricCardExample size={density} showSparkline={Boolean(v.showSparkline)} />
      case 'line-chart':
        return (
          <LineChartExample
            size={density}
            showGrid={Boolean(v.showGrid)}
            showLegend={Boolean(v.showLegend)}
          />
        )
      case 'object-inspector':
        return (
          <ObjectInspectorExample
            key={`${v.expandLevel}-${v.sortKeys}`}
            size={density}
            expandLevel={Number(v.expandLevel)}
            sortKeys={Boolean(v.sortKeys)}
            copyable={Boolean(v.copyable)}
          />
        )
      case 'code-browser':
        return (
          <CodeBrowserExample
            key={String(v.defaultShowBlame)}
            size={density}
            defaultShowBlame={Boolean(v.defaultShowBlame)}
            wrap={Boolean(v.wrap)}
          />
        )
      case 'merge-readiness':
        return (
          <MergeReadinessExample
            key={`${v.status}-${v.defaultExpanded}`}
            size={density}
            status={v.status as 'ready' | 'blocked' | 'pending' | 'draft' | 'merged'}
            defaultExpanded={Boolean(v.defaultExpanded)}
          />
        )
      case 'stack-graph':
        return <StackGraphExample size={density} />
      case 'test-report':
        return (
          <TestReportExample
            key={String(v.defaultFilter)}
            size={density}
            defaultFilter={v.defaultFilter as 'all' | 'failed' | 'flaky' | 'passed' | 'skipped'}
          />
        )
      case 'merge-queue':
        return <MergeQueueExample size={density} removable={Boolean(v.removable)} />
      case 'activity-heatmap':
        return (
          <ActivityHeatmapExample
            size={density}
            tone={v.tone as 'success' | 'accent' | 'warning' | 'danger'}
            showLegend={Boolean(v.showLegend)}
          />
        )
      case 'kanban-board':
        return <KanbanBoardExample size={density} wipLimit={Boolean(v.wipLimit)} />
      case 'grouped-list':
        return <GroupedListExample size={density} showEmptyGroups={Boolean(v.showEmptyGroups)} />
      case 'roadmap-timeline':
        return (
          <RoadmapTimelineExample
            key={String(v.defaultZoom)}
            size={density}
            defaultZoom={v.defaultZoom as 'weeks' | 'months' | 'quarters'}
            showToday={Boolean(v.showToday)}
          />
        )
      case 'cycle-overview':
        return (
          <CycleOverviewExample
            size={density}
            showAssignees={Boolean(v.showAssignees)}
            showBurndown={Boolean(v.showBurndown)}
          />
        )
      case 'triage-queue':
        return <TriageQueueExample size={density} />
      case 'quick-create-bar':
        return (
          <QuickCreateBarExample
            key={String(v.defaultPriority)}
            size={density}
            defaultPriority={v.defaultPriority as 'urgent' | 'high' | 'medium' | 'low' | 'none'}
            showCreateMore={Boolean(v.showCreateMore)}
          />
        )
      case 'alert-dialog':
        return (
          <AlertDialog
            trigger="Revoke API key"
            triggerVariant={v.confirmVariant === 'destructive' ? 'destructive' : 'secondary'}
            triggerSize={density}
            title="Revoke production key?"
            description="Requests signed with rf_live_98d4 will fail immediately. This action cannot be undone."
            confirmLabel="Revoke key"
            confirmVariant={v.confirmVariant as ButtonVariant}
            onConfirm={() => {}}
          />
        )
      case 'split-button':
        return (
          <SplitButton
            label="Squash and merge"
            variant={v.variant as 'primary' | 'secondary' | 'destructive'}
            loading={Boolean(v.loading)}
            disabled={disabled}
            size={density}
            items={[
              { value: 'squash', label: 'Squash and merge' },
              { value: 'merge', label: 'Create a merge commit' },
              { value: 'rebase', label: 'Rebase and merge' },
            ]}
            onClick={() => {}}
            onSelect={() => {}}
          />
        )
      case 'number-field':
        return (
          <NumberField
            key={String(v.step)}
            label="Retry attempts"
            defaultValue={3}
            min={0}
            max={50}
            step={Number(v.step)}
            scrub={Boolean(v.scrub)}
            disabled={disabled}
            size={density}
          />
        )
      case 'pagination':
        return <PaginationPlayground pageCount={Number(v.pageCount)} size={density} />
      case 'empty-state':
        return (
          <EmptyState
            title="No matching audit events"
            description="Clear your active filter facets or widen the time range."
            surface={v.surface === 'outlined' ? 'outlined' : 'plain'}
            size={density}
            actions={
              v.showActions ? (
                <Button size="compact" variant="secondary">
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )
      case 'inline-edit':
        return <InlineEditPlayground disabled={disabled} size={density} />
      case 'copy-chip':
        return (
          <CopyChip
            value="3f1976a9b2c4e801d7"
            display={v.shortDisplay ? '3f1976a' : undefined}
            size={density}
            onCopy={playCopySuccess}
          />
        )
      case 'kbd':
        return (
          <Kbd
            keys="mod+shift+p"
            variant={v.variant === 'outline' ? 'outline' : 'subtle'}
            platform={v.platform === 'other' ? 'other' : 'mac'}
            size={density}
          />
        )
      case 'skeleton':
        return v.shape === 'circle' ? (
          <Skeleton shape="circle" width="44px" height="44px" animate={Boolean(v.animate)} />
        ) : (
          <div style={{ display: 'grid', gap: '8px', width: '240px' }}>
            <Skeleton width="70%" height="14px" animate={Boolean(v.animate)} />
            <Skeleton width="100%" height="12px" animate={Boolean(v.animate)} />
            <Skeleton width="85%" height="12px" animate={Boolean(v.animate)} />
          </div>
        )
      case 'spinner':
        return <Spinner label="Loading builds" size={String(v.diameter)} />
      case 'progress-ring': {
        const val = Number(v.value)
        const dia = Number(v.diameter)
        return (
          <ProgressRing
            label="Cycle completion"
            value={val}
            tone={v.tone as ProgressRingTone}
            size={dia}
          >
            {dia >= 44 ? `${val}%` : undefined}
          </ProgressRing>
        )
      }
      case 'proportion-bar':
        return (
          <div style={{ width: 'min(100%, 340px)' }}>
            <ProportionBar
              label="Test outcomes"
              showLegend={Boolean(v.showLegend)}
              height={Number(v.height)}
              size={density}
              segments={[
                { id: 'pass', label: 'Passed', value: 284, tone: 'success' },
                { id: 'flaky', label: 'Flaky', value: 11, tone: 'warning' },
                { id: 'fail', label: 'Failed', value: 6, tone: 'danger' },
              ]}
            />
          </div>
        )
      case 'priority-indicator':
        return (
          <PriorityIndicator
            priority={v.priority as IssuePriority}
            showLabel={Boolean(v.showLabel)}
          />
        )
      case 'status-icon':
        return <StatusIcon status={v.status as IssueStatusKind} showLabel={Boolean(v.showLabel)} />
      case 'estimate-pill':
        return (
          <EstimatePillPlayground
            unit={String(v.unit)}
            readonly={Boolean(v.readonly)}
            size={density}
          />
        )
      case 'diff-stat':
        return (
          <DiffStat
            added={142}
            removed={38}
            blocks={Number(v.blocks)}
            showCounts={Boolean(v.showCounts)}
            size={density}
          />
        )
      case 'size-delta':
        return (
          <div style={{ width: 'min(100%, 420px)' }}>
            <SizeDelta
              showTotal={Boolean(v.showTotal)}
              size={density}
              items={[
                {
                  id: 'core',
                  name: 'dist/core.css',
                  beforeBytes: 64_200,
                  afterBytes: 51_400,
                  encoding: 'gzip',
                },
                {
                  id: 'index',
                  name: 'dist/index.js',
                  beforeBytes: 28_100,
                  afterBytes: 30_900,
                  encoding: 'gzip',
                },
              ]}
            />
          </div>
        )
      case 'saved-view-tabs':
        return <SavedViewTabsPlayground dirty={Boolean(v.dirty)} size={density} />
      case 'metadata-list':
        return (
          <div style={{ width: 'min(100%, 340px)' }}>
            <MetadataList
              label="Pull request metadata"
              orientation={v.orientation === 'inline' ? 'inline' : 'stacked'}
              size={density}
              items={[
                {
                  id: 'commit',
                  label: 'Commit',
                  value: <CopyChip value="3f1976a" size="compact" />,
                },
                {
                  id: 'status',
                  label: 'Status',
                  value: (
                    <Badge color="green" size="compact">
                      Ready
                    </Badge>
                  ),
                },
                { id: 'branch', label: 'Branch', value: <code>feat/masked-copy</code> },
              ]}
            />
          </div>
        )
      case 'file-input':
        return (
          <div style={{ width: 'min(100%, 340px)' }}>
            <FileInput
              label="Attach diagnostic logs"
              description="Upload .json, .log, or .har archives."
              multiple={Boolean(v.multiple)}
              disabled={disabled}
              size={density}
            />
          </div>
        )
    }
    return null
  }
}
