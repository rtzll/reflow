import { Avatar, Badge, Button, ContextMenu, Icon, Progress, Toolbar } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { statuses, type Issue, type Status } from './fixtures.ts'

const statusColors = { Todo: 'gray', 'In progress': 'amber', Done: 'emerald' } as const

export const IssueTracker = clientEntry(
  import.meta.url,
  function IssueTracker(handle: Handle<{ initialIssues: Issue[] }>) {
    let issues = handle.props.initialIssues
    let active: string | undefined = issues[0]?.id
    let selected = new Set<string>()
    let range: { anchor: number; previous: Set<string> } | undefined
    let announcement = ''
    let list: HTMLDivElement | undefined
    const mountList = ref<HTMLDivElement>((element) => {
      list = element
    })

    function orderedIssues() {
      return statuses.flatMap((status) => issues.filter((issue) => issue.status === status))
    }

    function focusIssue(id: string | undefined) {
      list?.querySelector<HTMLElement>(`[data-issue-id="${id}"]`)?.focus()
    }

    function toggle(id: string) {
      range = undefined
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      announcement = ''
      void handle.update()
    }

    async function clear() {
      range = undefined
      selected.clear()
      announcement = 'Selection cleared.'
      await handle.update()
      focusIssue(active)
    }

    async function move(ids: Set<string>, status: Status, anchor: string | undefined) {
      const before = orderedIssues()
      const moved = before.filter((issue) => ids.has(issue.id) && issue.status !== status)
      if (!moved.length) return
      range = undefined
      // Continue at the next stationary issue in the old reading order. At the end,
      // step back. If every row moved, follow the original issue to its new group.
      const index = before.findIndex((issue) => issue.id === anchor)
      const stationary = (issue: Issue) => !moved.includes(issue)
      active =
        before.slice(index).find(stationary)?.id ??
        before.slice(0, index).reverse().find(stationary)?.id ??
        anchor
      issues = issues.map((issue) => (ids.has(issue.id) ? { ...issue, status } : issue))
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
          if (!event.shiftKey) range = undefined
          else if (next !== index) {
            // Rebuild from the original selection so shrinking the range preserves
            // independent selections inside and outside it.
            range ??= { anchor: index, previous: new Set(selected) }
            selected = new Set(range.previous)
            const start = Math.min(range.anchor, next)
            const end = Math.max(range.anchor, next)
            for (const issue of rows.slice(start, end + 1)) selected.add(issue.id)
            announcement = ''
          }
          focusIssue(rows[next]?.id)
          break
        }
        case 'Home':
          range = undefined
          focusIssue(rows[0]?.id)
          break
        case 'End':
          range = undefined
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
      const current = issues.find((issue) => issue.id === active)
      return (
        <article class="issue-tracker">
          <header class="issues-heading">
            <div>
              <p class="issues-project">
                <Icon name="folder" /> Atlas field guide
              </p>
              <h1>Issue tracker</h1>
            </div>
            <div class="issues-progress">
              <Progress
                label="Cycle 12 completion"
                showValue
                size="compact"
                value={issues.filter((issue) => issue.status === 'Done').length}
                max={issues.length}
              />
            </div>
          </header>
          <div class="issues-layout">
            <div class="issues-board">
              <div class="issues-board-heading">
                <h2 id={handle.id + '-title'}>Cycle issues</h2>
                <span>{issues.length} total</span>
              </div>
              <ContextMenu
                label="Issue actions"
                target="[data-issue-id]"
                items={statuses.map((status) => ({ value: status, label: 'Move to ' + status }))}
                onSelect={(value, row) => {
                  const id = row.dataset.issueId
                  const status = statuses.find((item) => item === value)
                  if (id && status)
                    void move(selected.has(id) ? selected : new Set([id]), status, id)
                }}
              >
                <div
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
                        range = undefined
                    }),
                  ]}
                >
                  {statuses.map((status, groupIndex) => {
                    const group = issues.filter((issue) => issue.status === status)
                    const label = handle.id + '-group-' + groupIndex
                    return (
                      <div role="group" key={status} aria-labelledby={label} class="issues-group">
                        <div class="issues-group-heading">
                          <span id={label}>
                            <Badge variant="dot" color={statusColors[status]} size="compact">
                              {status}
                            </Badge>
                          </span>
                          <span class="issues-count" aria-hidden="true">
                            {group.length}
                          </span>
                        </div>
                        {group.map((issue) => (
                          <div
                            key={issue.id}
                            role="option"
                            data-issue-id={issue.id}
                            class="issues-row"
                            aria-selected={selected.has(issue.id)}
                            tabIndex={active === issue.id ? 0 : -1}
                            mix={[
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
                            <span class="issues-check" aria-hidden="true">
                              {selected.has(issue.id) && <Icon name="check" size={14} />}
                            </span>
                            <span class="issues-id">{issue.id}</span>
                            <span class="issues-title">{issue.title}</span>
                            <Avatar name={issue.owner} size={24} />
                          </div>
                        ))}
                        {!group.length && <p class="issues-empty">No issues in {status}.</p>}
                      </div>
                    )
                  })}
                </div>
              </ContextMenu>
              <footer class="issues-actions">
                {selected.size > 0 && (
                  <Toolbar label="Selected issue actions">
                    <strong>{selected.size} selected</strong>
                    <span>Move to</span>
                    {statuses.map((status) => (
                      <Button
                        key={status}
                        size="compact"
                        variant="secondary"
                        aria-label={'Move to ' + status}
                        disabled={
                          !issues.some((issue) => selected.has(issue.id) && issue.status !== status)
                        }
                        mix={on('click', () => void move(selected, status, active))}
                      >
                        {status}
                      </Button>
                    ))}
                    <Button variant="ghost" size="compact" mix={on('click', clear)}>
                      Clear selection
                    </Button>
                  </Toolbar>
                )}
                <p id={handle.id + '-keys'} class="issues-keys">
                  <span>
                    <kbd>↑</kbd> <kbd>↓</kbd> or <kbd>J</kbd> <kbd>K</kbd> Navigate
                  </span>
                  <span>
                    <kbd>Shift</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> Select range
                  </span>
                  <span>
                    <kbd>Space</kbd> Select
                  </span>
                  <span>
                    <kbd>Tab</kbd> Actions
                  </span>
                </p>
                <p role="status" class="issues-feedback">
                  {announcement}
                </p>
              </footer>
            </div>
            {current && (
              <aside class="issues-detail" aria-label="Issue details">
                <div class="issues-detail-heading">
                  <Icon name="panel-left" />
                  <h2>Issue details</h2>
                </div>
                <p class="issues-id">{current.id}</p>
                <h3>{current.title}</h3>
                <p class="issues-description">{current.description}</p>
                <dl>
                  <dt>Status</dt>
                  <dd>
                    <Badge variant="dot" color={statusColors[current.status]} size="compact">
                      {current.status}
                    </Badge>
                  </dd>
                  <dt>Assignee</dt>
                  <dd>
                    <Avatar name={current.owner} size={22} decorative /> {current.owner}
                  </dd>
                  <dt>Area</dt>
                  <dd>{current.area}</dd>
                </dl>
              </aside>
            )}
          </div>
        </article>
      )
    }
  },
)
