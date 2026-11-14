import type { Handle, Props, RemixNode } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'
import { type ControlSize, classList, type StyledProps } from './systems/styling.ts'

export type TableProps = StyledProps<'table'> & {
  size?: ControlSize
  fluidHover?: boolean
}

export function Table(handle: Handle<TableProps>) {
  return () => {
    const { class: classProp, className, size, fluidHover: hover = true, ...props } = handle.props
    return (
      <div
        class="rf-table-container"
        data-size={size}
        data-row-hover={hover || undefined}
        mix={hover && fluidHover({ fastHover: true })}
      >
        {hover && (
          <span class="rf-highlight rf-table-highlight" aria-hidden="true" data-rf-hover-layer />
        )}
        <table {...props} class={classList('rf-table', classProp, className)} data-slot="table" />
      </div>
    )
  }
}

export function TableHeader(handle: Handle<Props<'thead'>>) {
  return () => <thead {...handle.props} data-slot="table-header" />
}

export function TableBody(handle: Handle<Props<'tbody'>>) {
  return () => <tbody {...handle.props} data-slot="table-body" />
}

export type TableRowProps = StyledProps<'tr'> & { selected?: boolean; hover?: boolean }

export function TableRow(handle: Handle<TableRowProps>) {
  return () => {
    const { class: classProp, className, selected, hover = true, ...props } = handle.props
    return (
      <tr
        {...props}
        class={classList('rf-table-row', classProp, className)}
        data-slot="table-row"
        data-rf-hover-item={hover || undefined}
        data-selected={selected || undefined}
      />
    )
  }
}

export function TableHead(handle: Handle<Props<'th'>>) {
  return () => <th scope="col" {...handle.props} data-slot="table-head" />
}

export function TableCell(handle: Handle<Props<'td'>>) {
  return () => <td {...handle.props} data-slot="table-cell" />
}

export type TableEmptyProps = {
  colSpan: number
  title?: RemixNode
  description?: RemixNode
  action?: RemixNode
}

export function TableEmpty(handle: Handle<TableEmptyProps>) {
  return () => {
    const { colSpan, title = 'No results', description, action } = handle.props
    return (
      <tr data-slot="table-empty">
        <td colSpan={colSpan} class="rf-table-empty-cell" data-slot="table-cell">
          <div class="rf-table-empty">
            <span class="rf-table-empty-title">{title}</span>
            {description && <span class="rf-table-empty-description">{description}</span>}
            {action && <div class="rf-table-empty-action">{action}</div>}
          </div>
        </td>
      </tr>
    )
  }
}
