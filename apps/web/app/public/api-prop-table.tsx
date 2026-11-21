import { RoutedDataTable, type DataTableColumn } from '@rtzll/reflow'
import { clientEntry, type Handle } from 'remix/component'
import type { ApiProperty } from '../docs-data.ts'

type PropRow = ApiProperty & { defaultValue: string }

const columns: readonly DataTableColumn<PropRow>[] = [
  {
    id: 'prop',
    label: 'Prop',
    rowHeader: true,
    value: (row) => row.name,
    cell: (row) => (
      <>
        <code>{row.name}</code>
        {row.required && (
          <span class="doc-required" title="Required">
            *
          </span>
        )}
      </>
    ),
  },
  { id: 'type', label: 'Type', value: (row) => row.type, cell: (row) => <code>{row.type}</code> },
  {
    id: 'default',
    label: 'Default',
    value: (row) => row.defaultValue,
    cell: (row) => <code>{row.defaultValue}</code>,
  },
  { id: 'description', label: 'Description', value: (row) => row.description, sortable: false },
]

export const ApiPropTable = clientEntry(
  import.meta.url,
  function ApiPropTable(
    handle: Handle<{
      rows: PropRow[]
      name: string
      path: string
      search: string
    }>,
  ) {
    return () => (
      <RoutedDataTable
        rows={handle.props.rows}
        columns={columns}
        label={`${handle.props.name} props`}
        rowKey={(row) => row.name}
        size="compact"
        pageSize={12}
        route={{
          path: handle.props.path,
          search: handle.props.search,
          prefix: 'api',
          anchor: 'api-reference',
        }}
      />
    )
  },
)
