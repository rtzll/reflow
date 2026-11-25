// API descriptions reflect the public Reflow component interfaces.
export interface ApiProperty {
  name: string
  type: string
  description: string
  required: boolean
}
export interface ApiSection {
  name: string
  props: readonly ApiProperty[]
}

const menuItemApi: ApiSection = {
  name: 'DropdownItem',
  props: [
    {
      name: 'closeOnSelect',
      type: 'boolean',
      description:
        'Whether selecting closes the menu. Defaults to false for checkbox items and true for other items.',
      required: false,
    },
    {
      name: 'group',
      type: 'string',
      description: 'Label used to group related items.',
      required: false,
    },
    {
      name: 'value',
      type: 'string',
      description: 'Identifier passed to onSelect when this row is activated.',
      required: true,
    },
    {
      name: 'label',
      type: 'string',
      description: 'Accessible name or visible label for the control.',
      required: true,
    },
    {
      name: 'icon',
      type: 'RemixNode',
      description: 'Decorative content displayed before the item label.',
      required: false,
    },
    {
      name: 'shortcut',
      type: 'string',
      description:
        'Key hint displayed after the label. Set it to a shortcut your application handles.',
      required: false,
    },
    {
      name: 'disabled',
      type: 'boolean',
      description: 'Prevents interaction and conveys the disabled state.',
      required: false,
    },
    {
      name: 'separatorBefore',
      type: 'boolean',
      description: 'Draws a separator before this item.',
      required: false,
    },
    {
      name: 'type',
      type: '"checkbox" | "radio" | "switch"',
      description:
        'Renders a checkable or mutually exclusive menu item. A switch row is a checkbox drawn as a switch; like a checkbox it keeps the menu open.',
      required: false,
    },
    {
      name: 'checked',
      type: 'boolean',
      description: 'Selected state for a checkbox or radio menu row.',
      required: false,
    },
    {
      name: 'children',
      type: 'readonly DropdownItem[]',
      description: 'Items in a nested submenu.',
      required: false,
    },
    {
      name: 'badge',
      type: 'RemixNode',
      description: 'A small tag after the label, such as a Badge.',
      required: false,
    },
    {
      name: 'hint',
      type: 'string',
      description: 'Quiet text at the end of the row; on a row with a submenu, its current choice.',
      required: false,
    },
    {
      name: 'note',
      type: 'string',
      description: "A short explanation at the top of this row's submenu.",
      required: false,
    },
  ],
}

