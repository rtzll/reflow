// Deterministic relative time formatting with hydration-safe SSR fallback.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export function toTimestampMs(value: string | number | Date): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return Date.parse(value)
}

export function formatUtcTimestamp(ms: number): string {
  if (!Number.isFinite(ms)) return ''
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da} ${h}:${mi} UTC`
}

export function formatShortUtcDate(ms: number): string {
  if (!Number.isFinite(ms)) return ''
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const d = new Date(ms)
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

export function formatRelativeTime(targetMs: number, nowMs: number): string {
  if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs)) return ''
  const diff = targetMs - nowMs
  const abs = Math.abs(diff)
  const past = diff <= 0

  if (abs < 45_000) return 'just now'

  const unit = (n: number, suffix: string) => (past ? `${n}${suffix} ago` : `in ${n}${suffix}`)
  if (abs < HOUR) return unit(Math.max(1, Math.round(abs / MINUTE)), 'm')
  if (abs < DAY) return unit(Math.max(1, Math.round(abs / HOUR)), 'h')
  if (abs < WEEK) return unit(Math.max(1, Math.round(abs / DAY)), 'd')
  if (abs < MONTH) return unit(Math.max(1, Math.round(abs / WEEK)), 'w')
  if (abs < YEAR) return unit(Math.max(1, Math.round(abs / MONTH)), 'mo')
  return unit(Math.max(1, Math.round(abs / YEAR)), 'y')
}
