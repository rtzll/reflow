import {
  Avatar,
  Button,
  ContextMenu,
  Dialog,
  Dropdown,
  Icon,
  SegmentedControl,
  Toolbar,
  createRangeSelection,
} from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { CycleOverview, type IssueFilter } from './cycle-overview.tsx'
import { statuses, type Issue, type Status } from './fixtures.ts'

export const IssueTracker = clientEntry(
  import.meta.url,
  function IssueTracker(handle: Handle<{ initialIssues: Issue[] }>) {
    let issues = handle.props.initialIssues
    let active: string | undefined = issues[0]?.id
    let selected = new Set<string>()
    const range = createRangeSelection<string>()
    let announcement = ''
    let filter: IssueFilter | undefined
    let layout = 'board'
    let detailId: string | undefined
    let reset: HTMLButtonElement | undefined
    let list: HTMLDivElement | undefined
    const mountList = ref<HTMLDivElement>((element) => {
      list = element
    })

    const mountDraggable = ref<HTMLDivElement>(async (element, signal) => {
      const { draggable } = await import('./drag-adapter.ts')
      if (signal.aborted) return
      const cleanup = draggable({
        element,
        onDragStart: () => element.setAttribute('data-dragging', ''),
        onDrop: () => element.removeAttribute('data-dragging'),
      })
      signal.addEventListener('abort', cleanup, { once: true })
    })

    const mountDropTarget = ref<HTMLDivElement>(async (element, signal) => {
      const { dropTargetForElements } = await import('./drag-adapter.ts')
      if (signal.aborted) return
      const status = statuses.find((item) => item === element.dataset.status)!
      const leave = () => element.removeAttribute('data-drag-over')
      const cleanup = dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          const id = source.element.dataset.issueId
          if (!id || !list?.contains(source.element)) return false
          const ids = movingIds(id)
          return issues.some((issue) => ids.has(issue.id) && issue.status !== status)
        },
        onDragEnter: () => element.setAttribute('data-drag-over', ''),
        onDragLeave: leave,
        onDrop: ({ source }) => {
          leave()
          const id = source.element.dataset.issueId!
          void move(movingIds(id), status, id)
        },
      })
      signal.addEventListener('abort', cleanup, { once: true })
    })

    function movingIds(id: string) {
      return selected.has(id) ? selected : new Set([id])
    }

    function orderedIssues() {
      const scope = filter
      const visible = scope ? issues.filter((issue) => issue[scope.field] === scope.value) : issues
      return statuses.flatMap((status) => visible.filter((issue) => issue.status === status))
    }

    function focusIssue(id: string | undefined) {
      if (!id) {
        reset?.focus()
        return
      }
      list?.querySelector<HTMLElement>(`[data-issue-id="${id}"]`)?.focus()
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

    async function move(ids: Set<string>, status: Status, anchor: string | undefined) {
      const before = orderedIssues()
      const moved = before.filter((issue) => ids.has(issue.id) && issue.status !== status)
      if (!moved.length) return
      range.reset()
      // Continue at the next stationary issue in the old reading order. At the end,
      // step back. If every row moved, follow the original issue to its new group.
      const index = before.findIndex((issue) => issue.id === anchor)
      const stationary = (issue: Issue) => !moved.includes(issue)
      active =
        before.slice(index).find(stationary)?.id ??
        before.slice(0, index).reverse().find(stationary)?.id ??
        anchor
      issues = issues.map((issue) => (ids.has(issue.id) ? { ...issue, status } : issue))
      if (!orderedIssues().some((issue) => issue.id === active)) active = orderedIssues()[0]?.id
      for (const id of ids) selected.delete(id)
      announcement = `Moved ${moved.length} ${moved.length === 1 ? 'issue' : 'issues'} to ${status}.`
      await handle.update()
      focusIssue(active)
    }

    function navigate(event: KeyboardEvent, id: string) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return
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
            selected = range.extend(
              rows.map((issue) => issue.id),
              selected,
              id,
              rows[next]!.id,
            )
            announcement = ''
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
      const detail = issues.find((issue) => issue.id === detailId)
      const moveItems = statuses.map((status) => ({ value: status, label: 'Move to ' + status }))
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
            <div class="issues-board-heading">
              <div class="issues-board-title">
                <h2 id={handle.id + '-title'}>Cycle issues</h2>
                <span class="issues-count">{visible.length}</span>
              </div>
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
            {filter && (
              <div class="issues-filter">
                <button
                  type="button"
                  aria-label={'Clear filter ' + filter.value}
                  mix={[
                    ref<HTMLButtonElement>((element) => {
                      reset = element
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
              Use the arrows to navigate, Space to select, Shift and vertical arrows to select a
              range, Enter for details, and Tab for selected issue actions.
            </p>
            <ContextMenu
              label="Issue actions"
              target="[data-issue-id]"
              items={[{ value: 'details', label: 'Open issue' }, ...moveItems]}
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
                  .filter((status) => filter?.field !== 'status' || filter.value === status)
                  .map((status) => {
                    const group = visible.filter((issue) => issue.status === status)
                    return (
                      <div
                        role="group"
                        key={status}
                        aria-label={status}
                        data-status={status}
                        class="issues-group"
                        mix={mountDropTarget}
                      >
                        <div class="issues-group-heading" aria-hidden="true">
                          <span class="issues-status-mark" data-status={status} />
                          <strong>{status}</strong>
                          <span class="issues-count">{group.length}</span>
                        </div>
                        <div class="issues-cards">
                          {group.map((issue) => (
                            <div
                              key={issue.id}
                              role="option"
                              data-issue-id={issue.id}
                              class="issues-row"
                              aria-selected={selected.has(issue.id)}
                              tabIndex={active === issue.id ? 0 : -1}
                              mix={[
                                mountDraggable,
                                on('focus', () => {
                                  active = issue.id
                                  void handle.update()
                                }),
                                on('click', () => {
                                  focusIssue(issue.id)
                                  toggle(issue.id)
                                }),
                                on('keydown', (event) => navigate(event, issue.id)),
                              ]}
                            >
                              <span class="issues-id">{issue.id}</span>
                              <span class="issues-check" aria-hidden="true">
                                {selected.has(issue.id) && <Icon name="check" size={12} />}
                              </span>
                              <strong class="issues-title">{issue.title}</strong>
                              <span class="issues-area">{issue.area}</span>
                              <Avatar name={issue.owner} size={22} />
                            </div>
                          ))}
                          {!group.length && <p class="issues-empty">No issues in {status}.</p>}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ContextMenu>
            {selected.size > 0 && (
              <div class="issues-actions">
                <Toolbar label="Selected issue actions">
                  <strong>{selected.size} selected</strong>
                  <Dropdown
                    label="Move to"
                    size="compact"
                    side="top"
                    items={moveItems.map((item) => ({
                      ...item,
                      disabled: !issues.some(
                        (issue) => selected.has(issue.id) && issue.status !== item.value,
                      ),
                    }))}
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
              </div>
            )}
            <p role="status" class="rf-basic-sr-only">
              {announcement}
            </p>
          </section>
          <Dialog
            title={detail?.title ?? 'Issue details'}
            description={detail?.description}
            open={!!detail}
            onOpenChange={(open) => {
              if (!open) {
                detailId = undefined
                void handle.update()
              }
            }}
          >
            {detail && (
              <dl class="issues-properties">
                <dt>Issue</dt>
                <dd class="issues-id">{detail.id}</dd>
                <dt>Status</dt>
                <dd>
                  <span class="issues-status-mark" data-status={detail.status} />
                  {detail.status}
                </dd>
                <dt>Assignee</dt>
                <dd>
                  <Avatar name={detail.owner} size={22} decorative />
                  {detail.owner}
                </dd>
                <dt>Area</dt>
                <dd>{detail.area}</dd>
              </dl>
            )}
          </Dialog>
        </article>
      )
    }
  },
)
