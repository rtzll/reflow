import {
  EstimatePill,
  InlineEdit,
  Pagination,
  SavedViewTabs,
  type ControlSize,
  type SavedView,
} from '@rtzll/reflow'
import { type Handle } from 'remix/component'

export function PaginationPlayground(handle: Handle<{ pageCount: number; size?: ControlSize }>) {
  let page = 2
  return () => {
    const count = Math.max(1, handle.props.pageCount)
    if (page > count) page = count
    return (
      <Pagination
        page={page}
        pageCount={count}
        size={handle.props.size}
        onPageChange={(next) => {
          page = next
          handle.update()
        }}
      />
    )
  }
}

export function InlineEditPlayground(handle: Handle<{ disabled?: boolean; size?: ControlSize }>) {
  let value = 'Release v0.22 checklist'
  return () => (
    <InlineEdit
      label="Document title"
      value={value}
      disabled={handle.props.disabled}
      size={handle.props.size}
      onCommit={(next) => {
        value = next
        handle.update()
      }}
    />
  )
}

export function EstimatePillPlayground(
  handle: Handle<{ unit: string; readonly?: boolean; size?: ControlSize }>,
) {
  let value: string | number | null = 3
  return () => (
    <EstimatePill
      value={value}
      unit={handle.props.unit}
      readonly={handle.props.readonly}
      size={handle.props.size}
      onChange={(next) => {
        value = next
        handle.update()
      }}
    />
  )
}

export function SavedViewTabsPlayground(handle: Handle<{ dirty?: boolean; size?: ControlSize }>) {
  let activeId = 'active'
  let views: SavedView[] = [
    { id: 'all', label: 'All issues', count: 42 },
    { id: 'active', label: 'Active sprint', count: 14 },
    { id: 'bugs', label: 'P0 Bugs', count: 3 },
  ]
  return () => (
    <SavedViewTabs
      views={views.map((view) =>
        view.id === activeId ? { ...view, dirty: Boolean(handle.props.dirty) } : view,
      )}
      activeId={activeId}
      size={handle.props.size}
      onSelect={(id) => {
        activeId = id
        handle.update()
      }}
      onCreate={() => {
        const id = `view-${views.length + 1}`
        views = [...views, { id, label: `View ${views.length + 1}`, count: 0 }]
        activeId = id
        handle.update()
      }}
    />
  )
}
