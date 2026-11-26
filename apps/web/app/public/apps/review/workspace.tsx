import {
  AvatarGroup,
  Badge,
  Button,
  CommandMenu,
  CommentThread,
  Drawer,
  EmptyState,
  FileChanges,
  Icon,
  Input,
  Kbd,
  Popover,
  Progress,
  RadioGroup,
  Resizable,
  SegmentedControl,
  Tabs,
  Terminal,
  Timeline,
  Toaster,
  toast,
  type CommandItem,
  type TimelineItem,
} from '@rtzll/reflow'
import { Diagram } from '@rtzll/reflow/diagrams'
import { DiffView, type DiffLineAnnotation, type SelectedLineRange } from '@rtzll/reflow/diffs'
import { Markdown, type MarkdownCodeBlock } from '@rtzll/reflow/markdown'
import { FileTree, type FileTreeSsrPayload } from '@rtzll/reflow/trees'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from '../../showcase-sound.ts'
import {
  buildReviewTreeDecorations,
  buildReviewTreeGitStatus,
  type ReviewCheck,
  type ReviewFile,
  type ReviewThread,
  type SeedActivityEvent,
  type pullRequest as PullRequestData,
} from './fixtures.ts'

interface ReviewWorkspaceProps {
  pullRequest: typeof PullRequestData
  files: ReviewFile[]
  initialThreads: ReviewThread[]
  checks: ReviewCheck[]
  initialActivity: SeedActivityEvent[]
  prerenderedDiffs?: Record<string, string>
  prerenderedTree?: FileTreeSsrPayload
  prerenderedDiagrams?: Record<string, string>
}

type Verdict = 'open' | 'approved' | 'changes-requested'
type DraftDecision = 'comment' | 'approved' | 'changes-requested'

interface DraftComment {
  filePath: string
  side: 'additions' | 'deletions'
  lineNumber: number
  body: string
}

const STORAGE_KEY = 'reflow:review:142'

interface SavedState {
  viewed: string[]
  verdict: Verdict
  appliedSuggestions: string[]
  threads: ReviewThread[]
  activity: SeedActivityEvent[]
}

function readSaved(): Partial<SavedState> | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<SavedState>) : undefined
  } catch {
    return undefined
  }
}

