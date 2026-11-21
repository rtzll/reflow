import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  Icon,
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
  { name: 'Alice', role: 'Engineer', status: 'Active' },
  { name: 'Bob', role: 'Designer', status: 'Away' },
  { name: 'Carol', role: 'PM', status: 'Active' },
  { name: 'Dan', role: 'Engineer', status: 'Offline' },
  { name: 'Emilia', role: 'Engineer', status: 'Active' },
  { name: 'Faye', role: 'Designer', status: 'Away' },
  { name: 'Gus', role: 'PM', status: 'Offline' },
  { name: 'Hugo', role: 'Engineer', status: 'Active' },
  { name: 'Iris', role: 'Designer', status: 'Away' },
  { name: 'Jo', role: 'PM', status: 'Active' },
  { name: 'Kai', role: 'Engineer', status: 'Active' },
  { name: 'Lina', role: 'Designer', status: 'Offline' },
]

type Member = (typeof members)[number]
const columns: readonly DataTableColumn<Member>[] = [
  { id: 'name', label: 'Name', value: (member) => member.name },
  { id: 'role', label: 'Role', value: (member) => member.role },
  { id: 'status', label: 'Status', value: (member) => member.status },
]

const memberActions = [
  { value: 'name', label: 'Copy member name', icon: <Icon name="users" /> },
  {
    value: 'details',
    label: 'Copy details',
    icon: <Icon name="copy" />,
    children: [
      { value: 'role', label: 'Role', icon: <Icon name="square-library" /> },
      { value: 'status', label: 'Status', icon: <Icon name="circle" /> },
    ],
  },
]

export function teamTableCode(pageSize = 4) {
  const examples = members.map((member) => '  ' + JSON.stringify(member)).join(',\n')
  return `const members = [
${examples}
]

let message = ''
let loading = false
async function copyValue(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    message = 'Copied ' + value + '.'
  } catch {
    message = 'Could not copy to the clipboard.'
  }
  if (!handle.signal.aborted) void handle.update()
}

const memberActions = [
  { value: 'name', label: 'Copy member name', icon: <Icon name="users" /> },
  { value: 'details', label: 'Copy details', icon: <Icon name="copy" />, children: [
    { value: 'role', label: 'Role', icon: <Icon name="square-library" /> },
    { value: 'status', label: 'Status', icon: <Icon name="circle" /> },
  ] },
]

<DataTable label="Team members" rows={members} rowKey={(member) => member.name}
  loading={loading}
  filterAction={<Switch label="Loading preview" size="compact" checked={loading}
    onCheckedChange={(value) => { loading = value; void handle.update() }} />}
  pageSize={${pageSize}} size="compact" columns={[
    { id: 'name', label: 'Name', value: (member) => member.name },
    { id: 'role', label: 'Role', value: (member) => member.role },
    { id: 'status', label: 'Status', value: (member) => member.status },
  ]} rowActions={{
    label: (member) => 'Actions for ' + member.name,
    items: memberActions,
    onSelect: (key, member) => {
      if (key === 'name' || key === 'role' || key === 'status') void copyValue(member[key])
    },
  }} />
<span role="status">{message}</span>`
}

export function TeamDirectory(handle: Handle<{ query?: string; pageSize?: number }>) {
  let loading = false
  let message = ''
  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      message = `Copied ${value}.`
    } catch {
      message = 'Could not copy to the clipboard.'
    }
    if (!handle.signal.aborted) void handle.update()
  }
  return () => {
    const { query, pageSize = 4 } = handle.props
    const props: DataTableProps<Member> = {
      label: 'Team members',
      rows: members,
      columns,
      rowKey: (member) => member.name,
      pageSize,
      paginationLabel: 'Team pages',
      size: 'compact',
      loading,
      filterAction: (
        <Switch
          label="Loading preview"
          size="compact"
          checked={loading}
          onCheckedChange={(value) => {
            loading = value
            void handle.update()
          }}
        />
      ),
      rowActions: {
        items: memberActions,
        label: (member) => `Actions for ${member.name}`,
        onSelect: (key, member) => {
          if (key === 'name' || key === 'role' || key === 'status') void copyValue(member[key])
        },
      },
    }
    return (
      <div class="example-block example-team-directory">
        {query !== undefined ? (
          <RoutedDataTable
            {...props}
            id="team-table"
            route={{ path: '/', search: query, prefix: 'team', anchor: 'team-table' }}
          />
        ) : (
          <DataTable {...props} />
        )}
        <span role="status" class={message ? undefined : 'rf-basic-sr-only'}>
          {message}
        </span>
      </div>
    )
  }
}

export function TeamTableExample(handle: Handle<{ showcase?: boolean; loading?: boolean }>) {
  let loading = handle.props.loading ?? false
  return () => {
    const rows = members.slice(0, 3)
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
              <TableRow key={row.name} hover={!loading}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {loading ? (
                      <Skeleton width={column.id === 'role' ? '78%' : '60%'} />
                    ) : (
                      column.value(row)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {handle.props.loading && (
          <div class="example-table-actions">
            <Switch
              label="Loading preview"
              size="compact"
              checked={loading}
              onCheckedChange={(value) => {
                loading = value
                void handle.update()
              }}
            />
          </div>
        )}
      </div>
    )
  }
}
