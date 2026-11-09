import { advancedSource } from './advanced-code.ts'
import { on, ref, type Handle } from 'remix/component'
import {
  AskUserQuestions,
  Badge,
  Banner,
  BannerAction,
  BannerActions,
  BannerTitle,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Dialog,
  Dropdown,
  Field,
  Icon,
  Input,
  Sidebar,
  Switch,
  Tabs,
  ThinkingSteps,
  ThinkingStepDetails,
  ThinkingStepImage,
  ThinkingStepSource,
  ThinkingStepSources,
  type AskUserAnswer,
  type AskUserQuestion,
  type SidebarItem,
  type ThinkingStep,
} from '@rtzll/reflow'

const researchText =
  'The interface uses one shared hover surface, measured against each row. Keeping the highlight continuous makes movement between controls feel connected. Keyboard focus stays visible, and reduced motion keeps every action immediate.'

export const advancedExamples = {
  'ask-user-questions': [
    {
      title: 'Controlled',
      variant: 'controlled',
      description:
        'The parent owns the active question and answers. Load sample answers, switch questions, or clear the state from outside the component.',
      code: advancedSource['controlled'],
    },
  ],
  'thinking-steps': [
    {
      title: 'Streaming Text',
      variant: 'streaming-text',
      description:
        'Text arrives progressively inside the expanded step. Replay restarts the stream, and reduced motion reveals the complete text immediately.',
      code: advancedSource['streaming-text'],
    },
    {
      title: 'With Images',
      variant: 'images',
      description: 'Step content can contain native images, captions, and source links.',
      code: advancedSource['images'],
    },
    {
      title: 'Sources and details',
      variant: 'rich',
      description:
        'Combine source badges, expandable notes, images, and step status in a single research flow.',
      code: advancedSource['rich'],
    },
  ],
  sidebar: [
    {
      title: 'Workspace composition',
      variant: 'workspace',
      description:
        'Switch workspaces, navigate nested projects, create a project, and open profile settings. The preview keeps its own local state.',
      code: advancedSource['workspace'],
    },
  ],
}

export function ControlledQuestions(handle: Handle) {
  let index = 0
  let answers: Record<string, AskUserAnswer> = {}
  let saved = false
  const questions: AskUserQuestion[] = [
    {
      id: 'role',
      title: 'What is your role?',
      options: [
        { id: 'design', title: 'Designer' },
        { id: 'eng', title: 'Engineer' },
      ],
    },
    {
      id: 'tool',
      title: 'Which tool do you use?',
      options: [
        { id: 'figma', title: 'Figma' },
        { id: 'editor', title: 'Code editor' },
      ],
    },
  ]
  function loadSample() {
    answers = { role: { questionId: 'role', selectedIds: ['eng'] } }
    index = 0
    saved = false
    handle.update()
  }
  return () => (
    <div class="doc-demo-wide doc-demo-stack">
      <div class="doc-demo-row">
        <Button size="compact" variant="secondary" mix={on('click', loadSample)}>
          Load sample answer
        </Button>
        <Button
          size="compact"
          variant="ghost"
          mix={on('click', () => {
            answers = {}
            index = 0
            saved = false
            handle.update()
          })}
        >
          Clear answers
        </Button>
      </div>
      <Tabs
        label="Choose question"
        value={String(index)}
        onValueChange={(value) => {
          index = Number(value)
          handle.update()
        }}
        items={questions.map((question, position) => ({
          value: String(position),
          label: position === 0 ? 'Role' : 'Tool',
        }))}
      />
      <AskUserQuestions
        questions={questions}
        currentIndex={index}
        onCurrentIndexChange={(value) => {
          index = value
          handle.update()
        }}
        answers={answers}
        onAnswersChange={(value) => {
          answers = value
          saved = false
          handle.update()
        }}
        onComplete={() => {
          saved = true
          index = 0
          handle.update()
        }}
      />
      <div class="doc-controlled-state">
        <span>Parent state</span>
        <pre>{JSON.stringify(answers, null, 2)}</pre>
      </div>
      <output class="doc-demo-feedback">
        {saved ? 'Answers saved. The parent returned to the first question.' : ''}
      </output>
    </div>
  )
}