export const componentApi: Record<string, readonly ApiSection[]> = {
  pagination: [
    {
      name: 'Pagination',
      props: [
        {
          name: 'page',
          type: 'number',
          required: true,
          description: 'Current page, starting at one.',
        },
        {
          name: 'pageCount',
          type: 'number',
          required: true,
          description: 'Total pages. Navigation is hidden for zero or one page.',
        },
        {
          name: 'href',
          type: '(page: number) => string',
          required: false,
          description: 'Builds a native link for each page. Supply href or onPageChange.',
        },
        {
          name: 'onPageChange',
          type: '(page: number) => void',
          required: false,
          description:
            'Use buttons to change a locally managed page. Supply this when href is omitted.',
        },
        {
          name: 'resetScroll',
          type: "'after-transition' | 'manual'",
          required: false,
          description: 'Set to manual to keep the current scroll position during Remix navigation.',
        },
        {
          name: 'label',
          type: 'string',
          required: false,
          description: 'Navigation name. Defaults to Pagination.',
        },
        {
          name: 'size',
          type: "'default' | 'compact'",
          required: false,
          description: 'Control density.',
        },
      ],
    },
  ],
  'data-table': [
    {
      name: 'DataTable',
      props: [
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Accessible table name, also used to name the filter and pagination.',
        },
        {
          name: 'rows',
          type: 'readonly Row[]',
          required: true,
          description: 'Complete collection to filter, sort, and page through.',
        },
        {
          name: 'columns',
          type: 'readonly DataTableColumn<Row>[]',
          required: true,
          description: 'Column definitions in display order.',
        },
        {
          name: 'rowKey',
          type: '(row: Row) => string',
          required: true,
          description: 'Unique, stable record identifier used for rendering and row actions.',
        },
        {
          name: 'pageSize',
          type: 'number',
          required: false,
          description: 'Positive integer row limit. Omit to display all matching rows.',
        },
        {
          name: 'size',
          type: "'default' | 'compact'",
          required: false,
          description: 'Table and control density.',
        },
        {
          name: 'state',
          type: 'DataTableState',
          required: false,
          description: 'Current filter, sort, and one-based page in controlled mode.',
        },
        {
          name: 'defaultState',
          type: 'Partial<DataTableState>',
          required: false,
          description: 'Initial values in locally managed mode.',
        },
        {
          name: 'onStateChange',
          type: '(next: DataTableState) => void',
          required: false,
          description:
            'Reports local edits. Linked sorting and pagination navigate to href instead.',
        },
        {
          name: 'href',
          type: '(next: DataTableState) => string',
          required: false,
          description:
            'Builds native links for sorting and pagination. Read their state from the destination URL.',
        },
        {
          name: 'paginationLabel',
          type: 'string',
          required: false,
          description: 'Accessible name for page navigation.',
        },
        {
          name: 'filterInput',
          type: '{ name?: string; form?: string; value?: string }',
          required: false,
          description:
            'Connect the search input to a GET form. Supply a draft value while the server applies the filter.',
        },
        {
          name: 'filterAction',
          type: 'RemixNode',
          required: false,
          description: 'A control placed opposite the search input in the same row.',
        },
        {
          name: 'loading',
          type: 'boolean',
          required: false,
          description: 'Marks the table busy and replaces visible row contents with skeletons.',
        },
        {
          name: 'rowActions',
          type: '{ items: readonly DropdownItem[] | ((row: Row) => readonly DropdownItem[]); label: (row: Row) => string; onSelect: (action: string, row: Row, checked?: boolean) => void; shortcuts?: boolean }',
          required: false,
          description:
            'Shows the same actions in a named button menu and a context menu for each record. items can be a function of the row to tailor or disable actions. With shortcuts, an action runs from its shortcut while focus is in its row.',
        },
        {
          name: 'rowSelection',
          type: '{ label: (row: Row) => string; actions: (rows: readonly Row[], clear: () => void, selection: DataTableSelection) => RemixNode; selectAllMatching?: boolean }',
          description:
            'Adds native checkboxes for the current page. Render bulk actions for the selected rows in display order. Call clear after success to restore focus. Changing the view or entering loading clears the checks. With selectAllMatching, a full page offers every matching row; that selection lasts across pages and sorting and clears when the filter or matching rows change.',
          required: false,
        },
        {
          name: 'freezeRowHeader',
          type: 'boolean',
          required: false,
          description: 'Keeps the first row-header column visible during horizontal scrolling.',
        },
        {
          name: 'rowCount',
          type: 'number',
          description:
            'Rows the filter matches when the owner filters, sorts and pages on a server. rows is then the current page as sent; headers, the filter and pagination report state for the owner to apply.',
          required: false,
        },
        {
          name: 'id',
          type: 'string',
          required: false,
          description: 'ID of the native table, suitable for a URL fragment.',
        },
      ],
    },
    {
      name: 'RoutedDataTable',
      props: [
        {
          name: 'route',
          type: '{ path: string; search: string; prefix: string; anchor: string }',
          required: true,
          description:
            'Supply the request pathname and search string, a unique parameter prefix, and the table section ID. Accepts all DataTable props except state, defaultState, href, onStateChange, and filterInput.',
        },
        {
          name: 'class',
          type: 'string',
          required: false,
          description: 'Optional class name applied to the outer routed wrapper.',
        },
      ],
    },
    {
      name: 'DataTableColumn',
      props: [
        {
          name: 'id',
          type: 'string',
          required: true,
          description: 'Unique stable column identifier, also used in sort state.',
        },
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Column header text.',
        },
        {
          name: 'value',
          type: '(row: Row) => string | number',
          required: true,
          description: 'Value used for filtering, sorting, and default display.',
        },
        {
          name: 'cell',
          type: '(row: Row) => RemixNode',
          required: false,
          description: 'Optional formatted display. Filtering and sorting still use value.',
        },
        {
          name: 'sortable',
          type: 'boolean',
          required: false,
          description: 'Set to false for a static column header. Defaults to true.',
        },
        {
          name: 'rowHeader',
          type: 'boolean',
          required: false,
          description: 'Render each cell as a native row header.',
        },
      ],
    },
    {
      name: 'DataTableState',
      props: [
        {
          name: 'filter',
          type: 'string',
          required: true,
          description: 'Case-insensitive text matched across column values.',
        },
        {
          name: 'sort',
          type: "{ column: string; direction: 'ascending' | 'descending' } | null",
          required: true,
          description: 'Active column and direction. Null preserves input order.',
        },
        {
          name: 'page',
          type: 'number',
          required: true,
          description:
            'One-based page, clamped to the available results. Filter and sort edits reset it to one.',
        },
      ],
    },
    menuItemApi,
  ],
  'context-menu': [
    {
      name: 'ContextMenu',
      props: [
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Accessible name of the menu.',
        },
        {
          name: 'target',
          type: 'string',
          required: true,
          description:
            'CSS selector for focusable descendants. The closest match to the pointer or keyboard event receives the action. Editable controls keep their native menu.',
        },
        {
          name: 'children',
          type: 'RemixNode',
          required: true,
          description: 'Content containing the action targets.',
        },
        {
          name: 'items',
          type: 'readonly DropdownItem[] | ((target: HTMLElement) => readonly DropdownItem[])',
          required: true,
          description:
            'Use icon for a leading icon, shortcut for a trailing key hint, and children for a submenu. Supports separators, disabled actions, and checked items. Pass a function to build the items for the row that opened the menu, for example to disable an action that does not apply to it.',
        },
        {
          name: 'onSelect',
          type: '(value: string, target: HTMLElement, checked?: boolean) => void',
          required: false,
          description:
            'Receives the action value, the element that opened the menu, and the new checked state for checkbox or radio actions.',
        },
        {
          name: 'size',
          type: "'default' | 'compact'",
          required: false,
          description: 'Menu row density.',
        },
        {
          name: 'shortcuts',
          type: 'boolean',
          required: false,
          description:
            'Runs an item from its shortcut while focus is on a target row, without opening the menu. Hints such as ⌘C, ⌥⇧C or ⌫ are read as written; ⌘ is Command on a Mac and Ctrl elsewhere. Off by default.',
        },
      ],
    },
    menuItemApi,
  ],
  tree: [
    {
      name: 'Tree',
      props: [
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Accessible name of the tree.',
        },
        {
          name: 'items',
          type: 'readonly TreeItem[]',
          required: true,
          description:
            'Hierarchical data with unique values. Branches expand and leaves can be selected.',
        },
        {
          name: 'value / defaultValue',
          type: 'string | null',
          required: false,
          description:
            'Controlled or initial selected leaf. Use null to clear a controlled selection.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          required: false,
          description: 'Reports the selected leaf.',
        },
        {
          name: 'expanded / defaultExpanded',
          type: 'readonly string[]',
          required: false,
          description: 'Controlled or initial list of expanded branch values.',
        },
        {
          name: 'onExpandedChange',
          type: '(expanded: string[]) => void',
          required: false,
          description: 'Reports expanded branch values when a branch opens or closes.',
        },
        {
          name: 'size',
          type: "'default' | 'compact'",
          required: false,
          description: 'Row density.',
        },
      ],
    },
    {
      name: 'TreeItem',
      props: [
        {
          name: 'value',
          type: 'string',
          required: true,
          description:
            'Unique identifier across the tree, exposed as data-tree-value on the item’s row.',
        },
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Visible label, accessible name, and typeahead text.',
        },
        {
          name: 'children',
          type: 'readonly TreeItem[]',
          required: false,
          description: 'Nested items. An item with children is a branch.',
        },
        {
          name: 'icon',
          type: 'RemixNode',
          required: false,
          description: 'Optional decorative icon. Defaults to a folder or file.',
        },
      ],
    },
  ],
  toolbar: [
    {
      name: 'Toolbar',
      props: [
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Accessible name of the toolbar.',
        },
        {
          name: 'orientation',
          type: "'horizontal' | 'vertical'",
          required: false,
          description: 'Selects the arrow keys and layout. Defaults to horizontal.',
        },
        {
          name: 'children',
          type: 'RemixNode',
          required: true,
          description:
            'Action buttons or links. Text fields and nested keyboard widgets keep their existing navigation.',
        },
      ],
    },
  ],
  'file-thumbnail': [
    {
      name: 'FileThumbnail',
      props: [
        {
          name: 'file',
          type: 'File | RemoteFile',
          required: true,
          description:
            'A local File, read through an object URL, or a { name, type?, previewUrl? } description of one stored elsewhere.',
        },
        {
          name: 'size',
          type: 'number',
          required: false,
          description:
            'Height in pixels. Image previews are square; name cards are twice as wide. Defaults to 80.',
        },
        {
          name: 'class',
          type: 'string',
          required: false,
          description: 'Additional class on the thumbnail.',
        },
      ],
    },
  ],
  'chat-outline': [
    {
      name: 'ChatOutline',
      props: [
        {
          name: 'items',
          type: 'readonly { id: string; label: string; preview?: string }[]',
          required: true,
          description:
            "The turns to list, oldest first, each with the id of its message element. preview adds a line to the rail's hover preview. With none, nothing renders.",
        },
        {
          name: 'variant',
          type: '"menu" | "rail"',
          required: false,
          description:
            'menu lists the turns behind an icon button; rail draws a tick per turn beside the transcript, with a preview on hover or focus. Defaults to menu.',
        },
        {
          name: 'label',
          type: 'string',
          required: false,
          description: 'Names the trigger and the menu. Defaults to "Conversation outline".',
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          required: false,
          description: 'Trigger size. Defaults to compact.',
        },
        {
          name: 'align',
          type: '"start" | "end"',
          required: false,
          description: 'Which edge of the trigger the menu aligns to. Defaults to end.',
        },
      ],
    },
  ],
  'tool-calls': [
    {
      name: 'ToolCalls',
      props: [
        {
          name: 'calls',
          type: "readonly { id: string; label: string; status?: 'running' | 'done' | 'failed'; detail?: RemixNode }[]",
          required: true,
          description:
            'The work in order. A running call shows in the closed line with a spinner; detail shows under a call while the line is open.',
        },
        {
          name: 'summary',
          type: 'string',
          required: false,
          description:
            'Replaces the closed line, which otherwise counts the calls or says how long the work took.',
        },
        {
          name: 'startedAt / endedAt',
          type: 'number',
          required: false,
          description:
            'Times in milliseconds. With both the line reads "Worked for 1m 12s"; with startedAt alone a running line counts the elapsed time.',
        },
        {
          name: 'open / defaultOpen / onOpenChange',
          type: 'boolean / boolean / (open: boolean) => void',
          required: false,
          description: 'Controls the disclosure. Closed by default.',
        },
      ],
    },
  ],
  'task-list': [
    {
      name: 'TaskList',
      props: [
        {
          name: 'tasks',
          type: "readonly { id: string; label: string; status?: 'pending' | 'active' | 'done' }[]",
          required: true,
          description: 'The steps in order. Pending by default; the active step shows a spinner.',
        },
        {
          name: 'label',
          type: 'string',
          required: false,
          description: 'Names the list. Defaults to "Tasks".',
        },
        {
          name: 'progress',
          type: 'boolean',
          required: false,
          description: 'Shows a count of finished steps above the list.',
        },
      ],
    },
  ],
  'file-changes': [
    {
      name: 'FileChanges',
      props: [
        {
          name: 'files',
          type: 'readonly { path: string; added: number; removed: number; href?: string }[]',
          required: true,
          description: 'The changed files. href makes a row a link, such as to its diff.',
        },
        {
          name: 'title',
          type: 'string',
          required: false,
          description: 'Replaces the heading, which reads "Edited 2 files" by default.',
        },
        {
          name: 'actions',
          type: 'RemixNode',
          required: false,
          description: 'At the end of the header, such as Undo and View changes.',
        },
        {
          name: 'visible',
          type: 'number',
          required: false,
          description: 'Rows shown before the rest fold behind "Show N more files". Defaults to 3.',
        },
      ],
    },
  ],
  spinner: [
    {
      name: 'Spinner',
      props: [
        {
          name: 'label',
          type: 'string',
          required: false,
          description:
            'Names a standalone status. Omit for a decorative indicator beside a status message.',
        },
        {
          name: 'size',
          type: 'string',
          required: false,
          description: 'Width and height in CSS units. Defaults to the shared icon size.',
        },
        {
          name: 'class',
          type: 'string',
          required: false,
          description: 'Additional class on the SVG.',
        },
      ],
    },
  ],
  skeleton: [
    {
      name: 'Skeleton',
      props: [
        {
          name: 'width / height',
          type: 'string',
          required: false,
          description: 'CSS dimensions. Defaults to the available width and a line of text.',
        },
        {
          name: 'shape',
          type: "'rounded' | 'circle'",
          required: false,
          description: 'Uses the shared radius by default. Give circles equal dimensions.',
        },
        {
          name: 'animate',
          type: 'boolean',
          required: false,
          description: 'Enables the shimmer when motion is allowed. Defaults to true.',
        },
        {
          name: 'class',
          type: 'string',
          required: false,
          description: 'Additional class for sizing or layout.',
        },
      ],
    },
  ],
  'queued-stack': [
    {
      name: 'QueuedStack',
      props: [
        {
          name: 'messages',
          type: 'readonly QueuedMessage[]',
          description: 'Queued messages in display and send order.',
          required: true,
        },
        {
          name: 'onOrderChange',
          type: '(ids: string[]) => void',
          description: 'Receives queued message identifiers in the new order.',
          required: true,
        },
        {
          name: 'onSend',
          type: '(id: string) => void | Promise<void>',
          description:
            'Receives the identifier to send. Return a promise to keep the send operation pending.',
          required: true,
        },
        {
          name: 'onRemove',
          type: '((id: string) => void)',
          description: 'Called with the identifier of a removed queued message.',
          required: false,
        },
        {
          name: 'onEdit',
          type: '((id: string) => void)',
          description:
            'Receives the message identifier when Enter or a double click requests editing.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name of the queued-message list.',
          required: false,
        },
        {
          name: 'transitionMessages',
          type: 'boolean',
          description:
            'Animates a queued message into its matching sent-message bubble when view transitions are supported.',
          required: false,
        },
      ],
    },
    {
      name: 'QueuedMessage',
      props: [
        {
          name: 'id',
          type: 'string',
          description: 'Stable identifier for reordering, editing, sending, and transitions.',
          required: true,
        },
        {
          name: 'content',
          type: 'RemixNode',
          description: 'Content displayed in this queued-message row.',
          required: true,
        },
      ],
    },
  ],
  accordion: [
    {
      name: 'Accordion',
      props: [
        {
          name: 'type',
          type: '"single" | "multiple"',
          description: 'Single or multiple expansion mode.',
          required: false,
        },
        {
          name: 'value',
          type: 'AccordionSingleValue | AccordionMultipleValue',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'AccordionSingleValue | AccordionMultipleValue',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Content rendered inside the component.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'items',
          type: 'readonly AccordionItem[]',
          description: 'Items and their content.',
          required: true,
        },
        {
          name: 'variant',
          type: '"grouped" | "separated"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'highlight',
          type: '"item" | "trigger"',
          description: 'Highlight the whole expanded item or only the trigger on hover.',
          required: false,
        },
        {
          name: 'headingLevel',
          type: '2 | 3 | 4 | 5 | 6',
          description: 'Semantic heading level for accordion triggers.',
          required: false,
        },
      ],
    },
    {
      name: 'AccordionItem',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Unique identifier for this accordion item.',
          required: true,
        },
        {
          name: 'title',
          type: 'RemixNode',
          description: 'Content of the accordion trigger.',
          required: true,
        },
        {
          name: 'content',
          type: 'RemixNode',
          description: 'Panel content revealed when the item is expanded.',
          required: true,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
      ],
    },
  ],
  'ask-user-questions': [
    {
      name: 'AskUserQuestions',
      props: [
        {
          name: 'questions',
          type: 'readonly AskUserQuestion[]',
          description: 'Questions presented in order.',
          required: true,
        },
        {
          name: 'currentIndex',
          type: 'number',
          description: 'Zero-based active question index when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultCurrentIndex',
          type: 'number',
          description: 'Initial question index for an uncontrolled flow.',
          required: false,
        },
        {
          name: 'onCurrentIndexChange',
          type: '((index: number) => void)',
          description: 'Receives the next question index after navigation.',
          required: false,
        },
        {
          name: 'answers',
          type: 'Record<string, AskUserAnswer>',
          description: 'Answer record controlled by the parent, keyed by question identifier.',
          required: false,
        },
        {
          name: 'defaultAnswers',
          type: 'Record<string, AskUserAnswer>',
          description: 'Initial answers for an uncontrolled flow.',
          required: false,
        },
        {
          name: 'onAnswersChange',
          type: '((answers: Record<string, AskUserAnswer>) => void)',
          description:
            'Receives the proposed complete answer record after edits, choices, or skipping.',
          required: false,
        },
        {
          name: 'onComplete',
          type: '((answers: Record<string, AskUserAnswer>) => void)',
          description: 'Receives answers when the flow is completed.',
          required: false,
        },
        {
          name: 'onSkip',
          type: '((questionId: string, index: number) => void)',
          description: 'Called when a question is skipped.',
          required: false,
        },
        {
          name: 'skipLabel',
          type: 'string',
          description: 'Label of the skip action.',
          required: false,
        },
      ],
    },
    {
      name: 'AskUserQuestion',
      props: [
        {
          name: 'id',
          type: 'string',
          description:
            'Stable question identifier. A position-based identifier is used when omitted.',
          required: false,
        },
        {
          name: 'title',
          type: 'string',
          description: 'Heading displayed by the component.',
          required: true,
        },
        {
          name: 'options',
          type: 'readonly AskUserOption[]',
          description: 'Choices shown for this question.',
          required: false,
        },
        {
          name: 'multiSelect',
          type: 'boolean',
          description: 'Allows more than one answer.',
          required: false,
        },
        {
          name: 'allowOther',
          type: 'boolean',
          description: 'Adds a custom answer option.',
          required: false,
        },
        {
          name: 'otherPlaceholder',
          type: 'string',
          description: 'Hint for a custom answer.',
          required: false,
        },
        {
          name: 'skippable',
          type: 'boolean',
          description: 'Allows this question to be skipped.',
          required: false,
        },
        {
          name: 'nextLabel',
          type: 'string',
          description: 'Label of the next action.',
          required: false,
        },
        {
          name: 'layout',
          type: '"inline" | "stacked"',
          description: 'Layout of question choices.',
          required: false,
        },
        {
          name: 'chipPosition',
          type: '"left" | "right"',
          description: 'Position of the option shortcut.',
          required: false,
        },
        {
          name: 'freeText',
          type: 'boolean',
          description: 'Uses text input instead of choices.',
          required: false,
        },
        {
          name: 'freeTextPlaceholder',
          type: 'string',
          description: 'Hint for the text answer.',
          required: false,
        },
        {
          name: 'freeTextMultiline',
          type: 'boolean',
          description: 'Uses a multiline text answer.',
          required: false,
        },
        {
          name: 'freeTextValidate',
          type: '((value: string) => string | null)',
          description: 'Returns a validation message, or no message for a valid answer.',
          required: false,
        },
      ],
    },
    {
      name: 'AskUserOption',
      props: [
        {
          name: 'id',
          type: 'string',
          description:
            'Stable option identifier. A position-based identifier is used when omitted.',
          required: false,
        },
        {
          name: 'title',
          type: 'string',
          description: 'Main text of the answer option.',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Supporting text below the option title.',
          required: false,
        },
      ],
    },
    {
      name: 'AskUserAnswer',
      props: [
        {
          name: 'questionId',
          type: 'string',
          description: 'Identifier of the question that was answered.',
          required: true,
        },
        {
          name: 'selectedIds',
          type: 'string[]',
          description: 'Identifiers of the selected options.',
          required: true,
        },
        {
          name: 'otherText',
          type: 'string',
          description: 'Text supplied as a custom or free-text answer.',
          required: false,
        },
        {
          name: 'skipped',
          type: 'boolean',
          description: 'Whether this question was skipped.',
          required: false,
        },
      ],
    },
  ],
  badge: [
    {
      name: 'Badge',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'color',
          type: '"accent" | "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink" | "rose"',
          description: 'Color treatment.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'variant',
          type: '"solid" | "dot"',
          description: 'Visual or layout treatment.',
          required: false,
        },
      ],
    },
  ],
  banner: [
    {
      name: 'Banner',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'status',
          type: '"default" | "info" | "success" | "warning" | "error"',
          description: 'Semantic status treatment.',
          required: false,
        },
        {
          name: 'contrast',
          type: '"low" | "high"',
          description: 'Contrast treatment of the status surface.',
          required: false,
        },
        {
          name: 'variant',
          type: '"inline" | "fixed"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'dismissible',
          type: 'boolean',
          description: 'Shows an action to dismiss the component.',
          required: false,
        },
        {
          name: 'dismissLabel',
          type: 'string',
          description: 'Accessible name of the dismiss action.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description: 'Controlled visibility.',
          required: false,
        },
        {
          name: 'onDismiss',
          type: '(() => void)',
          description: 'Called after dismissal.',
          required: false,
        },
      ],
    },
    {
      name: 'BannerAction',
      props: [
        {
          name: 'active',
          type: 'boolean',
          description: 'Applies the active visual state.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'leadingIcon',
          type: 'RemixNode',
          description: 'Icon shown before the button label.',
          required: false,
        },
        {
          name: 'loading',
          type: 'boolean',
          description: 'Shows progress and prevents repeated activation.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact" | "icon" | "icon-compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'trailingIcon',
          type: 'RemixNode',
          description: 'Icon shown after the button label.',
          required: false,
        },
        {
          name: 'variant',
          type: '"primary" | "secondary" | "tertiary" | "ghost" | "destructive"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'type',
          type: 'string',
          description: 'The `type` HTML attribute.',
          required: false,
        },
        {
          name: 'href',
          type: 'string',
          description: 'Destination URL when rendered as a link.',
          required: false,
        },
      ],
    },
  ],
  button: [
    {
      name: 'Button',
      props: [
        {
          name: 'active',
          type: 'boolean',
          description: 'Applies the active visual state.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'leadingIcon',
          type: 'RemixNode',
          description: 'Icon shown before the button label.',
          required: false,
        },
        {
          name: 'loading',
          type: 'boolean',
          description: 'Shows progress and prevents repeated activation.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact" | "icon" | "icon-compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'trailingIcon',
          type: 'RemixNode',
          description: 'Icon shown after the button label.',
          required: false,
        },
        {
          name: 'variant',
          type: '"primary" | "secondary" | "tertiary" | "ghost" | "destructive"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'type',
          type: 'string',
          description: 'The `type` HTML attribute.',
          required: false,
        },
        {
          name: 'href',
          type: 'string',
          description: 'Destination URL when rendered as a link.',
          required: false,
        },
      ],
    },
  ],
  'bar-chart': [
    {
      name: 'BarChart',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name for the chart.',
          required: true,
        },
        {
          name: 'items',
          type: 'readonly Item[]',
          description:
            'Categories in display order. Supply value for a single series or values for named series.',
          required: true,
        },
        {
          name: 'range',
          type: '{ start: string; end: string }',
          description:
            'Highlight the inclusive interval between two item IDs. A single ID at both ends marks the current category.',
          required: false,
        },
        {
          name: 'formatValue',
          type: '(value: number) => string',
          description: 'Format the quantity and its units for tooltips and accessible bar names.',
          required: false,
        },
        {
          name: 'href',
          type: '(item: Item) => string',
          description: 'Render each bar as a native link to its drill-down view.',
          required: false,
        },
        {
          name: 'onSelect',
          type: '(item: Item, event: MouseEvent) => void',
          description:
            'Activate a bar by pointer or keyboard. With href, call event.preventDefault() to handle an ordinary link activation.',
          required: false,
        },
        {
          name: 'describedBy',
          type: 'string',
          description: 'IDs of supplementary instructions or a summary.',
          required: false,
        },
        {
          name: 'series',
          type: 'readonly { id: string; label: string }[]',
          description:
            'Several quantities per category: give each item values, one per series in order. Colored with --rf-bar-chart-series-1 to -4 and named in a legend.',
          required: false,
        },
        {
          name: 'layout',
          type: '"grouped" | "stacked"',
          description: 'Series side by side, or piled into one bar. Default grouped.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"vertical" | "horizontal"',
          description:
            'Categories as columns, or as rows with their labels beside the bars; rows move with Up and Down. Default vertical.',
          required: false,
        },
        {
          name: 'showAxes',
          type: 'boolean',
          description: 'Show numeric and category labels along the axes.',
          required: false,
        },
      ],
    },
    {
      name: 'BarChartItem',
      props: [
        {
          name: 'id',
          type: 'string',
          description: 'Unique category ID, stable across updates.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Short category name for the axis and tooltip.',
          required: true,
        },
        {
          name: 'value',
          type: 'number',
          description:
            'Single value on the zero baseline. A negative value extends below zero. Use BarChartSeriesItem for values-only data.',
          required: true,
        },
        {
          name: 'values',
          type: 'readonly number[]',
          description: 'With series, one value per series in the same order.',
          required: false,
        },
      ],
    },
    {
      name: 'BarChartSeriesItem',
      props: [
        { name: 'id', type: 'string', description: 'Stable category ID.', required: true },
        {
          name: 'label',
          type: 'string',
          description: 'Category name for the axis and tooltip.',
          required: true,
        },
        {
          name: 'values',
          type: 'readonly number[]',
          description: 'One quantity per named series in display order.',
          required: true,
        },
      ],
    },
  ],
  'time-grid': [
    {
      name: 'TimeGrid',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name for the schedule.',
          required: true,
        },
        {
          name: 'days',
          type: 'readonly string[]',
          description: 'Column names in display order. Event day indexes refer to this list.',
          required: true,
        },
        {
          name: 'events',
          type: 'readonly E[]',
          description: 'Controlled event collection. E extends TimeGridEvent.',
          required: true,
        },
        {
          name: 'startMinute',
          type: 'number',
          description:
            'Inclusive start in local wall-clock minutes. Omit to fit earlier events and include 09:00.',
          required: false,
        },
        {
          name: 'endMinute',
          type: 'number',
          description:
            'Exclusive end in local wall-clock minutes. Omit to fit later events and include 17:00.',
          required: false,
        },
        {
          name: 'stepMinutes',
          type: 'number',
          description:
            'Positive whole-minute increment for pointer and keyboard edits, anchored at the start of the grid.',
          required: false,
        },
        {
          name: 'compactDay',
          type: 'number',
          description: 'Zero-based day to show on viewports up to 800px. Omit to keep all columns.',
          required: false,
        },
        {
          name: 'selectedId',
          type: 'string',
          description: 'ID of the selected event.',
          required: false,
        },
        {
          name: 'onSelect',
          type: '(event: E) => void',
          description: 'Select an event by clicking it or pressing Space.',
          required: false,
        },
        {
          name: 'onActivate',
          type: '(event: E) => void',
          description: 'Open an event with Enter. Clicking also opens when onSelect is omitted.',
          required: false,
        },
        {
          name: 'onEventChange',
          type: '(event: E) => void',
          description: 'Request a move or resize. Update the collection to accept the change.',
          required: false,
        },
        {
          name: 'onCreate',
          type: '(range: TimeGridRange) => void',
          description:
            'Receive a selected interval after dragging across open time or pressing Enter on a keyboard slot. A click without a drag creates nothing.',
          required: false,
        },
        {
          name: 'onCreateAllDay',
          type: '(range: { day: number; span: number }) => void',
          description:
            'Receive the days covered by a drag across empty space in the all-day strip. The strip stays available when empty.',
          required: false,
        },
        {
          name: 'getEventLabel',
          type: '(event: E) => string',
          description: 'Customize the accessible event name, for example to include a timezone.',
          required: false,
        },
        {
          name: 'getEventClass',
          type: '(event: E) => string',
          description: 'Add a class to style the event surface and accent.',
          required: false,
        },
        {
          name: 'describedBy',
          type: 'string',
          description: 'IDs of supplementary instructions for the board and its event buttons.',
          required: false,
        },
      ],
    },
    {
      name: 'TimeGridEvent',
      props: [
        {
          name: 'id',
          type: 'string',
          description: 'Unique, stable event identifier.',
          required: true,
        },
        {
          name: 'title',
          type: 'string',
          description: 'Visible appointment title.',
          required: true,
        },
        { name: 'day', type: 'number', description: 'Zero-based index in days.', required: true },
        {
          name: 'start',
          type: 'number',
          description: 'Minutes since midnight on that day.',
          required: true,
        },
        {
          name: 'duration',
          type: 'number',
          description:
            'Positive duration in whole minutes, up to 24 hours. Past midnight, the event continues in the next column.',
          required: true,
        },
        {
          name: 'allDay',
          type: 'boolean',
          description:
            'Shows the event in the all-day strip above the hours; start and duration are ignored.',
          required: false,
        },
        {
          name: 'span',
          type: 'number',
          description: 'Consecutive days an all-day event covers. Default 1.',
          required: false,
        },
      ],
    },
    {
      name: 'TimeGridRange',
      props: [
        { name: 'day', type: 'number', description: 'Zero-based index in days.', required: true },
        {
          name: 'start',
          type: 'number',
          description: 'Minutes since midnight on that day.',
          required: true,
        },
        {
          name: 'duration',
          type: 'number',
          description: 'Positive duration in whole minutes, ending by midnight.',
          required: true,
        },
      ],
    },
  ],
  calendar: [
    {
      name: 'Calendar',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'mode',
          type: '"single" | "range"',
          description: 'Select one date or a date range.',
          required: false,
        },
        {
          name: 'value',
          type: 'DateValue',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'DateValue',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: DateValue) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'min',
          type: 'string',
          description: 'Minimum allowed value.',
          required: false,
        },
        {
          name: 'max',
          type: 'string',
          description: 'Maximum allowed value.',
          required: false,
        },
        {
          name: 'isDateDisabled',
          type: '((date: string) => boolean)',
          description: 'Determines whether a date is unavailable.',
          required: false,
        },
        {
          name: 'defaultMonth',
          type: 'string',
          description: 'Initially displayed month as a local ISO date.',
          required: false,
        },
        {
          name: 'today',
          type: 'string',
          description:
            'Pin today to a YYYY-MM-DD date shared by server and client. Otherwise the initial render uses UTC and switches to the visitor’s local day after hydration.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'weekStartsOn',
          type: '0 | 1',
          description: 'First weekday. Zero is Sunday and one is Monday.',
          required: false,
        },
        {
          name: 'showWeekNumbers',
          type: 'boolean',
          description: 'Displays ISO week numbers.',
          required: false,
        },
        {
          name: 'numberOfMonths',
          type: '2 | 1',
          description: 'Number of calendar months shown together.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"horizontal" | "vertical"',
          description: 'Layout direction.',
          required: false,
        },
        {
          name: 'booked',
          type: 'readonly string[]',
          description: 'Dates marked as unavailable.',
          required: false,
        },
        {
          name: 'available',
          type: 'readonly string[]',
          description: 'Explicit set of selectable dates.',
          required: false,
        },
        {
          name: 'minNights',
          type: 'number',
          description: 'Minimum nights in a selected date range.',
          required: false,
        },
        {
          name: 'maxNights',
          type: 'number',
          description: 'Maximum nights in a selected date range.',
          required: false,
        },
        {
          name: 'dayDetail',
          type: '((date: string) => RemixNode)',
          description: 'Additional content inside a date cell.',
          required: false,
        },
        {
          name: 'cellSize',
          type: 'number',
          description: 'Date-cell dimension in pixels.',
          required: false,
        },
      ],
    },
    {
      name: 'DateRange',
      props: [
        {
          name: 'start',
          type: 'string',
          description: 'First date in the range.',
          required: true,
        },
        {
          name: 'end',
          type: 'string',
          description: 'Last date in the range.',
          required: false,
        },
      ],
    },
  ],
  card: [
    {
      name: 'Card',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'href',
          type: 'string',
          description: 'Destination URL when rendered as a link.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'onClick',
          type: '((event: MouseEvent) => void)',
          description: 'Called when the card is activated.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'selected',
          type: 'boolean',
          description: 'Marks the item as selected.',
          required: false,
        },
        {
          name: 'dismissible',
          type: 'boolean',
          description: 'Shows an action to dismiss the component.',
          required: false,
        },
        {
          name: 'dismissOnHover',
          type: 'boolean',
          description: 'Reveals the dismiss control on hover.',
          required: false,
        },
        {
          name: 'onDismiss',
          type: '(() => void)',
          description: 'Called after dismissal.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'border',
          type: '"none" | "outlined"',
          description: 'Border treatment.',
          required: false,
        },
      ],
    },
    {
      name: 'CardGroup',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"inline" | "card"',
          description: 'Layout direction.',
          required: false,
        },
        {
          name: 'columns',
          type: 'number',
          description: 'Number of columns in the card grid.',
          required: false,
        },
        {
          name: 'border',
          type: '"none" | "outlined"',
          description: 'Border treatment.',
          required: false,
        },
        {
          name: 'separated',
          type: 'boolean',
          description: 'Gives each card its own surface.',
          required: false,
        },
        {
          name: 'fluidHover',
          type: 'boolean',
          description: 'Enables the shared moving hover surface.',
          required: false,
        },
      ],
    },
  ],
  'carousel-dots': [
    {
      name: 'CarouselDots',
      props: [
        {
          name: 'count',
          type: 'number',
          description: 'Number of slides.',
          required: true,
        },
        {
          name: 'current',
          type: 'number',
          description: 'Zero-based index of the selected slide.',
          required: true,
        },
        {
          name: 'onChange',
          type: '(index: number) => void',
          description: 'Receives the zero-based index of the selected slide.',
          required: true,
        },
        {
          name: 'labels',
          type: 'readonly string[]',
          description: 'Accessible names for the slide buttons.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'progressDuration',
          type: 'number',
          description: 'Duration of the progress animation in milliseconds.',
          required: false,
        },
        {
          name: 'autoplay',
          type: '{ duration: number; paused?: boolean; }',
          description: 'Automatic advance duration and optional paused state.',
          required: false,
        },
      ],
    },
  ],
  'chat-message': [
    {
      name: 'ChatMessage',
      props: [
        {
          name: 'transitionId',
          type: 'string',
          description:
            'Matches a sent message to its originating queued message for a shared transition.',
          required: false,
        },
        {
          name: 'id',
          type: 'string',
          required: false,
          description: 'Put on the message element, so a ChatOutline or a link can find it.',
        },
        {
          name: 'role',
          type: '"user" | "assistant" | "system"',
          description:
            'Position and treatment of the chat message. A system message shows an event, such as a model switch, as a quiet centred line.',
          required: true,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Content rendered inside the component.',
          required: false,
        },
        {
          name: 'attachments',
          type: 'readonly ChatAttachment[]',
          description: 'Files displayed before the body of a user or assistant message.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name of the message. Defaults to You, Assistant or System.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'time',
          type: 'string',
          description: 'Timestamp shown below a user message, or after a system event.',
          required: false,
        },
        {
          name: 'actions',
          type: 'RemixNode',
          description: 'Actions shown on hover below a message, and always after a system event.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'A small glyph before a system event.',
          required: false,
        },
        {
          name: 'animate',
          type: 'boolean',
          description: 'Enables entry animation.',
          required: false,
        },
      ],
    },
    {
      name: 'ChatAttachment',
      props: [
        {
          name: 'name',
          type: 'string',
          description: 'Visible filename of the attachment.',
          required: true,
        },
        {
          name: 'url',
          type: 'string',
          description: 'URL opened when the attachment is activated.',
          required: false,
        },
        {
          name: 'detail',
          type: 'string',
          description: 'File type, size, or other secondary information.',
          required: false,
        },
        {
          name: 'type',
          type: 'string',
          description: 'Single or multiple expansion mode.',
          required: false,
        },
        {
          name: 'previewUrl',
          type: 'string',
          description: 'Image URL used for a visual attachment preview.',
          required: false,
        },
      ],
    },
  ],
  checkbox: [
    {
      name: 'Checkbox',
      props: [
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The `disabled` HTML attribute.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'The `name` HTML attribute.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | number',
          description: 'The `value` HTML attribute.',
          required: false,
        },
        {
          name: 'checked',
          type: 'boolean',
          description: 'The `checked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description: 'The `defaultChecked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string | number',
          description: 'The `defaultValue` HTML attribute.',
          required: false,
        },
        {
          name: 'indeterminate',
          type: 'boolean',
          description: 'The `indeterminate` HTML attribute.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'The `placeholder` HTML attribute.',
          required: false,
        },
        {
          name: 'required',
          type: 'boolean',
          description: 'The `required` HTML attribute.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'label',
          type: 'RemixNode',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'onCheckedChange',
          type: '((checked: boolean, event: Event) => void)',
          description: 'Called when the checked state changes.',
          required: false,
        },
      ],
    },
  ],
  'checkbox-group': [
    {
      name: 'CheckboxGroup',
      props: [
        {
          name: 'value',
          type: 'readonly string[]',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'readonly string[]',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string[]) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'options',
          type: 'readonly GroupOption[]',
          description: 'Choices available to the user.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'hideLabel',
          type: 'boolean',
          description:
            'Keeps the label available to assistive technology while hiding it visually.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"horizontal" | "vertical"',
          description: 'Layout direction.',
          required: false,
        },
      ],
    },
    {
      name: 'GroupOption',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Value submitted for this option.',
          required: true,
        },
        {
          name: 'label',
          type: 'RemixNode',
          description: 'Visible option label.',
          required: true,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
      ],
    },
  ],
  'color-picker': [
    {
      name: 'ColorPicker',
      props: [
        {
          name: 'variant',
          type: '"inline" | "popover"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'value',
          type: 'string',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'format',
          type: '"hex" | "rgb" | "hsl" | "oklch"',
          description: 'Controlled color format.',
          required: false,
        },
        {
          name: 'defaultFormat',
          type: '"hex" | "rgb" | "hsl" | "oklch"',
          description: 'Initial color format.',
          required: false,
        },
        {
          name: 'onFormatChange',
          type: '((format: ColorFormat) => void)',
          description: 'Called when the color format changes.',
          required: false,
        },
        {
          name: 'swatches',
          type: 'ColorSwatchItem[]',
          description: 'Preset colors shown below the editor.',
          required: false,
        },
        {
          name: 'hideEyedropper',
          type: 'boolean',
          description: 'Hides the eyedropper action.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'triggerLabel',
          type: 'string',
          description: 'Visible label shown beside the popover trigger tile.',
          required: false,
        },
        {
          name: 'triggerLabelPosition',
          type: '"left" | "right"',
          description: 'Placement of triggerLabel relative to the color tile.',
          required: false,
        },
        {
          name: 'triggerShowValue',
          type: 'boolean',
          description: 'Shows the six-digit hex value next to the popover trigger tile.',
          required: false,
        },
        {
          name: 'triggerShowRemove',
          type: 'boolean',
          description: 'Adds a clear button inside the popover trigger that calls onTriggerRemove.',
          required: false,
        },
        {
          name: 'onTriggerRemove',
          type: '(() => void)',
          description: 'Called when the trigger clear button is pressed.',
          required: false,
        },
        {
          name: 'placement',
          type: '"bottom-start" | "right-start"',
          description: 'Popover placement when variant is popover.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description: 'Controlled popover visibility.',
          required: false,
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          description: 'Initial popover visibility.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '((open: boolean) => void)',
          description: 'Called when popover visibility changes.',
          required: false,
        },
      ],
    },
  ],
  combobox: [
    {
      name: 'Combobox',
      props: [
        {
          name: 'leadingIcon',
          type: 'RemixNode',
          description: 'Decorative icon rendered before the input value.',
          required: false,
        },
        {
          name: 'multiple',
          type: 'boolean',
          description: 'Enables multiple selected values.',
          required: false,
        },
        {
          name: 'values',
          type: 'readonly string[]',
          description: 'Controlled selected values.',
          required: false,
        },
        {
          name: 'defaultValues',
          type: 'readonly string[]',
          description: 'Initial selected values.',
          required: false,
        },
        {
          name: 'onValuesChange',
          type: '((values: string[]) => void)',
          description: 'Called when the selected values change.',
          required: false,
        },
        {
          name: 'creatable',
          type: 'boolean',
          description: 'Allows a new option to be created from the query.',
          required: false,
        },
        {
          name: 'onCreate',
          type: '((value: string) => void)',
          description: 'Receives the newly created option.',
          required: false,
        },
        {
          name: 'emptyMessage',
          type: 'string',
          description: 'Message shown when no options match.',
          required: false,
        },
        {
          name: 'hideSelected',
          type: 'boolean',
          description: 'Hides picked options from the list.',
          required: false,
        },
        {
          name: 'error',
          type: 'boolean',
          description: 'Validation message or error state.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'options',
          type: 'readonly ChoiceOption[]',
          description: 'Choices available to the user.',
          required: true,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | null',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string | null) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'Hint shown while the value is empty.',
          required: false,
        },
        {
          name: 'variant',
          type: '"ghost" | "bordered"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
      ],
    },
    {
      name: 'ChoiceOption',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Value submitted when this option is selected.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Text shown for the option.',
          required: true,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'searchValue',
          type: 'string | string[]',
          description: 'Additional text matched by filtering or typeahead.',
          required: false,
        },
        {
          name: 'group',
          type: 'string',
          description: 'Label for a contiguous group of options in Select.',
          required: false,
        },
      ],
    },
  ],
  'command-menu': [
    {
      name: 'CommandMenu',
      props: [
        {
          name: 'items',
          type: 'readonly CommandItem[]',
          description: 'Items and their content.',
          required: true,
        },
        {
          name: 'renderItem',
          type: '((item: CommandItem) => RemixNode)',
          description:
            'Replaces the label and description of a row. The icon and shortcut caps stay.',
          required: false,
        },
        {
          name: 'footer',
          type: 'RemixNode | boolean',
          description:
            'true shows the key hints that follow the menu; a node replaces them. Omitted, there is no footer.',
          required: false,
        },
        {
          name: 'suggestions',
          type: 'readonly string[]',
          description:
            'Command values listed first, under suggestionsLabel, while nothing is typed.',
          required: false,
        },
        {
          name: 'suggestionsLabel',
          type: 'string',
          description: 'Heading of the suggestions group. Defaults to Suggestions.',
          required: false,
        },
        {
          name: 'controls',
          type: 'RemixNode',
          description:
            'Compact controls (ghost selects or buttons) in a row under the field, or at the end of the tab row.',
          required: false,
        },
        {
          name: 'emptyMessage',
          type: 'string',
          description: 'Shown when nothing matches. Defaults to No results.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'Hint shown while the value is empty.',
          required: false,
        },
        {
          name: 'filters',
          type: 'readonly string[]',
          description:
            'Group names to expose as filters. Left and Right switch filters from the search field.',
          required: false,
        },
        {
          name: 'trigger',
          type: 'RemixNode',
          description: 'Supply a trigger to open the menu in a modal.',
          required: false,
        },
        {
          name: 'inDialog',
          type: 'boolean',
          description: 'Enable dialog focus and dismissal hints when supplying your own dialog.',
          required: false,
        },
        {
          name: 'shortcut',
          type: 'boolean | string',
          description:
            'The combo that toggles a modal menu: true or omitted is Mod+K, a string such as mod+p sets another, false binds nothing.',
          required: false,
        },
        {
          name: 'onSelect',
          type: '((value: string) => void)',
          description: 'Called when an item is selected.',
          required: false,
        },
      ],
    },
    {
      name: 'CommandItem',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Identifier passed to onSelect when the command is invoked.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'group',
          type: 'string',
          description: 'Label used to group related items.',
          required: false,
        },
        {
          name: 'filter',
          type: 'string',
          description: 'Quick filter membership; defaults to the displayed group.',
          required: false,
        },
        {
          name: 'keywords',
          type: 'readonly string[]',
          description: 'Additional terms matched by search.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'shortcut',
          type: 'string',
          description: 'Visible keyboard hint. The consumer registers the action shortcut.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'action',
          type: 'string',
          description: 'Overrides the highlighted command label in the Enter hint.',
          required: false,
        },
      ],
    },
  ],
  'date-picker': [
    {
      name: 'DatePicker',
      props: [
        {
          name: 'clearable',
          type: 'boolean',
          description:
            'Adds a button that clears the selected date or range and returns focus to the picker.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'Hint shown while the value is empty.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'closeOnSelect',
          type: 'boolean',
          description: 'Closes the calendar after a complete selection.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'variant',
          type: '"ghost" | "outline"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'time',
          type: 'boolean',
          description: 'Includes a time field in the date picker.',
          required: false,
        },
        {
          name: 'timeRange',
          type: 'boolean',
          description:
            'Adds start/end time slots and a duration. Editing the start preserves the duration up to 23:59.',
          required: false,
        },
        {
          name: 'step',
          type: 'number',
          description: 'Minutes between time slots; defaults to 15.',
          required: false,
        },
        {
          name: 'hourCycle',
          type: '12 | 24',
          description: 'Clock display; defaults to 12.',
          required: false,
        },
        {
          name: 'locale',
          type: 'string',
          description: 'Time display locale; defaults to en-US for consistent server rendering.',
          required: false,
        },
        {
          name: 'timeValue',
          type: 'string',
          description: 'Controlled start time in HH:mm format.',
          required: false,
        },
        {
          name: 'defaultTime',
          type: 'string',
          description: 'Initial start time.',
          required: false,
        },
        {
          name: 'onTimeChange',
          type: '((value: string) => void)',
          description: 'Called when the start time changes.',
          required: false,
        },
        {
          name: 'endTimeValue',
          type: 'string',
          description: 'Controlled end time.',
          required: false,
        },
        {
          name: 'defaultEndTime',
          type: 'string',
          description: 'Initial end time.',
          required: false,
        },
        {
          name: 'onEndTimeChange',
          type: '((value: string) => void)',
          description: 'Called when the end time changes.',
          required: false,
        },
        {
          name: 'presets',
          type: 'readonly { label: string; value: DateValue; }[]',
          description: 'Named date or date-range shortcuts.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'mode',
          type: '"single" | "range"',
          description: 'Select one date or a date range.',
          required: false,
        },
        {
          name: 'value',
          type: 'DateValue',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'DateValue',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: DateValue) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'min',
          type: 'string',
          description: 'Minimum allowed value.',
          required: false,
        },
        {
          name: 'max',
          type: 'string',
          description: 'Maximum allowed value.',
          required: false,
        },
        {
          name: 'isDateDisabled',
          type: '((date: string) => boolean)',
          description: 'Determines whether a date is unavailable.',
          required: false,
        },
        {
          name: 'defaultMonth',
          type: 'string',
          description: 'Initially displayed month as a local ISO date.',
          required: false,
        },
        {
          name: 'today',
          type: 'string',
          description:
            'Pin today to a YYYY-MM-DD date shared by server and client. Otherwise the initial render uses UTC and switches to the visitor’s local day after hydration.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'weekStartsOn',
          type: '0 | 1',
          description: 'First weekday. Zero is Sunday and one is Monday.',
          required: false,
        },
        {
          name: 'showWeekNumbers',
          type: 'boolean',
          description: 'Displays ISO week numbers.',
          required: false,
        },
        {
          name: 'numberOfMonths',
          type: '2 | 1',
          description: 'Number of calendar months shown together.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"horizontal" | "vertical"',
          description: 'Layout direction.',
          required: false,
        },
        {
          name: 'booked',
          type: 'readonly string[]',
          description: 'Dates marked as unavailable.',
          required: false,
        },
        {
          name: 'available',
          type: 'readonly string[]',
          description: 'Explicit set of selectable dates.',
          required: false,
        },
        {
          name: 'minNights',
          type: 'number',
          description: 'Minimum nights in a selected date range.',
          required: false,
        },
        {
          name: 'maxNights',
          type: 'number',
          description: 'Maximum nights in a selected date range.',
          required: false,
        },
        {
          name: 'dayDetail',
          type: '((date: string) => RemixNode)',
          description: 'Additional content inside a date cell.',
          required: false,
        },
        {
          name: 'cellSize',
          type: 'number',
          description: 'Date-cell dimension in pixels.',
          required: false,
        },
      ],
    },
    {
      name: 'DateRange',
      props: [
        {
          name: 'start',
          type: 'string',
          description: 'First date in the range.',
          required: true,
        },
        {
          name: 'end',
          type: 'string',
          description: 'Last date in the range.',
          required: false,
        },
      ],
    },
  ],
  dialog: [
    {
      name: 'Dialog',
      props: [
        {
          name: 'triggerVariant',
          type: 'ButtonProps["variant"]',
          description: 'Visual treatment of the opening button.',
          required: false,
        },
        {
          name: 'triggerSize',
          type: 'ButtonProps["size"]',
          description: 'Size of the opening button.',
          required: false,
        },
        {
          name: 'trigger',
          type: 'RemixNode',
          description: 'Contents of the button that opens the dialog.',
          required: false,
        },
        {
          name: 'title',
          type: 'string',
          description: 'Heading displayed by the component.',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Content rendered inside the component.',
          required: false,
        },
        {
          name: 'footer',
          type: 'RemixNode | ((close: () => void) => RemixNode)',
          description: 'Render footer actions with a callback that requests dismissal.',
          required: false,
        },
        {
          name: 'size',
          type: '"sm" | "lg" | "xl"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'position',
          type: '"center" | "top"',
          description: 'Vertical placement in the viewport.',
          required: false,
        },
        {
          name: 'flush',
          type: 'boolean',
          description: 'Let a child composition fill the panel and visually hide the title.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description: 'Controlled visibility.',
          required: false,
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          description: 'Initial visibility.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '((open: boolean) => void)',
          description: 'Called when visibility changes.',
          required: false,
        },
        {
          name: 'showCloseButton',
          type: 'boolean',
          description: 'Shows the close affordance.',
          required: false,
        },
        {
          name: 'dismissOnBackdrop',
          type: 'boolean',
          description: 'Allows a click on the backdrop to dismiss the dialog.',
          required: false,
        },
        {
          name: 'modal',
          type: 'boolean',
          description: 'Uses modal focus and background interaction behavior.',
          required: false,
        },
      ],
    },
  ],
  breadcrumb: [
    {
      name: 'Breadcrumb',
      props: [
        {
          name: 'items',
          type: 'readonly BreadcrumbItem[]',
          description: 'The trail, ending with the current page.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Names the navigation landmark.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Pins the trail to 28px steps and 13px text, or 24px and 12px.',
          required: false,
        },
        {
          name: 'separator',
          type: 'RemixNode | null',
          description: 'Trailing glyph of every step but the last, such as a slash. null drops it.',
          required: false,
        },
        {
          name: 'collapse',
          type: 'boolean',
          description:
            'Hides middle steps behind an ellipsis menu while the trail is wider than its container. The first step, the last link and the current page stay; past that the page name truncates.',
          required: false,
        },
        {
          name: 'openOnHover',
          type: 'boolean',
          description: 'Opens step menus and the ellipsis menu when a mouse rests on them.',
          required: false,
        },
      ],
    },
    {
      name: 'BreadcrumbItem',
      props: [
        { name: 'label', type: 'string', description: 'Step name.', required: true },
        {
          name: 'href',
          type: 'string',
          description: 'Where the step goes. The last item is the current page and is not a link.',
          required: false,
        },
        { name: 'icon', type: 'RemixNode', description: 'Leading icon.', required: false },
        {
          name: 'menu',
          type: 'readonly DropdownItem[]',
          description:
            'Turns a step before the current page into a menu trigger, such as its siblings. Its chevron points down while the menu is open.',
          required: false,
        },
        {
          name: 'onMenuSelect',
          type: '((value: string, checked?: boolean) => void)',
          description: 'Called when an item in the step menu is selected.',
          required: false,
        },
      ],
    },
  ],
  dropdown: [
    {
      name: 'Dropdown',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'triggerContent',
          type: 'RemixNode',
          description: 'Custom content rendered inside the trigger button.',
          required: false,
        },
        {
          name: 'items',
          type: 'readonly DropdownItem[]',
          description: 'Items and their content.',
          required: true,
        },
        {
          name: 'onSelect',
          type: '((value: string, checked?: boolean) => void)',
          description: 'Called when an item is selected.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'align',
          type: '"start" | "end"',
          description: 'Horizontal alignment of the action or popup.',
          required: false,
        },
        {
          name: 'side',
          type: '"top" | "bottom"',
          description: 'Which side of the trigger the menu opens on.',
          required: false,
        },
        {
          name: 'variant',
          type: '"outline" | "ghost" | "bare"',
          description:
            'Visual or layout treatment. bare renders an unstyled trigger for custom rows.',
          required: false,
        },
        {
          name: 'triggerClass',
          type: 'string',
          description: 'Additional CSS class applied to the trigger button.',
          required: false,
        },
        {
          name: 'triggerMix',
          type: 'MixInput',
          description: 'Extra behavior attached to the trigger, such as Tooltip trigger props.',
          required: false,
        },
        {
          name: 'chevron',
          type: 'boolean',
          description: 'Show the trailing chevron on the trigger.',
          required: false,
        },
        {
          name: 'searchable',
          type: 'boolean',
          description: 'Enables filtering.',
          required: false,
        },
        {
          name: 'searchPlaceholder',
          type: 'string',
          description: 'Placeholder for the menu search field.',
          required: false,
        },
        {
          name: 'emptyMessage',
          type: 'string',
          description: 'Text shown when a search matches nothing.',
          required: false,
        },
        {
          name: 'inline',
          type: 'boolean',
          description: 'Renders the menu without a popup trigger.',
          required: false,
        },
        {
          name: 'creatable',
          type: 'boolean',
          description: 'Allows a new option to be created from the query.',
          required: false,
        },
        {
          name: 'onCreate',
          type: '((value: string) => void)',
          description: 'Receives the newly created option.',
          required: false,
        },
        {
          name: 'openOnHover',
          type: 'boolean',
          description:
            'Opens the menu when a mouse rests on the trigger and closes it once the pointer leaves the trigger and the menu. A click pins it open; touch and the keyboard open it as usual.',
          required: false,
        },
        {
          name: 'delay',
          type: 'number',
          description: 'With openOnHover: ms the pointer rests before the menu opens. Default 100.',
          required: false,
        },
        {
          name: 'closeDelay',
          type: 'number',
          description:
            'With openOnHover: ms before the menu closes once the pointer has left. Default 150.',
          required: false,
        },
      ],
    },
    menuItemApi,
  ],
  field: [
    {
      name: 'Field',
      props: [
        {
          name: 'children',
          type: 'RemixNode | ((control: FieldControlProps) => RemixNode)',
          description: 'Content rendered inside the component.',
          required: true,
        },
        {
          name: 'controlId',
          type: 'string',
          description: 'ID of the associated form control.',
          required: false,
        },
        {
          name: 'label',
          type: 'RemixNode',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'error',
          type: 'RemixNode',
          description: 'Validation message or error state.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"horizontal" | "vertical" | "responsive"',
          description: 'Layout direction.',
          required: false,
        },
      ],
    },
    {
      name: 'FieldSet',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The `disabled` HTML attribute.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'The `name` HTML attribute.',
          required: false,
        },
        {
          name: 'legend',
          type: 'RemixNode',
          description: 'Legend for a group of form controls.',
          required: false,
        },
        {
          name: 'legendVariant',
          type: '"legend" | "label"',
          description: 'Visual styling of the fieldset legend.',
          required: false,
        },
      ],
    },
  ],
  input: [
    {
      name: 'Input',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The `disabled` HTML attribute.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'The `name` HTML attribute.',
          required: false,
        },
        {
          name: 'type',
          type: '"number" | "hidden" | "color" | "button" | "search" | "checkbox" | "radio" | "date" | "time" | "text" | "submit" | "reset" | "range" | "email" | "image" | "tel" | "url" | "datetime-local" | "file" | "month" | "password" | "week"',
          description: 'Single or multiple expansion mode.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | number',
          description: 'The `value` HTML attribute.',
          required: false,
        },
        {
          name: 'checked',
          type: 'boolean',
          description: 'The `checked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description: 'The `defaultChecked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string | number',
          description: 'The `defaultValue` HTML attribute.',
          required: false,
        },
        {
          name: 'indeterminate',
          type: 'boolean',
          description: 'The `indeterminate` HTML attribute.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'The `placeholder` HTML attribute.',
          required: false,
        },
        {
          name: 'required',
          type: 'boolean',
          description: 'The `required` HTML attribute.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
      ],
    },
  ],
  'input-copy': [
    {
      name: 'InputCopy',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Text displayed in the field and copied to the clipboard.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'onCopy',
          type: '(() => void)',
          description: 'Called after successfully copying the value.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'variant',
          type: '"button" | "icon"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'align',
          type: '"left" | "right"',
          description: 'Horizontal alignment of the action or popup.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
      ],
    },
  ],
  'input-group': [
    {
      name: 'InputGroup',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
      ],
    },
    {
      name: 'InputField',
      props: [
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The `disabled` HTML attribute.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'The `name` HTML attribute.',
          required: false,
        },
        {
          name: 'type',
          type: '"number" | "hidden" | "color" | "button" | "search" | "checkbox" | "radio" | "date" | "time" | "text" | "submit" | "reset" | "range" | "email" | "image" | "tel" | "url" | "datetime-local" | "file" | "month" | "password" | "week"',
          description: 'Single or multiple expansion mode.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | number',
          description: 'The `value` HTML attribute.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'checked',
          type: 'boolean',
          description: 'The `checked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description: 'The `defaultChecked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string | number',
          description: 'The `defaultValue` HTML attribute.',
          required: false,
        },
        {
          name: 'indeterminate',
          type: 'boolean',
          description: 'The `indeterminate` HTML attribute.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'The `placeholder` HTML attribute.',
          required: false,
        },
        {
          name: 'required',
          type: 'boolean',
          description: 'The `required` HTML attribute.',
          required: false,
        },
        {
          name: 'id',
          type: 'string',
          description: 'Stable identifier.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'labelHidden',
          type: 'boolean',
          description: 'Keeps the label accessible while hiding it visually.',
          required: false,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'error',
          type: 'RemixNode',
          description: 'Validation message or error state.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'onChange',
          type: '((value: string, event: Event) => void)',
          description: 'Called with the updated value.',
          required: false,
        },
      ],
    },
  ],
  'input-message': [
    {
      name: 'InputMessage',
      props: [
        {
          name: 'transitionMessages',
          type: 'boolean',
          description:
            'Animates a queued message into its matching sent-message bubble when view transitions are supported.',
          required: false,
        },
        {
          name: 'queue',
          type: 'readonly ComposerQueuedMessage[]',
          description: 'Controlled messages waiting for the active response to finish.',
          required: false,
        },
        {
          name: 'onQueueChange',
          type: '((queue: ComposerQueuedMessage[]) => void)',
          description:
            'Receives the updated queue when messages are added, edited, reordered, or removed.',
          required: false,
        },
        {
          name: 'showQueue',
          type: 'boolean',
          description: 'Displays queued messages above the composer.',
          required: false,
        },
        {
          name: 'value',
          type: 'string',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'files',
          type: 'readonly File[]',
          description: 'Controlled selected attachments.',
          required: false,
        },
        {
          name: 'onFilesChange',
          type: '((files: File[]) => void)',
          description: 'Receives attachments after adding or removing files.',
          required: false,
        },
        {
          name: 'accept',
          type: 'string',
          description:
            'Accepted file types, as in the file input. Any file is accepted by default.',
          required: false,
        },
        {
          name: 'voice',
          type: 'boolean',
          description:
            'While there is nothing to send, the main button records a voice note, with a level meter and timer, and attaches it as an audio file.',
          required: false,
        },
        {
          name: 'voiceShortcut',
          type: 'string | null',
          description:
            'Starts and attaches a voice note from the keyboard while focus is in the composer. Defaults to alt+shift+v; null turns it off.',
          required: false,
        },
        {
          name: 'pasteAsFile',
          type: 'number',
          description:
            'Attaches pasted text of at least this many characters as pasted-text.txt instead of filling the message box.',
          required: false,
        },
        {
          name: 'filePreviewSize',
          type: 'number',
          description:
            'Height of attachment previews in pixels. Images show a thumbnail; other files show their name and extension on a card twice as wide.',
          required: false,
        },
        {
          name: 'minRows',
          type: 'number',
          description: 'Minimum visible textarea rows.',
          required: false,
        },
        {
          name: 'maxRows',
          type: 'number',
          description: 'Maximum visible rows before the composer scrolls.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'history',
          type: 'readonly string[]',
          description: 'Previous messages recalled with the arrow keys.',
          required: false,
        },
        {
          name: 'triggers',
          type: 'readonly TriggerMenuTrigger[]',
          description: 'Optional caret suggestions for triggers such as @ or /. See TriggerMenu.',
          required: false,
        },
        {
          name: 'suggestions',
          type: 'readonly string[]',
          description: 'Suggested messages presented while the composer is empty.',
          required: false,
        },
        {
          name: 'status',
          type: '"idle" | "streaming"',
          description:
            'Whether the assistant is idle or streaming. Submissions during streaming join the queue.',
          required: false,
        },
        {
          name: 'onStop',
          type: '(() => void)',
          description: 'Called when the user stops a streaming response.',
          required: false,
        },
        {
          name: 'onSend',
          type: '(message: ComposerMessage) => void | Promise<void>',
          description: 'Receives the submitted message and selected files.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'Hint shown while the value is empty.',
          required: false,
        },
        {
          name: 'placeholderSuggestion',
          type: 'string',
          description: 'Suggestion accepted with Tab while the composer is empty.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'attachments',
          type: 'boolean',
          description: 'Message attachments, or permission to attach files in a composer.',
          required: false,
        },
        {
          name: 'maxFiles',
          type: 'number',
          description: 'Maximum number of attachments.',
          required: false,
        },
        {
          name: 'actions',
          type: 'RemixNode',
          description: 'Actions displayed beside the message or composer.',
          required: false,
        },
        {
          name: 'rightActions',
          type: 'RemixNode',
          description: 'Actions aligned to the trailing end of the composer toolbar.',
          required: false,
        },
      ],
    },
    {
      name: 'ComposerMessage',
      props: [
        {
          name: 'queuedId',
          type: 'string',
          description: 'Identifier of the queued message being sent, when applicable.',
          required: false,
        },
        {
          name: 'text',
          type: 'string',
          description: 'Trimmed text of the submitted message.',
          required: true,
        },
        {
          name: 'files',
          type: 'readonly File[]',
          description: 'Files attached to the message.',
          required: true,
        },
      ],
    },
    {
      name: 'ComposerQueuedMessage',
      props: [
        {
          name: 'id',
          type: 'string',
          description:
            'Stable identifier used to edit, remove, reorder, and animate the queued message.',
          required: true,
        },
        {
          name: 'queuedId',
          type: 'string',
          description: 'Identifier of the queued message being sent, when applicable.',
          required: false,
        },
        {
          name: 'text',
          type: 'string',
          description: 'Text waiting to be submitted.',
          required: true,
        },
        {
          name: 'files',
          type: 'readonly File[]',
          description: 'Files attached to the queued message.',
          required: true,
        },
      ],
    },
  ],
  'alert-dialog': [
    {
      name: 'AlertDialog',
      props: [
        { name: 'title', type: 'string', required: true, description: 'Names the modal.' },
        {
          name: 'description',
          type: 'string',
          required: true,
          description: 'Explains what the action will do.',
        },
        {
          name: 'trigger',
          type: 'RemixNode',
          required: false,
          description: 'Contents of the button that opens the modal.',
        },
        {
          name: 'triggerVariant / triggerSize',
          type: 'Button props',
          required: false,
          description: 'Appearance of the trigger.',
        },
        {
          name: 'confirmLabel',
          type: 'string',
          required: true,
          description: 'Label for the confirmation button.',
        },
        {
          name: 'cancelLabel',
          type: 'string',
          required: false,
          description: 'Label for the cancel button. Defaults to Cancel.',
        },
        {
          name: 'confirmVariant',
          type: 'ButtonVariant',
          required: false,
          description: 'Confirm button appearance. Defaults to destructive.',
        },
        {
          name: 'onConfirm',
          type: '() => void',
          required: true,
          description: 'Invoked when the confirm action is activated.',
        },
        {
          name: 'open / defaultOpen',
          type: 'boolean',
          required: false,
          description: 'Controlled or initial open state.',
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          required: false,
          description: 'Reports requests to open or close.',
        },
      ],
    },
  ],
  resizable: [
    {
      name: 'Resizable',
      props: [
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Accessible name for the separator.',
        },
        {
          name: 'first / second',
          type: 'RemixNode',
          required: true,
          description: 'The two pane contents, in reading order.',
        },
        {
          name: 'orientation',
          type: "'horizontal' | 'vertical'",
          required: false,
          description: 'Side by side by default. Use vertical to stack the panes.',
        },
        {
          name: 'value / defaultValue',
          type: 'number',
          required: false,
          description: 'Controlled or initial percentage of available space for the first pane.',
        },
        {
          name: 'min / max',
          type: 'number',
          required: false,
          description: 'First pane bounds as percentages. Defaults to 15 and 85.',
        },
        {
          name: 'step',
          type: 'number',
          required: false,
          description: 'Percentage points per arrow key press. Defaults to 5.',
        },
        {
          name: 'onValueChange / onValueCommit',
          type: '(value: number) => void',
          required: false,
          description: 'Reports the percentage as it changes or when a resize finishes.',
        },
        {
          name: 'class',
          type: 'string',
          required: false,
          description: 'Class on the split layout. Give vertical stacks a block size.',
        },
      ],
    },
  ],
  'file-input': [
    {
      name: 'FileInput',
      props: [
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'Visible label associated with the file input.',
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: 'Name used when submitting the form.',
        },
        {
          name: 'accept',
          type: 'string',
          required: false,
          description: 'Comma-separated file extensions and MIME types, including wildcards.',
        },
        {
          name: 'multiple',
          type: 'boolean',
          required: false,
          description: 'Accumulate more than one selected file.',
        },
        {
          name: 'maxFiles',
          type: 'number',
          required: false,
          description: 'Maximum count when multiple is enabled.',
        },
        {
          name: 'maxSize',
          type: 'number',
          required: false,
          description: 'Maximum bytes per file.',
        },
        {
          name: 'required / disabled',
          type: 'boolean',
          required: false,
          description: 'Native form states.',
        },
        {
          name: 'description',
          type: 'RemixNode',
          required: false,
          description: 'Help text associated with the input.',
        },
        {
          name: 'size',
          type: "'default' | 'compact'",
          required: false,
          description: 'Control density.',
        },
        {
          name: 'onFilesChange',
          type: '(files: readonly File[]) => void',
          required: false,
          description: 'Reports the current selection after a change or reset.',
        },
      ],
    },
  ],
  'trigger-menu': [
    {
      name: 'TriggerMenu',
      props: [
        {
          name: 'triggers',
          type: 'readonly TriggerMenuTrigger[]',
          required: true,
          description:
            'Each trigger has a character, an accessible list label and items with a label, replacement value and optional description. Typing filters by label and description.',
        },
        {
          name: 'renderField',
          type: '(props: TriggerMenuFieldProps) => RemixNode',
          required: true,
          description:
            'Spread the supplied attributes and mix onto a textarea. Run the mix before custom key handling.',
        },
      ],
    },
  ],
  progress: [
    {
      name: 'Progress',
      props: [
        {
          name: 'label',
          required: true,
          type: 'string',
          description: 'Visible and accessible name.',
        },
        {
          name: 'value',
          required: false,
          type: 'number',
          description: 'Completed work. Omit to show indeterminate progress.',
        },
        {
          name: 'max',
          required: false,
          type: 'number',
          description: 'Total work. Defaults to 100.',
        },
        {
          name: 'size',
          required: false,
          type: "'default' | 'compact'",
          description: 'Bar thickness.',
        },
        {
          name: 'showValue',
          required: false,
          type: 'boolean',
          description: 'Shows the percentage beside the label when the value is known.',
        },
      ],
    },
  ],
  'number-field': [
    {
      name: 'NumberField',
      props: [
        {
          name: 'label',
          required: true,
          type: 'string',
          description: 'Visible label associated with the numeric input.',
        },
        {
          name: 'name',
          required: false,
          type: 'string',
          description: 'Name used when submitting the form.',
        },
        {
          name: 'value',
          required: false,
          type: 'number | null',
          description: 'Controlled value. Use null for an empty field.',
        },
        {
          name: 'defaultValue',
          required: false,
          type: 'number',
          description: 'Initial uncontrolled value, restored on form reset.',
        },
        {
          name: 'min / max / step',
          required: false,
          type: 'number',
          description: 'Native number bounds and increment. The default step is 1.',
        },
        {
          name: 'scrub',
          required: false,
          type: 'boolean',
          description: 'Drag the label horizontally to step through values.',
        },
        {
          name: 'description / error',
          required: false,
          type: 'RemixNode',
          description: 'Associated help or validation text.',
        },
        {
          name: 'size',
          required: false,
          type: "'default' | 'compact'",
          description: 'Control density.',
        },
        {
          name: 'required / disabled / readOnly',
          required: false,
          type: 'boolean',
          description: 'Native input states.',
        },
        {
          name: 'onValueChange',
          required: false,
          type: '(value: number | null) => void',
          description: 'Called when the number changes. Empty input reports null.',
        },
      ],
    },
  ],
  carousel: [
    {
      name: 'Carousel',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Names the carousel, such as "Featured projects".',
          required: true,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'The slides, one per child.',
          required: false,
        },
        {
          name: 'slideLabels',
          type: 'string[]',
          description:
            'Names each slide, for its announcement, such as “Shared hover, 2 of 4”, and its dot.',
          required: false,
        },
        {
          name: 'index',
          type: 'number',
          description: 'The current slide, when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultIndex',
          type: 'number',
          description: 'The slide shown first when uncontrolled. Default 0.',
          required: false,
        },
        {
          name: 'onIndexChange',
          type: '((index: number) => void)',
          description:
            'Called when a button, a dot, a drag, a scroll or autoplay changes the slide.',
          required: false,
        },
        {
          name: 'dots',
          type: 'boolean',
          description: 'Shows CarouselDots under the slides. Default true.',
          required: false,
        },
        {
          name: 'controls',
          type: 'boolean',
          description: 'Shows previous and next buttons. Default true.',
          required: false,
        },
        {
          name: 'autoplay',
          type: '{ duration: number }',
          description:
            'Moves on after this many milliseconds, timed and shown by the dots, with a button to pause.',
          required: false,
        },
        {
          name: 'align',
          type: '"start" | "center"',
          description: 'Where a slide comes to rest. Default start.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Tightens the controls.',
          required: false,
        },
      ],
    },
  ],
  'chat-layout': [
    {
      name: 'ChatLayout',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'The messages, usually ChatMessage elements, oldest first.',
          required: false,
        },
        {
          name: 'composer',
          type: 'RemixNode',
          description: 'Docked below the transcript, usually an InputMessage.',
          required: false,
        },
        {
          name: 'header',
          type: 'RemixNode',
          description: 'Above the transcript, such as a title or the people in the chat.',
          required: false,
        },
        {
          name: 'empty',
          type: 'RemixNode',
          description: 'Shown in place of the transcript until the first message.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Names the transcript, a log. Default "Conversation".',
          required: false,
        },
        {
          name: 'scroll',
          type: '"follow" | "anchor"',
          description:
            'follow keeps the newest message in view. anchor glides a message the reader sends to the top of the view and grows its reply below it, then follows once the reply fills the view. Default follow.',
          required: false,
        },
        {
          name: 'busy',
          type: 'boolean',
          description:
            'Set while a reply streams: the log is aria-busy, so assistive technology reads the reply once it is complete.',
          required: false,
        },
        {
          name: 'class',
          type: 'string',
          description:
            'Extra classes on the layout. Set --rf-chat-width for the column width; default 720px.',
          required: false,
        },
      ],
    },
  ],
  avatar: [
    {
      name: 'Avatar',
      props: [
        {
          name: 'name',
          type: 'string',
          description: 'Who or what it shows: the accessible name, and the source of the initials.',
          required: true,
        },
        {
          name: 'src',
          type: 'string',
          description: 'An image. Until it loads, or if it fails, the initials show.',
          required: false,
        },
        {
          name: 'size',
          type: 'number',
          description: 'Width and height in pixels. Default 32.',
          required: false,
        },
        {
          name: 'shape',
          type: '"circle" | "square"',
          description: 'Square suits teams, organisations and agents. Default circle.',
          required: false,
        },
        {
          name: 'color',
          type: 'BadgeColor',
          description:
            'The initials’ colour. Defaults to one picked from the name, the same every time.',
          required: false,
        },
        {
          name: 'status',
          type: '"online" | "away" | "busy" | "offline"',
          description: 'A dot in the corner, named with the avatar.',
          required: false,
        },
        {
          name: 'decorative',
          type: 'boolean',
          description:
            'Hides the avatar from assistive technology, for when the name is written beside it.',
          required: false,
        },
      ],
    },
    {
      name: 'AvatarGroup',
      props: [
        {
          name: 'avatars',
          type: 'AvatarProps[]',
          description: 'The people or things in the group, without size or shape.',
          required: true,
        },
        {
          name: 'max',
          type: 'number',
          description: 'How many avatars show, the count of the rest included. Default 4.',
          required: false,
        },
        {
          name: 'size',
          type: 'number',
          description: 'Each avatar’s size in pixels. Default 32.',
          required: false,
        },
        {
          name: 'shape',
          type: '"circle" | "square"',
          description: 'Each avatar’s shape. Default circle.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Names the group. Defaults to the number of people.',
          required: false,
        },
      ],
    },
  ],
  confirmation: [
    {
      name: 'Confirmation',
      props: [
        {
          name: 'title',
          type: 'RemixNode',
          description: 'The question, phrased so Approve and Deny answer it.',
          required: true,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'What approving does, or why it is asked.',
          required: false,
        },
        {
          name: 'state',
          type: '"requested" | "approved" | "denied"',
          description:
            'The answer, when the app keeps it. Without it, Confirmation keeps the answer itself after calling onApprove or onDeny.',
          required: false,
        },
        {
          name: 'onApprove',
          type: '() => void',
          description: 'Called when Approve is pressed.',
          required: false,
        },
        {
          name: 'onDeny',
          type: '() => void',
          description: 'Called when Deny is pressed.',
          required: false,
        },
        {
          name: 'approveLabel',
          type: 'string',
          description: 'The approve button. Default Approve.',
          required: false,
        },
        {
          name: 'denyLabel',
          type: 'string',
          description: 'The deny button. Default Deny.',
          required: false,
        },
        {
          name: 'approvedLabel',
          type: 'string',
          description: 'Shown once approved. Default Approved.',
          required: false,
        },
        {
          name: 'deniedLabel',
          type: 'string',
          description: 'Shown once denied. Default Denied.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description:
            'Submits approved or denied with a surrounding form once answered; unanswered, the field is absent.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Replaces the status icon, to name the action.',
          required: false,
        },
        {
          name: 'status',
          type: '"default" | "info" | "success" | "warning" | "error"',
          description: 'Banner status, such as warning for a risky action. Default default.',
          required: false,
        },
        {
          name: 'contrast',
          type: '"low" | "high"',
          description: 'Banner surface contrast.',
          required: false,
        },
        {
          name: 'variant',
          type: '"inline" | "fixed"',
          description: 'Banner placement style.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Overrides the surrounding density.',
          required: false,
        },
      ],
    },
  ],
  citation: [
    {
      name: 'Citation',
      props: [
        {
          name: 'sources',
          type: 'CitationSource | CitationSource[]',
          description: 'The source, or several sources cited together.',
          required: true,
        },
        {
          name: 'index',
          type: 'number',
          description:
            'The first source’s number; several sources take the numbers that follow. Default 1.',
          required: false,
        },
        {
          name: 'variant',
          type: '"number" | "site"',
          description:
            'number shows the source numbers; site shows the first site’s name and how many more. Default number.',
          required: false,
        },
        {
          name: 'target',
          type: 'string',
          description: 'Where links open, such as _blank, which also sets a safe rel.',
          required: false,
        },
        {
          name: 'placement',
          type: 'PopoverPlacement',
          description:
            'Which side of the chip the preview opens on, flipping when there is no room. Default top.',
          required: false,
        },
        {
          name: 'openDelay',
          type: 'number',
          description:
            'Milliseconds the pointer rests on the chip before the preview opens. Default 300.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Tightens the chip and the preview.',
          required: false,
        },
      ],
    },
    {
      name: 'CitationSource',
      props: [
        {
          name: 'title',
          type: 'string',
          description: 'The source’s title, linked in the preview.',
          required: true,
        },
        {
          name: 'href',
          type: 'string',
          description: 'The source’s address; the chip links to the first source.',
          required: true,
        },
        {
          name: 'site',
          type: 'string',
          description: 'The site’s name. Defaults to the link’s host, without www.',
          required: false,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'A short excerpt shown in the preview, cut to three lines.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'The site’s icon, such as a favicon. Defaults to a globe.',
          required: false,
        },
      ],
    },
  ],
  markdown: [
    {
      name: 'Markdown',
      props: [
        {
          name: 'source',
          type: 'string',
          required: true,
          description:
            'Markdown text. Pass the accumulated text on each streaming update. Raw HTML stays literal. Links support HTTP, HTTPS, mailto, root paths and fragments.',
        },
        {
          name: 'size',
          type: "'default' | 'compact'",
          required: false,
          description: 'Overrides the surrounding type density.',
        },
        {
          name: 'images',
          type: 'boolean | ((src: string) => boolean)',
          required: false,
          description:
            'Which images load inline. By default every image is a link, so rendering loads nothing. true loads same-site paths; a function decides for each safe source. Refused images stay links.',
        },
        {
          name: 'class',
          type: 'string',
          required: false,
          description: 'Adds a class to the container.',
        },
      ],
    },
  ],
  'code-block': [
    {
      name: 'CodeBlock',
      props: [
        {
          name: 'code',
          type: 'string | HighlightedCode',
          description: 'Plain code, or code from highlight() in @rtzll/reflow/highlight.',
          required: true,
        },
        {
          name: 'filename',
          type: 'string',
          description: 'Shown in the header, and names the code region.',
          required: false,
        },
        {
          name: 'language',
          type: 'string',
          description:
            'Shown in the header when there is no filename. Defaults to the highlighted language.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description:
            'Names the code region. Defaults to the filename, or the language followed by "code".',
          required: false,
        },
        {
          name: 'lineNumbers',
          type: 'boolean',
          description: 'Numbers the lines, in a gutter that copying skips.',
          required: false,
        },
        {
          name: 'startLine',
          type: 'number',
          description: 'The first line’s number. Default 1.',
          required: false,
        },
        {
          name: 'wrap',
          type: 'boolean',
          description: 'Wraps long lines instead of scrolling them sideways.',
          required: false,
        },
        {
          name: 'maxLines',
          type: 'number',
          description: 'Folds longer code to this many lines behind a Show all button.',
          required: false,
        },
        {
          name: 'copyable',
          type: 'boolean',
          description: 'Shows the copy button. Default true.',
          required: false,
        },
        {
          name: 'onCopy',
          type: '(() => void)',
          description: 'Called after the code is copied.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Tightens the type, line height and padding.',
          required: false,
        },
      ],
    },
    {
      name: 'highlight()',
      props: [
        {
          name: 'code',
          type: 'string',
          description: 'The code to highlight.',
          required: true,
        },
        {
          name: 'lang',
          type: 'string',
          description:
            'Any language Shiki bundles, or an alias such as ts or py. Unknown languages render as plain text. Default text.',
          required: false,
        },
        {
          name: 'theme',
          type: 'BundledTheme | ThemeRegistration',
          description:
            'A Shiki theme. Defaults to Reflow’s, which colours tokens with --rf-code-token-* CSS variables.',
          required: false,
        },
        {
          name: 'themes',
          type: '{ light: Theme; dark: Theme }',
          description: 'A light and a dark theme; the block follows the page between them.',
          required: false,
        },
        {
          name: 'notation',
          type: 'boolean',
          description:
            'Reads // [!code highlight], ++, --, focus, error, warning and word:name comments into line and word marks, and removes them. Default true.',
          required: false,
        },
        {
          name: 'transformers',
          type: 'ShikiTransformer[]',
          description: 'More Shiki transformers, run after the notation ones.',
          required: false,
        },
      ],
    },
  ],
  drawer: [
    {
      name: 'Drawer',
      props: [
        {
          name: 'title',
          type: 'string',
          description: 'Names the drawer, shown as its heading.',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Supporting text under the title, announced with the drawer.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'The drawer content.',
          required: false,
        },
        {
          name: 'footer',
          type: 'RemixNode | ((close: () => void) => RemixNode)',
          description: 'Footer actions; a callback receives a function that closes the drawer.',
          required: false,
        },
        {
          name: 'trigger',
          type: 'RemixNode',
          description: 'Contents of the button that opens the drawer.',
          required: false,
        },
        {
          name: 'triggerVariant',
          type: 'ButtonProps["variant"]',
          description: 'The trigger button variant. Default tertiary.',
          required: false,
        },
        {
          name: 'triggerSize',
          type: 'ButtonProps["size"]',
          description: 'The trigger button size.',
          required: false,
        },
        {
          name: 'renderTrigger',
          type: '(props: DrawerTriggerProps) => RemixNode',
          description:
            'Renders your own trigger instead of the built-in button; spread the props onto it.',
          required: false,
        },
        {
          name: 'flush',
          type: 'boolean',
          description:
            'Lets the content fill the panel edge to edge and visually hides the title, which still names the drawer.',
          required: false,
        },
        {
          name: 'class',
          type: 'string',
          description: 'Extra classes on the panel.',
          required: false,
        },
        {
          name: 'side',
          type: '"bottom" | "top" | "left" | "right"',
          description: 'The edge the drawer slides in from. Default bottom.',
          required: false,
        },
        {
          name: 'handle',
          type: 'boolean',
          description: 'Shows a grab handle. Default true for dismissible top and bottom drawers.',
          required: false,
        },
        {
          name: 'showCloseButton',
          type: 'boolean',
          description: 'Shows a close button. Default true for left and right drawers.',
          required: false,
        },
        {
          name: 'dismissible',
          type: 'boolean',
          description:
            'Whether Escape, a click on the backdrop or a drag can close it. Default true.',
          required: false,
        },
        {
          name: 'snapPoints',
          type: 'readonly (number | `${number}px`)[]',
          description:
            'Resting heights for a top or bottom drawer, smallest first: a share of the viewport such as 0.4, or pixels such as "320px". The panel is as tall as the largest.',
          required: false,
        },
        {
          name: 'snap',
          type: 'number',
          description: 'The index of the current snap point, when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultSnap',
          type: 'number',
          description: 'The snap point it opens at when uncontrolled. Default 0.',
          required: false,
        },
        {
          name: 'onSnapChange',
          type: '((index: number) => void)',
          description: 'Called when a drag, the handle or its arrow keys move to another point.',
          required: false,
        },
        {
          name: 'scaleBackground',
          type: 'boolean',
          description:
            'Scales the element marked data-rf-drawer-background back while a bottom drawer is open, as iOS sheets do.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description: 'Whether the drawer is open, when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          description: 'Whether the drawer starts open when uncontrolled.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '((open: boolean) => void)',
          description:
            'Called when the trigger, Escape, the backdrop, a drag or close() opens or closes the drawer.',
          required: false,
        },
      ],
    },
  ],
  toaster: [
    {
      name: 'Toaster',
      props: [
        {
          name: 'position',
          type: 'ToasterPosition',
          description:
            'Where the stack sits: top-left, top-center, top-right, bottom-left, bottom-center or bottom-right. Default bottom-right.',
          required: false,
        },
        {
          name: 'expand',
          type: 'boolean',
          description: 'Show the stack spread out instead of piled. Default false.',
          required: false,
        },
        {
          name: 'visibleToasts',
          type: 'number',
          description: 'How many toasts stay in view; older ones wait behind them. Default 3.',
          required: false,
        },
        {
          name: 'duration',
          type: 'number',
          description: 'Milliseconds each toast stays before closing on its own. Default 4000.',
          required: false,
        },
        {
          name: 'closeButton',
          type: 'boolean',
          description: 'Gives every dismissible toast a close button. Default false.',
          required: false,
        },
        {
          name: 'hotkey',
          type: 'string',
          description:
            'Moves focus to the newest toast. F6 also moves into the stack and back. Default alt+t.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Names the notifications region. Default "Notifications".',
          required: false,
        },
        {
          name: 'offset',
          type: 'number',
          description:
            'Distance from the viewport edges in pixels. Default 24, or 16 on narrow screens.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Tightens the toast padding and icons.',
          required: false,
        },
      ],
    },
    {
      name: 'toast()',
      props: [
        {
          name: 'toast',
          type: '(title: RemixNode, options?: ToastOptions) => string',
          description: 'Raises a toast and returns its id.',
          required: false,
        },
        {
          name: 'toast.success',
          type: '(title, options?) => string',
          description:
            'A success toast. toast.info, toast.warning and toast.error work the same way.',
          required: false,
        },
        {
          name: 'toast.loading',
          type: '(title, options?) => string',
          description: 'A toast with a spinner that stays until updated or dismissed.',
          required: false,
        },
        {
          name: 'toast.promise',
          type: '(promise, { loading, success, error, description? }, options?) => string',
          description:
            'One toast that follows a promise, or a function returning one, from loading to success or error. success and error take a value or a function of the result.',
          required: false,
        },
        {
          name: 'toast.dismiss',
          type: '(id?: string) => void',
          description: 'Closes one toast, or all of them without an id.',
          required: false,
        },
      ],
    },
    {
      name: 'ToastOptions',
      props: [
        {
          name: 'id',
          type: 'string',
          description: 'Reuse an id to update a toast in place instead of adding another.',
          required: false,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Supporting text under the title.',
          required: false,
        },
        {
          name: 'duration',
          type: 'number',
          description:
            'Milliseconds before it closes on its own; Infinity keeps it until dismissed. Defaults to the Toaster duration.',
          required: false,
        },
        {
          name: 'action',
          type: '{ label: string; onClick: (event: MouseEvent) => void }',
          description:
            'A button beside the text. The toast closes after it runs, unless the handler calls event.preventDefault().',
          required: false,
        },
        {
          name: 'dismissible',
          type: 'boolean',
          description: 'Whether a swipe, Escape or the close button can close it. Default true.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Replaces the status icon.',
          required: false,
        },
        {
          name: 'onDismiss',
          type: '(toast: Toast) => void',
          description:
            'Called when the toast is closed by a swipe, Escape, the close button, an action or toast.dismiss.',
          required: false,
        },
        {
          name: 'onAutoClose',
          type: '(toast: Toast) => void',
          description: 'Called when the toast closes on its own after its duration.',
          required: false,
        },
      ],
    },
  ],
  'hover-card': [
    {
      name: 'HoverCard',
      props: [
        {
          name: 'renderTrigger',
          type: '(props: HoverCardTriggerProps) => RemixNode',
          description: 'Renders the trigger, usually a link; spread the props onto it.',
          required: true,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'The card content.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description: 'Whether the card is open, when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          description: 'Whether the card starts open when uncontrolled.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '((open: boolean) => void)',
          description: 'Called when hovering, focus or Escape opens or closes the card.',
          required: false,
        },
        {
          name: 'placement',
          type: 'PopoverPlacement',
          description:
            'Which side of the trigger the card opens on, flipping when there is no room. Default bottom.',
          required: false,
        },
        {
          name: 'offset',
          type: 'number',
          description: 'Distance from the trigger in pixels. Default 8.',
          required: false,
        },
        {
          name: 'openDelay',
          type: 'number',
          description:
            'Milliseconds the pointer rests on the trigger, or focus stays on it, before the card opens. Default 500.',
          required: false,
        },
        {
          name: 'closeDelay',
          type: 'number',
          description:
            'Milliseconds after the pointer leaves the trigger and the card before it closes. Default 200.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Tightens the card padding.',
          required: false,
        },
      ],
    },
  ],
  popover: [
    {
      name: 'Popover',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Names the panel when it has no visible title.',
          required: false,
        },
        {
          name: 'title',
          type: 'RemixNode',
          description: 'A visible heading that names the panel.',
          required: false,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Supporting text under the title, announced with the panel.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'The panel content.',
          required: false,
        },
        {
          name: 'trigger',
          type: 'RemixNode',
          description: 'Contents of the button that opens the panel.',
          required: false,
        },
        {
          name: 'triggerVariant',
          type: 'ButtonProps["variant"]',
          description: 'Appearance of the built-in trigger button. Default secondary.',
          required: false,
        },
        {
          name: 'triggerSize',
          type: 'ButtonProps["size"]',
          description: 'Size of the built-in trigger button.',
          required: false,
        },
        {
          name: 'renderTrigger',
          type: '(props: PopoverTriggerProps) => RemixNode',
          description: 'Renders your own trigger; spread the props onto a focusable element.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description: 'Whether the panel is open, when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          description: 'Whether the panel starts open when uncontrolled.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '((open: boolean) => void)',
          description:
            'Called when the trigger, Escape or an outside click opens or closes the panel.',
          required: false,
        },
        {
          name: 'placement',
          type: 'PopoverPlacement',
          description:
            'Which side of the trigger the panel opens on, flipping when there is no room. Default bottom.',
          required: false,
        },
        {
          name: 'offset',
          type: 'number',
          description: 'Distance from the trigger in pixels. Default 8.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Tightens the panel padding and the built-in trigger.',
          required: false,
        },
      ],
    },
  ],
  'radio-group': [
    {
      name: 'RadioGroup',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'required',
          type: 'boolean',
          description: 'Requires a value when submitting the form.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'options',
          type: 'readonly GroupOption[]',
          description: 'Choices available to the user.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'hideLabel',
          type: 'boolean',
          description:
            'Keeps the label available to assistive technology while hiding it visually.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'orientation',
          type: '"horizontal" | "vertical"',
          description: 'Layout direction.',
          required: false,
        },
      ],
    },
    {
      name: 'GroupOption',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Value submitted for this option.',
          required: true,
        },
        {
          name: 'label',
          type: 'RemixNode',
          description: 'Visible option label.',
          required: true,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
      ],
    },
  ],
  'segmented-control': [
    {
      name: 'SegmentedControl',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Names the group for screen readers.',
          required: true,
        },
        {
          name: 'options',
          type: 'readonly SegmentedControlOption[]',
          description: 'The segments, in order.',
          required: true,
        },
        {
          name: 'value',
          type: 'string',
          description: 'The selected option when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description:
            'The option selected first when uncontrolled. Defaults to the first enabled option, so the control is never empty.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string) => void)',
          description: 'Called when the selection changes.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Submits the selected value with a surrounding form.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Disables every segment.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Pins the control to 36px with 28px segments, or 28px with 24px.',
          required: false,
        },
        {
          name: 'fill',
          type: 'boolean',
          description: 'Stretches the control to its container, with equal-width segments.',
          required: false,
        },
      ],
    },
    {
      name: 'SegmentedControlOption',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'The value the segment selects and submits.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description:
            'The segment text; for an icon-only segment, its accessible name and tooltip.',
          required: true,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Leading icon.',
          required: false,
        },
        {
          name: 'iconOnly',
          type: 'boolean',
          description:
            'Shows only the icon; the label stays for screen readers and appears in a tooltip.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Makes the segment unavailable.',
          required: false,
        },
      ],
    },
  ],
  select: [
    {
      name: 'Select',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'options',
          type: 'readonly ChoiceOption[]',
          description: 'Choices available to the user.',
          required: true,
        },
        {
          name: 'name',
          type: 'string',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | null',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string | null) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'Hint shown while the value is empty.',
          required: false,
        },
        {
          name: 'variant',
          type: '"ghost" | "bordered"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
      ],
    },
    {
      name: 'ChoiceOption',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Value submitted when this option is selected.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Text shown for the option.',
          required: true,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'searchValue',
          type: 'string | string[]',
          description: 'Additional text matched by filtering or typeahead.',
          required: false,
        },
        {
          name: 'group',
          type: 'string',
          description: 'Label for a contiguous group of options in Select.',
          required: false,
        },
      ],
    },
  ],
  sidebar: [
    {
      name: 'Sidebar',
      props: [
        {
          name: 'sections',
          type: 'readonly SidebarSection[]',
          description: 'Navigation groups and their items.',
          required: true,
        },
        {
          name: 'activeHref',
          type: 'string',
          description: 'URL of the active navigation item.',
          required: false,
        },
        {
          name: 'header',
          type: 'RemixNode',
          description: 'Content above the navigation.',
          required: false,
        },
        {
          name: 'footer',
          type: 'RemixNode',
          description: 'Footer content or actions.',
          required: false,
        },
        {
          name: 'toolbar',
          type: 'RemixNode',
          description: 'Breadcrumbs or actions alongside the built-in navigation button.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Content rendered inside the component.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'variant',
          type: '"default" | "floating" | "inset"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'defaultWidth',
          type: 'number',
          description: 'Initial sidebar width in pixels.',
          required: false,
        },
        {
          name: 'minWidth',
          type: 'number',
          description: 'Minimum sidebar width in pixels.',
          required: false,
        },
        {
          name: 'maxWidth',
          type: 'number',
          description: 'Maximum sidebar width in pixels.',
          required: false,
        },
        {
          name: 'defaultCollapsed',
          type: 'boolean',
          description: 'Starts with the navigation collapsed.',
          required: false,
        },
        {
          name: 'peek',
          type: '"none" | "hover" | "click"',
          description:
            'Temporarily reveals the collapsed rail from its edge. Escape/outside press dismiss; Pin sidebar expands it.',
          required: false,
        },
        {
          name: 'fixed',
          type: 'boolean',
          description: 'Renders a fixed rail without resizing or collapsing controls.',
          required: false,
        },
        {
          name: 'searchable',
          type: 'boolean',
          description: 'Enables filtering.',
          required: false,
        },
        {
          name: 'searchShortcut',
          type: 'string | null',
          description:
            'Key hint shown in the search field on hover or focus. Pass null to drop it.',
          required: false,
        },
        {
          name: 'searchActions',
          type: 'RemixNode',
          description: 'Header actions shown after the search field.',
          required: false,
        },
        {
          name: 'onWidthChange',
          type: '((width: number) => void)',
          description: 'Called after the sidebar is resized.',
          required: false,
        },
        {
          name: 'callout',
          type: 'RemixNode',
          description: 'Additional content below sidebar navigation.',
          required: false,
        },
      ],
    },
    {
      name: 'SidebarSection',
      props: [
        {
          name: 'collapsible',
          type: 'boolean',
          description: 'Set false for a static section heading.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Heading for this navigation group.',
          required: false,
        },
        {
          name: 'items',
          type: 'readonly SidebarItem[]',
          description: 'Items and their content.',
          required: true,
        },
        {
          name: 'defaultCollapsed',
          type: 'boolean',
          description: 'Starts the navigation group collapsed.',
          required: false,
        },
        {
          name: 'actions',
          type: 'RemixNode',
          description: 'Actions displayed beside the message or composer.',
          required: false,
        },
      ],
    },
    {
      name: 'SidebarItem',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'href',
          type: 'string',
          description:
            'Destination of the navigation link. Omit on a row with children to fold and unfold them instead of navigating.',
          required: false,
        },
        {
          name: 'badge',
          type: 'RemixNode',
          description: 'Small status or count displayed with a navigation item.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'status',
          type: '"active" | "unread" | "idle"',
          description: 'Status dot in the icon column: active and unread fill it, idle rings it.',
          required: false,
        },
        {
          name: 'onClick',
          type: '((event: MouseEvent) => void)',
          description: 'Optional click handler for application navigation.',
          required: false,
        },
        {
          name: 'children',
          type: 'readonly SidebarItem[]',
          description: 'Nested navigation items.',
          required: false,
        },
        {
          name: 'defaultExpanded',
          type: 'boolean',
          description: 'Initial expansion state of the nested navigation.',
          required: false,
        },
        {
          name: 'actions',
          type: 'RemixNode',
          description: 'Row actions revealed on hover or focus.',
          required: false,
        },
        {
          name: 'actionCount',
          type: 'number',
          description: 'How many 24px actions are in actions, so the label leaves room for them.',
          required: false,
        },
      ],
    },
  ],
  slider: [
    {
      name: 'Slider',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'showLabel',
          type: 'boolean',
          description:
            'Shows the visible label above the slider while keeping the accessible name.',
          required: false,
        },
        {
          name: 'name',
          type: 'string | [string, string]',
          description: 'Name used when the control participates in a form.',
          required: false,
        },
        {
          name: 'value',
          type: 'SliderValue',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'SliderValue',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'onChange',
          type: '((value: SliderValue) => void)',
          description: 'Called with the updated value.',
          required: false,
        },
        {
          name: 'min',
          type: 'number',
          description: 'Minimum allowed value.',
          required: false,
        },
        {
          name: 'max',
          type: 'number',
          description: 'Maximum allowed value.',
          required: false,
        },
        {
          name: 'step',
          type: 'number',
          description: 'Increment between allowed values.',
          required: false,
        },
        {
          name: 'steps',
          type: 'number[]',
          description: 'Explicit allowed values, including non-uniform steps.',
          required: false,
        },
        {
          name: 'showSteps',
          type: 'boolean',
          description: 'Draws a marker at each step.',
          required: false,
        },
        {
          name: 'showValue',
          type: 'boolean',
          description: 'Displays an editable numeric value.',
          required: false,
        },
        {
          name: 'valuePosition',
          type: 'ValuePosition',
          description: 'Placement of the value display.',
          required: false,
        },
        {
          name: 'formatValue',
          type: '((value: number) => string)',
          description: 'Formats the displayed number.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'variant',
          type: '"pips" | "scrubber"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
        {
          name: 'hideFill',
          type: 'boolean',
          description: 'Hides the slider fill.',
          required: false,
        },
        {
          name: 'thumbColor',
          type: 'string',
          description: 'Custom slider thumb color.',
          required: false,
        },
        {
          name: 'thumbBorderColor',
          type: 'string',
          description: 'Custom slider thumb outline.',
          required: false,
        },
        {
          name: 'trackStyle',
          type: 'Record<string, string | number>',
          description: 'Extra CSS on the track line, for gradients behind the thumb.',
          required: false,
        },
      ],
    },
  ],
  switch: [
    {
      name: 'Switch',
      props: [
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The `disabled` HTML attribute.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'The `name` HTML attribute.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | number',
          description: 'The `value` HTML attribute.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'checked',
          type: 'boolean',
          description: 'The `checked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description: 'The `defaultChecked` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string | number',
          description: 'The `defaultValue` HTML attribute.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'The `placeholder` HTML attribute.',
          required: false,
        },
        {
          name: 'required',
          type: 'boolean',
          description: 'The `required` HTML attribute.',
          required: false,
        },
        {
          name: 'label',
          type: 'RemixNode',
          description: 'Accessible name or visible label for the control.',
          required: false,
        },
        {
          name: 'onCheckedChange',
          type: '((checked: boolean, event: Event) => void)',
          description: 'Called when the checked state changes.',
          required: false,
        },
      ],
    },
  ],
  table: [
    {
      name: 'Table',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'fluidHover',
          type: 'boolean',
          description: 'Enables the shared moving hover surface.',
          required: false,
        },
      ],
    },
    {
      name: 'TableRow',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Child nodes to render inside the element.',
          required: false,
        },
        {
          name: 'selected',
          type: 'boolean',
          description: 'Marks the item as selected.',
          required: false,
        },
        {
          name: 'hover',
          type: 'boolean',
          description: 'Enables row hover feedback.',
          required: false,
        },
      ],
    },
    {
      name: 'TableEmpty',
      props: [
        {
          name: 'colSpan',
          type: 'number',
          description: 'Number of table columns the empty state spans.',
          required: true,
        },
        {
          name: 'title',
          type: 'RemixNode',
          description: 'Heading displayed by the component.',
          required: false,
        },
        {
          name: 'description',
          type: 'RemixNode',
          description: 'Additional explanatory text.',
          required: false,
        },
        {
          name: 'action',
          type: 'RemixNode',
          description: 'Optional action control shown below the empty-state message.',
          required: false,
        },
      ],
    },
  ],
  tabs: [
    {
      name: 'Tabs',
      props: [
        {
          name: 'label',
          type: 'string',
          description: 'Accessible name or visible label for the control.',
          required: true,
        },
        {
          name: 'items',
          type: 'readonly TabItem[]',
          description: 'Items and their content.',
          required: true,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Initial value for an uncontrolled component.',
          required: false,
        },
        {
          name: 'value',
          type: 'string',
          description: 'Current value when controlled by the parent.',
          required: false,
        },
        {
          name: 'onValueChange',
          type: '((value: string) => void)',
          description: 'Called when the selected value changes.',
          required: false,
        },
        {
          name: 'variant',
          type: '"pill" | "underline"',
          description: 'Visual or layout treatment.',
          required: false,
        },
        {
          name: 'activeLabel',
          type: 'boolean',
          description: 'Shows the label only for the active tab.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
      ],
    },
    {
      name: 'TabItem',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Unique identifier for the tab and its associated panel.',
          required: true,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Text of the tab trigger.',
          required: true,
        },
        {
          name: 'panel',
          type: 'RemixNode',
          description: 'Content of the selected tab panel.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'Prevents interaction and conveys the disabled state.',
          required: false,
        },
      ],
    },
  ],
  textarea: [
    {
      name: 'Textarea',
      props: [
        {
          name: 'children',
          type: 'undefined',
          description: 'Textarea content comes from `value` or `defaultValue`.',
          required: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'The `disabled` HTML attribute.',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: 'The `name` HTML attribute.',
          required: false,
        },
        {
          name: 'value',
          type: 'string | number',
          description: 'The `value` HTML attribute.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string | number',
          description: 'The `defaultValue` HTML attribute.',
          required: false,
        },
        {
          name: 'placeholder',
          type: 'string',
          description: 'The `placeholder` HTML attribute.',
          required: false,
        },
        {
          name: 'required',
          type: 'boolean',
          description: 'The `required` HTML attribute.',
          required: false,
        },
        {
          name: 'rows',
          type: 'number',
          description: 'The `rows` HTML attribute.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Control density or icon-button dimensions.',
          required: false,
        },
        {
          name: 'autoResize',
          type: 'boolean',
          description: 'Grows the textarea with its contents.',
          required: false,
        },
      ],
    },
  ],
  'thinking-indicator': [
    {
      name: 'ThinkingIndicator',
      props: [
        {
          name: 'labels',
          type: 'readonly string[]',
          description: 'Status words rotated through the indicator.',
          required: false,
        },
        {
          name: 'interval',
          type: 'number',
          description: 'Time between label changes in milliseconds.',
          required: false,
        },
        {
          name: 'showIcon',
          type: 'boolean',
          description: 'Displays the animated status icon.',
          required: false,
        },
      ],
    },
  ],
  'thinking-steps': [
    {
      name: 'ThinkingSteps',
      props: [
        {
          name: 'open',
          type: 'boolean',
          description: 'Controls the labeled disclosure from its parent.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          description: 'Called when the disclosure requests a change.',
          required: false,
        },
        {
          name: 'size',
          type: '"default" | "compact"',
          description: 'Sets the size used by the group and its rows.',
          required: false,
        },
        {
          name: 'steps',
          type: 'readonly ThinkingStep[]',
          description: 'Ordered steps with disclosure content and progress status.',
          required: false,
        },
        {
          name: 'heading',
          type: 'RemixNode',
          description: 'Custom non-interactive heading for the disclosure.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Custom disclosure body in place of the generated step list.',
          required: false,
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'Identifier of the step initially expanded in the accordion.',
          required: false,
        },
        {
          name: 'label',
          type: 'string',
          description: 'Optional heading that wraps the step list in a disclosure.',
          required: false,
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          description:
            'Initial expansion state of the labeled outer disclosure. The timeline starts open by default.',
          required: false,
        },
        {
          name: 'variant',
          type: '"accordion" | "timeline"',
          description: 'Display steps as individual disclosures or as a continuous timeline.',
          required: false,
        },
      ],
    },
    {
      name: 'ThinkingStep',
      props: [
        {
          name: 'value',
          type: 'string',
          description: 'Unique identifier for the step and its disclosure.',
          required: true,
        },
        {
          name: 'title',
          type: 'string',
          description: 'Title of the step.',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Muted supporting text below the title in the timeline.',
          required: false,
        },
        {
          name: 'content',
          type: 'RemixNode',
          description: 'Text, images, sources, or nested disclosure content.',
          required: false,
        },
        {
          name: 'icon',
          type: 'RemixNode',
          description: 'Decorative icon in the timeline. Steps without icons show a dot.',
          required: false,
        },
        {
          name: 'status',
          type: '"active" | "pending" | "complete"',
          description:
            'Progress state. The timeline reveals steps when they become active or complete.',
          required: false,
        },
      ],
    },
    {
      name: 'ThinkingStepDetails',
      props: [
        {
          name: 'summary',
          type: 'string',
          description: 'Label for a nested disclosure.',
          required: true,
        },
        {
          name: 'details',
          type: 'readonly string[]',
          description: 'List of file names, actions or other step details.',
          required: false,
        },
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Optional content inside the disclosure.',
          required: false,
        },
      ],
    },
    {
      name: 'ThinkingStepSources',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Source badges arranged in a wrapping row.',
          required: true,
        },
      ],
    },
    {
      name: 'ThinkingStepSource',
      props: [
        {
          name: 'children',
          type: 'RemixNode',
          description: 'Source label or icon and label.',
          required: true,
        },
        {
          name: 'href',
          type: 'string',
          description: 'Optional destination for a source link.',
          required: false,
        },
        {
          name: 'delay',
          type: 'number',
          description: 'Entry delay in milliseconds.',
          required: false,
        },
      ],
    },
    {
      name: 'ThinkingStepImage',
      props: [
        { name: 'src', type: 'string', description: 'Image URL.', required: true },
        {
          name: 'alt',
          type: 'string',
          description: 'Image description for assistive technology.',
          required: false,
        },
        { name: 'caption', type: 'string', description: 'Text below the image.', required: false },
      ],
    },
  ],
  tooltip: [
    {
      name: 'Tooltip',
      props: [
        {
          name: 'content',
          type: 'RemixNode',
          description: 'Content of the panel, tooltip, or menu item.',
          required: true,
        },
        {
          name: 'renderTrigger',
          type: '(props: TooltipTriggerProps) => RemixNode',
          description: 'Return a focusable element, spreading the provided props onto it.',
          required: true,
        },
        {
          name: 'side',
          type: '"left" | "right" | "top" | "bottom"',
          description: 'Preferred side of the trigger.',
          required: false,
        },
        {
          name: 'sideOffset',
          type: 'number',
          description: 'Gap between the trigger and the popup in pixels.',
          required: false,
        },
        {
          name: 'delayDuration',
          type: 'number',
          description: 'Delay before showing the tooltip in milliseconds.',
          required: false,
        },
        {
          name: 'followCursor',
          type: 'boolean',
          description: 'Positions the tooltip near the pointer.',
          required: false,
        },
        {
          name: 'open',
          type: 'boolean',
          description:
            'Forces the tooltip open (true) or closed (false). Leave undefined for hover and focus behaviour.',
          required: false,
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          description:
            'Called when hover or focus opens or closes the tooltip, before open is applied.',
          required: false,
        },
      ],
    },
  ],
}
export const componentDefaults: Record<string, Record<string, string>> = {
  AskUserQuestions: { defaultCurrentIndex: '0', defaultAnswers: '{}' },
  QueuedStack: { label: 'Queued messages' },
  ThinkingStep: { status: 'pending' },
  Accordion: { type: 'single', variant: 'grouped', headingLevel: '3' },
  Badge: { color: 'gray', variant: 'solid' },
  Banner: {
    status: 'default',
    contrast: 'low',
    variant: 'inline',
    dismissLabel: 'Dismiss',
  },
  Breadcrumb: {
    label: 'Breadcrumb',
    separator: 'chevron-right icon',
    collapse: 'false',
    openOnHover: 'false',
  },
  Button: { variant: 'primary' },
  Carousel: { defaultIndex: '0', dots: 'true', controls: 'true', align: 'start' },
  ChatLayout: { label: 'Conversation' },
  Avatar: { size: '32', shape: 'circle' },
  AvatarGroup: { max: '4', size: '32', shape: 'circle' },
  Citation: { index: '1', variant: 'number', placement: 'top', openDelay: '300' },
  CodeBlock: { startLine: '1', copyable: 'true' },
  'highlight()': { lang: 'text', notation: 'true' },
  DataTable: { defaultState: "{ filter: '', sort: null, page: 1 }", loading: 'false' },
  DataTableColumn: { sortable: 'true', rowHeader: 'false' },
  Drawer: {
    side: 'bottom',
    triggerVariant: 'tertiary',
    dismissible: 'true',
  },
  Toaster: {
    position: 'bottom-right',
    visibleToasts: '3',
    duration: '4000',
    hotkey: 'alt+t',
    label: 'Notifications',
    offset: '24',
  },
  BarChart: { showAxes: 'true' },
  TimeGrid: { stepMinutes: '15' },
  Calendar: {
    label: 'Calendar',
    mode: 'single',
    weekStartsOn: '0',
    showWeekNumbers: 'false',
    numberOfMonths: '1',
    orientation: 'horizontal',
    defaultValue: 'null',
  },
  Card: { dismissOnHover: 'true' },
  CardGroup: {
    orientation: 'card',
    columns: '1',
    border: 'none',
    separated: 'false',
    fluidHover: 'true',
  },
  CarouselDots: { label: 'Choose a slide' },
  ChatMessage: { animate: 'true' },
  CheckboxGroup: { orientation: 'vertical' },
  ColorPicker: { label: 'Color' },
  Combobox: { placeholder: 'Choose an option…', variant: 'bordered' },
  CommandMenu: {
    label: 'Command menu',
    placeholder: 'Type a command or search…',
  },
  DatePicker: {
    label: 'Choose a date',
    closeOnSelect: 'true',
    variant: 'outline',
    defaultValue: 'null',
  },
  Dialog: { showCloseButton: 'true', dismissOnBackdrop: 'true' },
  Dropdown: {
    align: 'start',
    variant: 'outline',
    searchPlaceholder: 'Search…',
  },
  Field: { orientation: 'vertical' },
  InputCopy: { variant: 'icon', align: 'right' },
  InputMessage: {
    label: 'Message',
    placeholder: 'Type a message…',
    attachments: 'true',
    minRows: '1',
    maxRows: '8',
    maxFiles: '5',
    filePreviewSize: '80',
    history: '[]',
    suggestions: '[]',
    defaultValue: "''",
  },
  RadioGroup: { orientation: 'vertical' },
  Select: { placeholder: 'Choose an option…', variant: 'bordered' },
  Sidebar: {
    label: 'Workspace',
    defaultWidth: '220',
    minWidth: '160',
    maxWidth: '380',
  },
  Slider: {
    label: 'Value',
    showSteps: 'false',
    showValue: 'true',
    valuePosition: 'left',
    variant: 'pips',
    min: '0',
    max: '100',
    step: '1',
  },
  Table: { fluidHover: 'true' },
  TableRow: { hover: 'true' },
  Textarea: { autoResize: 'true', rows: '3' },
  ThinkingIndicator: { interval: '4000' },
  Tooltip: { side: 'top', sideOffset: '8', delayDuration: '200' },
}
