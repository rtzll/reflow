import {
  Button,
  CycleOverview,
  EstimatePill,
  FloatingActionBar,
  GroupedList,
  InlinePropertyPicker,
  KanbanBoard,
  LabelPicker,
  PriorityIndicator,
  ProgressRing,
  QuickCreateBar,
  RelationList,
  RoadmapTimeline,
  SavedViewTabs,
  StatusIcon,
  SubIssueList,
  TriageQueue,
  ViewOptionsPopover,
  placeGroupedItems,
  type KanbanItem,
  type SubIssue,
  type TriageItem,
} from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

export function FloatingActionBarExample(handle: Handle) {
  let count = 3
  return () => (
    <div
      style={{ width: 'min(100%, 480px)', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      {count === 0 ? (
        <Button
          size="compact"
          variant="secondary"
          mix={on('click', () => {
            count = 3
            void handle.update()
          })}
        >
          Select 3 issues
        </Button>
      ) : (
        <FloatingActionBar
          count={count}
          position="inline"
          onClear={() => {
            count = 0
            void handle.update()
          }}
          actions={
            <>
              <Button size="compact" variant="secondary">
                Set status
              </Button>
              <Button size="compact" variant="secondary">
                Assign
              </Button>
              <Button size="compact" variant="secondary">
                Move to cycle
              </Button>
            </>
          }
        />
      )}
    </div>
  )
}

export function ViewOptionsPopoverExample(handle: Handle) {
  let layout = 'board'
  let groupBy = 'status'
  let orderBy = 'priority'
  let showEmptyGroups = true
  let propsList = [
    { id: 'priority', label: 'Priority', visible: true },
    { id: 'assignee', label: 'Assignee', visible: true },
    { id: 'labels', label: 'Labels', visible: true },
    { id: 'estimate', label: 'Estimate', visible: false },
  ]

  return () => (
    <ViewOptionsPopover
      layout={layout}
      layouts={[
        { value: 'list', label: 'List' },
        { value: 'board', label: 'Board' },
        { value: 'roadmap', label: 'Roadmap' },
      ]}
      onLayoutChange={(next) => {
        layout = next
        void handle.update()
      }}
      groupBy={groupBy}
      groupByOptions={[
        { value: 'status', label: 'Status' },
        { value: 'priority', label: 'Priority' },
        { value: 'assignee', label: 'Assignee' },
      ]}
      onGroupByChange={(next) => {
        groupBy = next
        void handle.update()
      }}
      orderBy={orderBy}
      orderByOptions={[
        { value: 'manual', label: 'Manual' },
        { value: 'priority', label: 'Priority' },
        { value: 'updated', label: 'Updated' },
      ]}
      onOrderByChange={(next) => {
        orderBy = next
        void handle.update()
      }}
      showEmptyGroups={showEmptyGroups}
      onShowEmptyGroupsChange={(next) => {
        showEmptyGroups = next
        void handle.update()
      }}
      properties={propsList}
      onToggleProperty={(id, visible) => {
        propsList = propsList.map((item) => (item.id === id ? { ...item, visible } : item))
        void handle.update()
      }}
    />
  )
}

export function InlinePropertyPickerExample(handle: Handle) {
  let status = 'in-progress'
  let priority = 'high'
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <InlinePropertyPicker
        label="Status"
        value={status}
        onChange={(next) => {
          status = next
          void handle.update()
        }}
        options={[
          {
            value: 'backlog',
            label: 'Backlog',
            icon: <StatusIcon status="backlog" size={13} decorative />,
          },
          { value: 'todo', label: 'Todo', icon: <StatusIcon status="todo" size={13} decorative /> },
          {
            value: 'in-progress',
            label: 'In progress',
            icon: <StatusIcon status="in-progress" size={13} decorative />,
          },
          { value: 'done', label: 'Done', icon: <StatusIcon status="done" size={13} decorative /> },
        ]}
      />
      <InlinePropertyPicker
        label="Priority"
        value={priority}
        onChange={(next) => {
          priority = next
          void handle.update()
        }}
        options={[
          {
            value: 'urgent',
            label: 'Urgent',
            icon: <PriorityIndicator priority="urgent" size={13} decorative />,
          },
          {
            value: 'high',
            label: 'High',
            icon: <PriorityIndicator priority="high" size={13} decorative />,
          },
          {
            value: 'medium',
            label: 'Medium',
            icon: <PriorityIndicator priority="medium" size={13} decorative />,
          },
          {
            value: 'low',
            label: 'Low',
            icon: <PriorityIndicator priority="low" size={13} decorative />,
          },
        ]}
      />
    </div>
  )
}

export function ProgressRingExample() {
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
      <ProgressRing label="Sub-issues 60%" value={3} max={5} size={22} tone="success" />
      <ProgressRing label="Cycle progress 72%" value={72} max={100} size={48} tone="accent">
        <span style={{ fontSize: '11px', fontWeight: 600 }}>72%</span>
      </ProgressRing>
      <ProgressRing
        label="Status breakdown"
        size={64}
        strokeWidth={7}
        segments={[
          { id: 'done', label: 'Done', value: 7, tone: 'success' },
          { id: 'active', label: 'In progress', value: 3, tone: 'warning' },
          { id: 'todo', label: 'Todo', value: 2, tone: 'neutral' },
        ]}
      >
        <span style={{ fontSize: '12px', fontWeight: 600 }}>58%</span>
      </ProgressRing>
    </div>
  )
}