export function RichThinkingSteps(handle: Handle<{ variant: string; previewImage: string }>) {
  let progress = 0
  let open = true
  let inView = false
  let paused = false
  let reduced = false
  let timer: ReturnType<typeof setTimeout> | undefined
  // The reference's schedules: when each step appears, in ms from the start,
  // the last entry marking every step complete. Text streams 3 characters
  // every 16ms once its step appears.
  const schedules: Record<string, readonly number[]> = {
    streaming: [400, 1800, 3200, 4200, 5200],
    full: [400, 1600, 2800, 3800, 5000, 6200, 7200],
  }
  // Time left before the next tick, kept across a pause.
  let remaining: number | undefined
  let due = 0
  function limit() {
    const variant = handle.props.variant
    return variant === 'streaming-text' ? researchText.length : (schedules[variant]?.length ?? 1)
  }
  function gap() {
    const variant = handle.props.variant
    if (variant === 'streaming-text') return progress === 0 ? 400 : 16
    const schedule = schedules[variant] ?? [400]
    return (schedule[progress] ?? 0) - (schedule[progress - 1] ?? 0)
  }
  // The preview frame's header button plays, pauses and replays the stream,
  // as in the reference; the demo reports its state for that button.
  let host: HTMLElement | null = null
  let reported: string | undefined
  function report() {
    const state =
      progress >= limit() ? 'finished' : inView && !paused && !reduced ? 'playing' : 'paused'
    if (!host || state === reported) return
    reported = state
    host.dispatchEvent(new CustomEvent('reflow:playback', { bubbles: true, detail: { state } }))
  }
  function synchronize() {
    report()
    if (timer !== undefined) remaining = Math.max(0, due - performance.now())
    clearTimeout(timer)
    timer = undefined
    if (!inView || paused || reduced || progress >= limit()) return
    const wait = remaining ?? gap()
    remaining = undefined
    due = performance.now() + wait
    timer = setTimeout(() => {
      timer = undefined
      const text = handle.props.variant === 'streaming-text'
      progress = Math.min(limit(), progress + (text ? 3 : 1))
      handle.update()
      synchronize()
    }, wait)
  }
  const stream = ref((element, signal) => {
    if (handle.props.variant === 'rich' || !(element instanceof HTMLElement)) return
    host = element
    const frame = element.closest<HTMLElement>('[data-component-preview]') ?? element
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const preference = () => {
      reduced = motion.matches
      if (reduced) progress = limit()
      synchronize()
      handle.update()
    }
    motion.addEventListener('change', preference, { signal })
    preference()
    // As in the reference: play once half the example is in view, pause when
    // it scrolls away, and forget a manual pause once it has left the screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.intersectionRatio >= 0.5) inView = true
        else if (entry.intersectionRatio < 0.1) {
          inView = false
          paused = false
        }
        synchronize()
      },
      { threshold: [0.1, 0.5] },
    )
    observer.observe(frame)
    frame.addEventListener(
      'reflow:playback-control',
      ((event: CustomEvent<{ action: 'play' | 'pause' }>) => {
        paused = event.detail.action === 'pause'
        synchronize()
      }) as EventListener,
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        observer.disconnect()
      },
      { once: true },
    )
  })
  return () => {
    const variant = handle.props.variant
    const image = (
      <ThinkingStepImage
        src={handle.props.previewImage}
        alt="Reflow component showcase preview"
        width={1200}
        height={630}
        caption="Component showcase · Reflow"
      />
    )
    const sources = (
      <div class="doc-research-content">
        <ThinkingStepSources>
          <ThinkingStepSource
            href="https://github.com/rtzll/reflow/blob/main/docs/integration.md"
            delay={50}
          >
            Documentation
          </ThinkingStepSource>
          <ThinkingStepSource href="https://github.com/rtzll/reflow" delay={100}>
            Source
          </ThinkingStepSource>
        </ThinkingStepSources>
        <ThinkingStepDetails
          summary="Explored four files"
          details={[
            'Component anatomy',
            'Animation tokens',
            'Keyboard interactions',
            'Theme configuration',
          ]}
        />
      </div>
    )
    const steps: ThinkingStep[] =
      variant === 'streaming-text'
        ? [
            {
              value: 'analysis',
              title: 'Analyzing the interface',
              icon: <Icon name="brain" />,
              status: progress < researchText.length ? 'active' : 'complete',
              content: (
                <p class="doc-streaming-text" aria-busy={progress < researchText.length}>
                  {researchText.slice(0, progress)}
                  {progress < researchText.length && (
                    <span class="doc-stream-caret" aria-hidden="true" />
                  )}
                </p>
              ),
            },
          ]
        : variant === 'streaming'
          ? [
              {
                value: 'search',
                title: 'Searching for sources',
                icon: <Icon name="search" />,
                content: sources,
              },
              { value: 'read', title: 'Reading sources', icon: <Icon name="globe" /> },
              { value: 'analysis', title: 'Analyzing results', icon: <Icon name="brain" /> },
              { value: 'done', title: 'Complete', icon: <Icon name="check" /> },
            ]
          : variant === 'images'
            ? [
                {
                  value: 'preview',
                  title: 'Reviewing the homepage',
                  icon: <Icon name="file" />,
                  status: 'complete',
                  content: image,
                },
              ]
            : [
                {
                  value: 'sources',
                  title: 'Searching sources',
                  icon: <Icon name="search" />,
                  status: 'complete',
                  content: sources,
                },
                {
                  value: 'preview',
                  title: 'Reviewing the homepage',
                  icon: <Icon name="file" />,
                  status: 'complete',
                  content: image,
                },
                {
                  value: 'analysis',
                  title: 'Compiling findings',
                  icon: <Icon name="brain" />,
                  status: 'active',
                  content: (
                    <p>
                      The interaction patterns share consistent timing, geometry, and keyboard
                      behavior.
                    </p>
                  ),
                },
              ]
    if (variant === 'full') {
      steps.splice(
        0,
        steps.length,
        {
          value: 'profiles',
          title: 'Exploring the library',
          icon: <Icon name="search" />,
          content: (
            <ThinkingStepSources>
              <ThinkingStepSource delay={50}>x.com</ThinkingStepSource>
              <ThinkingStepSource delay={100}>instagram.com</ThinkingStepSource>
              <ThinkingStepSource delay={150}>github.com</ThinkingStepSource>
            </ThinkingStepSources>
          ),
        },
        {
          value: 'photo',
          title: 'Captured the showcase',
          icon: <Icon name="image" />,
          description: 'Reflow component gallery',
          content: image,
        },
        {
          value: 'portfolio',
          title: 'Reading documentation',
          icon: <Icon name="globe" />,
          content: (
            <ThinkingStepDetails
              summary="Explored 4 pages"
              details={[
                'Read README.md',
                'Read integration.md',
                'Read customization.md',
                'Read coverage.md',
              ]}
            />
          ),
        },
        {
          value: 'recent-work',
          title: 'Searching for recent work',
          icon: <Icon name="search" />,
          content: (
            <ThinkingStepSources>
              <ThinkingStepSource delay={50}>figma.com</ThinkingStepSource>
              <ThinkingStepSource delay={100}>behance.net</ThinkingStepSource>
              <ThinkingStepSource delay={150}>google.com</ThinkingStepSource>
            </ThinkingStepSources>
          ),
        },
        {
          value: 'analysis',
          title: 'Analyzing results',
          icon: <Icon name="brain" />,
          description: 'Compiling findings into a summary.',
        },
        { value: 'done', title: 'Research complete', icon: <Icon name="check" /> },
      )
    }

    const label =
      variant === 'streaming-text' || variant === 'streaming'
        ? 'Thinking'
        : variant === 'images'
          ? 'Vision Agent'
          : 'Research Agent'
    const staged = variant === 'streaming' || variant === 'full' || variant === 'images'
    const finished = progress >= limit()
    return (
      <div class="doc-thinking-timeline" mix={stream}>
        <ThinkingSteps
          label={label}
          variant="timeline"
          open={open}
          onOpenChange={(value) => {
            open = value
            handle.update()
          }}
          steps={
            staged
              ? steps.map((step, index) => ({
                  ...step,
                  // A step shows its sources and details once it completes.
                  content: finished || index < progress - 1 ? step.content : undefined,
                  status:
                    finished || index < progress - 1
                      ? 'complete'
                      : index === progress - 1
                        ? 'active'
                        : 'pending',
                }))
              : steps
          }
        />
      </div>
    )
  }
}

