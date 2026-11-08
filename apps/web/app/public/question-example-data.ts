import type { AskUserQuestion } from '@rtzll/reflow'

const fixtures: Record<string, readonly AskUserQuestion[]> = {
  example: [
    {
      id: 'role',
      title: 'How do you plan to use Reflow?',
      options: [
        { id: 'design', title: 'Designer', description: 'Prototyping flows and pages' },
        { id: 'eng', title: 'Engineer', description: 'Shipping production UI' },
        { id: 'pm', title: 'PM', description: 'Aligning the team on patterns' },
        { id: 'founder', title: 'Founder', description: 'Bootstrapping a product' },
      ],
    },
    {
      id: 'shape',
      title: 'Which shape language fits your brand?',
      options: [
        { id: 'rounded', title: 'Rounded', description: 'Soft, familiar corners' },
        { id: 'pill', title: 'Pill', description: 'Fully rounded, friendly' },
        { id: 'sharp', title: 'Sharp', description: 'Square corners, precise' },
      ],
    },
    {
      id: 'components',
      title: 'Which components are you reaching for first?',
      multiSelect: true,
      nextLabel: 'Continue',
      options: [
        { id: 'input', title: 'InputMessage', description: 'Chat-style composer with attachments' },
        { id: 'thinking', title: 'ThinkingSteps', description: 'Streamed reasoning steps' },
        { id: 'ask', title: 'AskUserQuestions', description: 'Stepped question flows' },
        { id: 'tabs', title: 'Tabs', description: 'Quiet segmented tabs' },
        { id: 'nav', title: 'NavMenu', description: 'Sidebar navigation' },
      ],
    },
    {
      id: 'drew',
      title: 'What drew you to Reflow?',
      allowOther: true,
      otherPlaceholder: 'Something else?',
      options: [
        { id: 'motion', title: 'Motion', description: 'Springs that feel alive' },
        { id: 'craft', title: 'Craft', description: 'Pixel-level polish' },
        { id: 'tokens', title: 'Tokens', description: 'Shape and elevation systems' },
      ],
    },
    {
      id: 'frameworks',
      title: 'Where will you ship these components?',
      multiSelect: true,
      options: [
        { id: 'next', title: 'Next.js', description: 'App Router projects' },
        { id: 'remix', title: 'Remix', description: 'Full-stack apps' },
        { id: 'vite', title: 'Vite + React', description: 'SPAs and dashboards' },
        { id: 'astro', title: 'Astro', description: 'Content-first sites' },
      ],
    },
    {
      id: 'themes',
      title: 'Which theme mode do you support?',
      options: [
        { id: 'light', title: 'Light only' },
        { id: 'dark', title: 'Dark only' },
        { id: 'system', title: 'System-aware' },
        { id: 'toggle', title: 'User toggle' },
      ],
    },
    {
      id: 'missing',
      title: "What's missing from the registry today?",
      multiSelect: true,
      allowOther: true,
      otherPlaceholder: 'Tell us what to build next…',
      nextLabel: 'Send feedback',
      options: [
        { id: 'data', title: 'Data table', description: 'Sortable, filterable rows' },
        { id: 'calendar', title: 'Calendar', description: 'Date picker and range' },
        { id: 'command', title: 'Command menu', description: 'Fast keyboard launcher' },
      ],
    },
    {
      id: 'recommend',
      title: 'Would you recommend Reflow to a teammate?',
      skippable: false,
      options: [
        { id: 'yes', title: 'Yes', description: 'Already have' },
        { id: 'soon', title: 'Soon', description: 'Once it covers more ground' },
        { id: 'unsure', title: 'Not sure yet', description: 'Still evaluating' },
      ],
    },
  ],
  multiple: [
    {
      ...{ id: 'role', title: "What's your role?" },
      options: [
        { id: 'design', title: 'Designer', description: 'Visual / interaction' },
        { id: 'eng', title: 'Engineer', description: 'Frontend / backend' },
        { id: 'pm', title: 'PM', description: 'Product / program' },
        { id: 'research', title: 'Researcher', description: 'User / market research' },
      ],
    },
    {
      ...{ id: 'tools', title: 'Which tool do you use most?' },
      options: [
        { id: 'figma', title: 'Figma', description: 'Design source of truth' },
        { id: 'vscode', title: 'VS Code', description: 'Code editor' },
        { id: 'linear', title: 'Linear', description: 'Issue tracker' },
        { id: 'notion', title: 'Notion', description: 'Docs and planning' },
      ],
    },
    {
      ...{ id: 'team', title: 'How big is your team?' },
      options: [
        { id: 'solo', title: 'Just me', description: 'Solo founder or freelancer' },
        { id: 'small', title: '2–10', description: 'Small team or pod' },
        { id: 'mid', title: '11–50', description: 'A few cross-functional teams' },
        { id: 'large', title: '50+', description: 'Full org' },
      ],
    },
    {
      ...{ id: 'experience', title: 'How long have you been doing this?' },
      options: [
        { id: 'lt1', title: 'Less than a year', description: 'Just getting started' },
        { id: '1to3', title: '1–3 years', description: 'Finding your rhythm' },
        { id: '3to7', title: '3–7 years', description: 'Comfortable in the craft' },
        { id: 'gt7', title: '7+ years', description: 'Seasoned' },
      ],
    },
  ],
  'multi-select': [
    {
      ...{
        id: 'features',
        title: 'Which features should we prioritize?',
        multiSelect: true,
        nextLabel: 'Continue',
      },
      options: [
        { id: 'dm', title: 'Dark mode', description: 'System-aware theme switching' },
        { id: 'a11y', title: 'Accessibility', description: 'Screen-reader and keyboard support' },
        { id: 'perf', title: 'Performance', description: 'Faster initial load' },
        { id: 'i18n', title: 'Translations', description: 'Multi-language support' },
      ],
    },
    {
      ...{ id: 'platforms', title: 'Which platforms do you target?', multiSelect: true },
      options: [
        { id: 'web', title: 'Web', description: 'Desktop browsers' },
        { id: 'ios', title: 'iOS', description: 'iPhone and iPad' },
        { id: 'android', title: 'Android', description: 'Phones and tablets' },
        { id: 'desktop', title: 'Native desktop', description: 'macOS / Windows / Linux apps' },
      ],
    },
    {
      ...{ id: 'integrations', title: 'Which integrations matter most?', multiSelect: true },
      options: [
        { id: 'slack', title: 'Slack', description: 'Notifications and approvals' },
        { id: 'github', title: 'GitHub', description: 'PR and issue sync' },
        { id: 'linear', title: 'Linear', description: 'Two-way ticket linking' },
        { id: 'figma', title: 'Figma', description: 'Design hand-off' },
        { id: 'calendar', title: 'Calendar', description: 'Schedule-aware reminders' },
      ],
    },
  ],
  other: [
    {
      ...{
        id: 'blocker',
        title: "What's blocking you most right now?",
        allowOther: true,
        otherPlaceholder: 'Describe in your own words…',
      },
      options: [
        { id: 'scope', title: 'Scope', description: 'Too much on the plate' },
        { id: 'review', title: 'Review', description: 'Waiting on feedback' },
        { id: 'infra', title: 'Infra', description: 'Tooling slows me down' },
      ],
    },
    {
      ...{ id: 'improve', title: 'Which area needs the most improvement?', allowOther: true },
      options: [
        { id: 'speed', title: 'Speed', description: 'Make the loop faster' },
        { id: 'clarity', title: 'Clarity', description: 'Sharpen what good looks like' },
        { id: 'alignment', title: 'Alignment', description: 'Get on the same page sooner' },
        { id: 'quality', title: 'Quality', description: 'Raise the craft bar' },
      ],
    },
    {
      ...{
        id: 'easier',
        title: 'What would make your week easier?',
        allowOther: true,
        otherPlaceholder: 'Anything else?',
      },
      options: [
        { id: 'fewer', title: 'Fewer meetings', description: 'Reclaim deep work time' },
        { id: 'decisions', title: 'Faster decisions', description: 'Unblock without escalation' },
        { id: 'context', title: 'More context', description: 'Know the why upfront' },
      ],
    },
  ],
  stacked: [
    {
      ...{ id: 'template', title: 'Which starting template fits your project?', layout: 'stacked' },
      options: [
        {
          id: 'marketing',
          title: 'Marketing site',
          description:
            'Polished landing page with hero, features grid, pricing table, and a footer. Best when you need to ship a story-driven page fast.',
        },
        {
          id: 'chat',
          title: 'AI chat app',
          description:
            'Full conversation UI with InputMessage, ThinkingSteps, and message bubbles wired up. Ideal for assistants and copilots.',
        },
        {
          id: 'admin',
          title: 'Admin dashboard',
          description:
            'Sidebar shell, sortable data tables, and form-heavy detail views. Built for back-office tools and operational apps.',
        },
        {
          id: 'onboarding',
          title: 'Onboarding flow',
          description:
            'Stepped intake using AskUserQuestions with a progress indicator and inline validation. Great for setup wizards.',
        },
      ],
    },
    {
      ...{ id: 'shape', title: 'Which shape language fits your brand?', layout: 'stacked' },
      options: [
        {
          id: 'rounded',
          title: 'Rounded',
          description:
            'Soft 16–24px corners that feel approachable and read as software. Pairs well with editorial typography and dense layouts.',
        },
        {
          id: 'pill',
          title: 'Pill',
          description:
            'Fully rounded shapes that lean playful and consumer-friendly. Best when controls are sparse and breathing room is generous.',
        },
      ],
    },
    {
      ...{
        id: 'components',
        title: 'Which components will you reach for first?',
        layout: 'stacked',
        multiSelect: true,
        nextLabel: 'Continue',
      },
      options: [
        {
          id: 'input',
          title: 'InputMessage',
          description:
            'Chat-style composer with attachments, dropdowns, and submit affordances. The backbone of any AI surface.',
        },
        {
          id: 'thinking',
          title: 'ThinkingSteps',
          description:
            'Animated, streamable reasoning steps with collapse and expand. Great for showing AI work in progress.',
        },
        {
          id: 'ask',
          title: 'AskUserQuestions',
          description:
            'This component — stepped flows with single and multi-select, optional Other, and fluid hover throughout.',
        },
        {
          id: 'tabs',
          title: 'Tabs',
          description:
            'Quiet segmented tabs that morph between selections. Reach for these when section headers would be too loud.',
        },
        {
          id: 'nav',
          title: 'NavMenu',
          description:
            'Sidebar navigation with active-state morphing, grouped sections, and keyboard support out of the box.',
        },
      ],
    },
    {
      ...{
        id: 'drew',
        title: 'What drew you to Reflow?',
        layout: 'stacked',
        allowOther: true,
        otherPlaceholder: 'Something else? Tell us in a sentence…',
      },
      options: [
        {
          id: 'motion',
          title: 'Motion that feels alive',
          description:
            'Spring tokens, fluid hover, and morphing backgrounds make every interaction feel intentional rather than scripted.',
        },
        {
          id: 'craft',
          title: 'Pixel-level craft',
          description:
            'Every component is tuned for typography, spacing, focus rings, and dark mode — no defaults left untouched.',
        },
        {
          id: 'tokens',
          title: 'A token system, not just components',
          description:
            'Shape, elevation, color, and font-weight tokens compose cleanly so the registry scales beyond what you see.',
        },
      ],
    },
    {
      ...{
        id: 'frameworks',
        title: 'Where will you ship these components?',
        layout: 'stacked',
        multiSelect: true,
      },
      options: [
        {
          id: 'next',
          title: 'Next.js (App Router)',
          description:
            'Server components, client islands, and route-level layouts. The primary target the registry is tuned for.',
        },
        {
          id: 'remix',
          title: 'Remix',
          description:
            'Full-stack data loading with nested routes. Most components transplant cleanly; framer-motion stays client-only.',
        },
        {
          id: 'vite',
          title: 'Vite + React',
          description:
            'Single-page apps and internal dashboards. The fastest dev loop for prototyping new flows against the registry.',
        },
        {
          id: 'astro',
          title: 'Astro',
          description:
            'Content-first sites with interactive islands. Good fit for marketing pages that need a handful of live components.',
        },
      ],
    },
    {
      ...{ id: 'theme', title: 'How will you handle theme mode?', layout: 'stacked' },
      options: [
        {
          id: 'light',
          title: 'Light only',
          description:
            'Tune one palette deeply. Best when the product is consumer-facing and the brand voice is bright.',
        },
        {
          id: 'dark',
          title: 'Dark only',
          description:
            'Lean into the dark-mode aesthetic the registry was designed in. Cuts theme work in half.',
        },
        {
          id: 'system',
          title: 'System-aware',
          description:
            'Follow the OS preference automatically. No toggle UI, no user friction, and it matches what most apps do today.',
        },
        {
          id: 'toggle',
          title: 'User toggle',
          description:
            'Give users an explicit switch with persistence. The most flexible option, but it adds a small surface to design.',
        },
      ],
    },
    {
      ...{
        id: 'missing',
        title: "What's missing from the registry today?",
        layout: 'stacked',
        multiSelect: true,
        allowOther: true,
        otherPlaceholder: 'Tell us what to build next…',
        nextLabel: 'Send feedback',
      },
      options: [
        {
          id: 'data',
          title: 'Data table',
          description:
            'Sortable, filterable, virtualized rows with column resizing and density modes. The most-asked-for primitive.',
        },
        {
          id: 'calendar',
          title: 'Calendar / date picker',
          description:
            'Single date, range, and inline calendar — with keyboard support and locale-aware formatting baked in.',
        },
        {
          id: 'command',
          title: 'Command menu',
          description:
            'Keyboard-first launcher with recents, grouped actions, and fuzzy matching. The connective tissue for power users.',
        },
      ],
    },
    {
      ...{
        id: 'recommend',
        title: 'Would you recommend Reflow to a teammate?',
        layout: 'stacked',
        skippable: false,
      },
      options: [
        {
          id: 'yes',
          title: 'Yes, already have',
          description:
            "It's clear from the first install where the bar is. You'd hand it to anyone shipping a polished React surface.",
        },
        {
          id: 'soon',
          title: 'Once it covers more ground',
          description:
            "Once the missing pieces (data table, calendar, command) land you'd recommend it without reservation.",
        },
        {
          id: 'unsure',
          title: 'Still evaluating',
          description:
            'You like the direction but want to ship one real flow against it before passing it on to others.',
        },
      ],
    },
  ],
  'chip-left': [
    {
      ...{ id: 'role', title: 'Pick your role', chipPosition: 'left' },
      options: [
        { id: 'design', title: 'Designer', description: 'Prototyping flows' },
        { id: 'eng', title: 'Engineer', description: 'Shipping production UI' },
        { id: 'pm', title: 'PM', description: 'Aligning the team' },
      ],
    },
    {
      ...{
        id: 'template',
        title: 'Which starting template fits your project?',
        chipPosition: 'left',
        layout: 'stacked',
      },
      options: [
        {
          id: 'marketing',
          title: 'Marketing site',
          description:
            'Hero, features grid, pricing, footer. Best when you need to ship a story-driven page fast.',
        },
        {
          id: 'chat',
          title: 'AI chat app',
          description:
            'InputMessage, ThinkingSteps and message bubbles wired together. Ideal for assistants and copilots.',
        },
        {
          id: 'admin',
          title: 'Admin dashboard',
          description:
            'Sidebar shell, sortable tables, and form-heavy detail views. Built for back-office tools.',
        },
      ],
    },
    {
      ...{
        id: 'frameworks',
        title: 'Where will you ship these components?',
        chipPosition: 'left',
        multiSelect: true,
        nextLabel: 'Continue',
      },
      options: [
        { id: 'next', title: 'Next.js', description: 'App Router projects' },
        { id: 'remix', title: 'Remix', description: 'Full-stack apps' },
        { id: 'vite', title: 'Vite + React', description: 'SPAs and dashboards' },
        { id: 'astro', title: 'Astro', description: 'Content-first sites' },
      ],
    },
    {
      ...{
        id: 'feedback',
        title: 'Anything else we should build?',
        chipPosition: 'left',
        allowOther: true,
        otherPlaceholder: 'Tell us in a few lines…',
      },
      options: [
        { id: 'data', title: 'Data table', description: 'Sortable, filterable rows' },
        { id: 'calendar', title: 'Calendar', description: 'Date picker and range' },
        { id: 'command', title: 'Command menu', description: 'Fast keyboard launcher' },
      ],
    },
    {
      ...{
        id: 'recommend',
        title: 'Would you recommend Reflow?',
        chipPosition: 'left',
        skippable: false,
      },
      options: [
        { id: 'yes', title: 'Yes', description: 'Already have' },
        { id: 'soon', title: 'Soon', description: 'Once it covers more ground' },
        { id: 'unsure', title: 'Not sure yet', description: 'Still evaluating' },
      ],
    },
  ],
  text: [
    {
      ...{
        id: 'name',
        title: 'What should we call your workspace?',
        freeText: true,
        freeTextMultiline: false,
        freeTextPlaceholder: 'e.g. Acme Design',
      },
    },
    {
      ...{
        id: 'goal',
        title: "Describe what you're hoping to build.",
        freeText: true,
        freeTextPlaceholder: 'A sentence or two is plenty…',
      },
    },
    {
      ...{
        id: 'feedback',
        title: "Anything else you'd like us to know?",
        freeText: true,
        skippable: false,
        nextLabel: 'Finish',
      },
    },
  ],
  skippable: [
    {
      ...{ id: 'experience', title: 'How long have you been using the product?' },
      options: [
        { id: 'new', title: 'Less than a week', description: 'Just getting started' },
        { id: 'mid', title: 'A few months', description: 'Comfortable with basics' },
        { id: 'long', title: 'Over a year', description: 'Power user' },
      ],
    },
    {
      ...{ id: 'frequency', title: 'How often do you use it?' },
      options: [
        { id: 'daily', title: 'Daily', description: 'Part of my routine' },
        { id: 'weekly', title: 'A few times a week', description: 'When the work calls for it' },
        { id: 'monthly', title: 'A few times a month', description: 'Occasional use' },
        { id: 'rarely', title: 'Rarely', description: 'Once in a while' },
      ],
    },
    {
      ...{ id: 'recommend', title: 'Would you recommend it to a colleague?' },
      options: [
        { id: 'yes', title: 'Yes', description: 'Already have' },
        { id: 'maybe', title: 'Maybe', description: 'Depends on the role' },
        { id: 'no', title: 'Not yet', description: 'Needs more polish first' },
      ],
    },
  ],
  validation: [
    {
      ...{
        id: 'email',
        title: 'Your work email?',
        freeText: true,
        freeTextMultiline: false,
        freeTextPlaceholder: 'you@company.com',
      },
    },
  ],
}

