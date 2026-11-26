import { on, ref, type Handle } from 'remix/component'
import { Icon } from './icon.tsx'
import { ScrollArea } from './scroll-area.tsx'
import { classList, type ControlSize } from './systems/styling.ts'
import { formatDurationMs } from './waterfall.tsx'

export type MatrixCellStatus = 'passed' | 'failed' | 'running' | 'pending' | 'skipped' | 'cancelled'

export interface MatrixAxisItem {
  id: string
  label: string
}

export interface MatrixCell {
  rowId: string
  columnId: string
  status: MatrixCellStatus
  durationMs?: number
  detail?: string
}

export interface MatrixGridProps {
  /** Matrix rows (e.g. OS targets: Linux, macOS, Windows). */
  rows: readonly MatrixAxisItem[]
  /** Matrix columns (e.g. Node versions or browsers). */
  columns: readonly MatrixAxisItem[]
  /** Populated cells keyed by `(rowId, columnId)`. Missing pairs render as omitted. */
  cells: readonly MatrixCell[]
  /** Currently selected matrix cell. */
  activeCell?: { rowId: string; columnId: string } | null
  /** Called when a matrix cell button is activated. */
  onSelectCell?: (cell: MatrixCell) => void
  /** Top-left header label describing the axes. Default `'Target'`. */
  rowHeaderLabel?: string
  /** Accessible name for the matrix table. Default `'Build matrix'`. */
  label?: string
  /** Controls cell padding and font scale. */
  size?: ControlSize
  class?: string
}

function statusText(status: MatrixCellStatus): string {
  switch (status) {
    case 'passed':
      return 'Passed'
    case 'failed':
      return 'Failed'
    case 'running':
      return 'Running'
    case 'pending':
      return 'Pending'
    case 'skipped':
      return 'Skipped'
    case 'cancelled':
      return 'Cancelled'
  }
}

/**
 * 2D CI build-matrix grid (OS × runtime × browser) with semantic status cells,
 * duration readouts, and 2D arrow-key focus navigation.
 */
export function MatrixGrid(handle: Handle<MatrixGridProps>) {
  let tableEl: HTMLTableElement | null = null
  const tableRef = ref((node) => {
    tableEl = node instanceof HTMLTableElement ? node : null
  })

  function focusCell(rowIdx: number, colIdx: number) {
    const target = tableEl?.querySelector<HTMLButtonElement>(
      `button[data-row-index="${rowIdx}"][data-col-index="${colIdx}"]`,
    )
    target?.focus()
  }

  return () => {
    const props = handle.props
    const cellMap = new Map<string, MatrixCell>()
    for (const cell of props.cells) {
      cellMap.set(`${cell.rowId}::${cell.columnId}`, cell)
    }

    return (
      <div
        class={classList('rf-matrix-grid', props.class)}
        data-size={props.size}
        role="region"
        aria-label={props.label ?? 'Build matrix'}
      >
        <ScrollArea orientation="horizontal">
          <table class="rf-matrix-grid-table" mix={tableRef}>
            <thead>
              <tr>
                <th scope="col" class="rf-matrix-grid-corner">
                  {props.rowHeaderLabel ?? 'Target'}
                </th>
                {props.columns.map((col) => (
                  <th key={col.id} scope="col" class="rf-matrix-grid-col-head">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row, rowIdx) => (
                <tr key={row.id}>
                  <th scope="row" class="rf-matrix-grid-row-head">
                    {row.label}
                  </th>
                  {props.columns.map((col, colIdx) => {
                    const cell = cellMap.get(`${row.id}::${col.id}`)
                    if (!cell) {
                      return (
                        <td key={col.id} class="rf-matrix-grid-td" data-empty="true">
                          <span class="rf-matrix-grid-empty" aria-label="Not scheduled">
                            —
                          </span>
                        </td>
                      )
                    }
                    const active =
                      props.activeCell?.rowId === row.id && props.activeCell?.columnId === col.id
                    const accessibleLabel = `${row.label}, ${col.label}: ${statusText(cell.status)}${cell.durationMs !== undefined ? ` (${formatDurationMs(cell.durationMs)})` : ''}${cell.detail ? ` · ${cell.detail}` : ''}`

                    return (
                      <td key={col.id} class="rf-matrix-grid-td">
                        <button
                          type="button"
                          class="rf-matrix-grid-cell"
                          data-status={cell.status}
                          data-active={active ? 'true' : undefined}
                          data-row-index={rowIdx}
                          data-col-index={colIdx}
                          aria-pressed={active ? 'true' : undefined}
                          aria-label={accessibleLabel}
                          title={accessibleLabel}
                          mix={[
                            on('click', () => props.onSelectCell?.(cell)),
                            on('keydown', (event) => {
                              if (event.key === 'ArrowRight') {
                                event.preventDefault()
                                focusCell(rowIdx, Math.min(props.columns.length - 1, colIdx + 1))
                              } else if (event.key === 'ArrowLeft') {
                                event.preventDefault()
                                focusCell(rowIdx, Math.max(0, colIdx - 1))
                              } else if (event.key === 'ArrowDown') {
                                event.preventDefault()
                                focusCell(Math.min(props.rows.length - 1, rowIdx + 1), colIdx)
                              } else if (event.key === 'ArrowUp') {
                                event.preventDefault()
                                focusCell(Math.max(0, rowIdx - 1), colIdx)
                              }
                            }),
                          ]}
                        >
                          <span class="rf-matrix-grid-glyph" aria-hidden="true">
                            {cell.status === 'passed' && <Icon name="check" size={12} />}
                            {cell.status === 'failed' && <Icon name="x" size={12} />}
                            {cell.status === 'running' && <Icon name="clock" size={12} />}
                            {(cell.status === 'pending' ||
                              cell.status === 'skipped' ||
                              cell.status === 'cancelled') && <Icon name="minus" size={12} />}
                          </span>
                          <span class="rf-matrix-grid-duration">
                            {cell.durationMs !== undefined
                              ? formatDurationMs(cell.durationMs)
                              : statusText(cell.status)}
                          </span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    )
  }
}
