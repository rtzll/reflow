import { on, ref, type Handle } from 'remix/component'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { ProportionBar } from './proportion-bar.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface DiffMinimapFile {
  id: string
  path: string
  additions: number
  deletions: number
  /** Whether the reviewer has marked this file viewed. */
  viewed?: boolean
  /** Count of unresolved review threads anchored in this file. */
  unresolvedComments?: number
}

export interface DiffMinimapProps {
  /** Files in diff order. */
  files: readonly DiffMinimapFile[]
  /** Currently focused or visible file ID. */
  activeId?: string
  /** Called when a file bar or jump button selects a file. */
  onSelect?: (file: DiffMinimapFile) => void
  /** Accessible name for the navigation region. Default `'Diff overview'`. */
  label?: string
  /** Controls bar density. */
  size?: ControlSize
  class?: string
}

function findNextMatching(
  files: readonly DiffMinimapFile[],
  activeId: string | undefined,
  predicate: (file: DiffMinimapFile) => boolean,
): DiffMinimapFile | undefined {
  if (files.length === 0) return undefined
  const activeIndex = activeId ? files.findIndex((file) => file.id === activeId) : -1
  for (let offset = 1; offset <= files.length; offset++) {
    const candidate = files[(activeIndex + offset + files.length) % files.length]!
    if (predicate(candidate)) return candidate
  }
  return undefined
}

/**
 * Diff review overview bar visualizing file change density, unresolved comment
 * pins, viewed progress, and one-click Next unviewed / Next unresolved jumps.
 */
export function DiffMinimap(handle: Handle<DiffMinimapProps>) {
  let trackEl: HTMLDivElement | null = null
  const trackRef = ref((node) => {
    trackEl = node instanceof HTMLDivElement ? node : null
  })

  function focusMarker(index: number) {
    const markers = trackEl?.querySelectorAll<HTMLButtonElement>('.rf-diff-minimap-marker')
    if (!markers || markers.length === 0) return
    const clamped = Math.max(0, Math.min(markers.length - 1, index))
    markers[clamped]?.focus()
  }

  return () => {
    const props = handle.props
    const files = props.files
    const viewedCount = files.filter((file) => file.viewed).length
    const unresolvedFiles = files.filter((file) => (file.unresolvedComments ?? 0) > 0)
    const unresolvedTotal = unresolvedFiles.reduce(
      (sum, file) => sum + (file.unresolvedComments ?? 0),
      0,
    )
    const nextUnviewed = findNextMatching(files, props.activeId, (file) => !file.viewed)
    const nextUnresolved = findNextMatching(
      files,
      props.activeId,
      (file) => (file.unresolvedComments ?? 0) > 0,
    )
    const maxChurn = Math.max(1, ...files.map((file) => file.additions + file.deletions))

    return (
      <nav
        class={classList('rf-diff-minimap', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Diff overview'}
      >
        <div class="rf-diff-minimap-top">
          <div class="rf-diff-minimap-progress">
            <span class="rf-diff-minimap-count">
              {viewedCount} / {files.length} viewed
            </span>
            <ProportionBar
              class="rf-diff-minimap-meter"
              label={`${viewedCount} of ${files.length} files viewed`}
              showLegend={false}
              height={6}
              segments={[
                { id: 'viewed', label: 'Viewed', value: viewedCount, tone: 'success' },
                {
                  id: 'remaining',
                  label: 'Unviewed',
                  value: Math.max(0, files.length - viewedCount),
                  tone: 'neutral',
                },
              ]}
            />
          </div>

          <div class="rf-diff-minimap-jumps">
            <Button
              variant="secondary"
              size="compact"
              disabled={!nextUnviewed}
              mix={
                nextUnviewed
                  ? on('click', () => {
                      props.onSelect?.(nextUnviewed)
                    })
                  : undefined
              }
            >
              Next unviewed
            </Button>
            <Button
              variant="secondary"
              size="compact"
              disabled={!nextUnresolved}
              leadingIcon={<Icon name="message-circle" size={13} />}
              mix={
                nextUnresolved
                  ? on('click', () => {
                      props.onSelect?.(nextUnresolved)
                    })
                  : undefined
              }
            >
              {unresolvedTotal > 0 ? `Unresolved (${unresolvedTotal})` : 'Unresolved (0)'}
            </Button>
          </div>
        </div>

        <div class="rf-diff-minimap-track" mix={trackRef} role="group" aria-label="Changed files">
          {files.map((file, index) => {
            const churn = file.additions + file.deletions
            const heightPct = Math.max(18, Math.round((churn / maxChurn) * 100))
            const addShare = churn > 0 ? Math.round((file.additions / churn) * 100) : 50
            const active = file.id === props.activeId
            const unresolved = file.unresolvedComments ?? 0
            const title = `${file.path} (+${file.additions} -${file.deletions})${file.viewed ? ' · viewed' : ''}${unresolved > 0 ? ` · ${unresolved} unresolved` : ''}`

            return (
              <button
                key={file.id}
                type="button"
                class="rf-diff-minimap-marker"
                data-active={active ? 'true' : undefined}
                data-viewed={file.viewed ? 'true' : undefined}
                data-unresolved={unresolved > 0 ? 'true' : undefined}
                aria-current={active ? 'true' : undefined}
                aria-label={title}
                title={title}
                mix={[
                  on('click', () => props.onSelect?.(file)),
                  on('keydown', (event) => {
                    if (event.key === 'ArrowRight') {
                      event.preventDefault()
                      focusMarker((index + 1) % files.length)
                    } else if (event.key === 'ArrowLeft') {
                      event.preventDefault()
                      focusMarker((index - 1 + files.length) % files.length)
                    } else if (event.key === 'Home') {
                      event.preventDefault()
                      focusMarker(0)
                    } else if (event.key === 'End') {
                      event.preventDefault()
                      focusMarker(files.length - 1)
                    }
                  }),
                ]}
              >
                <span class="rf-diff-minimap-bar" style={{ height: `${heightPct}%` }}>
                  <span class="rf-diff-minimap-add" style={{ height: `${addShare}%` }} />
                  <span class="rf-diff-minimap-del" style={{ height: `${100 - addShare}%` }} />
                </span>
                {unresolved > 0 && <span class="rf-diff-minimap-pin" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </nav>
    )
  }
}
