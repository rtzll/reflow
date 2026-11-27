import { animateLayout, prefersReducedMotion } from '@remix-run/ui/animation'
import {
  Avatar,
  Button,
  ContextMenu,
  Dialog,
  Dropdown,
  EstimatePill,
  Icon,
  LabelChip,
  MetadataList,
  PriorityIndicator,
  QuickCreateBar,
  RelationList,
  RoadmapTimeline,
  SavedViewTabs,
  SegmentedControl,
  StatusIcon,
  SubIssueList,
  Toolbar,
  TriageQueue,
  ViewOptionsPopover,
  createRangeSelection,
  type IssueStatusKind,
  type SubIssue,
  type TriageItem,
} from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { CycleOverview, type IssueFilter } from './cycle-overview.tsx'
import { statuses, type Issue, type Status } from './fixtures.ts'
import { issueAfterPointer, placeIssues } from './issue-placement.ts'

type Placement = { status: Status; beforeId: string | null }
interface LastMove {
  previous: Issue[]
  ids: Set<string>
  placed: boolean
  focus: string
  message: string
}

export const IssueTracker = clientEntry(
  import.meta.url,
  function IssueTracker(handle: Handle<{ initialIssues: Issue[] }>) {
    let issues = handle.props.initialIssues
    let active: string | undefined = issues[0]?.id
    let selected = new Set<string>()
    const range = createRangeSelection<string>()
    let selectionEnd: string | undefined
    let announcement = ''
    let lastMove: LastMove | undefined
    let filter: IssueFilter | undefined
    let savedView: 'all' | 'active' | 'priority' = 'all'
    let showEmptyGroups = true
    let displayProps: Record<string, boolean> = {
      priority: true,
      area: true,
      estimate: true,
      assignee: true,
    }
    let layout = 'board'
    let detailId: string | undefined
    let triageItems: TriageItem[] = [
      {
        id: 'AT-151',
        key: 'AT-151',
        title: 'Cache offline trail tiles across app restarts',
        description:
          'Walkers lose cached vector tiles after a cold restart on low-storage devices.',
        reporter: 'Sam Reed',
        createdAt: '2026-11-26T10:20:00Z',
        priority: 'high',
        source: 'Field report',
        labels: [{ id: 'offline', label: 'Offline', color: 'amber' }],
      },
      {
        id: 'AT-152',
        key: 'AT-152',
        title: 'Export GPX waypoints with photo captions',
        description: 'Include field note captions in exported GPX waypoint descriptions.',
        reporter: 'Iris Chen',
        createdAt: '2026-11-26T09:15:00Z',
        priority: 'medium',
        source: 'Community',
        labels: [{ id: 'notes', label: 'Field notes', color: 'blue' }],
      },
    ]
    let subIssues: SubIssue[] = [
      {
        id: 'sub-1',
        key: 'SUB-1',
        title: 'Audit current map viewport reset',
        status: 'done',
        assignee: 'Mina Ortiz',
      },
      {
        id: 'sub-2',
        key: 'SUB-2',
        title: 'Preserve zoom level on pin focus',
        status: 'in-progress',
        assignee: 'Leo Park',
      },
      {
        id: 'sub-3',
        key: 'SUB-3',
        title: 'Add keyboard focus regression test',
        status: 'todo',
        assignee: 'Iris Chen',
      },
    ]
    let nextNumber = 143
    let reset: HTMLButtonElement | undefined
    let list: HTMLDivElement | undefined
    const mountList = ref<HTMLDivElement>((element) => {
      list = element
    })

    const dragging = new Map<string, number>()
    const groupHeights = new Map<string, number>()
    let placement: Placement | undefined

    function preview(next: Placement | undefined) {
      if (placement?.status === next?.status && placement?.beforeId === next?.beforeId) return
      placement = next
      void handle.update()
    }

    const mountDraggable = ref<HTMLDivElement>(async (element, signal) => {
      try {
        const { draggable, setIssueDragPreview } = await import('./drag-adapter.ts')
        if (signal.aborted) return
        const cleanup = draggable({
          element,
          onGenerateDragPreview: (event) => {
            const id = element.dataset.issueId!
            if (selected.size < 2 || !selected.has(id)) return
            const companions = orderedIssues().filter(
              (issue) => issue.id !== id && selected.has(issue.id),
            )
            setIssueDragPreview(event, companions, layout)
          },
          onDragStart: () => {
            if (!list) return
            const ids = movingIds(element.dataset.issueId!)
            // Keep destinations reachable while the dragged items leave the flow. In List,
            // collapsing a source group would shift every group below it away from the pointer.
            if (layout === 'board') list.style.minHeight = `${list.offsetHeight}px`
            else {
              for (const group of list.querySelectorAll<HTMLElement>('.issues-group')) {
                groupHeights.set(group.dataset.status!, group.offsetHeight)
              }
            }
            for (const row of list.querySelectorAll<HTMLElement>('[data-issue-id]')) {
              if (ids.has(row.dataset.issueId!))
                dragging.set(row.dataset.issueId!, row.offsetHeight)
            }
            void handle.update()
          },
          onDrop: () => {
            dragging.clear()
            list?.style.removeProperty('min-height')
            groupHeights.clear()
            placement = undefined
            void handle.update()
          },
        })
        signal.addEventListener('abort', cleanup, { once: true })
      } catch {
        // Drag-and-drop is progressive; keyboard and toolbar moves still work.
      }
    })

    const mountDropTarget = ref<HTMLDivElement>(async (element, signal) => {
      try {
        const { dropTargetForElements } = await import('./drag-adapter.ts')
        if (signal.aborted) return
        const status = statuses.find((item) => item === element.dataset.status)!
        const cards = element.querySelector<HTMLElement>('.issues-cards')!
        const show = (data: Record<string | symbol, unknown>) =>
          preview({ status, beforeId: data.beforeId as string | null })
        const cleanup = dropTargetForElements({
          element,
          canDrop: ({ source }) =>
            !!source.element.dataset.issueId && !!list?.contains(source.element),
          getData: ({ input, source }) => ({
            beforeId: issueAfterPointer(cards, movingIds(source.element.dataset.issueId!), input),
          }),
          onDragStart: ({ self }) => show(self.data),
          onDragEnter: ({ self }) => show(self.data),
          onDrag: ({ self }) => show(self.data),
          onDragLeave: () => {
            if (placement?.status === status) preview(undefined)
          },
          onDrop: ({ source, self }) => {
            const id = source.element.dataset.issueId!
            void move(movingIds(id), status, id, self.data.beforeId as string | null)
          },
        })
        signal.addEventListener('abort', cleanup, { once: true })
      } catch {
        // Ignore chunk load failure; toolbar and context menu moves remain available.
      }
    })

    function movingIds(id: string) {
      return selected.has(id) ? selected : new Set([id])
    }

    // A status is offered only while at least one of the issues would change.
    function moveItems(ids: ReadonlySet<string>) {
      return statuses.map((status) => ({
        value: status,
        label: 'Move to ' + status,
        disabled: !issues.some((issue) => ids.has(issue.id) && issue.status !== status),
      }))
    }

    function matchesSavedView(issue: Issue, view = savedView) {
      if (view === 'active') return issue.status !== 'Done'
      if (view === 'priority') return issue.priority === 'urgent' || issue.priority === 'high'
      return true
    }

    function orderedIssues() {
      const scope = filter
      const visible = issues.filter(
        (issue) => matchesSavedView(issue) && (!scope || issue[scope.field] === scope.value),
      )
      return statuses.flatMap((status) => visible.filter((issue) => issue.status === status))
    }

    function focusIssue(id: string | undefined, options?: FocusOptions) {
      if (!id) {
        reset?.focus(options)
        return
      }
      list?.querySelector<HTMLElement>(`[data-issue-id="${CSS.escape(id)}"]`)?.focus(options)
    }

    async function setFilter(next?: IssueFilter) {
      filter =
        next && filter?.field === next.field && filter.value === next.value ? undefined : next
      range.reset()
      selected.clear()
      announcement = ''
      active = orderedIssues()[0]?.id
      await handle.update()
      focusIssue(active)
    }

    function openDetails(id: string) {
      detailId = id
      void handle.update()
    }

    function toggle(id: string) {
      range.reset()
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      selectionEnd = selected.has(id) ? id : [...selected].at(-1)
      announcement = ''
      void handle.update()
    }

    function extendSelection(from: string, to: string) {
      selected = range.extend(
        orderedIssues().map((issue) => issue.id),
        selected,
        from,
        to,
      )
      selectionEnd = to
      announcement = ''
      void handle.update()
    }

    async function clear() {
      range.reset()
      selected.clear()
      announcement = 'Selection cleared.'
      await handle.update()
      focusIssue(active)
    }

    async function move(
      ids: Set<string>,
      status: Status,
      anchor: string | undefined,
      beforeId?: string | null,
    ) {
      const before = orderedIssues()
      const placed = beforeId !== undefined
      const moved = before.filter(
        (issue) => ids.has(issue.id) && (placed || issue.status !== status),
      )
      if (!moved.length) return
      const previous = issues
      issues = placed
        ? placeIssues(issues, moved, status, beforeId)
        : issues.map((issue) => (ids.has(issue.id) ? { ...issue, status } : issue))
      if (issues === previous) return
      range.reset()
      if (placed && anchor && selected.has(anchor)) {
        // Keep the grabbed issue focused so the same selection can move again.
        active = anchor
        selectionEnd = anchor
      } else {
        const index = before.findIndex((issue) => issue.id === anchor)
        const start = Math.max(0, index)
        const stationary = (issue: Issue) => !moved.includes(issue)
        active =
          before.slice(start).find(stationary)?.id ??
          before.slice(0, start).reverse().find(stationary)?.id ??
          anchor
        for (const id of ids) selected.delete(id)
      }
      if (!orderedIssues().some((issue) => issue.id === active)) active = orderedIssues()[0]?.id
      announcement = moved.every((issue) => issue.status === status)
        ? `Reordered ${moved.length} ${moved.length === 1 ? 'issue' : 'issues'} in ${status}.`
        : `Moved ${moved.length} ${moved.length === 1 ? 'issue' : 'issues'} to ${status}.`
      lastMove = {
        previous,
        ids: new Set(moved.map((issue) => issue.id)),
        placed,
        focus: moved.find((issue) => issue.id === anchor)?.id ?? moved[0]!.id,
        message: announcement,
      }
      await handle.update()
      focusIssue(active, { preventScroll: placed })
    }

    async function undoMove() {
      if (!lastMove) return
      const { previous, ids, placed, focus } = lastMove
      lastMove = undefined
      range.reset()
      issues = previous
      const visible = orderedIssues()
      const visibleIds = new Set(visible.map((issue) => issue.id))
      for (const id of selected) {
        if (!visibleIds.has(id)) selected.delete(id)
      }
      // A different filter may now hide the initiating ticket or every restored ticket.
      const target =
        visible.find((issue) => issue.id === focus) ??
        visible.find((issue) => ids.has(issue.id)) ??
        visible.find((issue) => issue.id === active) ??
        visible[0]
      active = target?.id
      announcement =
        ids.size === 1
          ? `Restored 1 issue to its previous ${placed ? 'position' : 'status'}.`
          : `Restored ${ids.size} issues to their previous ${placed ? 'positions' : 'statuses'}.`
      await handle.update()
      focusIssue(active)
    }

    function navigate(event: KeyboardEvent, id: string) {
      if (event.isComposing || event.altKey) return
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === 'a' && !event.shiftKey) {
          event.preventDefault()
          range.reset()
          selected = new Set(orderedIssues().map((issue) => issue.id))
          selectionEnd = id
          announcement = `${selected.size} selected.`
          void handle.update()
        }
        return
      }
      const arrow = event.key === 'ArrowDown' || event.key === 'ArrowUp'
      if (event.shiftKey && !arrow) return
      const rows = orderedIssues()
      const index = rows.findIndex((issue) => issue.id === id)
      switch (event.key) {
        case 'j':
        case 'k':
        case 'ArrowDown':
        case 'ArrowUp': {
          const step = event.key === 'j' || event.key === 'ArrowDown' ? 1 : -1
          const next = Math.max(0, Math.min(index + step, rows.length - 1))
          if (!event.shiftKey) range.reset()
          else if (next !== index) {
            extendSelection(id, rows[next]!.id)
          }
          focusIssue(rows[next]?.id)
          break
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (layout !== 'board') return
          const current = rows[index]!
          const step = event.key === 'ArrowRight' ? 1 : -1
          const groups = statuses
            .map((status) => rows.filter((issue) => issue.status === status))
            .filter((group) => group.length)
          const column = groups.findIndex((group) => group.includes(current))
          const next = groups[column + step]
          if (next)
            focusIssue(next[Math.min(groups[column]!.indexOf(current), next.length - 1)]?.id)
          range.reset()
          break
        }
        case 'Enter':
          openDetails(id)
          break
        case 'Home':
          range.reset()
          focusIssue(rows[0]?.id)
          break
        case 'End':
          range.reset()
          focusIssue(rows.at(-1)?.id)
          break
        case 'x':
        case ' ':
          if (!event.repeat) toggle(id)
          break
        case 'Escape':
          if (!selected.size) return
          void clear()
          break
        default:
          return
      }
      event.preventDefault()
    }

    return () => {
      const visible = orderedIssues()
      const animateCards = dragging.size > 0 && !prefersReducedMotion()
      const detail = issues.find((issue) => issue.id === detailId)
      return (
        <article class="issue-tracker">
          <header class="issues-heading">
            <h1>Issue tracker</h1>
            <span class="issues-cycle">
              <Icon name="rotate-ccw" size={14} />
              Cycle 12
            </span>
          </header>
          <CycleOverview issues={issues} filter={filter} onFilter={setFilter} />
          <section class="issues-work" aria-labelledby={handle.id + '-title'}>
            <div class="issues-saved-views">
              <SavedViewTabs
                label="Saved issue views"
                size="compact"
                activeId={savedView}
                views={[
                  { id: 'all', label: 'All issues', count: issues.length },
                  {
                    id: 'active',
                    label: 'Active',
                    count: issues.filter((issue) => matchesSavedView(issue, 'active')).length,
                  },
                  {
                    id: 'priority',
                    label: 'High priority',
                    count: issues.filter((issue) => matchesSavedView(issue, 'priority')).length,
                  },
                ]}
                onSelect={(id) => {
                  savedView = id === 'active' || id === 'priority' ? id : 'all'
                  range.reset()
                  selected.clear()
                  active = orderedIssues()[0]?.id
                  void handle.update()
                }}
              />
            </div>
            <div class="issues-board-heading">
              <div class="issues-board-title">
                <h2 id={handle.id + '-title'}>Cycle issues</h2>
                <span class="issues-count">{visible.length}</span>
              </div>
              <div class="issues-board-controls">
                <ViewOptionsPopover
                  size="compact"
                  layout={layout}
                  layouts={[
                    { value: 'board', label: 'Board' },
                    { value: 'list', label: 'List' },
                  ]}
                  onLayoutChange={(value) => {
                    layout = value
                    void handle.update()
                  }}
                  showEmptyGroups={showEmptyGroups}
                  onShowEmptyGroupsChange={(show) => {
                    showEmptyGroups = show
                    void handle.update()
                  }}
                  properties={[
                    { id: 'priority', label: 'Priority', visible: displayProps.priority },
                    { id: 'area', label: 'Area', visible: displayProps.area },
                    { id: 'estimate', label: 'Estimate', visible: displayProps.estimate },
                    { id: 'assignee', label: 'Assignee', visible: displayProps.assignee },
                  ]}
                  onToggleProperty={(id, visible) => {
                    displayProps = { ...displayProps, [id]: visible }
                    void handle.update()
                  }}
                />
                <SegmentedControl
                  label="Issue layout"
                  size="compact"
                  value={layout}
                  options={[
                    { value: 'board', label: 'Board' },
                    { value: 'list', label: 'List' },
                  ]}
                  onValueChange={(value) => {
                    layout = value
                    void handle.update()
                  }}
                />
              </div>
            </div>
            {filter && (
              <div class="issues-filter">
                <button
                  type="button"
                  aria-label={'Clear filter ' + filter.value}
                  mix={[
                    ref<HTMLButtonElement>((element, signal) => {
                      reset = element
                      signal.addEventListener(
                        'abort',
                        () => {
                          if (reset === element) reset = undefined
                        },
                        { once: true },
                      )
                    }),
                    on('click', () => void setFilter()),
                  ]}
                >
                  {filter.value}
                  <Icon name="x" size={13} />
                </button>
              </div>
            )}
            <p id={handle.id + '-keys'} class="rf-basic-sr-only">
              Click an issue or press Enter to open it. Use its checkbox, Command-click,
              Control-click, X, or Space to toggle selection. After selecting one issue, Shift-click
              another issue or use Shift with the vertical arrows to extend the range. Control or
              Command with A selects all visible issues. Drag a selected issue to move the group, or
              Tab to the actions.
            </p>
            <ContextMenu
              label="Issue actions"
              target="[data-issue-id]"
              items={(row) => [
                { value: 'details', label: 'Open issue' },
                ...moveItems(movingIds(row.dataset.issueId ?? '')),
              ]}
              onSelect={(value, row) => {
                const id = row.dataset.issueId
                if (!id) return
                if (value === 'details') openDetails(id)
                const status = statuses.find((item) => item === value)
                if (status) void move(movingIds(id), status, id)
              }}
            >
              <div
                class="issues-collection"
                data-layout={layout}
                data-selecting={selected.size > 0 ? '' : undefined}
                data-single-status={filter?.field === 'status' || undefined}
                role="listbox"
                aria-multiselectable="true"
                aria-labelledby={handle.id + '-title'}
                aria-describedby={handle.id + '-keys'}
                mix={[
                  mountList,
                  on('focusout', (event) => {
                    if (
                      !(event.relatedTarget instanceof Node) ||
                      !event.currentTarget.contains(event.relatedTarget)
                    )
                      range.reset()
                  }),
                ]}
              >
                {statuses
                  .filter(
                    (status) =>
                      (filter?.field !== 'status' || filter.value === status) &&
                      (showEmptyGroups ||
                        visible.some((issue) => issue.status === status) ||
                        placement?.status === status),
                  )
                  .map((status) => {
                    const group = visible.filter((issue) => issue.status === status)
                    const destination = placement?.status === status ? placement : undefined
                    const slot = destination?.beforeId
                      ? group.findIndex((issue) => issue.id === destination.beforeId)
                      : group.length
                    return (
                      <div
                        role="group"
                        key={status}
                        aria-label={status}
                        data-status={status}
                        class="issues-group"
                        style={{ minHeight: groupHeights.get(status) }}
                        mix={mountDropTarget}
                      >
                        <div class="issues-group-heading" aria-hidden="true">
                          <StatusIcon
                            status={
                              status === 'Done'
                                ? 'done'
                                : status === 'In progress'
                                  ? 'in-progress'
                                  : 'todo'
                            }
                            size={13}
                            decorative
                          />
                          <strong>{status}</strong>
                          <span class="issues-count">{group.length}</span>
                        </div>
                        <div
                          class="issues-cards"
                          role="none"
                          data-previewing={placement ? '' : undefined}
                        >
                          {group.map((issue, index) => (
                            <div
                              key={issue.id}
                              role="option"
                              data-issue-id={issue.id}
                              data-dragging={dragging.has(issue.id) ? '' : undefined}
                              class="issues-row"
                              style={destination ? { order: index < slot ? 0 : 2 } : undefined}
                              aria-selected={selected.has(issue.id)}
                              tabIndex={active === issue.id ? 0 : -1}
                              mix={[
                                mountDraggable,
                                animateLayout(
                                  animateCards && !dragging.has(issue.id)
                                    ? { duration: 150, easing: 'ease-out', size: false }
                                    : false,
                                ),
                                on('focus', () => {
                                  active = issue.id
                                  void handle.update()
                                }),
                                on('click', (event) => {
                                  focusIssue(issue.id)
                                  if (event.shiftKey) {
                                    const from =
                                      selectionEnd && selected.has(selectionEnd)
                                        ? selectionEnd
                                        : issue.id
                                    extendSelection(from, issue.id)
                                  } else if (
                                    event.metaKey ||
                                    event.ctrlKey ||
                                    (event.target instanceof Element &&
                                      event.target.closest('.issues-check'))
                                  ) {
                                    toggle(issue.id)
                                  } else {
                                    openDetails(issue.id)
                                  }
                                }),
                                on('keydown', (event) => navigate(event, issue.id)),
                              ]}
                            >
                              <span class="issues-id-meta">
                                {displayProps.priority && issue.priority && (
                                  <PriorityIndicator
                                    priority={issue.priority}
                                    size={13}
                                    decorative
                                  />
                                )}
                                <span class="issues-id">{issue.id}</span>
                              </span>
                              <span
                                class="issues-check"
                                aria-hidden="true"
                                title={selected.has(issue.id) ? 'Deselect issue' : 'Select issue'}
                              >
                                {selected.has(issue.id) && <Icon name="check" size={12} />}
                              </span>
                              <strong class="issues-title">{issue.title}</strong>
                              <span class="issues-tags">
                                {displayProps.area && <span class="issues-area">{issue.area}</span>}
                                {displayProps.estimate && issue.estimate !== undefined && (
                                  <EstimatePill value={issue.estimate} size="compact" />
                                )}
                              </span>
                              {displayProps.assignee && <Avatar name={issue.owner} size={22} />}
                            </div>
                          ))}
                          {destination &&
                            Array.from(dragging, ([id, height]) => (
                              <div
                                class="issues-drop-slot"
                                aria-hidden="true"
                                key={'slot-' + id}
                                style={{ height, order: 1 }}
                              />
                            ))}
                          {!group.length && !destination && (
                            <p class="issues-empty" role="none">
                              No issues in {status}.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ContextMenu>
            {(selected.size > 0 || lastMove) && (
              <div class="issues-actions">
                {selected.size > 0 && (
                  <Toolbar label="Selected issue actions">
                    <strong>{selected.size} selected</strong>
                    <Dropdown
                      label="Move to"
                      size="compact"
                      side="top"
                      items={moveItems(selected)}
                      onSelect={(value) => {
                        const status = statuses.find((item) => item === value)
                        if (status) void move(selected, status, active)
                      }}
                    />
                    {selected.size === 1 && (
                      <Button
                        size="compact"
                        variant="ghost"
                        mix={on('click', () => openDetails([...selected][0]!))}
                      >
                        Open issue
                      </Button>
                    )}
                    <Button
                      size="icon-compact"
                      variant="ghost"
                      aria-label="Clear selection"
                      mix={on('click', clear)}
                    >
                      <Icon name="x" size={15} />
                    </Button>
                  </Toolbar>
                )}
                {lastMove && (
                  <div class="issues-move-notice">
                    <span>{lastMove.message}</span>
                    <Button variant="secondary" size="compact" mix={on('click', undoMove)}>
                      Undo
                    </Button>
                  </div>
                )}
              </div>
            )}
            <p role="status" class="rf-basic-sr-only">
              {announcement}
            </p>
          </section>

          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '20px',
            }}
            aria-label="Planning and triage"
          >
            <QuickCreateBar
              label="Quick create issue"
              placeholder="Capture a new issue for Cycle 12…"
              assignees={[
                { value: 'Mina Ortiz', label: 'Mina Ortiz' },
                { value: 'Leo Park', label: 'Leo Park' },
                { value: 'Iris Chen', label: 'Iris Chen' },
                { value: 'Sam Reed', label: 'Sam Reed' },
              ]}
              onCreate={(draft) => {
                const status: Status =
                  draft.status === 'done'
                    ? 'Done'
                    : draft.status === 'in-progress' || draft.status === 'in-review'
                      ? 'In progress'
                      : 'Todo'
                const created: Issue = {
                  id: `AT-${nextNumber++}`,
                  title: draft.title,
                  description: 'Captured via QuickCreateBar in Cycle 12.',
                  status,
                  area: 'Maps',
                  owner: draft.assignee ?? 'Mina Ortiz',
                  priority: draft.priority,
                  estimate: 2,
                }
                issues = [created, ...issues]
                announcement = `Created ${created.id}.`
                void handle.update()
              }}
            />

            <RoadmapTimeline
              label="Cycle 12 – 14 Roadmap"
              rangeStart="2026-10-01"
              rangeEnd="2027-02-28"
              today="2026-11-26"
              items={[
                {
                  id: 'rm-maps',
                  title: 'Dusk & offline maps',
                  owner: 'Mina Ortiz',
                  startDate: '2026-10-10',
                  endDate: '2026-12-20',
                  progress: 68,
                  tone: 'accent',
                  milestones: [{ id: 'ms-dusk', label: 'Dusk contrast GA', date: '2026-12-05' }],
                },
                {
                  id: 'rm-notes',
                  title: 'Field notes & captions',
                  owner: 'Leo Park',
                  startDate: '2026-11-01',
                  endDate: '2027-01-25',
                  progress: 42,
                  tone: 'success',
                  milestones: [{ id: 'ms-gpx', label: 'GPX export beta', date: '2027-01-10' }],
                },
              ]}
            />

            <TriageQueue
              label="Incoming triage"
              now="2026-11-26T12:00:00Z"
              items={triageItems}
              onDecision={(item, action) => {
                triageItems = triageItems.filter((entry) => entry.id !== item.id)
                if (action === 'accept') {
                  issues = [
                    {
                      id: item.key,
                      title: item.title,
                      description: item.description ?? '',
                      status: 'Todo',
                      area: item.labels?.[0]?.label ?? 'Maps',
                      owner: item.reporter,
                    },
                    ...issues,
                  ]
                }
                void handle.update()
              }}
            />
          </section>

          <Dialog
            title={detail?.title ?? 'Issue details'}
            description={detail?.description}
            open={!!detail}
            onOpenChange={(open) => {
              if (!open) {
                const closedId = detailId
                detailId = undefined
                void handle.update().then(() => {
                  if (!handle.signal.aborted) focusIssue(closedId ?? active)
                })
              }
            }}
          >
            {detail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <MetadataList
                  orientation="inline"
                  size="compact"
                  items={[
                    { id: 'id', label: 'Issue', value: <span class="issues-id">{detail.id}</span> },
                    {
                      id: 'status',
                      label: 'Status',
                      value: (
                        <StatusIcon
                          status={
                            detail.status === 'Done'
                              ? 'done'
                              : detail.status === 'In progress'
                                ? 'in-progress'
                                : 'todo'
                          }
                          label={detail.status}
                          showLabel
                          size={13}
                        />
                      ),
                    },
                    {
                      id: 'assignee',
                      label: 'Assignee',
                      value: (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Avatar name={detail.owner} size={20} decorative />
                          <span>{detail.owner}</span>
                        </span>
                      ),
                    },
                    {
                      id: 'area',
                      label: 'Area',
                      value: <LabelChip label={detail.area} color="blue" size="compact" />,
                    },
                    ...(detail.priority
                      ? [
                          {
                            id: 'priority',
                            label: 'Priority',
                            value: (
                              <PriorityIndicator priority={detail.priority} showLabel size={13} />
                            ),
                          },
                        ]
                      : []),
                    ...(detail.estimate !== undefined
                      ? [
                          {
                            id: 'estimate',
                            label: 'Estimate',
                            value: <EstimatePill value={detail.estimate} size="compact" />,
                          },
                        ]
                      : []),
                  ]}
                />
                <SubIssueList
                  size="compact"
                  items={subIssues}
                  onToggleStatus={(item, nextStatus: IssueStatusKind) => {
                    subIssues = subIssues.map((entry) =>
                      entry.id === item.id ? { ...entry, status: nextStatus } : entry,
                    )
                    void handle.update()
                  }}
                  onAdd={(title) => {
                    subIssues = [
                      ...subIssues,
                      {
                        id: `sub-${subIssues.length + 1}`,
                        key: `SUB-${subIssues.length + 1}`,
                        title,
                        status: 'todo',
                      },
                    ]
                    void handle.update()
                  }}
                />
                <RelationList
                  size="compact"
                  items={[
                    {
                      id: 'rel-pr',
                      kind: 'pull-request',
                      ref: '#142',
                      title: 'Preserve viewport bounds on selection',
                      prState: 'open',
                    },
                  ]}
                />
              </div>
            )}
          </Dialog>
        </article>
      )
    }
  },
)