export function PriorityIndicatorExample() {
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
      <PriorityIndicator priority="urgent" showLabel />
      <PriorityIndicator priority="high" showLabel />
      <PriorityIndicator priority="medium" showLabel />
      <PriorityIndicator priority="low" showLabel />
      <PriorityIndicator priority="none" showLabel />
    </div>
  )
}

export function StatusIconExample() {
  return () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
      <StatusIcon status="backlog" showLabel />
      <StatusIcon status="todo" showLabel />
      <StatusIcon status="in-progress" showLabel />
      <StatusIcon status="in-review" showLabel />
      <StatusIcon status="done" showLabel />
      <StatusIcon status="cancelled" showLabel />
    </div>
  )
}

export function LabelPickerExample(handle: Handle) {
  let options = [
    { id: 'ui', label: 'UI', color: 'blue' as const },
    { id: 'perf', label: 'Performance', color: 'amber' as const },
    { id: 'a11y', label: 'Accessibility', color: 'violet' as const },
    { id: 'bug', label: 'Bug', color: 'red' as const },
  ]
  let selected = ['ui', 'a11y']
  return () => (
    <LabelPicker
      options={options}
      value={selected}
      onChange={(next) => {
        selected = next
        void handle.update()
      }}
      onCreate={(name) => {
        const id = name.toLowerCase().replace(/\s+/g, '-')
        options = [...options, { id, label: name, color: 'blue' }]
        selected = [...selected, id]
        void handle.update()
      }}
    />
  )
}

export function EstimatePillExample(handle: Handle) {
  let estimate: string | number | null = 3
  return () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <EstimatePill
        value={estimate}
        onChange={(next) => {
          estimate = next
          void handle.update()
        }}
      />
      <EstimatePill value={5} readonly />
    </div>
  )
}

export function SavedViewTabsExample(handle: Handle) {
  let activeId = 'active'
  let dirty = true
  return () => (
    <div style={{ width: 'min(100%, 540px)' }}>
      <SavedViewTabs
        activeId={activeId}
        views={[
          { id: 'all', label: 'All issues', count: 32 },
          { id: 'active', label: 'Active cycle', count: 14, dirty },
          { id: 'triage', label: 'Triage', count: 4 },
          { id: 'backlog', label: 'Backlog', count: 18 },
        ]}
        onSelect={(id) => {
          activeId = id
          void handle.update()
        }}
        onSave={() => {
          dirty = false
          void handle.update()
        }}
        onReset={() => {
          dirty = false
          void handle.update()
        }}
        onCreate={() => {
          activeId = 'all'
          void handle.update()
        }}
      />
    </div>
  )
}

