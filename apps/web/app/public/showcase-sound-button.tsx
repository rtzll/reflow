import type { Handle } from 'remix/component'

export function ShowcaseSoundButton(handle: Handle<{ enabled: boolean }>) {
  return () => (
    <button
      class="site-icon-button site-sound"
      type="button"
      data-site-sound=""
      aria-label="Showcase sound"
      aria-pressed={handle.props.enabled}
      title={handle.props.enabled ? 'Mute showcase sound' : 'Enable showcase sound'}
      disabled
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H3v6h3l5 4Z" />
        <path class="site-sound-waves" d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" />
        <path class="site-sound-muted" d="m16 9 5 6m0-6-5 6" />
      </svg>
    </button>
  )
}
