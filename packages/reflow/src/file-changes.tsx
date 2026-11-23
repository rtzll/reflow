import { on, type Handle, type RemixNode } from 'remix/component'
import { Icon } from './icon.tsx'

export interface FileChange {
  path: string
  added: number
  removed: number
  /** Makes the row a link, such as to the file's diff. */
  href?: string
}

export interface FileChangesProps {
  files: readonly FileChange[]
  /** Replaces the heading, which by default reads "Edited 2 files". */
  title?: string
  /** At the end of the header, such as Undo and View changes. */
  actions?: RemixNode
  /** Rows shown before the rest fold away. Default 3. */
  visible?: number
}

function lines(count: number, verb: string) {
  return count === 0 ? `none ${verb}` : `${count} ${count === 1 ? 'line' : 'lines'} ${verb}`
}

function Counts(handle: Handle<{ added: number; removed: number }>) {
  return () => {
    const { added, removed } = handle.props
    return (
      <span class="rf-file-changes-counts">
        <span aria-hidden="true">
          <span class="rf-file-changes-added">+{added}</span>{' '}
          <span class="rf-file-changes-removed">−{removed}</span>
        </span>
        <span class="rf-basic-sr-only">
          {lines(added, 'added')}, {removed === 0 ? 'none removed' : lines(removed, 'removed')}
        </span>
      </span>
    )
  }
}

/**
 * Summarises an edit as a card: the files changed, lines added and removed,
 * and an app's actions, with long lists folded. See docs/file-changes.md.
 */
export function FileChanges(handle: Handle<FileChangesProps>) {
  let expanded = false
  return () => {
    const { files, title, actions, visible = 3 } = handle.props
    const added = files.reduce((sum, file) => sum + file.added, 0)
    const removed = files.reduce((sum, file) => sum + file.removed, 0)
    const hidden = Math.max(0, files.length - visible)
    const moreId = `${handle.id}-more`
    const row = (file: FileChange) => {
      const slash = file.path.lastIndexOf('/')
      const content = (
        <>
          {/* Cut from the start, so the file name stays in view. */}
          <span class="rf-file-changes-path" title={file.path}>
            <bdi>
              {slash >= 0 && (
                <span class="rf-file-changes-folder">{file.path.slice(0, slash + 1)}</span>
              )}
              {file.path.slice(slash + 1)}
            </bdi>
          </span>
          <Counts added={file.added} removed={file.removed} />
        </>
      )
      return (
        <li key={file.path}>
          {file.href ? (
            <a class="rf-file-changes-row" href={file.href}>
              {content}
            </a>
          ) : (
            <span class="rf-file-changes-row">{content}</span>
          )}
        </li>
      )
    }
    return (
      <section class="rf-file-changes" aria-labelledby={`${handle.id}-title`}>
        <header class="rf-file-changes-header">
          <span class="rf-file-changes-icon" aria-hidden="true">
            <Icon name="file" />
          </span>
          <span class="rf-file-changes-heading">
            <span id={`${handle.id}-title`} class="rf-file-changes-title">
              {title ?? `Edited ${files.length} ${files.length === 1 ? 'file' : 'files'}`}
            </span>
            <Counts added={added} removed={removed} />
          </span>
          {actions != null && <span class="rf-file-changes-actions">{actions}</span>}
        </header>
        <ul class="rf-file-changes-list" aria-label="Changed files">
          {files.slice(0, visible).map(row)}
        </ul>
        {hidden > 0 && (
          <>
            <div
              id={moreId}
              class="rf-file-changes-more"
              data-open={expanded || undefined}
              inert={!expanded}
              aria-hidden={!expanded || undefined}
            >
              <ul class="rf-file-changes-list" aria-label="More changed files">
                {files.slice(visible).map(row)}
              </ul>
            </div>
            <button
              type="button"
              class="rf-file-changes-toggle"
              aria-expanded={expanded}
              aria-controls={moreId}
              mix={on('click', () => {
                expanded = !expanded
                handle.update()
              })}
            >
              {expanded
                ? 'Show fewer files'
                : `Show ${hidden} more ${hidden === 1 ? 'file' : 'files'}`}
              <Icon name="chevron-down" />
            </button>
          </>
        )}
      </section>
    )
  }
}
