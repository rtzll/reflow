import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rtzll/reflow'
import { RoutedDataTable } from './routed-data-table.tsx'
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

type Member = (typeof members)[number]
const columns: readonly DataTableColumn<Member>[] = ['Name', 'Role', 'Status'].map(
  (label, index) => ({
    id: label.toLowerCase(),
    label,
    value: (member) => member[index]!,
  }),
)

export function TeamTableExample(
  handle: Handle<{
    gallery?: boolean
    interactive?: boolean
    showcase?: boolean
    loading?: boolean
    query?: string
    pageSize?: number
  }>,
) {
  let loading = handle.props.loading ?? false
  let message = ''
  async function copyName(member: Member) {
    try {
      await navigator.clipboard.writeText(member[0]!)
      message = `Copied ${member[0]}.`
    } catch {
      message = 'Could not copy the member name.'
    }
    if (!handle.signal.aborted) void handle.update()
  }
  return () => {
    const { gallery, interactive, query = '', pageSize = 4 } = handle.props
    const rows = members.slice(0, 3)
    const loadingControl = (
      <Switch
        label="Loading preview"
        size="compact"
        checked={loading}
        onCheckedChange={(value) => {
          loading = value
          void handle.update()
        }}
      />
    )
    if (interactive || gallery) {
      const props: DataTableProps<Member> = {
        label: 'Team members',
        rows: members,
        columns,
        rowKey: (member) => member[0]!,
        pageSize,
        paginationLabel: 'Team pages',
        size: 'compact',
        loading,
        rowActions: {
          items: [{ value: 'copy', label: 'Copy member name' }],
          label: (member) => `Actions for ${member[0]}`,
          onSelect: (_action, member) => {
            void copyName(member)
          },
        },
      }
      return (
        <div class="example-block example-team-directory">
          {gallery ? (
            <RoutedDataTable
              {...props}
              id="team-table"
              route={{ path: '/', search: query, prefix: 'team', anchor: 'team-table' }}
            />
          ) : (
            <DataTable {...props} />
          )}
          <div class="example-table-actions">
            {loadingControl}
            <span role="status">{message}</span>
          </div>
        </div>
      )
    }
    return (
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
        {handle.props.loading && <div class="example-table-actions">{loadingControl}</div>}
      </div>
    )
  }
}