const initialKanban: KanbanItem[] = [
  {
    id: 'k1',
    columnId: 'todo',
    key: 'ENG-412',
    title: 'Keyboard shortcuts for WIP column collapse',
    priority: 'medium',
    assignee: 'Ada Lovelace',
    estimate: 2,
    labels: [{ id: 'ui', label: 'UI', color: 'blue' }],
  },
  {
    id: 'k2',
    columnId: 'in-progress',
    key: 'ENG-415',
    title: 'Promote grouped drag placement to headless behavior',
    priority: 'urgent',
    assignee: 'Noah Kim',
    estimate: 5,
    labels: [{ id: 'core', label: 'Core', color: 'violet' }],
  },
  {
    id: 'k3',
    columnId: 'in-progress',
    key: 'ENG-418',
    title: 'Add roadmap diamond milestone markers',
    priority: 'high',
    assignee: 'Lin Chen',
    estimate: 3,
    labels: [{ id: 'ui', label: 'UI', color: 'blue' }],
  },
  {
    id: 'k4',
    columnId: 'done',
    key: 'ENG-409',
    title: 'Ship MergeReadiness and DiffMinimap',
    priority: 'high',
    assignee: 'Ada Lovelace',
    estimate: 3,
    labels: [{ id: 'forge', label: 'Forge', color: 'green' }],
  },
]

export function KanbanBoardExample(
  handle: Handle<{ size?: 'default' | 'compact'; wipLimit?: boolean }>,
) {
  let items = initialKanban
  let selected = new Set<string>()
  return () => (
    <div style={{ width: 'min(100%, 860px)' }}>
      <KanbanBoard
        size={handle.props.size}
        columns={[
          { id: 'todo', title: 'Todo', icon: <StatusIcon status="todo" size={13} decorative /> },
          {
            id: 'in-progress',
            title: 'In progress',
            wipLimit: handle.props.wipLimit === false ? undefined : 2,
            icon: <StatusIcon status="in-progress" size={13} decorative />,
          },
          { id: 'done', title: 'Done', icon: <StatusIcon status="done" size={13} decorative /> },
        ]}
        items={items}
        selectedIds={selected}
        onToggleSelect={(id) => {
          const next = new Set(selected)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          selected = next
          void handle.update()
        }}
        onMoveItem={(itemId, targetColumnId, beforeId) => {
          items = placeGroupedItems(items, {
            movingIds: new Set([itemId]),
            targetGroup: targetColumnId,
            beforeId,
            getId: (item) => item.id,
            getGroup: (item) => item.columnId,
            setGroup: (item, columnId) => ({ ...item, columnId }),
          })
          void handle.update()
        }}
      />
    </div>
  )
}

export function GroupedListExample(
  handle: Handle<{ size?: 'default' | 'compact'; showEmptyGroups?: boolean }>,
) {
  let selected: ReadonlySet<string> = new Set(['g2'])
  return () => (
    <div style={{ width: 'min(100%, 660px)' }}>
      <GroupedList
        size={handle.props.size}
        showEmptyGroups={handle.props.showEmptyGroups ?? true}
        selectedIds={selected}
        onSelectedChange={(next) => {
          selected = next
          void handle.update()
        }}
        groups={[
          {
            id: 'in-progress',
            title: 'In progress',
            icon: <StatusIcon status="in-progress" size={13} decorative />,
          },
          { id: 'todo', title: 'Todo', icon: <StatusIcon status="todo" size={13} decorative /> },
          {
            id: 'backlog',
            title: 'Backlog',
            icon: <StatusIcon status="backlog" size={13} decorative />,
          },
          { id: 'done', title: 'Done', icon: <StatusIcon status="done" size={13} decorative /> },
        ]}
        items={[
          {
            id: 'g1',
            groupId: 'in-progress',
            key: 'ENG-415',
            title: 'Promote grouped drag placement to headless behavior',
            status: 'in-progress',
            priority: 'urgent',
            assignee: 'Noah Kim',
            estimate: 5,
            labels: [{ id: 'core', label: 'Core', color: 'violet' }],
          },
          {
            id: 'g2',
            groupId: 'in-progress',
            key: 'ENG-418',
            title: 'Add roadmap diamond milestone markers',
            status: 'in-progress',
            priority: 'high',
            assignee: 'Lin Chen',
            estimate: 3,
            labels: [{ id: 'ui', label: 'UI', color: 'blue' }],
          },
          {
            id: 'g3',
            groupId: 'todo',
            key: 'ENG-421',
            title: 'Connect saved view tabs to FilterBar URL state',
            status: 'todo',
            priority: 'medium',
            assignee: 'Ada Lovelace',
            estimate: 2,
          },
          {
            id: 'g4',
            groupId: 'done',
            key: 'ENG-409',
            title: 'Ship MergeReadiness and DiffMinimap',
            status: 'done',
            priority: 'high',
            assignee: 'Ada Lovelace',
            estimate: 3,
          },
        ]}
      />
    </div>
  )
}

