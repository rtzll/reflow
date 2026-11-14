import { BreadcrumbDemo } from './breadcrumb-example.tsx'
import { SegmentedControlDemo } from './segmented-control-example.tsx'
import { PopoverDemo } from './popover-example.tsx'
import { ToasterDemo } from './toaster-example.tsx'
import { DrawerDemo } from './drawer-example.tsx'
import { CodeBlockDemo } from './code-block-example.tsx'
import { CitationDemo } from './citation-example.tsx'
import { AvatarDemo } from './avatar-example.tsx'
import { ChatLayoutDemo } from './chat-layout-example.tsx'
import { ResizableDemo } from './resizable-example.tsx'
import { CarouselDemo } from './carousel-demo.tsx'
import { HoverCardDemo } from './hover-card-example.tsx'
import { paletteCommands, paletteSuggestions } from './palette-example-data.tsx'
import { accents } from './site-settings.ts'
import { ChatExample } from './chat-example.tsx'
import { questionExample, questionPlayground } from './question-example-data.ts'
import { CarouselExample } from './carousel-example.tsx'
import {
  accordionItems,
  badgeGenres,
  cardItems,
  cardThumb,
  checkboxFruit,
  radioOptions,
  componentOptions,
  datePickerToday,
  datePickerOffset,
  composerTriggers,
} from './component-example-data.ts'
import { RequestFormExample } from './request-form-example.tsx'
import { SoundCombobox } from './sound-combobox.tsx'
import { playCopySuccess } from './showcase-sound.ts'
import { play } from 'cuelume'
import {
  Avatar,
  Accordion,
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
  CarouselDots,
  ChatLayout,
  ChatMessage,
  Citation,
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  CommandMenu,
  DatePicker,
  Dialog,
  Dropdown,
  FileInput,
  Field,
  Input,
  InputCopy,
  InputField,
  Icon,
  InputGroup,
  Progress,
  TriggerMenu,
  NumberField,
  InputMessage,
  QueuedStack,
  RadioGroup,
  reveal,
  Select,
  Sidebar,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  ThinkingIndicator,
  ThinkingSteps,
  ThinkingStepDetails,
  ThinkingStepSource,
  ThinkingStepSources,
  Tooltip,
  type HighlightedCode,
} from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { BannerExample, BannerPreview } from './banner-example.tsx'

// The tile uses the same range Calendar as the docs, with smaller cells to
// fit six weeks and one visible month when the preview itself is narrow.
function GalleryCalendar(handle: Handle) {
  let months: 1 | 2 = 2
  const today = datePickerToday()
  const measure = ref((node, signal) => {
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width < 370 ? 1 : 2
      if (months === next) return
      months = next
      handle.update()
    })
    observer.observe(node)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })

  return () => (
    <div class="example-gallery-calendar" data-months={months} mix={measure}>
      <Calendar
        label="Choose travel dates"
        mode="range"
        cellSize={30}
        numberOfMonths={months}
        defaultMonth={today}
        defaultValue={{ start: datePickerOffset(today, 3), end: datePickerOffset(today, 8) }}
      />
    </div>
  )
}

const galleryThreads = [
  { label: 'Sidebar component height in demo', href: '#thread-1', status: 'active', badge: '2' },
  { label: 'Dark mode token audit', href: '#thread-2', status: 'unread', badge: '3' },
  { label: 'Scrollbar fade regression', href: '#thread-3', status: 'idle', badge: '1' },
  { label: 'Registry deploy pipeline', href: '#thread-4', status: 'unread', badge: '7' },
] as const

