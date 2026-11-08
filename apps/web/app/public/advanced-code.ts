// Complete source for the interactive composition examples.
export const advancedSource = {
  controlled: `import { on, type Handle } from 'remix/component'
import { AskUserQuestions, Button, Tabs, type AskUserAnswer, type AskUserQuestion } from '@rtzll/reflow'

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
        <Button
          size="compact"
          variant="secondary"
          mix={on('click', loadSample)}
        >
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
        {saved
          ? 'Answers saved. The parent returned to the first question.'
          : ''}
      </output>
    </div>
  )
}`,
  'streaming-text': `<ThinkingSteps label="Thinking" variant="timeline" steps={[{
  value: "analysis",
  title: "Analyzing the interface",
  status: finished ? "complete" : "active",
  content: <p aria-busy={!finished}>{textSoFar}</p>,
}]} />`,
  images: `<ThinkingSteps label="Vision Agent" variant="timeline" steps={[{
  value: "preview",
  title: "Reviewing the homepage",
  content: <ThinkingStepImage src="/preview.png" alt="Homepage preview" caption="Homepage screenshot" />,
}]} />`,
  rich: `<ThinkingSteps label="Research Agent" variant="timeline" steps={[{
  value: "sources",
  title: "Searching sources",
  content: <>
    <ThinkingStepSources>
      <ThinkingStepSource href="/docs">Documentation</ThinkingStepSource>
      <ThinkingStepSource delay={45}>Source</ThinkingStepSource>
    </ThinkingStepSources>
    <ThinkingStepDetails summary="Explored four files" details={files} />
  </>,
}]} />`,
  workspace: `import { on, type Handle } from 'remix/component'
import { Badge, Banner, BannerAction, BannerActions, BannerTitle, Button, Card, CardDescription, CardTitle, Dialog, Dropdown, Field, Input, Sidebar, Switch, type SidebarItem } from '@rtzll/reflow'

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
      href: \`#\${project.id}\`,
      onClick: navigate,
      actions: (
        <Dropdown
          label="⋯"
          variant="ghost"
          items={[{ value: 'archive', label: 'Archive project' }]}
          onSelect={() => {
            projects = projects.filter((item) => item.id !== project.id)
            if (active === \`#\${project.id}\`) active = '#projects'
            handle.update()
          }}
        />
      ),
    }))
    const title =
      projects.find((project) => \`#\${project.id}\` === active)?.label ??
      { '#inbox': 'Inbox', '#projects': 'Projects', '#settings': 'Settings' }[
        active
      ] ??
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
              <span>{workspace} / {title}</span>
              <Badge color={plan === 'Pro' ? 'violet' : 'gray'}>{plan}</Badge>
            </>
          }
          searchable
          activeHref={active}
          header={
            <Dropdown
              label={workspace}
              variant="ghost"
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
              variant="ghost"
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
                {plan === 'Free'
                  ? 'Make room for more'
                  : 'Your workspace is on Pro'}
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
                        id: \`new-\${nextId++}\`,
                        label: projectName.trim(),
                      }
                      projects = [...projects, project]
                      active = \`#\${project.id}\`
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
                  ? \`\${projects.length} projects in this workspace.\`
                  : \`You are viewing \${title}.\`}
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
                  {value === 'Free'
                    ? 'For personal projects'
                    : 'For growing teams'}
                </CardDescription>
              </Card>
            ))}
          </div>
        </Dialog>
      </div>
    )
  }
}`,
}
