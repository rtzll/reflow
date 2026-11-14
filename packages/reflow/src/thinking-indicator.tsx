import { ref, type Handle } from 'remix/component'

const thinkingLabels = ['Thinking', 'Moonwalking', 'Planning', 'Refining']

export function ThinkingIndicator(
  handle: Handle<{ labels?: readonly string[]; interval?: number; showIcon?: boolean }>,
) {
  let position = 0
  const cycle = ref((_node, signal) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(
      () => {
        const count = handle.props.labels?.length || thinkingLabels.length
        position = (position + 1) % count
        handle.update()
      },
      Math.max(500, handle.props.interval ?? 4000),
    )
    signal.addEventListener('abort', () => clearInterval(timer), { once: true })
  })
  return () => {
    const labels = handle.props.labels?.length ? handle.props.labels : thinkingLabels
    const widestLabel = labels.reduce(
      (longest, label) => (label.length > longest.length ? label : longest),
      '',
    )
    return (
      <span class="rf-thinking" role="status" mix={cycle}>
        <span class="rf-basic-sr-only">Thinking…</span>
        {handle.props.showIcon !== false && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        )}
        <span class="rf-thinking-words" aria-hidden="true">
          <span class="rf-thinking-sizer">{widestLabel}</span>
          <span class="rf-thinking-word" key={position}>
            {labels[position % labels.length]}
          </span>
        </span>
      </span>
    )
  }
}