export function QuickCreateBarExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    showCreateMore?: boolean
    defaultPriority?: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  }>,
) {
  let recent: string[] = []
  return () => (
    <div
      style={{ width: 'min(100%, 560px)', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <QuickCreateBar
        size={handle.props.size}
        showCreateMore={handle.props.showCreateMore ?? true}
        defaultPriority={handle.props.defaultPriority ?? 'medium'}
        assignees={[
          { value: 'ada', label: 'Ada Lovelace' },
          { value: 'noah', label: 'Noah Kim' },
          { value: 'lin', label: 'Lin Chen' },
        ]}
        onCreate={(draft) => {
          recent = [`${draft.title} (${draft.status} · ${draft.priority})`, ...recent.slice(0, 2)]
          void handle.update()
        }}
      />
      {recent.length > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--rf-muted)' }}>
          Created: {recent.join(' · ')}
        </div>
      )}
    </div>
  )
}

export function RoadmapTimelineExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    defaultZoom?: 'weeks' | 'months' | 'quarters'
    showToday?: boolean
  }>,
) {
  return () => (
    <div style={{ width: 'min(100%, 720px)' }}>
      <RoadmapTimeline
        size={handle.props.size}
        defaultZoom={handle.props.defaultZoom}
        label="H1 Platform Roadmap"
        rangeStart="2026-01-01"
        rangeEnd="2026-06-30"
        today={handle.props.showToday === false ? undefined : '2026-03-18'}
        items={[
          {
            id: 'rm-1',
            title: 'Code Review & Diff Suite',
            owner: 'Ada Lovelace',
            startDate: '2026-01-10',
            endDate: '2026-03-20',
            progress: 92,
            tone: 'success',
            milestones: [
              { id: 'ms-1', label: 'Blame gutter GA', date: '2026-03-05', completed: true },
            ],
          },
          {
            id: 'rm-2',
            title: 'Linear Project Tracking',
            owner: 'Noah Kim',
            startDate: '2026-02-15',
            endDate: '2026-05-10',
            progress: 58,
            tone: 'accent',
            milestones: [{ id: 'ms-2', label: 'Boards & Triage beta', date: '2026-04-01' }],
          },
          {
            id: 'rm-3',
            title: 'CI Matrix & Merge Queue',
            owner: 'Lin Chen',
            startDate: '2026-03-01',
            endDate: '2026-06-15',
            progress: 34,
            tone: 'warning',
            milestones: [{ id: 'ms-3', label: 'Speculative batching', date: '2026-05-20' }],
          },
        ]}
      />
    </div>
  )
}

export function CycleOverviewExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    showAssignees?: boolean
    showBurndown?: boolean
  }>,
) {
  let activeStatus: string | null = null
  let activeAssignee: string | null = null
  return () => (
    <div style={{ width: 'min(100%, 660px)' }}>
      <CycleOverview
        size={handle.props.size}
        title="Cycle 14 · Forge & Projects"
        dateRange="Nov 18 – Dec 2"
        activeStatusId={activeStatus}
        activeAssignee={activeAssignee}
        onFilterStatus={(id) => {
          activeStatus = activeStatus === id ? null : id
          void handle.update()
        }}
        onFilterAssignee={(name) => {
          activeAssignee = activeAssignee === name ? null : name
          void handle.update()
        }}
        statuses={[
          { id: 'done', label: 'Done', count: 9, tone: 'success', completed: true },
          { id: 'in-progress', label: 'In progress', count: 4, tone: 'warning' },
          { id: 'todo', label: 'Todo', count: 3, tone: 'neutral' },
        ]}
        assignees={
          handle.props.showAssignees === false
            ? undefined
            : [
                { name: 'Ada', total: 6, completed: 4, inProgress: 1 },
                { name: 'Noah', total: 5, completed: 3, inProgress: 2 },
                { name: 'Lin', total: 5, completed: 2, inProgress: 1 },
              ]
        }
        burndown={
          handle.props.showBurndown === false
            ? undefined
            : {
                labels: ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 9', 'Day 11', 'Day 14'],
                series: [
                  {
                    id: 'scope',
                    label: 'Scope',
                    values: [14, 15, 15, 16, 16, 16, 16],
                    dashed: true,
                  },
                  {
                    id: 'done',
                    label: 'Completed',
                    values: [1, 3, 5, 7, 9, 12, 14],
                    area: true,
                  },
                ],
              }
        }
      />
    </div>
  )
}

