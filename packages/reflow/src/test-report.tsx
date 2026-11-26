import { on, type Handle } from 'remix/component'
import { Badge } from './badge.tsx'
import { Button } from './button.tsx'
import { Icon } from './icon.tsx'
import { ProportionBar } from './proportion-bar.tsx'
import { classList, type ControlSize } from './systems/styling.ts'
import { formatDurationMs } from './waterfall.tsx'

export type TestCaseStatus = 'passed' | 'failed' | 'flaky' | 'skipped'

export interface TestCaseResult {
  id: string
  name: string
  suite?: string
  file?: string
  status: TestCaseStatus
  durationMs?: number
  /** Historical flakiness percentage (`0–100`) for flaky badge display. */
  flakyRate?: number
  /** Failure assertion message or summary. */
  message?: string
  /** Expected value shown in an inline expected-vs-actual diff. */
  expected?: string
  /** Actual value shown in an inline expected-vs-actual diff. */
  actual?: string
  /** Stack trace or failure excerpt. */
  stack?: string
}

export interface TestReportProps {
  /** Test case execution results. */
  cases: readonly TestCaseResult[]
  /** Initial status filter tab. Default `'all'`. */
  defaultFilter?: TestCaseStatus | 'all'
  /** Called when the user clicks "Inspect log" on a test case. */
  onInspectLog?: (testCase: TestCaseResult) => void
  /** Accessible name for the test report region. Default `'Test report'`. */
  label?: string
  /** Controls padding and typography density. */
  size?: ControlSize
  class?: string
}

const filters: ReadonlyArray<{ id: TestCaseStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'failed', label: 'Failed' },
  { id: 'flaky', label: 'Flaky' },
  { id: 'passed', label: 'Passed' },
  { id: 'skipped', label: 'Skipped' },
]

/**
 * Structured CI test and flaky-test explorer composing ProportionBar with
 * status filters, search, expandable failure diffs and stack traces, and
 * jump-to-log actions.
 */
