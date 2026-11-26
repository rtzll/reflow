import { on, type Handle } from 'remix/component'
import { Badge, type BadgeColor } from './badge.tsx'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { StatusIcon, type IssueStatusKind } from './status-icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export type RelationKind = 'blocks' | 'blocked-by' | 'related' | 'pull-request'

export interface RelationItem {
  id: string
  kind: RelationKind
  /** Monospace ref (e.g. `ENG-398` or `#419`). */
  ref: string
  title: string
  /** Issue workflow status when referencing an issue. */
  status?: IssueStatusKind
  /** Pull request state badge when `kind === 'pull-request'`. */
  prState?: 'open' | 'draft' | 'merged' | 'closed'
  href?: string
}

export interface RelationListProps {
  /** Related issues, blockers, and linked pull requests. */
  items: readonly RelationItem[]
  /** Called when a linked item is clicked (if `href` is omitted). */
  onSelect?: (item: RelationItem) => void
  /** Optional unlink callback; renders a subtle remove button per row. */
  onRemove?: (item: RelationItem) => void
  /** Optional `+ Link` button handler in the header. */
  onAdd?: () => void
  /** Section heading. Default `'Relations'`. */
  title?: string
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

const kindOrder: readonly RelationKind[] = ['blocked-by', 'blocks', 'pull-request', 'related']
const kindLabels: Record<RelationKind, string> = {
  'blocked-by': 'Blocked by',
  blocks: 'Blocks',
  'pull-request': 'Pull requests',
  related: 'Related',
}

function prBadge(state: NonNullable<RelationItem['prState']>): {
  label: string
  color: BadgeColor
} {
  switch (state) {
    case 'merged':
      return { label: 'Merged', color: 'violet' }
    case 'open':
      return { label: 'Open', color: 'green' }
    case 'draft':
      return { label: 'Draft', color: 'gray' }
    case 'closed':
      return { label: 'Closed', color: 'red' }
  }
}

/**
 * Structured issue dependency and cross-reference list grouping Blockers,
 * Blocked-by items, Related issues, and linked Pull Requests.
 */
export function RelationList(handle: Handle<RelationListProps>) {
  return () => {
    const props = handle.props
    const grouped = kindOrder
      .map((kind) => ({
        kind,
        label: kindLabels[kind],
        items: props.items.filter((item) => item.kind === kind),
      }))
      .filter((group) => group.items.length > 0)

    return (
      <section
        class={classList('rf-relation-list', props.class)}
        data-size={props.size}
        aria-label={props.title ?? 'Relations'}
      >
        <header class="rf-relation-list-header">
          <span class="rf-relation-list-heading">{props.title ?? 'Relations'}</span>
          <span class="rf-relation-list-count">{props.items.length}</span>
          {props.onAdd && (
            <Button
              variant="ghost"
              size="compact"
              leadingIcon={<Icon name="link" size={12} />}
              mix={on('click', () => props.onAdd?.())}
            >
              Link
            </Button>
          )}
        </header>

        {grouped.length === 0 ? (
          <div class="rf-relation-list-empty">No linked issues or pull requests.</div>
        ) : (
          <div class="rf-relation-list-groups">
            {grouped.map((group) => (
              <div key={group.kind} class="rf-relation-list-group">
                <div class="rf-relation-list-group-label" data-kind={group.kind}>
                  {group.label}
                </div>
                <ul class="rf-relation-list-rows">
                  {group.items.map((item) => (
                    <li key={item.id} class="rf-relation-list-row">
                      {item.status && <StatusIcon status={item.status} size={13} />}
                      <span class="rf-relation-list-ref">{item.ref}</span>
                      {item.href ? (
                        <a class="rf-relation-list-link" href={item.href}>
                          {item.title}
                        </a>
                      ) : props.onSelect ? (
                        <button
                          type="button"
                          class="rf-relation-list-link"
                          mix={on('click', () => props.onSelect?.(item))}
                        >
                          {item.title}
                        </button>
                      ) : (
                        <span class="rf-relation-list-title">{item.title}</span>
                      )}
                      {item.prState && (
                        <Badge color={prBadge(item.prState).color} size="compact">
                          {prBadge(item.prState).label}
                        </Badge>
                      )}
                      {props.onRemove && (
                        <Button
                          variant="ghost"
                          size="icon-compact"
                          aria-label={`Unlink ${item.ref}`}
                          mix={on('click', () => props.onRemove?.(item))}
                        >
                          <Icon name="x" size={12} />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    )
  }
}
