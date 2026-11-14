import {
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
]

export function TeamTableExample(
  handle: Handle<{ gallery?: boolean; showcase?: boolean; loading?: boolean }>,
) {
  let loading = handle.props.loading ?? false
  return () => (
    <div
      class="example-block"
      style={{ width: handle.props.showcase ? 'min(100%, 420px)' : 'min(100%, 566px)' }}
    >
      <Table aria-label="Team members" aria-busy={loading} style={{ tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow hover={false}>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-hidden={loading || undefined}>
          {members.slice(0, handle.props.gallery ? 4 : 3).map((row) => (
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
  )
}