export function TestReport(handle: Handle<TestReportProps>) {
  let activeFilter: TestCaseStatus | 'all' = handle.props.defaultFilter ?? 'all'
  let query = ''
  const expanded = new Set<string>()
  let seeded = false

  function seedExpanded(cases: readonly TestCaseResult[]) {
    if (seeded) return
    seeded = true
    const firstFailed = cases.find(
      (item) => (item.status === 'failed' || item.status === 'flaky') && hasDetails(item),
    )
    if (firstFailed) expanded.add(firstFailed.id)
  }

  function hasDetails(item: TestCaseResult): boolean {
    return Boolean(
      item.message || item.stack || item.expected !== undefined || item.actual !== undefined,
    )
  }

  function toggleCase(id: string) {
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
    void handle.update()
  }

  return () => {
    const props = handle.props
    const cases = props.cases
    seedExpanded(cases)

    const counts: Record<TestCaseStatus, number> = {
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
    }
    let totalDuration = 0
    for (const item of cases) {
      counts[item.status]++
      totalDuration += item.durationMs ?? 0
    }

    const q = query.trim().toLowerCase()
    const visible = cases.filter((item) => {
      if (activeFilter !== 'all' && item.status !== activeFilter) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        (item.suite?.toLowerCase().includes(q) ?? false) ||
        (item.file?.toLowerCase().includes(q) ?? false)
      )
    })

    return (
      <section
        class={classList('rf-test-report', props.class)}
        data-size={props.size}
        aria-label={props.label ?? 'Test report'}
      >
        <div class="rf-test-report-summary">
          <div class="rf-test-report-headline">
            <span class="rf-test-report-total">
              {counts.passed} / {cases.length} passed
            </span>
            {counts.failed > 0 && (
              <Badge color="red" size="compact">
                {counts.failed} failed
              </Badge>
            )}
            {counts.flaky > 0 && (
              <Badge color="amber" size="compact">
                {counts.flaky} flaky
              </Badge>
            )}
            {totalDuration > 0 && (
              <span class="rf-test-report-duration">{formatDurationMs(totalDuration)}</span>
            )}
          </div>
          <ProportionBar
            label="Test outcome distribution"
            showLegend={false}
            height={6}
            segments={[
              { id: 'passed', label: 'Passed', value: counts.passed, tone: 'success' },
              { id: 'flaky', label: 'Flaky', value: counts.flaky, tone: 'warning' },
              { id: 'failed', label: 'Failed', value: counts.failed, tone: 'danger' },
              { id: 'skipped', label: 'Skipped', value: counts.skipped, tone: 'neutral' },
            ]}
          />
        </div>

        <div class="rf-test-report-controls">
          <div class="rf-test-report-filters" role="group" aria-label="Filter test status">
            {filters.map((filter) => {
              const count = filter.id === 'all' ? cases.length : counts[filter.id]
              const active = activeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  class="rf-test-report-filter"
                  data-active={active ? 'true' : undefined}
                  aria-pressed={active ? 'true' : 'false'}
                  mix={on('click', () => {
                    activeFilter = filter.id
                    void handle.update()
                  })}
                >
                  <span>{filter.label}</span>
                  <span class="rf-test-report-filter-count">{count}</span>
                </button>
              )
            })}
          </div>
          <div class="rf-test-report-search">
            <Icon name="search" size={13} class="rf-test-report-search-icon" />
            <input
              type="search"
              class="rf-test-report-search-input"
              placeholder="Filter tests…"
              aria-label="Filter tests"
              value={query}
              mix={on('input', (event) => {
                const target = event.currentTarget
                query = target instanceof HTMLInputElement ? target.value : ''
                void handle.update()
              })}
            />
          </div>
        </div>

        <ul class="rf-test-report-list">
          {visible.length === 0 ? (
            <li class="rf-test-report-empty">No matching test cases.</li>
          ) : (
            visible.map((item) => {
              const expandable = hasDetails(item)
              const isOpen = expandable && expanded.has(item.id)
              return (
                <li key={item.id} class="rf-test-report-item" data-status={item.status}>
                  {expandable ? (
                    <button
                      type="button"
                      class="rf-test-report-row"
                      aria-expanded={isOpen ? 'true' : 'false'}
                      mix={on('click', () => toggleCase(item.id))}
                    >
                      <TestStatusIcon status={item.status} />
                      <span class="rf-test-report-names">
                        {item.suite && <span class="rf-test-report-suite">{item.suite}</span>}
                        <span class="rf-test-report-name">{item.name}</span>
                      </span>
                      {item.flakyRate !== undefined && (
                        <Badge color="amber" size="compact">
                          {Math.round(item.flakyRate)}% flaky
                        </Badge>
                      )}
                      {item.durationMs !== undefined && (
                        <span class="rf-test-report-time">{formatDurationMs(item.durationMs)}</span>
                      )}
                      <span
                        class="rf-test-report-chevron"
                        data-open={isOpen ? 'true' : 'false'}
                        aria-hidden="true"
                      >
                        <Icon name="chevron-right" size={13} />
                      </span>
                    </button>
                  ) : (
                    <div class="rf-test-report-row" data-static="true">
                      <TestStatusIcon status={item.status} />
                      <span class="rf-test-report-names">
                        {item.suite && <span class="rf-test-report-suite">{item.suite}</span>}
                        <span class="rf-test-report-name">{item.name}</span>
                      </span>
                      {item.flakyRate !== undefined && (
                        <Badge color="amber" size="compact">
                          {Math.round(item.flakyRate)}% flaky
                        </Badge>
                      )}
                      {item.durationMs !== undefined && (
                        <span class="rf-test-report-time">{formatDurationMs(item.durationMs)}</span>
                      )}
                    </div>
                  )}

                  {isOpen && (
                    <div class="rf-test-report-detail">
                      {item.message && <p class="rf-test-report-message">{item.message}</p>}
                      {(item.expected !== undefined || item.actual !== undefined) && (
                        <div class="rf-test-report-diff">
                          {item.expected !== undefined && (
                            <div class="rf-test-report-diff-line" data-kind="expected">
                              <span class="rf-test-report-diff-prefix">- Expected:</span>
                              <code>{item.expected}</code>
                            </div>
                          )}
                          {item.actual !== undefined && (
                            <div class="rf-test-report-diff-line" data-kind="actual">
                              <span class="rf-test-report-diff-prefix">+ Actual:</span>
                              <code>{item.actual}</code>
                            </div>
                          )}
                        </div>
                      )}
                      {item.stack && <pre class="rf-test-report-stack">{item.stack}</pre>}
                      {props.onInspectLog && (
                        <div class="rf-test-report-detail-actions">
                          <Button
                            variant="secondary"
                            size="compact"
                            mix={on('click', () => props.onInspectLog?.(item))}
                          >
                            Inspect log
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </section>
    )
  }
}

function TestStatusIcon(handle: Handle<{ status: TestCaseStatus }>) {
  return () => {
    const { status } = handle.props
    return (
      <span class="rf-test-report-status" data-status={status} aria-label={status}>
        {status === 'passed' && <Icon name="check" size={11} />}
        {status === 'failed' && <Icon name="x" size={11} />}
        {status === 'flaky' && <Icon name="rotate-ccw" size={11} />}
        {status === 'skipped' && <Icon name="minus" size={11} />}
      </span>
    )
  }
}
