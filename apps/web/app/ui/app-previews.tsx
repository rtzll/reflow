import { BarChart, Icon, StatusStrip } from '@rtzll/reflow'
import { activityBars, fullRange } from '../analytics-data.ts'
import { dayLabel } from '../public/apps/analytics/activity.ts'
import { seedEvents, timeLabel } from '../public/apps/calendar/events.ts'
import { ciHistoryRuns } from '../public/apps/ci/fixtures.ts'
import { issues } from '../public/apps/issues/fixtures.ts'

function IssuePreview() {
  return () => (
    <div class="app-preview-sheet app-preview-issues">
      <div class="app-preview-heading">
        <i class="app-status-dot" />
        In progress
      </div>
      {issues
        .filter((issue) => issue.status === 'In progress')
        .slice(0, 2)
        .map((issue) => (
          <div key={issue.id} class="app-preview-ticket">
            <small>{issue.id}</small>
            <strong>{issue.title}</strong>
          </div>
        ))}
    </div>
  )
}

function ChatPreview() {
  return () => (
    <div class="app-preview-chat">
      <div class="app-preview-bubble">Help me plan the next issue.</div>
      <div class="app-preview-skills app-preview-sheet">
        <div class="app-preview-prompt">
          <span>/</span>Skills
        </div>
        <div>
          <Icon name="pencil" size={14} /> /outline
        </div>
        <div>
          <Icon name="message-circle" size={14} /> /interview
        </div>
      </div>
    </div>
  )
}

function CalendarPreview() {
  const events = seedEvents.filter((event) =>
    ['kickoff', 'research', 'identity'].includes(event.id),
  )
  return () => (
    <div class="app-preview-sheet app-preview-week">
      <div class="app-preview-heading">November</div>
      <div class="app-preview-days">
        <span>
          Mon <b>16</b>
        </span>
        <span>
          Tue <b>17</b>
        </span>
      </div>
      <div class="app-preview-slots">
        {events.map((event) => (
          <div
            key={event.id}
            class="app-preview-event"
            data-calendar={event.calendar}
            style={{ gridColumn: event.day + 1, gridRow: event.id === 'identity' ? 2 : 1 }}
          >
            <small>{timeLabel(event.start)}</small>
            <strong>{event.title}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsPreview() {
  return () => (
    <div class="app-preview-sheet app-preview-activity">
      <div class="app-preview-heading">Daily activity</div>
      <BarChart label="Daily event counts" items={activityBars} showAxes={false} />
      <div class="app-preview-dates">
        <span>{dayLabel(fullRange.start)}</span>
        <span>{dayLabel(fullRange.end)}</span>
      </div>
    </div>
  )
}

function ReviewPreview() {
  return () => (
    <div class="app-preview-sheet app-preview-review">
      <div class="app-preview-heading">
        <span>src/diffs-ssr.ts</span>
        <span class="app-preview-diff-counts">
          <b>+29</b> <i>−0</i>
        </span>
      </div>
      <div class="app-preview-diff-lines">
        <div class="app-preview-diff-line" data-kind="remove">
          − let ready = false
        </div>
        <div class="app-preview-diff-line" data-kind="add">
          + let ready = Boolean(prerenderedHTML)
        </div>
        <div class="app-preview-diff-line" data-kind="add">
          + return preloadDiffHTML(&#123; fileDiff &#125;)
        </div>
      </div>
    </div>
  )
}

function CiPreview() {
  return () => (
    <div class="app-preview-sheet app-preview-ci">
      <div class="app-preview-heading">
        <span>Release #4578</span>
        <span>3m 42s</span>
      </div>
      <StatusStrip label="Recent CI runs" items={ciHistoryRuns} size="compact" />
      <div class="app-preview-dates">
        <span>verify ✓</span>
        <span>publish ✓</span>
      </div>
    </div>
  )
}

export const appPreviews = {
  issues: IssuePreview,
  chat: ChatPreview,
  calendar: CalendarPreview,
  analytics: AnalyticsPreview,
  review: ReviewPreview,
  ci: CiPreview,
}
