import {
  Pagination,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const members = [
  ['Alice', 'Engineer', 'Active'],
  ['Bob', 'Designer', 'Away'],
  ['Carol', 'PM', 'Active'],
  ['Dan', 'Engineer', 'Offline'],
  ['Emilia', 'Engineer', 'Active'],
  ['Faye', 'Designer', 'Away'],
  ['Gus', 'PM', 'Offline'],
  ['Hugo', 'Engineer', 'Active'],
  ['Iris', 'Designer', 'Away'],
  ['Jo', 'PM', 'Active'],
  ['Kai', 'Engineer', 'Active'],
  ['Lina', 'Designer', 'Offline'],
]

const pageSize = 4
const pageCount = Math.ceil(members.length / pageSize)

export function TeamTableExample(
  handle: Handle<{
    gallery?: boolean
    showcase?: boolean
    loading?: boolean
    teamPage?: string
    search?: string
  }>,
) {
  let loading = handle.props.loading ?? false
  return () => {
    const { teamPage, search, gallery } = handle.props
    const requested = Number(teamPage)
    const page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(pageCount, requested)) : 1
    const rows = gallery
      ? members.slice((page - 1) * pageSize, page * pageSize)
      : members.slice(0, 3)
    return (
      <div
        class="example-block"
        style={{ width: handle.props.showcase ? 'min(100%, 420px)' : 'min(100%, 566px)' }}
      >
        <Table
          id={gallery ? 'team-table' : undefined}
          aria-label="Team members"
          aria-busy={loading}
          style={{ tableLayout: 'fixed' }}
        >
          <TableHeader>
            <TableRow hover={false}>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody aria-hidden={loading || undefined}>
            {rows.map((row) => (
              <TableRow key={row[0]} hover={!loading}>
                {row.map((cell, column) => (
                  <TableCell key={column}>
                    {loading ? <Skeleton width={column === 1 ? '78%' : '60%'} /> : cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div class="example-table-actions">
          {gallery && (
            <Pagination
              page={page}
              pageCount={pageCount}
              label="Team pages"
              size="compact"
              resetScroll="manual"
              href={(next) => {
                const query = new URLSearchParams()
                if (search) query.set('q', search)
                query.set('teamPage', String(next))
                return `/?${query}#team-table`
              }}
            />
          )}
          {(handle.props.gallery || handle.props.loading) && (
            <Switch
              label="Loading preview"
              size="compact"
              checked={loading}
              onCheckedChange={(value) => {
                loading = value
                void handle.update()
              }}
            />
          )}
        </div>
      </div>
    )
  }
}