function GallerySidebar(handle: Handle<{ avatar: string }>) {
  let active = '#thread-1'
  let drafts = 0
  return () => (
    <div class="example-gallery-sidebar">
      <Sidebar
        fixed
        variant="inset"
        label="Acme workspace"
        defaultWidth={224}
        activeHref={active}
        searchable
        header={
          <div class="rf-sidebar-row">
            <span class="rf-sidebar-tile" aria-hidden="true">
              A
            </span>
            <span class="rf-sidebar-row-name">Acme Inc</span>
          </div>
        }
        footer={
          <div class="rf-sidebar-row">
            <Avatar
              class="rf-sidebar-avatar"
              name="Alex Morgan"
              src={handle.props.avatar}
              size={20}
              decorative
            />
            <span class="rf-sidebar-row-name rf-sidebar-row-plain">Alex Morgan</span>
          </div>
        }
        sections={[
          {
            items: [
              {
                label: 'New thread',
                icon: <Icon name="plus" />,
                href: '#new-thread',
                onClick: (event) => {
                  event.preventDefault()
                  drafts++
                  active = `#draft-${drafts}`
                  handle.update()
                },
              },
            ],
          },
          {
            label: 'Threads',
            collapsible: false,
            items: [
              ...Array.from({ length: drafts }, (_, i) => ({
                label: i === 0 ? 'Untitled thread' : `Untitled thread ${i + 1}`,
                href: `#draft-${i + 1}`,
              })).reverse(),
              ...galleryThreads,
            ].map((item) => ({
              ...item,
              onClick: (event: MouseEvent) => {
                event.preventDefault()
                active = item.href
                handle.update()
              },
            })),
          },
        ]}
      >
        {null}
      </Sidebar>
    </div>
  )
}

