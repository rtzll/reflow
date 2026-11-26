import { on, type Handle, type RemixNode } from 'remix/component'
import { Avatar } from './avatar.tsx'
import { Badge } from './badge.tsx'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface CommentAuthor {
  name: string
  src?: string
  /** Optional role chip shown beside the author (e.g. `Author`, `Maintainer`). */
  role?: string
}

export interface CommentSuggestion {
  /** Original lines replaced by the suggestion. */
  removed?: string
  /** Replacement lines proposed by the reviewer. */
  added: string
  /** Optional header label. Default `'Suggested change'`. */
  label?: string
  /** Marks the suggestion as already applied. */
  applied?: boolean
  /** Called when the user clicks Apply suggestion. */
  onApply?: () => void
}

export interface CommentEntry {
  id: string
  author: CommentAuthor
  /** Human-readable timestamp (e.g. `'12m ago'`). */
  timestamp?: string
  /** Plain text or rich RemixNode (such as `<Markdown />`). */
  body: RemixNode
  /** Optional inline code suggestion block. */
  suggestion?: CommentSuggestion
}

export interface CommentThreadProps {
  /** Ordered list of comments in this thread. */
  comments: readonly CommentEntry[]
  /** Optional anchor context shown in the header (e.g. `'Lines 14–18'` or `'src/diffs.tsx:42'`). */
  context?: RemixNode
  /** Marks the thread as outdated when the referenced lines have changed. */
  outdated?: boolean
  /** Controlled resolved state. */
  resolved?: boolean
  /** Initial resolved state when uncontrolled. Default `false`. */
  defaultResolved?: boolean
  /** Called when the user resolves or reopens the thread. */
  onResolvedChange?: (resolved: boolean) => void
  /** Called when the user submits a reply from the inline composer. */
  onReply?: (body: string) => void
  /** Controls whether the reply composer is shown. Defaults to `true` when `onReply` is provided. */
  replyable?: boolean
  /** Placeholder text for the reply composer. Default `'Write a reply…'`. */
  replyPlaceholder?: string
  /** Extra controls placed in the thread header. */
  actions?: RemixNode
  /** Controls text scale and spacing. */
  size?: ControlSize
  /** Accessible name for the thread region. */
  label?: string
  class?: string
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
}

/**
 * Threaded inline or standalone review discussion with author avatars,
 * optional code suggestion blocks, inline replies, and spring-collapsed
 * resolve/reopen states. Works standalone or slotted inside `DiffView`.
 * See docs/comment-thread.md.
 */