export function WorkspaceSidebar(handle: Handle) {
  let workspace = 'Acme Inc'
  let active = '#inbox'
  let projects = [
    { id: 'design', label: 'Design system' },
    { id: 'website', label: 'Website' },
    { id: 'brand', label: 'Brand' },
  ]
  let nextId = 1
  let projectName = ''
  let profileOpen = false
  let workspaceName = 'Alex Morgan'
  let upgradeOpen = false
  let plan = 'Free'
  const navigate = (event: MouseEvent) => {
    if (!(event.currentTarget instanceof HTMLAnchorElement)) return
    event.preventDefault()
    active = event.currentTarget.hash
    handle.update()
  }
  const icon = (path: string) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
  return () => {
    const projectItems: SidebarItem[] = projects.map((project) => ({
      label: project.label,
      href: `#${project.id}`,
      onClick: navigate,
      actions: (
        <Dropdown
          label={`Actions for ${project.label}`}
          variant="bare"
          triggerClass="rf-sidebar-action"
          chevron={false}
          triggerContent={<Icon name="more-vertical" />}
          items={[{ value: 'archive', label: 'Archive project' }]}
          onSelect={() => {
            projects = projects.filter((item) => item.id !== project.id)
            if (active === `#${project.id}`) active = '#projects'
            handle.update()
          }}
        />
      ),
    }))
    const title =
      projects.find((project) => `#${project.id}` === active)?.label ??
      { '#inbox': 'Inbox', '#projects': 'Projects', '#settings': 'Settings' }[active] ??
      'Workspace'
    return (
      <div class="doc-workspace-shell">
        <Sidebar
          variant="inset"
          label="Workspace preview"
          defaultWidth={204}
          minWidth={160}
          maxWidth={280}
          toolbar={
            <>
              <span class="doc-workspace-crumb">
                {workspace} / {title}
              </span>
              <Badge color={plan === 'Pro' ? 'violet' : 'gray'}>{plan}</Badge>
            </>
          }
          searchable
          activeHref={active}
          header={
            <Dropdown
              label={workspace}
              variant="bare"
              triggerClass="rf-sidebar-row"
              triggerContent={
                <>
                  <span class="rf-sidebar-tile" aria-hidden="true">
                    {workspace[0]}
                  </span>
                  <span class="rf-sidebar-row-name">{workspace}</span>
                  <Icon name="chevron-down" />
                </>
              }
              items={['Acme Inc', 'Design Studio'].map((label) => ({
                value: label,
                label,
              }))}
              onSelect={(value) => {
                workspace = value
                handle.update()
              }}
            />
          }
          footer={
            <Dropdown
              label={workspaceName}
              variant="bare"
              triggerClass="rf-sidebar-row"
              side="top"
              triggerContent={
                <>
                  <span class="rf-sidebar-avatar" aria-hidden="true">
                    {workspaceName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span class="rf-sidebar-row-name rf-sidebar-row-plain">{workspaceName}</span>
                  <span class="rf-sidebar-row-trailing" aria-hidden="true">
                    <Icon name="chevrons-up-down" />
                  </span>
                </>
              }
              items={[
                { value: 'profile', label: 'Profile settings' },
                { value: 'plan', label: 'Workspace plan' },
              ]}
              onSelect={(value) => {
                profileOpen = value === 'profile'
                upgradeOpen = value === 'plan'
                handle.update()
              }}
            />
          }
          callout={
            <Banner>
              <BannerTitle>
                {plan === 'Free' ? 'Make room for more' : 'Your workspace is on Pro'}
              </BannerTitle>
              <BannerActions>
                <BannerAction
                  variant="ghost"
                  mix={on('click', () => {
                    upgradeOpen = true
                    handle.update()
                  })}
                >
                  View plans
                </BannerAction>
              </BannerActions>
            </Banner>
          }
          sections={[
            {
              label: 'Workspace',
              items: [
                {
                  label: 'Inbox',
                  href: '#inbox',
                  badge: '3',
                  icon: icon('M3 4h18v16H3zM3 14h5l2 3h4l2-3h5'),
                  onClick: navigate,
                },
                {
                  label: 'Projects',
                  href: '#projects',
                  icon: icon('M3 6h7l2 2h9v12H3z'),
                  onClick: navigate,
                  children: projectItems,
                  defaultExpanded: true,
                },
                {
                  label: 'Settings',
                  href: '#settings',
                  icon: icon('M4 6h16M4 12h16M4 18h16'),
                  onClick: navigate,
                },
              ],
            },
          ]}
        >
          <div class="doc-workspace-content">
            <h3>{title}</h3>
            <Dialog
              title="New project"
              trigger="New project"
              onOpenChange={(open) => {
                if (open) {
                  projectName = ''
                  handle.update()
                }
              }}
              footer={(close) => (
                <>
                  <Button variant="ghost" mix={on('click', close)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={!projectName.trim()}
                    mix={on('click', () => {
                      const project = {
                        id: `new-${nextId++}`,
                        label: projectName.trim(),
                      }
                      projects = [...projects, project]
                      active = `#${project.id}`
                      close()
                      handle.update()
                    })}
                  >
                    Create project
                  </Button>
                </>
              )}
            >
              <Field label="Project name">
                {(props) => (
                  <Input
                    {...props}
                    value={projectName}
                    placeholder="New project name"
                    mix={on<HTMLInputElement, 'input'>('input', (event) => {
                      projectName = event.currentTarget.value
                      handle.update()
                    })}
                  />
                )}
              </Field>
            </Dialog>
            <p>
              {active === '#inbox'
                ? 'Your team has shared three updates.'
                : active === '#projects'
                  ? `${projects.length} projects in this workspace.`
                  : `You are viewing ${title}.`}
            </p>
          </div>
        </Sidebar>
        <Dialog
          title="Profile settings"
          open={profileOpen}
          onOpenChange={(value) => {
            profileOpen = value
            handle.update()
          }}
          footer={(close) => <Button mix={on('click', close)}>Done</Button>}
        >
          <Field label="Display name">
            {(props) => (
              <Input
                {...props}
                value={workspaceName}
                mix={on<HTMLInputElement, 'input'>('input', (event) => {
                  workspaceName = event.currentTarget.value
                  handle.update()
                })}
              />
            )}
          </Field>
          <Switch label="Email notifications" defaultChecked />
        </Dialog>
        <Dialog
          title="Workspace plan"
          description="Choose a plan for this local preview."
          open={upgradeOpen}
          onOpenChange={(value) => {
            upgradeOpen = value
            handle.update()
          }}
          footer={(close) => <Button mix={on('click', close)}>Done</Button>}
        >
          <div class="doc-demo-row">
            {['Free', 'Pro'].map((value) => (
              <Card
                key={value}
                selected={plan === value}
                label={value}
                onClick={() => {
                  plan = value
                  handle.update()
                }}
              >
                <CardTitle>{value}</CardTitle>
                <CardDescription>
                  {value === 'Free' ? 'For personal projects' : 'For growing teams'}
                </CardDescription>
              </Card>
            ))}
          </div>
        </Dialog>
      </div>
    )
  }
}