export const Example = clientEntry(
  import.meta.url,
  function Example(
    handle: Handle<{
      slug: string
      showcase?: boolean
      gallery?: boolean
      avatar?: string
      code?: HighlightedCode
    }>,
  ) {
    let saved = false
    let lastAction = ''
    let selectedFeature: string | undefined = 'Spring animations'
    let slide = 1
    let opacity = 35
    let message = ''
    const initialQueue = [
      { id: 'draft', content: 'Draft an intro' },
      { id: 'demo', content: 'Review demo' },
      { id: 'notes', content: 'List changes' },
    ]
    let queued = initialQueue
    let sentQueue: { id: string; content: string }[] = []
    let queueHovered = false
    let restore: ReturnType<typeof setTimeout> | undefined
    handle.signal.addEventListener('abort', () => clearTimeout(restore), { once: true })
    // In the gallery and the deck, the queue returns to how it began a while
    // after it was last used, as a dismissed banner returns, so the card
    // always shows what it is for. It waits while the pointer is on it.
    const scheduleRestore = () => {
      if (!handle.props.showcase) return
      clearTimeout(restore)
      restore = setTimeout(() => {
        if (queueHovered) return
        queued = initialQueue
        sentQueue = []
        void handle.update()
      }, 2500)
    }

    return () => {
      switch (handle.props.slug) {
        case 'button':
          return (
            <div className="example-stack">
              {handle.props.showcase ? (
                <div className="example-row">
                  <Button
                    size="compact"
                    mix={on('click', () => {
                      saved = true
                      handle.update()
                    })}
                  >
                    Primary
                  </Button>
                  <Button size="compact" variant="secondary">
                    Secondary
                  </Button>
                  <Button size="compact" variant="tertiary">
                    Tertiary
                  </Button>
                  <Button size="compact" variant="ghost">
                    Ghost
                  </Button>
                </div>
              ) : (
                <Button
                  mix={on('click', () => {
                    saved = true
                    handle.update()
                  })}
                >
                  Get started
                </Button>
              )}
              <span className="example-status" role="status">
                {saved ? 'Ready to start' : ''}
              </span>
            </div>
          )
        case 'tabs':
          if (handle.props.showcase)
            return (
              <Tabs
                label="Navigation"
                activeLabel
                defaultValue="home"
                items={[
                  { value: 'home', label: 'Home', icon: <Icon name="home" /> },
                  { value: 'chat', label: 'Chat', icon: <Icon name="message-circle" /> },
                  { value: 'inbox', label: 'Inbox', icon: <Icon name="inbox" /> },
                ]}
              />
            )
          return (
            <div className="doc-demo-fill">
              <Tabs
                label="Workspace"
                defaultValue="teamspaces"
                items={['Teamspaces', 'Recents', 'Favorites', 'Shared'].map((label) => ({
                  value: label.toLowerCase(),
                  label,
                  panel: (
                    <p className="example-note example-tab-note">{label} content goes here.</p>
                  ),
                }))}
              />
            </div>
          )
        case 'hover-card':
          return <HoverCardDemo variant="basic" />
        case 'carousel':
          return <CarouselDemo variant={handle.props.showcase ? 'gallery' : 'playground'} />
        case 'chat-layout':
          return <ChatLayoutDemo variant="playground" />
        case 'avatar':
          return (
            <AvatarDemo
              variant={handle.props.showcase ? 'gallery' : 'playground'}
              image={handle.props.avatar}
            />
          )
        case 'citation':
          return <CitationDemo variant="playground" />
        case 'code-block':
          return (
            <CodeBlockDemo
              variant={handle.props.code ? 'gallery' : 'plain'}
              samples={handle.props.code ? { card: handle.props.code } : undefined}
            />
          )
        case 'drawer':
          return <DrawerDemo variant={handle.props.showcase ? 'gallery' : 'playground'} />
        case 'toaster':
          return <ToasterDemo variant={handle.props.showcase ? 'gallery' : 'playground'} />
        case 'popover':
          return <PopoverDemo variant="playground" placement="bottom" />
        case 'segmented-control':
          return <SegmentedControlDemo variant="playground" />
        case 'breadcrumb':
          return <BreadcrumbDemo variant={handle.props.showcase ? 'showcase' : 'menu'} />
        case 'dropdown':
          if (handle.props.gallery) {
            return (
              <div className="example-combobox">
                <Dropdown
                  label="Component features"
                  inline
                  items={[
                    { label: 'Spring animations', icon: <Icon name="circle" /> },
                    { label: 'Fluid hover', icon: <Icon name="star" /> },
                    { label: 'Font weight shifts', icon: <Icon name="plus" /> },
                    {
                      label: 'Accessible by default',
                      icon: (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.6"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 20.5 4.8 13.3C-2 6.5 7.5.5 12 7c4.5-6.5 14-.5 7.2 6.3Z" />
                        </svg>
                      ),
                    },
                    { label: 'Remix primitives', icon: <Icon name="check" /> },
                    { label: 'Functional clarity', icon: <Icon name="brain" /> },
                  ].map((item) => ({
                    ...item,
                    value: item.label,
                    type: 'checkbox' as const,
                    checked: item.label === selectedFeature,
                  }))}
                  onSelect={(value, checked) => {
                    selectedFeature = checked ? value : undefined
                    handle.update()
                  }}
                />
              </div>
            )
          }
          if (handle.props.showcase) {
            const current = lastAction || 'Email'
            return (
              <div className="example-stack">
                <Dropdown
                  label={current}
                  variant="ghost"
                  items={[
                    {
                      value: 'Email',
                      label: 'Email',
                      type: 'radio',
                      checked: current === 'Email',
                      icon: <Icon name="mail" />,
                    },
                    {
                      value: 'Notifications',
                      label: 'Notifications',
                      type: 'radio',
                      checked: current === 'Notifications',
                      icon: <Icon name="bell" />,
                    },
                    {
                      value: 'Privacy',
                      label: 'Privacy',
                      type: 'radio',
                      checked: current === 'Privacy',
                      icon: <Icon name="lock" />,
                    },
                    {
                      value: 'General',
                      label: 'General',
                      type: 'radio',
                      checked: current === 'General',
                      icon: <Icon name="menu" />,
                    },
                    {
                      value: 'Theme',
                      label: 'Theme',
                      icon: <Icon name="moon" />,
                      children: [
                        { value: 'Light', label: 'Light' },
                        { value: 'Dark', label: 'Dark' },
                        { value: 'System', label: 'System' },
                      ],
                    },
                    {
                      value: 'Display',
                      label: 'Display',
                      type: 'radio',
                      checked: current === 'Display',
                      icon: <Icon name="monitor" />,
                    },
                  ]}
                  onSelect={(value) => {
                    lastAction = value
                    handle.update()
                  }}
                />
                <span className="example-status" role="status">
                  {lastAction && `Selected ${lastAction}`}
                </span>
              </div>
            )
          }
          return (
            <div className="example-stack">
              <Dropdown
                label="Options"
                searchable
                items={[
                  { value: 'Rename', label: 'Rename' },
                  { value: 'Duplicate', label: 'Duplicate' },
                  { value: 'Archive', label: 'Archive' },
                ]}
                onSelect={(value) => {
                  lastAction = value
                  handle.update()
                }}
              />
              <span className="example-status" role="status">
                {lastAction ? `Selected ${lastAction}` : ''}
              </span>
            </div>
          )
        case 'accordion':
          return (
            <div className="example-accordion">
              <Accordion defaultValue="item-1" items={accordionItems} />
            </div>
          )
        case 'ask-user-questions':
          return (
            <div className="example-questions" data-showcase={handle.props.showcase || undefined}>
              <AskUserQuestions
                questions={
                  handle.props.showcase ? questionExample('example') : questionPlayground()
                }
                onComplete={() => {
                  lastAction = 'Answers saved'
                  handle.update()
                }}
              />
              <div className="example-note" role="status">
                {lastAction}
              </div>
            </div>
          )
        case 'badge':
          if (handle.props.showcase)
            return (
              <div className="example-row">
                <Badge variant="dot" color="blue">
                  Published
                </Badge>
                <Badge variant="dot" color="green">
                  Active
                </Badge>
                <Badge variant="dot" color="red">
                  Declined
                </Badge>
              </div>
            )
          return (
            <div className="example-row">
              {badgeGenres.map(([color, text]) => (
                <Badge key={color} color={color}>
                  {text}
                </Badge>
              ))}
            </div>
          )
        case 'banner':
          return handle.props.showcase ? <BannerPreview /> : <BannerExample />
        case 'calendar':
          if (handle.props.gallery) return <GalleryCalendar />
          return (
            <Calendar
              label="Choose travel dates"
              mode="range"
              defaultMonth="2026-11-01"
              numberOfMonths={2}
            />
          )
        case 'card':
          if (handle.props.showcase)
            return (
              <div className="example-block" style={{ width: '100%' }}>
                <CardGroup orientation="inline">
                  {['Fluid motion', 'Accessible', 'Yours to theme', 'Fluid hover'].map((title) => (
                    <Card
                      key={title}
                      label={title}
                      onClick={() => {
                        lastAction = title
                        handle.update()
                      }}
                    >
                      <CardMedia logo={cardThumb} logoSize={28} />
                      <CardTitle>{title}</CardTitle>
                    </Card>
                  ))}
                </CardGroup>
              </div>
            )
          return (
            <div className="example-block" style={{ width: 'min(100%, 560px)' }}>
              <CardGroup columns={2}>
                {cardItems.slice(0, 4).map(({ icon, title, description }) => (
                  <Card
                    key={title}
                    style={{ minHeight: handle.props.showcase ? undefined : '140px' }}
                    label={title}
                    onClick={() => {
                      lastAction = title
                      handle.update()
                    }}
                    selected={handle.props.showcase && lastAction === title}
                  >
                    <CardHeader>
                      <CardMedia treatment="icon">
                        <Icon name={icon} size={18} />
                      </CardMedia>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </CardGroup>
            </div>
          )
        case 'carousel-dots':
          return <CarouselExample autoplay={handle.props.showcase} duration={2400} />
        case 'resizable':
          return <ResizableDemo />
        case 'chat-message':
          if (handle.props.gallery) return <ResizableDemo />
          return handle.props.showcase ? (
            <div className="example-chat-tile">
              <ChatMessage role="user" size="compact" animate={false}>
                Why is every other input box so stiff?
              </ChatMessage>
              <ChatMessage role="assistant" size="compact" animate={false}>
                Because nothing about them moves with you.
              </ChatMessage>
            </div>
          ) : (
            <ChatExample />
          )
        case 'checkbox':
          return <Checkbox label="Accept terms and conditions" />
        case 'checkbox-group':
          if (handle.props.gallery)
            return (
              <div className="example-checklist">
                <CheckboxGroup
                  label="Features"
                  hideLabel
                  defaultValue={['Fluid hover', 'Font weight transitions']}
                  options={[
                    'Spring physics',
                    'Fluid hover',
                    'Font weight transitions',
                    'Keyboard navigation',
                    'Dark mode support',
                  ].map((label) => ({ label, value: label }))}
                />
              </div>
            )
          return (
            <div className="example-checklist">
              <CheckboxGroup
                label="Fruit"
                hideLabel
                defaultValue={['apples']}
                options={checkboxFruit}
              />
            </div>
          )
        case 'color-picker':
          return (
            <ColorPicker
              defaultValue="#6B97FF"
              swatches={
                handle.props.showcase
                  ? Object.entries(accents).map(([label, colors]) => ({ label, color: colors[1] }))
                  : undefined
              }
            />
          )
        case 'combobox':
          return (
            <div class="example-combobox">
              <SoundCombobox
                label="Components"
                placeholder="Add components…"
                emptyMessage="No component found."
                multiple
                defaultValues={['button', 'combobox']}
                options={componentOptions}
              />
            </div>
          )
        case 'command-menu':
          return (
            <div className="example-command">
              <CommandMenu
                placeholder="Type a command or search…"
                suggestions={paletteSuggestions}
                items={paletteCommands}
                onSelect={(value) => {
                  lastAction = value
                  handle.update()
                }}
              />
              <div className="example-note" role="status">
                {lastAction && `Selected ${lastAction}`}
              </div>
            </div>
          )
        case 'date-picker':
          if (handle.props.gallery)
            return <DatePicker label="Start date" defaultValue={datePickerToday()} clearable />
          return <DatePicker label="Start date" defaultMonth="2026-11-01" />
        case 'dialog':
          return (
            <Dialog
              title="Create teamspace"
              trigger={handle.props.gallery ? 'Open Dialog' : 'Open dialog'}
              triggerVariant={handle.props.gallery ? 'secondary' : undefined}
              triggerSize={handle.props.gallery ? 'compact' : undefined}
              description={
                handle.props.gallery
                  ? 'Add a new teamspace to organize your projects.'
                  : 'Add a new teamspace to organize your projects and collaborate with your team.'
              }
              footer={(close) => (
                <>
                  <Button variant="ghost" mix={on('click', close)}>
                    Cancel
                  </Button>
                  <Button mix={on('click', close)}>Create</Button>
                </>
              )}
            />
          )
        case 'field':
          return <RequestFormExample />
        case 'input':
          return (
            <div className="example-block" style={{ width: 'min(100%, 320px)' }}>
              <Input type="email" aria-label="Email" placeholder="Email" />
            </div>
          )
        case 'input-copy':
          return (
            <div
              className="example-block"
              style={{ width: handle.props.showcase ? 'min(100%, 420px)' : 'min(100%, 288px)' }}
            >
              <InputCopy
                value="pnpm add remix @remix-run/ui @remix-run/component"
                onCopy={playCopySuccess}
              />
            </div>
          )
        case 'file-input':
          return (
            <div style={{ width: 'min(100%, 320px)' }}>
              <FileInput
                label="Documents"
                name="documents"
                accept=".pdf,.txt"
                maxFiles={3}
                multiple
              />
            </div>
          )
        case 'trigger-menu':
          return (
            <div style={{ width: 'min(100%, 320px)' }}>
              <TriggerMenu
                triggers={composerTriggers}
                renderField={(props) => (
                  <Textarea {...props} aria-label="Message" placeholder="Type @ or /" />
                )}
              />
            </div>
          )
        case 'progress':
          return (
            <div style={{ width: 'min(100%, 280px)' }}>
              <Progress label="Uploading files" value={7} max={12} showValue />
            </div>
          )
        case 'number-field':
          return (
            <div style={{ width: 'min(100%, 240px)' }}>
              <NumberField label="Guests" name="guests" min={1} max={12} defaultValue={2} scrub />
            </div>
          )
        case 'input-group':
          return (
            <div className="example-block" style={{ width: 'min(100%, 320px)' }}>
              <InputGroup>
                {handle.props.showcase ? (
                  <>
                    <InputField
                      label="Name"
                      placeholder="Your name"
                      icon={handle.props.gallery ? <Icon name="users" /> : undefined}
                    />
                    <InputField
                      type="email"
                      label="Email"
                      placeholder="you@example.com"
                      icon={handle.props.gallery ? <Icon name="mail" /> : undefined}
                    />
                    {handle.props.gallery && (
                      <NumberField
                        label="Guests"
                        name="guests"
                        min={1}
                        max={12}
                        defaultValue={2}
                        scrub
                      />
                    )}
                  </>
                ) : (
                  <InputField
                    label="Search"
                    placeholder="Search teamspaces..."
                    icon={<Icon name="search" />}
                  />
                )}
              </InputGroup>
            </div>
          )
        case 'input-message':
          return (
            <div className="example-composer example-chat">
              <InputMessage
                attachments={!handle.props.showcase}
                triggers={composerTriggers}
                placeholderSuggestion="Why is every other input box so stiff?"
                onSend={async ({ text, files }) => {
                  message =
                    text || `Attached ${files.length} ${files.length === 1 ? 'file' : 'files'}`
                  handle.update()
                  play('success')
                }}
              />
              {message && <ChatMessage role="user">{message}</ChatMessage>}
            </div>
          )
        case 'radio-group':
          if (handle.props.gallery)
            return (
              <div className="example-checklist">
                <RadioGroup
                  label="Animation"
                  hideLabel
                  defaultValue="Moderate spring"
                  options={[
                    'Fast spring',
                    'Moderate spring',
                    'Slow spring',
                    'Comfortable',
                    'No animation',
                  ].map((label) => ({ label, value: label }))}
                />
              </div>
            )
          return (
            <div className="example-checklist">
              <RadioGroup label="Options" hideLabel defaultValue="0" options={radioOptions} />
            </div>
          )
        case 'select':
          return handle.props.showcase ? (
            <Select
              label="Role"
              defaultValue="viewer"
              options={[
                { value: 'viewer', label: 'Viewer' },
                { value: 'editor', label: 'Editor' },
                ...(handle.props.gallery
                  ? [
                      { value: 'owner', label: 'Owner' },
                      { value: 'guest', label: 'Guest' },
                    ]
                  : [{ value: 'admin', label: 'Admin' }]),
              ]}
            />
          ) : (
            <Select
              label="Fruit"
              placeholder="Select a fruit…"
              options={['Apple', 'Banana', 'Cherry', 'Mango'].map((label) => ({
                value: label.toLowerCase(),
                label,
              }))}
            />
          )
        case 'sidebar':
          if (handle.props.showcase && handle.props.slug === 'sidebar' && handle.props.avatar)
            return <GallerySidebar avatar={handle.props.avatar} />
          return (
            <div className="example-wide">
              <Sidebar
                label="Studio workspace"
                defaultWidth={165}
                minWidth={120}
                maxWidth={220}
                activeHref={lastAction || '#overview'}
                header="Studio"
                footer="Alex Morgan"
                searchable
                sections={[
                  {
                    label: 'Workspace',
                    items: [
                      {
                        label: 'Overview',
                        href: '#overview',
                        onClick: (event) => {
                          event.preventDefault()
                          lastAction = '#overview'
                          handle.update()
                        },
                      },
                      {
                        label: 'Inbox',
                        href: '#inbox',
                        badge: '3',
                        onClick: (event) => {
                          event.preventDefault()
                          lastAction = '#inbox'
                          handle.update()
                        },
                      },
                    ],
                  },
                  {
                    label: 'Settings',
                    items: [
                      {
                        label: 'Preferences',
                        href: '#preferences',
                        onClick: (event) => {
                          event.preventDefault()
                          lastAction = '#preferences'
                          handle.update()
                        },
                      },
                    ],
                  },
                ]}
              >
                <p className="example-sidebar-content">
                  {lastAction === '#inbox'
                    ? 'Inbox'
                    : lastAction === '#preferences'
                      ? 'Preferences'
                      : 'Overview'}
                </p>
              </Sidebar>
            </div>
          )
        case 'slider':
          return (
            <div className="example-slider">
              <div className="example-slider-opacity">
                <div className="example-slider-readout">
                  <span>Opacity</span>
                  <span>{opacity}</span>
                </div>
                <Slider
                  label="Opacity"
                  showLabel={false}
                  value={opacity}
                  showValue={false}
                  onChange={(value) => {
                    if (typeof value === 'number') opacity = value
                    handle.update()
                  }}
                />
              </div>
              <Slider
                label="Volume"
                defaultValue={60}
                variant="scrubber"
                formatValue={(value) => `${value}%`}
              />
            </div>
          )
        case 'switch':
          return (
            <div className="example-chat">
              <Switch label="Notifications" defaultChecked />
              <Switch label="Sound effects" />
            </div>
          )
        case 'table':
          return (
            <div
              className="example-block"
              style={{ width: handle.props.showcase ? 'min(100%, 420px)' : 'min(100%, 566px)' }}
            >
              <Table aria-label="Team members">
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['Alice', 'Engineer', 'Active'],
                    ['Bob', 'Designer', 'Away'],
                    ['Carol', handle.props.gallery ? 'PM' : 'Manager', 'Active'],
                    ...(handle.props.gallery ? [['Dan', 'Engineer', 'Offline']] : []),
                  ].map((row) => (
                    <TableRow key={row[0]}>
                      {row.map((cell) => (
                        <TableCell key={cell}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        case 'textarea':
          return (
            <div className="example-block" style={{ width: 'min(100%, 384px)' }}>
              <Textarea
                autoResize
                aria-label="Message"
                rows={3}
                placeholder="Type your message here."
              />
            </div>
          )
        case 'thinking-indicator':
          return <ThinkingIndicator />
        case 'thinking-steps':
          return (
            <ThinkingSteps
              label="Research Agent"
              variant="timeline"
              steps={[
                {
                  value: 'profiles',
                  title: 'Searching profiles',
                  icon: <Icon name="search" />,
                  status: 'complete',
                  content: (
                    <ThinkingStepSources>
                      <ThinkingStepSource>x.com</ThinkingStepSource>
                      <ThinkingStepSource>github.com</ThinkingStepSource>
                    </ThinkingStepSources>
                  ),
                },
                {
                  value: 'portfolio',
                  title: 'Reading portfolio',
                  icon: <Icon name="globe" />,
                  status: 'complete',
                  content: (
                    <ThinkingStepDetails
                      summary="Explored 4 pages"
                      details={['about.html', 'projects.html', 'resume.pdf', 'contact.html'].map(
                        (name) => `Read ${name}`,
                      )}
                    />
                  ),
                },
                {
                  value: 'recent-work',
                  title: 'Searching recent work',
                  icon: <Icon name="search" />,
                  status: 'complete',
                  content: (
                    <ThinkingStepSources>
                      <ThinkingStepSource>figma.com</ThinkingStepSource>
                      <ThinkingStepSource>behance.net</ThinkingStepSource>
                    </ThinkingStepSources>
                  ),
                },
                {
                  value: 'analysis',
                  title: 'Analyzing results',
                  icon: <Icon name="brain" />,
                  status: 'active',
                  description: 'Compiling findings into a summary.',
                },
              ]}
            />
          )
        case 'tooltip':
          return (
            <Tooltip
              content={handle.props.gallery ? 'Copy to clipboard' : 'Save your changes'}
              renderTrigger={(props) => (
                <Button
                  {...props}
                  variant={handle.props.showcase ? 'secondary' : 'primary'}
                  size={handle.props.showcase ? 'compact' : undefined}
                >
                  Hover me
                </Button>
              )}
            />
          )
        case 'queued-stack':
          return (
            <div
              className="example-queue-chat"
              mix={[
                on('pointerenter', () => {
                  queueHovered = true
                }),
                on('pointerleave', () => {
                  queueHovered = false
                  if (queued !== initialQueue || sentQueue.length) scheduleRestore()
                }),
              ]}
            >
              <ChatLayout
                label="Sent messages"
                composer={
                  <QueuedStack
                    transitionMessages
                    messages={queued}
                    onOrderChange={(ids) => {
                      const byId = new Map(queued.map((entry) => [entry.id, entry]))
                      queued = ids.flatMap((id) => byId.get(id) ?? [])
                      handle.update()
                      scheduleRestore()
                    }}
                    onRemove={(id) => {
                      queued = queued.filter((entry) => entry.id !== id)
                      handle.update()
                      scheduleRestore()
                    }}
                    onSend={async (id) => {
                      const entry = queued.find((item) => item.id === id)
                      if (entry) sentQueue = [...sentQueue, entry]
                      queued = queued.filter((item) => item.id !== id)
                      await handle.update()
                      scheduleRestore()
                    }}
                  />
                }
              >
                {sentQueue.map((entry) => (
                  <ChatMessage key={entry.id} role="user" transitionId={entry.id} animate={false}>
                    {entry.content}
                  </ChatMessage>
                ))}
              </ChatLayout>
            </div>
          )
        case 'fluid-hover':
          return (
            <RadioGroup
              label="Try moving between rows"
              defaultValue="default"
              options={[
                { value: 'default', label: 'Default' },
                { value: 'compact', label: 'Compact' },
                { value: 'pill', label: 'Pill' },
              ]}
            />
          )
        case 'motion':
          return (
            <div className="example-chat">
              <Switch label="Drag or toggle" />
              <CarouselDots
                count={4}
                current={slide}
                onChange={(index) => {
                  slide = index
                  handle.update()
                }}
              />
            </div>
          )
        case 'reveal':
          return (
            <div className="example-chat">
              <Button
                variant="tertiary"
                mix={on('click', () => {
                  slide++
                  handle.update()
                })}
              >
                Replay reveal
              </Button>
              <p key={slide} mix={reveal()}>
                Revealed content
              </p>
            </div>
          )
        case 'scrollbars':
          return (
            <div
              className="example-block rf-scroll-area example-scroll"
              role="region"
              aria-label="Scrollable items"
              tabIndex={0}
            >
              {Array.from({ length: 8 }, (_, index) => (
                <p key={index}>Workspace item {index + 1}</p>
              ))}
            </div>
          )
        case 'sizes':
          return (
            <div className="example-row">
              <Button>Default</Button>
              <Button size="compact" variant="secondary">
                Compact
              </Button>
            </div>
          )
        case 'surfaces':
          return (
            <div className="example-block example-surfaces">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={index} style={{ backgroundColor: `var(--rf-surface-${index + 1})` }}>
                  {index + 1}
                </span>
              ))}
            </div>
          )
        case 'typography':
          return (
            <div className="example-block">
              <div style={{ fontSize: 'var(--rf-text-display)' }}>Display</div>
              <p style={{ fontSize: 'var(--rf-text-title)' }}>Title</p>
              <p>Body text</p>
              <small>Caption</small>
            </div>
          )
      }
      return null
    }
  },
)