export function CommentThread(handle: Handle<CommentThreadProps>) {
  let internalResolved = handle.props.defaultResolved ?? false
  let expandedResolved = false
  let draft = ''

  function isResolved() {
    return handle.props.resolved ?? internalResolved
  }

  function setResolved(next: boolean) {
    if (handle.props.resolved === undefined) internalResolved = next
    if (!next) expandedResolved = false
    handle.props.onResolvedChange?.(next)
    void handle.update()
  }

  function submitReply() {
    const trimmed = draft.trim()
    if (!trimmed) return
    draft = ''
    handle.props.onReply?.(trimmed)
    void handle.update()
  }

  return () => {
    const {
      comments,
      context,
      outdated = false,
      onResolvedChange,
      onReply,
      replyable = Boolean(onReply),
      replyPlaceholder = 'Write a reply…',
      actions,
      size,
      label,
      class: classProp,
    } = handle.props

    const resolved = isResolved()
    const bodyOpen = !resolved || expandedResolved
    const bodyId = `${handle.id}-body`
    const canResolve =
      handle.props.resolved !== undefined ||
      handle.props.defaultResolved !== undefined ||
      onResolvedChange !== undefined
    const participantNames = [...new Set(comments.map((entry) => entry.author.name))]
    const commentCount = `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`

    return (
      <section
        class={classList('rf-comment-thread', classProp)}
        aria-label={
          label ?? (typeof context === 'string' ? `Comment thread on ${context}` : 'Comment thread')
        }
        data-resolved={resolved ? 'true' : undefined}
        data-density={size === 'compact' ? 'compact' : undefined}
      >
        {(context != null || outdated || resolved || canResolve || actions != null) && (
          <header class="rf-comment-header">
            <div class="rf-comment-heading">
              {resolved && (
                <span class="rf-comment-resolved-mark" aria-hidden="true">
                  <Icon name="check" size={12} />
                </span>
              )}
              {context != null && <span class="rf-comment-context">{context}</span>}
              {outdated && (
                <Badge size="compact" color="amber">
                  Outdated
                </Badge>
              )}
              {resolved && (
                <span class="rf-comment-summary">
                  Resolved · {commentCount}
                  {participantNames.length > 0 ? ` · ${participantNames.join(', ')}` : ''}
                </span>
              )}
            </div>
            <div class="rf-comment-header-actions">
              {actions}
              {resolved && (
                <Button
                  size="compact"
                  variant="ghost"
                  aria-expanded={bodyOpen}
                  aria-controls={bodyId}
                  mix={on('click', () => {
                    expandedResolved = !expandedResolved
                    void handle.update()
                  })}
                >
                  {bodyOpen ? 'Hide thread' : 'Show thread'}
                </Button>
              )}
              {canResolve && (
                <Button
                  size="compact"
                  variant="ghost"
                  mix={on('click', () => setResolved(!resolved))}
                >
                  {resolved ? 'Reopen' : 'Resolve'}
                </Button>
              )}
            </div>
          </header>
        )}

        <div
          id={bodyId}
          class="rf-comment-collapse"
          data-open={bodyOpen ? '' : undefined}
          inert={!bodyOpen || undefined}
          aria-hidden={!bodyOpen || undefined}
        >
          <div class="rf-comment-collapse-inner">
            <ol class="rf-comment-list" aria-label="Comments">
              {comments.map((entry) => (
                <li key={entry.id} class="rf-comment-entry">
                  <div class="rf-comment-meta">
                    <Avatar name={entry.author.name} src={entry.author.src} size={22} decorative />
                    <span class="rf-comment-author">{entry.author.name}</span>
                    {entry.author.role && <Badge size="compact">{entry.author.role}</Badge>}
                    {entry.timestamp && <span class="rf-comment-time">{entry.timestamp}</span>}
                  </div>
                  <div class="rf-comment-body">
                    {typeof entry.body === 'string' ? <p>{entry.body}</p> : entry.body}
                  </div>
                  {entry.suggestion && (
                    <div
                      class="rf-comment-suggestion"
                      data-applied={entry.suggestion.applied ? '' : undefined}
                    >
                      <div class="rf-comment-suggestion-header">
                        <span>{entry.suggestion.label ?? 'Suggested change'}</span>
                        {entry.suggestion.applied ? (
                          <Badge size="compact" color="green">
                            Applied
                          </Badge>
                        ) : (
                          entry.suggestion.onApply && (
                            <Button
                              size="compact"
                              variant="secondary"
                              mix={on('click', () => entry.suggestion?.onApply?.())}
                            >
                              Apply suggestion
                            </Button>
                          )
                        )}
                      </div>
                      <pre class="rf-comment-suggestion-code">
                        <code>
                          {entry.suggestion.removed &&
                            splitLines(entry.suggestion.removed).map((line, i) => (
                              <span
                                key={`r-${i}`}
                                class="rf-comment-suggestion-line"
                                data-kind="remove"
                              >
                                <span class="rf-comment-suggestion-mark" aria-hidden="true">
                                  −
                                </span>
                                <span>{line}</span>
                              </span>
                            ))}
                          {splitLines(entry.suggestion.added).map((line, i) => (
                            <span key={`a-${i}`} class="rf-comment-suggestion-line" data-kind="add">
                              <span class="rf-comment-suggestion-mark" aria-hidden="true">
                                +
                              </span>
                              <span>{line}</span>
                            </span>
                          ))}
                        </code>
                      </pre>
                    </div>
                  )}
                </li>
              ))}
            </ol>

            {replyable && onReply && !resolved && (
              <form
                class="rf-comment-reply"
                mix={on('submit', (event) => {
                  event.preventDefault()
                  submitReply()
                })}
              >
                <textarea
                  class="rf-comment-reply-input"
                  rows={2}
                  aria-label="Reply to thread"
                  placeholder={replyPlaceholder}
                  value={draft}
                  mix={[
                    on('input', (event) => {
                      draft = (event.currentTarget as HTMLTextAreaElement).value
                      void handle.update()
                    }),
                    on('keydown', (event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault()
                        submitReply()
                      }
                    }),
                  ]}
                />
                <div class="rf-comment-reply-footer">
                  <span class="rf-comment-reply-hint">⌘↵ to reply</span>
                  <Button
                    type="submit"
                    size="compact"
                    variant="secondary"
                    disabled={draft.trim().length === 0}
                  >
                    Reply
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    )
  }
}
