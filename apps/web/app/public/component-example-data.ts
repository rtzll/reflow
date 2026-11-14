export const inputMessagePrompts = [
  'What is Reflow about?',
  'How does Reflow tune the springs behind these animations?',
  'Install the InputMessage component in my project',
  'Draft a short welcome message for my app',
] as const

export const accordionItems = [
  {
    value: 'item-1',
    title: 'Getting Started',
    content:
      'Install the component and import it into your project. The accordion supports both single and multiple expand modes.',
  },
  {
    value: 'item-2',
    title: 'Styling',
    content:
      'The component integrates with the shape system for rounded, pill or sharp border-radius variants. All animations use spring physics.',
  },
  {
    value: 'item-3',
    title: 'Accessibility',
    content:
      'Built with Remix UI primitives, accessible roles, keyboard navigation, and focus management.',
  },
  {
    value: 'item-4',
    title: 'Animation',
    content:
      'Smooth height transitions and spring-animated chevron rotation. The fluid hover background tracks your cursor.',
  },
]

export const multipleAccordionItems = [
  {
    value: 'item-1',
    title: 'First Section',
    content: 'Multiple items can be expanded at the same time.',
  },
  {
    value: 'item-2',
    title: 'Second Section',
    content: 'Click any trigger to expand or collapse independently.',
  },
  {
    value: 'item-3',
    title: 'Third Section',
    content: 'Each item operates independently in multiple mode.',
  },
]

export const rowHighlightAccordionItems = [
  {
    value: 'item-1',
    title: 'Expanded, but not tinted',
    content: 'The panel reads as part of the page rather than a filled block.',
  },
  {
    value: 'item-2',
    title: 'Hover any row',
    content: 'The fill follows your cursor instead of marking a state.',
  },
  {
    value: 'item-3',
    title: 'Compare with the sections above',
    content: 'Those hold a block across the row and its panel while open.',
  },
]

export const standaloneAccordionItems = [
  {
    value: 'item-1',
    title: 'What is this component?',
    content: 'A collapsible accordion with animated expand/collapse and spring-animated chevron.',
  },
]

export const cardItems = [
  {
    icon: 'circle',
    title: 'Fluid motion',
    description: 'Spring-tuned transitions calibrated across three tiers',
  },
  {
    icon: 'shield',
    title: 'Accessible by default',
    description: 'Focus-visible rings and ARIA roles in every part',
  },
  {
    icon: 'palette',
    title: 'Yours to theme',
    description: 'Adjust radius, icons, and density to fit your app',
  },
  {
    icon: 'moon',
    title: 'Dark mode ready',
    description: 'Tokens adapt to light and dark automatically',
  },
  {
    icon: 'search',
    title: 'Fluid hover',
    description: 'A magnetic highlight previews where a click lands',
  },
  {
    icon: 'lightbulb',
    title: 'Native Remix',
    description: 'Compose components with the Remix runtime',
  },
] as const

export const cardBanner =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Cdefs%3E%3CradialGradient id='a' cx='12%25' cy='16%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.9'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='90%25' cy='12%25' r='65%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.45'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='82%25' cy='94%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='d' cx='24%25' cy='90%25' r='68%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.55'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='320' height='180' fill='%23ffffff'/%3E%3Crect width='320' height='180' fill='%236B97FF' fill-opacity='0.2'/%3E%3Crect width='320' height='180' fill='url(%23a)'/%3E%3Crect width='320' height='180' fill='url(%23b)'/%3E%3Crect width='320' height='180' fill='url(%23c)'/%3E%3Crect width='320' height='180' fill='url(%23d)'/%3E%3C/svg%3E"

export const badgeColors = [
  'accent',
  'gray',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

export const badgeGenres = [
  ['violet', 'Fiction'],
  ['amber', 'Science'],
  ['green', 'Philosophy'],
  ['blue', 'History'],
  ['rose', 'Poetry'],
] as const

export const badgeColorNames = badgeColors.map(
  (color) => [color, color.charAt(0).toUpperCase() + color.slice(1)] as const,
)

export const checkboxFruit = ['Apples', 'Bananas', 'Cherries', 'Dates'].map((label) => ({
  label,
  value: label.toLowerCase(),
}))
export const radioOptions = ['Option A', 'Option B', 'Option C'].map((label, index) => ({
  label,
  value: String(index),
}))

export const componentOptions = [
  'Accordion',
  'Badge',
  'Button',
  'Card',
  'CheckboxGroup',
  'ColorPicker',
  'Combobox',
  'Dialog',
  'Dropdown',
  'InputGroup',
  'RadioGroup',
  'Select',
  'Sidebar',
  'Slider',
  'Switch',
  'Table',
  'Tabs',
].map((label) => ({ label, value: label.toLowerCase() }))

// Use the same UTC day for server and browser demo data.
export function datePickerToday(): string {
  return new Date().toISOString().slice(0, 10)
}
export function datePickerOffset(today: string, days: number): string {
  const date = new Date(today)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
/** Four ranges counted from today. */
export function datePickerPresets(today = datePickerToday()) {
  const toSaturday = (6 - new Date(today).getUTCDay() + 7) % 7
  return [
    { label: 'Next 7 days', value: { start: today, end: datePickerOffset(today, 6) } },
    { label: 'Next 14 days', value: { start: today, end: datePickerOffset(today, 13) } },
    { label: 'Next 30 days', value: { start: today, end: datePickerOffset(today, 29) } },
    {
      label: 'This weekend',
      value: {
        start: datePickerOffset(today, toSaturday),
        end: datePickerOffset(today, toSaturday + 1),
      },
    },
  ]
}
/** Five booked days counted from today. */
export function datePickerBooked(today = datePickerToday()): string[] {
  return [3, 4, 5, 11, 12].map((days) => datePickerOffset(today, days))
}

export const cardThumb =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cdefs%3E%3CradialGradient id='a' cx='20%25' cy='18%25' r='80%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='86%25' cy='14%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='72%25' cy='94%25' r='85%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Crect width='40' height='40' fill='%236B97FF' fill-opacity='0.35'/%3E%3Crect width='40' height='40' fill='url(%23a)'/%3E%3Crect width='40' height='40' fill='url(%23b)'/%3E%3Crect width='40' height='40' fill='url(%23c)'/%3E%3C/svg%3E"

export const composerTriggers = [
  {
    character: '@',
    label: 'People',
    items: [
      { label: 'Ada Lovelace', value: '@Ada Lovelace' },
      { label: 'Grace Hopper', value: '@Grace Hopper' },
      { label: 'Katherine Johnson', value: '@Katherine Johnson' },
    ],
  },
  {
    character: '/',
    label: 'Commands',
    items: [
      { label: 'Summarize', value: '/summarize' },
      { label: 'Explain', value: '/explain' },
    ],
  },
]

export const triggerMenuCode = `const triggers = ${JSON.stringify(composerTriggers, null, 2)}

<TriggerMenu
  triggers={triggers}
  renderField={(props) => <Textarea {...props} aria-label="Message" placeholder="Type @ or /" />}
/>`
