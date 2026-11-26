import { placeGroupedItems } from '@rtzll/reflow'
import type { Issue, Status } from './fixtures.ts'

// Read the settled grid positions. A card animating away from the pointer must
// not move its own hit target and send the preview back to the previous slot.
export function issueAfterPointer(
  cards: HTMLElement,
  moving: ReadonlySet<string>,
  input: { clientX: number; clientY: number },
) {
  const bounds = cards.getBoundingClientRect()
  const x = input.clientX - bounds.left
  const y = input.clientY - bounds.top
  const grid = getComputedStyle(cards).gridTemplateColumns.split(' ').length > 1
  for (const row of cards.querySelectorAll<HTMLElement>('[data-issue-id]')) {
    const id = row.dataset.issueId!
    if (moving.has(id)) continue
    if (y < row.offsetTop) return id
    if (grid) {
      if (y < row.offsetTop + row.offsetHeight && x < row.offsetLeft + row.offsetWidth / 2)
        return id
    } else if (y < row.offsetTop + row.offsetHeight / 2) return id
  }
  return null
}

export function placeIssues(
  issues: Issue[],
  moving: Issue[],
  status: Status,
  beforeId: string | null,
) {
  const next = placeGroupedItems(issues, {
    movingIds: new Set(moving.map((issue) => issue.id)),
    targetGroup: status,
    beforeId,
    getId: (issue) => issue.id,
    getGroup: (issue) => issue.status,
    setGroup: (issue, nextStatus) => ({ ...issue, status: nextStatus }),
  })
  const group = issues.filter((issue) => issue.status === status)
  const nextGroup = next.filter((issue) => issue.status === status)
  if (group.length === nextGroup.length && group.every((issue, i) => issue.id === nextGroup[i]!.id))
    return issues
  return next
}
