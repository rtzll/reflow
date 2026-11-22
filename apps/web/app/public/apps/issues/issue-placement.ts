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
  const ids = new Set(moving.map((issue) => issue.id))
  const rest = issues.filter((issue) => !ids.has(issue.id))
  const index = rest.findIndex((issue) => issue.id === beforeId)
  const next = rest.toSpliced(
    index < 0 ? rest.length : index,
    0,
    ...moving.map((issue) => ({ ...issue, status })),
  )
  const group = issues.filter((issue) => issue.status === status)
  const nextGroup = next.filter((issue) => issue.status === status)
  if (group.length === nextGroup.length && group.every((issue, i) => issue.id === nextGroup[i]!.id))
    return issues
  return next
}