export function SubIssueListExample(handle: Handle) {
  let items: SubIssue[] = [
    {
      id: 's1',
      key: 'ENG-415.1',
      title: 'Extract pure group-placement helpers',
      status: 'done',
      assignee: 'Ada',
    },
    {
      id: 's2',
      key: 'ENG-415.2',
      title: 'Wire Alt+Arrow column moves on KanbanBoard',
      status: 'done',
      assignee: 'Noah',
    },
    {
      id: 's3',
      key: 'ENG-415.3',
      title: 'Add multi-select range Shift+Click in GroupedList',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Lin',
    },
    {
      id: 's4',
      key: 'ENG-415.4',
      title: 'Dogfood in showcase Issues app',
      status: 'todo',
      assignee: 'Ada',
    },
  ]
  return () => (
    <div style={{ width: 'min(100%, 520px)' }}>
      <SubIssueList
        items={items}
        onToggleStatus={(item, nextStatus) => {
          items = items.map((entry) =>
            entry.id === item.id ? { ...entry, status: nextStatus } : entry,
          )
          void handle.update()
        }}
        onAdd={(title) => {
          items = [
            ...items,
            {
              id: `s${items.length + 1}`,
              key: `ENG-415.${items.length + 1}`,
              title,
              status: 'todo',
            },
          ]
          void handle.update()
        }}
      />
    </div>
  )
}

export function RelationListExample() {
  return () => (
    <div style={{ width: 'min(100%, 480px)' }}>
      <RelationList
        items={[
          {
            id: 'r1',
            kind: 'blocked-by',
            ref: 'ENG-401',
            title: 'Ship fixed-height VirtualList',
            status: 'done',
          },
          {
            id: 'r2',
            kind: 'blocks',
            ref: 'ENG-430',
            title: 'Release v0.20.0 showcase update',
            status: 'todo',
          },
          {
            id: 'r3',
            kind: 'pull-request',
            ref: '#424',
            title: 'feat(components): Wave 17 project tracking',
            prState: 'open',
          },
          {
            id: 'r4',
            kind: 'related',
            ref: 'ENG-398',
            title: 'Keyboard chord engine (g p / g c)',
            status: 'done',
          },
        ]}
      />
    </div>
  )
}

const initialTriage: TriageItem[] = [
  {
    id: 'tr-1',
    key: 'ENG-511',
    title: 'Compact mode clips focus outline on collapsed Kanban rail',
    description:
      'When collapsing a column under data-density="compact", the focus outline touches the outer border by 1px.',
    reporter: 'Ada Lovelace',
    createdAt: '2026-11-26T11:35:00Z',
    priority: 'high',
    source: 'GitHub',
    labels: [
      { id: 'bug', label: 'Bug', color: 'red' },
      { id: 'a11y', label: 'Accessibility', color: 'violet' },
    ],
  },
  {
    id: 'tr-2',
    key: 'ENG-512',
    title: 'Support T-shirt sizes in EstimatePill preset',
    description: 'Teams using XS–XL sizing instead of Fibonacci points want a one-prop preset.',
    reporter: 'Noah Kim',
    createdAt: '2026-11-26T10:12:00Z',
    priority: 'medium',
    source: 'Slack',
    labels: [{ id: 'ui', label: 'UI', color: 'blue' }],
  },
]

export function TriageQueueExample(handle: Handle<{ size?: 'default' | 'compact' }>) {
  let items = initialTriage
  return () => (
    <div style={{ width: 'min(100%, 680px)' }}>
      <TriageQueue
        size={handle.props.size}
        items={items}
        now="2026-11-26T12:00:00Z"
        onDecision={(item) => {
          items = items.filter((entry) => entry.id !== item.id)
          if (items.length === 0) items = initialTriage
          void handle.update()
        }}
      />
    </div>
  )
}