const validEmail = (value: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
    ? null
    : 'Please enter a valid email so we can reach out.'

export function questionExample(variant: string): readonly AskUserQuestion[] {
  return (fixtures[variant] ?? fixtures.multiple).map((question) => ({
    ...question,
    skippable: question.skippable ?? true,
    freeTextValidate: variant === 'validation' ? validEmail : undefined,
  }))
}

const choices = [
  {
    ...{ id: 'role', title: 'How do you plan to use Reflow?' },
    options: [
      {
        id: 'design',
        title: 'Designer',
        short: 'Prototyping flows and pages',
        long: 'Prototyping flows and pages fast, then handing the patterns to the team.',
      },
      {
        id: 'eng',
        title: 'Engineer',
        short: 'Shipping production UI',
        long: 'Shipping production UI with springs and tokens instead of hand-rolled CSS.',
      },
      {
        id: 'pm',
        title: 'PM',
        short: 'Aligning the team on patterns',
        long: 'Aligning the team on one set of interaction patterns everyone can point to.',
      },
      {
        id: 'founder',
        title: 'Founder',
        short: 'Bootstrapping a product',
        long: 'Bootstrapping a product that needs to look credible from day one.',
      },
    ],
  },
  {
    ...{ id: 'drew', title: 'What drew you to Reflow?' },
    options: [
      {
        id: 'motion',
        title: 'Motion',
        short: 'Springs that feel alive',
        long: 'Spring-driven motion that feels alive instead of scripted.',
      },
      {
        id: 'craft',
        title: 'Craft',
        short: 'Pixel-level polish',
        long: 'Pixel-level polish across typography, spacing, and focus states.',
      },
      {
        id: 'tokens',
        title: 'Tokens',
        short: 'Shape and elevation systems',
        long: 'Shape and elevation systems that compose beyond single components.',
      },
    ],
  },
  {
    ...{ id: 'recommend', title: 'Would you recommend Reflow to a teammate?' },
    options: [
      {
        id: 'yes',
        title: 'Yes',
        short: 'Already have',
        long: 'Already have — it sets the bar for polished React surfaces.',
      },
      {
        id: 'soon',
        title: 'Soon',
        short: 'Once it covers more ground',
        long: 'Once it covers more ground — a few primitives are still missing.',
      },
      {
        id: 'unsure',
        title: 'Not sure yet',
        short: 'Still evaluating',
        long: 'Still evaluating — one real flow will settle it.',
      },
    ],
  },
]

const text = [
  {
    ...{
      id: 'name',
      title: 'What should we call your workspace?',
      placeholder: 'e.g. Acme Design',
    },
  },
  {
    ...{
      id: 'goal',
      title: "Describe what you're hoping to build.",
      placeholder: 'A sentence or two is plenty…',
    },
  },
  {
    ...{
      id: 'feedback',
      title: "Anything else you'd like us to know?",
      placeholder: 'Type your answer…',
    },
  },
]

export interface QuestionSettings {
  count?: number
  multiSelect?: boolean
  allowOther?: boolean
  skippable?: boolean
  layout?: 'inline' | 'stacked'
  chipPosition?: 'right' | 'left'
  freeText?: boolean
  multiline?: boolean
}

export function questionPlayground({
  count = 3,
  multiSelect,
  allowOther,
  skippable = true,
  layout = 'inline',
  chipPosition = 'right',
  freeText,
  multiline = true,
}: QuestionSettings = {}): readonly AskUserQuestion[] {
  if (freeText)
    return text.slice(0, count).map(({ id, title, placeholder }) => ({
      id,
      title,
      skippable,
      freeText: true,
      freeTextMultiline: multiline,
      freeTextPlaceholder: placeholder,
    }))

  return choices.slice(0, count).map(({ id, title, options }) => ({
    id,
    title,
    skippable,
    layout,
    chipPosition,
    allowOther,
    multiSelect,
    otherPlaceholder: allowOther ? 'Something else?' : undefined,
    options: options.map(({ id, title, short, long }) => ({
      id,
      title,
      description: layout === 'stacked' ? long : short,
    })),
  }))
}

export function questionCode(questions: readonly AskUserQuestion[]) {
  const declarations = JSON.stringify(questions, null, 2)
  const body = questions.some((question) => question.freeTextValidate)
    ? declarations.replace(
        /(\"freeText\": true,)/,
        '$1\n    "freeTextValidate": ' +
          validEmail.toString().replace('(value)', '(value: string)') +
          ',',
      )
    : declarations
  return `const questions = ${body} as const

<AskUserQuestions questions={questions} onComplete={(answers) => console.log(answers)} />`
}