function writeSaved(state: SavedState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage may be disabled in private browsing.
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export const ReviewWorkspace = clientEntry(
  import.meta.url,
  function ReviewWorkspace(handle: Handle<ReviewWorkspaceProps>) {
    let tab: 'files' | 'conversation' = 'files'
    let diffLayout: 'unified' | 'split' = 'unified'
    let filter = ''
    let activeFilePath = handle.props.files[0]?.path ?? ''
    let viewed = new Set<string>()
    let collapsed = new Set<string>()
    let threads: ReviewThread[] = handle.props.initialThreads
    let appliedSuggestions = new Set<string>()
    let activity: SeedActivityEvent[] = handle.props.initialActivity
    let verdict: Verdict = 'open'

    let draftComment: DraftComment | null = null
    let reviewPopoverOpen = false
    let reviewDecision: DraftDecision = 'approved'
    let reviewNote = ''
    let activeCheck: ReviewCheck | null = null
    let hydratedStorage = false

    let workspaceRoot: HTMLElement | undefined

    function persist() {
      writeSaved({
        viewed: [...viewed],
        verdict,
        appliedSuggestions: [...appliedSuggestions],
        threads,
        activity,
      })
    }

    function jumpToFile(path: string) {
      activeFilePath = path
      tab = 'files'
      void handle.update()
      handle.queueTask(() => {
        const card = workspaceRoot?.querySelector<HTMLElement>(
          `[data-review-file="${CSS.escape(path)}"]`,
        )
        card?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    function toggleViewed(path: string) {
      const nextViewed = new Set(viewed)
      const nextCollapsed = new Set(collapsed)
      if (nextViewed.has(path)) {
        nextViewed.delete(path)
        nextCollapsed.delete(path)
      } else {
        nextViewed.add(path)
        nextCollapsed.add(path)
      }
      viewed = nextViewed
      collapsed = nextCollapsed
      persist()
      void handle.update()
    }

    function startInlineComment(filePath: string, range: SelectedLineRange) {
      const side = range.side === 'deletions' ? 'deletions' : 'additions'
      draftComment = {
        filePath,
        side,
        lineNumber: range.end ?? range.start,
        body: '',
      }
      void handle.update()
    }

    function submitInlineComment() {
      if (!draftComment) return
      const text = draftComment.body.trim()
      if (!text) return
      const created: ReviewThread = {
        id: `thread-${Date.now()}`,
        filePath: draftComment.filePath,
        side: draftComment.side,
        lineNumber: draftComment.lineNumber,
        resolved: false,
        comments: [
          {
            id: `comment-${Date.now()}`,
            author: { name: 'You', role: 'Reviewer' },
            timestamp: 'Just now',
            body: text,
          },
        ],
      }
      threads = [...threads, created]
      draftComment = null
      persist()
      void handle.update()
    }

    function addReply(threadId: string, body: string) {
      threads = threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              comments: [
                ...thread.comments,
                {
                  id: `reply-${Date.now()}`,
                  author: { name: 'You', role: 'Reviewer' },
                  timestamp: 'Just now',
                  body,
                },
              ],
            }
          : thread,
      )
      persist()
      void handle.update()
    }

    function setThreadResolved(threadId: string, next: boolean) {
      threads = threads.map((thread) =>
        thread.id === threadId ? { ...thread, resolved: next } : thread,
      )
      persist()
      void handle.update()
    }

    function applySuggestion(commentId: string) {
      appliedSuggestions = new Set([...appliedSuggestions, commentId])
      toast.success('Suggestion queued for commit')
      persist()
      void handle.update()
    }

    function submitReview() {
      const label =
        reviewDecision === 'approved'
          ? 'approved these changes'
          : reviewDecision === 'changes-requested'
            ? 'requested changes'
            : 'left a review comment'
      if (reviewDecision !== 'comment') verdict = reviewDecision
      const note = reviewNote.trim()
      activity = [
        ...activity,
        {
          id: `ev-${Date.now()}`,
          actor: 'You',
          summary: label,
          timestamp: 'Just now',
          tone:
            reviewDecision === 'approved'
              ? 'success'
              : reviewDecision === 'changes-requested'
                ? 'warning'
                : 'accent',
          detail: note || undefined,
        },
      ]
      reviewNote = ''
      reviewPopoverOpen = false
      persist()
      if (reviewDecision === 'approved') toast.success('Review submitted: Approved')
      else if (reviewDecision === 'changes-requested')
        toast.warning('Review submitted: Changes requested')
      else toast.success('Review comment posted')
      void handle.update()
    }

    const mountWorkspace = ref<HTMLElement>((node, signal) => {
      workspaceRoot = node
      if (!hydratedStorage) {
        hydratedStorage = true
        const saved = readSaved()
        if (saved) {
          if (Array.isArray(saved.viewed)) {
            viewed = new Set(saved.viewed)
            collapsed = new Set(saved.viewed)
          }
          if (saved.verdict) verdict = saved.verdict
          if (Array.isArray(saved.appliedSuggestions)) {
            appliedSuggestions = new Set(saved.appliedSuggestions)
          }
          if (Array.isArray(saved.threads) && saved.threads.length > 0) {
            threads = saved.threads
          }
          if (Array.isArray(saved.activity) && saved.activity.length > 0) {
            activity = saved.activity
          }
          void handle.update()
        }
      }

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented) return
        if (isEditableTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
        const files = handle.props.files
        if (event.key === 'j' || event.key === 'k') {
          event.preventDefault()
          const index = Math.max(
            0,
            files.findIndex((f) => f.path === activeFilePath),
          )
          const nextIndex =
            event.key === 'j' ? Math.min(files.length - 1, index + 1) : Math.max(0, index - 1)
          const target = files[nextIndex]
          if (target) jumpToFile(target.path)
        } else if (event.key === 'v' && activeFilePath) {
          event.preventDefault()
          toggleViewed(activeFilePath)
        } else if (event.key === 'u') {
          event.preventDefault()
          diffLayout = 'unified'
          void handle.update()
        } else if (event.key === 's') {
          event.preventDefault()
          diffLayout = 'split'
          void handle.update()
        }
      }

      window.addEventListener('keydown', onKeyDown, { signal })
      signal.addEventListener(
        'abort',
        () => {
          workspaceRoot = undefined
        },
        { once: true },
      )
    })

    return () => {
      const {
        pullRequest: pr,
        files,
        checks,
        prerenderedDiffs,
        prerenderedTree,
        prerenderedDiagrams,
      } = handle.props
      const needle = filter.trim().toLowerCase()
      const visibleFiles = files.filter(
        (file) => !needle || file.path.toLowerCase().includes(needle),
      )
      const totalAdded = files.reduce((sum, f) => sum + f.added, 0)
      const totalRemoved = files.reduce((sum, f) => sum + f.removed, 0)
      const unresolvedCount = threads.filter((t) => !t.resolved).length
      const visiblePaths = visibleFiles.map((file) => file.path)
      const treeGitStatus = buildReviewTreeGitStatus(visibleFiles)
      const treeDecorations = buildReviewTreeDecorations(visibleFiles, viewed, threads)

      function renderCommentCodeBlock({ code, language, size }: MarkdownCodeBlock) {
        if (language !== 'mermaid') return undefined
        return (
          <Diagram
            code={code}
            prerenderedSVG={prerenderedDiagrams?.[code.trim()]}
            size={size ?? 'compact'}
            copyable
            showSourceToggle
          />
        )
      }

      const commands: CommandItem[] = [
        ...files.map((file) => ({
          value: `file:${file.path}`,
          label: file.path,
          group: 'Jump to file',
          icon: <Icon name="file" size={14} />,
        })),
        {
          value: 'layout:toggle',
          label: `Switch to ${diffLayout === 'unified' ? 'split' : 'unified'} diff`,
          group: 'View',
          shortcut: diffLayout === 'unified' ? 's' : 'u',
        },
        ...checks.map((check) => ({
          value: `check:${check.id}`,
          label: `Inspect log: ${check.name}`,
          group: 'CI Checks',
          icon: <Icon name="check" size={14} />,
        })),
      ]

      function runCommand(value: string) {
        if (value.startsWith('file:')) {
          jumpToFile(value.slice(5))
        } else if (value === 'layout:toggle') {
          diffLayout = diffLayout === 'unified' ? 'split' : 'unified'
          void handle.update()
        } else if (value.startsWith('check:')) {
          const id = value.slice(6)
          activeCheck = checks.find((check) => check.id === id) ?? null
          void handle.update()
        }
      }

      const timelineItems: TimelineItem[] = activity.map((event) => ({
        id: event.id,
        tone: event.tone ?? 'neutral',
        icon:
          event.tone === 'success' ? (
            <Icon name="check" size={12} />
          ) : event.tone === 'accent' ? (
            <Icon name="message-circle" size={12} />
          ) : (
            <Icon name="file" size={12} />
          ),
        title: (
          <>
            <strong>{event.actor}</strong> {event.summary}
          </>
        ),
        meta: event.badge ? <Badge size="compact">{event.badge}</Badge> : undefined,
        timestamp: event.timestamp,
        detail: event.detail,
      }))

      const verdictBadge =
        verdict === 'approved' ? (
          <Badge size="compact" color="green">
            Approved
          </Badge>
        ) : verdict === 'changes-requested' ? (
          <Badge size="compact" color="amber">
            Changes requested
          </Badge>
        ) : (
          <Badge size="compact" color="accent">
            Open
          </Badge>
        )

      const filesPanel = (
        <div class="review-split">
          <Resizable
            class="review-resizable"
            label="Files and diffs"
            defaultValue={24}
            min={18}
            max={38}
            first={
              <aside class="review-sidebar" aria-label="Changed files">
                <div class="review-sidebar-search">
                  <Input
                    size="compact"
                    type="search"
                    aria-label="Filter changed files"
                    placeholder="Filter files…"
                    value={filter}
                    mix={on('input', (event) => {
                      filter = (event.currentTarget as HTMLInputElement).value
                      void handle.update()
                    })}
                  />
                </div>
                {visiblePaths.length > 0 ? (
                  <div class="review-tree-wrap">
                    <FileTree
                      label="Changed files tree"
                      paths={visiblePaths}
                      gitStatus={treeGitStatus}
                      rowDecorations={treeDecorations}
                      value={activeFilePath}
                      onValueChange={(path) => {
                        if (files.some((file) => file.path === path)) jumpToFile(path)
                      }}
                      prerendered={
                        visibleFiles.length === files.length ? prerenderedTree : undefined
                      }
                      size="compact"
                    />
                  </div>
                ) : (
                  <div class="review-sidebar-empty">No matching files</div>
                )}

                <section class="review-sidebar-checks" aria-label="CI checks">
                  <h2 class="review-sidebar-heading">Checks ({checks.length} passed)</h2>
                  <ul class="review-check-list" role="list">
                    {checks.map((check) => (
                      <li key={check.id}>
                        <button
                          type="button"
                          class="review-check-row"
                          mix={on('click', () => {
                            activeCheck = check
                            void handle.update()
                          })}
                        >
                          <span
                            class="review-check-dot"
                            data-status={check.status}
                            aria-hidden="true"
                          >
                            <Icon name={check.status === 'passed' ? 'check' : 'x'} size={12} />
                          </span>
                          <span class="review-check-name">{check.name}</span>
                          <span class="review-check-duration">{check.duration}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            }
            second={
              <div class="review-stream" aria-label="Diff stream">
                {visibleFiles.length === 0 ? (
                  <EmptyState
                    surface="outlined"
                    icon={<Icon name="search" size={18} />}
                    title="No matching files"
                    description={`No changed files match “${filter.trim()}”. Clear the filter to inspect all ${files.length} files.`}
                    actions={
                      <Button
                        size="compact"
                        variant="secondary"
                        mix={on('click', () => {
                          filter = ''
                          void handle.update()
                        })}
                      >
                        Clear filter
                      </Button>
                    }
                  />
                ) : (
                  visibleFiles.map((file) => {
                    const fileThreads = threads.filter((t) => t.filePath === file.path)
                    const fileDraft =
                      draftComment && draftComment.filePath === file.path ? draftComment : null
                    const isViewed = viewed.has(file.path)
                    const isCollapsed = collapsed.has(file.path)
                    const annotations: DiffLineAnnotation<
                      | { kind: 'thread'; thread: ReviewThread }
                      | { kind: 'draft'; draft: DraftComment }
                    >[] = [
                      ...fileThreads.map((thread) => ({
                        side: thread.side,
                        lineNumber: thread.lineNumber,
                        metadata: { kind: 'thread' as const, thread },
                      })),
                      ...(fileDraft
                        ? [
                            {
                              side: fileDraft.side,
                              lineNumber: fileDraft.lineNumber,
                              metadata: { kind: 'draft' as const, draft: fileDraft },
                            },
                          ]
                        : []),
                    ]

                    return (
                      <div
                        key={file.id}
                        class="review-file-card"
                        data-review-file={file.path}
                        data-active={activeFilePath === file.path ? '' : undefined}
                        mix={on('click', () => {
                          if (activeFilePath !== file.path) {
                            activeFilePath = file.path
                            void handle.update()
                          }
                        })}
                      >
                        <DiffView
                          filename={file.path}
                          oldFile={file.oldFile}
                          newFile={file.newFile}
                          prerenderedHTML={prerenderedDiffs?.[file.path]}
                          view={diffLayout}
                          wrap
                          size="compact"
                          collapsible
                          collapsed={isCollapsed}
                          onCollapsedChange={(next) => {
                            const updated = new Set(collapsed)
                            if (next) updated.add(file.path)
                            else updated.delete(file.path)
                            collapsed = updated
                            void handle.update()
                          }}
                          copyable
                          onCopy={playCopySuccess}
                          onCopyError={playCopyError}
                          enableLineSelection
                          enableGutterUtility
                          onGutterUtilityClick={(range) => startInlineComment(file.path, range)}
                          headerPrefix={
                            <Badge
                              size="compact"
                              color={file.status === 'added' ? 'green' : 'accent'}
                            >
                              {file.status === 'added' ? 'Added' : 'Modified'}
                            </Badge>
                          }
                          actions={
                            <div class="review-file-actions">
                              <Button
                                size="compact"
                                variant="ghost"
                                leadingIcon={<Icon name="message-circle" size={13} />}
                                mix={on('click', () =>
                                  startInlineComment(file.path, {
                                    start: 1,
                                    end: 1,
                                    side: 'additions',
                                  }),
                                )}
                              >
                                Comment
                              </Button>
                              <Button
                                size="compact"
                                variant={isViewed ? 'secondary' : 'ghost'}
                                aria-pressed={isViewed}
                                leadingIcon={<Icon name="check" size={13} />}
                                mix={on('click', () => toggleViewed(file.path))}
                              >
                                {isViewed ? 'Viewed' : 'Mark viewed'}
                              </Button>
                            </div>
                          }
                          lineAnnotations={annotations}
                          renderAnnotation={(annotation) => {
                            const meta = annotation.metadata as
                              | { kind: 'thread'; thread: ReviewThread }
                              | { kind: 'draft'; draft: DraftComment }
                            if (meta.kind === 'draft') {
                              return (
                                <form
                                  class="review-draft-comment"
                                  mix={on('submit', (event) => {
                                    event.preventDefault()
                                    submitInlineComment()
                                  })}
                                >
                                  <div class="review-draft-header">
                                    <span>
                                      New comment on line {meta.draft.lineNumber} ({meta.draft.side}
                                      )
                                    </span>
                                  </div>
                                  <textarea
                                    class="rf-comment-reply-input"
                                    rows={2}
                                    aria-label="New review comment"
                                    placeholder="Leave a review comment on this line…"
                                    value={meta.draft.body}
                                    mix={[
                                      on('input', (event) => {
                                        if (!draftComment) return
                                        draftComment = {
                                          ...draftComment,
                                          body: (event.currentTarget as HTMLTextAreaElement).value,
                                        }
                                        void handle.update()
                                      }),
                                      on('keydown', (event) => {
                                        if (
                                          (event.metaKey || event.ctrlKey) &&
                                          event.key === 'Enter'
                                        ) {
                                          event.preventDefault()
                                          submitInlineComment()
                                        }
                                      }),
                                    ]}
                                  />
                                  <div class="review-draft-actions">
                                    <Button
                                      type="button"
                                      size="compact"
                                      variant="ghost"
                                      mix={on('click', () => {
                                        draftComment = null
                                        void handle.update()
                                      })}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      size="compact"
                                      disabled={meta.draft.body.trim().length === 0}
                                    >
                                      Post comment
                                    </Button>
                                  </div>
                                </form>
                              )
                            }
                            const thread = meta.thread
                            return (
                              <CommentThread
                                size="compact"
                                context={`Line ${thread.lineNumber}`}
                                outdated={thread.outdated}
                                resolved={thread.resolved}
                                onResolvedChange={(next) => setThreadResolved(thread.id, next)}
                                onReply={(body) => addReply(thread.id, body)}
                                comments={thread.comments.map((entry) => ({
                                  ...entry,
                                  body: (
                                    <Markdown
                                      size="compact"
                                      source={entry.body}
                                      renderCodeBlock={renderCommentCodeBlock}
                                    />
                                  ),
                                  suggestion: entry.suggestion
                                    ? {
                                        ...entry.suggestion,
                                        applied: appliedSuggestions.has(entry.id),
                                        onApply: () => applySuggestion(entry.id),
                                      }
                                    : undefined,
                                }))}
                              />
                            )
                          }}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            }
          />
        </div>
      )

      const conversationPanel = (
        <div class="review-conversation">
          <div class="review-conversation-main">
            <section class="review-section">
              <h2>Architecture</h2>
              <Diagram
                title="Zero-flash SSR hydration pipeline"
                code={pr.diagram}
                prerenderedSVG={prerenderedDiagrams?.[pr.diagram.trim()]}
                copyable
                showSourceToggle
              />
            </section>
            <section class="review-section">
              <h2>Activity</h2>
              <Timeline label="Pull request timeline" items={timelineItems} />
            </section>
          </div>
          <aside class="review-conversation-rail">
            <FileChanges
              title={`Changed ${files.length} files`}
              visible={files.length}
              files={files.map((file) => ({
                path: file.path,
                added: file.added,
                removed: file.removed,
              }))}
              actions={
                <Button
                  size="compact"
                  variant="secondary"
                  mix={on('click', () => {
                    tab = 'files'
                    void handle.update()
                  })}
                >
                  Inspect diffs
                </Button>
              }
            />
            <section class="review-checks-card" aria-label="Check runs">
              <h3>Checks ({checks.length} passed)</h3>
              <ul class="review-check-list" role="list">
                {checks.map((check) => (
                  <li key={check.id}>
                    <button
                      type="button"
                      class="review-check-row"
                      mix={on('click', () => {
                        activeCheck = check
                        void handle.update()
                      })}
                    >
                      <span class="review-check-dot" data-status={check.status} aria-hidden="true">
                        <Icon name={check.status === 'passed' ? 'check' : 'x'} size={12} />
                      </span>
                      <span class="review-check-info">
                        <span class="review-check-name">{check.name}</span>
                        <span class="review-check-summary">{check.summary}</span>
                      </span>
                      <span class="review-check-duration">{check.duration}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )

      return (
        <div class="review-workspace" data-review-ready="" mix={mountWorkspace}>
          <header class="review-header">
            <div class="review-header-top">
              <div class="review-title-block">
                <div class="review-title-row">
                  <h1>
                    {pr.title} <span class="review-pr-number">#{pr.number}</span>
                  </h1>
                  {verdictBadge}
                </div>
                <div class="review-meta-row">
                  <span class="review-branch">
                    <code>{pr.branch}</code> → <code>{pr.base}</code>
                  </span>
                  <span class="review-counts">
                    <span class="review-added">+{totalAdded}</span>{' '}
                    <span class="review-removed">−{totalRemoved}</span>
                  </span>
                  <span class="review-open-threads">
                    {unresolvedCount} unresolved {unresolvedCount === 1 ? 'thread' : 'threads'}
                  </span>
                  <AvatarGroup size={22} avatars={pr.reviewers.map((name) => ({ name }))} />
                </div>
              </div>

              <div class="review-header-controls">
                <div class="review-progress-wrap">
                  <Progress
                    label={`${viewed.size} of ${files.length} viewed`}
                    value={viewed.size}
                    max={files.length}
                    size="compact"
                  />
                </div>

                <SegmentedControl
                  label="Diff layout"
                  size="compact"
                  value={diffLayout}
                  options={[
                    { value: 'unified', label: 'Unified' },
                    { value: 'split', label: 'Split' },
                  ]}
                  onValueChange={(next) => {
                    diffLayout = next === 'split' ? 'split' : 'unified'
                    void handle.update()
                  }}
                />

                <CommandMenu
                  label="Jump to file or check"
                  placeholder="Jump to a changed file or check…"
                  shortcut="mod+k"
                  items={commands}
                  onSelect={runCommand}
                  triggerSize="compact"
                  trigger={
                    <span class="review-jump-trigger">
                      <span>Jump</span>
                      <Kbd size="compact" variant="outline" keys="mod+k" />
                    </span>
                  }
                />

                <Popover
                  label="Submit review"
                  open={reviewPopoverOpen}
                  onOpenChange={(next) => {
                    reviewPopoverOpen = next
                    void handle.update()
                  }}
                  placement="bottom-end"
                  renderTrigger={(triggerProps) => (
                    <Button
                      size="compact"
                      variant="primary"
                      trailingIcon={<Icon name="chevron-down" size={14} />}
                      {...triggerProps}
                    >
                      Submit review
                    </Button>
                  )}
                >
                  <form
                    class="review-submit-form"
                    mix={on('submit', (event) => {
                      event.preventDefault()
                      submitReview()
                    })}
                  >
                    <RadioGroup
                      label="Review verdict"
                      value={reviewDecision}
                      onValueChange={(next) => {
                        reviewDecision = next as DraftDecision
                        void handle.update()
                      }}
                      options={[
                        { value: 'approved', label: 'Approve' },
                        { value: 'comment', label: 'Comment only' },
                        { value: 'changes-requested', label: 'Request changes' },
                      ]}
                    />
                    <textarea
                      class="rf-comment-reply-input"
                      rows={3}
                      aria-label="Review summary"
                      placeholder="Leave a summary note…"
                      value={reviewNote}
                      mix={on('input', (event) => {
                        reviewNote = (event.currentTarget as HTMLTextAreaElement).value
                        void handle.update()
                      })}
                    />
                    <div class="review-submit-footer">
                      <Button type="submit" size="compact">
                        Submit review
                      </Button>
                    </div>
                  </form>
                </Popover>
              </div>
            </div>

            <div class="review-shortcuts-bar" aria-label="Keyboard shortcuts">
              <span>
                <Kbd size="compact" variant="outline">
                  j
                </Kbd>{' '}
                <Kbd size="compact" variant="outline">
                  k
                </Kbd>{' '}
                next/prev file
              </span>
              <span>
                <Kbd size="compact" variant="outline">
                  v
                </Kbd>{' '}
                mark viewed
              </span>
              <span>
                <Kbd size="compact" variant="outline">
                  u
                </Kbd>{' '}
                <Kbd size="compact" variant="outline">
                  s
                </Kbd>{' '}
                unified/split
              </span>
            </div>
          </header>

          <div class="review-tabs-wrap">
            <Tabs
              label="Pull request views"
              value={tab}
              onValueChange={(next) => {
                tab = next === 'conversation' ? 'conversation' : 'files'
                void handle.update()
              }}
              items={[
                {
                  value: 'files',
                  label: `Files changed (${files.length})`,
                  panel: filesPanel,
                },
                {
                  value: 'conversation',
                  label: `Conversation & checks (${checks.length})`,
                  panel: conversationPanel,
                },
              ]}
            />
          </div>

          <Drawer
            side="right"
            open={activeCheck !== null}
            onOpenChange={(next) => {
              if (!next) {
                activeCheck = null
                void handle.update()
              }
            }}
            title={activeCheck?.name ?? 'Check log'}
            description={activeCheck?.summary}
          >
            {activeCheck && (
              <div class="review-drawer-log">
                <Terminal
                  command={activeCheck.command}
                  status={activeCheck.status}
                  exitCode={activeCheck.exitCode}
                  output={activeCheck.output}
                  searchable
                  lineNumbers
                  wrap
                  size="compact"
                  onCopy={playCopySuccess}
                  onCopyError={playCopyError}
                />
              </div>
            )}
          </Drawer>

          <Toaster position="bottom-right" />
        </div>
      )
    }
  },
)
