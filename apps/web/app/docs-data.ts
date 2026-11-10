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

export const componentApi: Record<string, readonly ApiSection[]> = {
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
      ],
    },
  ],
  combobox: [
    {
      name: 'Combobox',
      props: [
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
          name: 'variant',
          type: '"ghost" | "outline"',
          description: 'Visual or layout treatment.',
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
    {
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
          description: 'Icon content.',
          required: false,
        },
        {
          name: 'shortcut',
          type: 'string',
          description: 'Keyboard hint or optional command-palette shortcut.',
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
          type: '"checkbox" | "radio"',
          description: 'Single or multiple expansion mode.',
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
      ],
    },
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
          description: 'Accepted file types passed to the file input.',
          required: false,
        },
        {
          name: 'filePreviewSize',
          type: 'number',
          description: 'Size of image attachment previews in pixels.',
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
          description: 'Moves focus to the newest toast. Default alt+t.',
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
          description: 'Destination of the navigation link.',
          required: true,
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
          description: 'Actions displayed beside the message or composer.',
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
  Citation: { index: '1', variant: 'number', placement: 'top', openDelay: '300' },
  CodeBlock: { startLine: '1', copyable: 'true' },
  'highlight()': { lang: 'text', notation: 'true' },
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
