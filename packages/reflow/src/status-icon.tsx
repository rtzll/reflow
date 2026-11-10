/** The status glyphs Banner and toasts share. Internal: not exported from the package. */
export type StatusIconName = 'default' | 'info' | 'success' | 'warning' | 'error'

export function statusIcon(status: StatusIconName) {
  if (status === 'default') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4m0-4h.01" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none">
      {status === 'warning' ? (
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      ) : (
        <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      )}
      <g stroke="var(--rf-bg)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
        {status === 'success' ? (
          <path d="m8.5 12.25 2.5 2.5 4.5-5" />
        ) : status === 'warning' ? (
          <path d="M12 9.5v3.5M12 17h.01" />
        ) : status === 'error' ? (
          <path d="M12 7.5v5M12 16.5h.01" />
        ) : (
          <path d="M12 16.5v-5M12 7.5h.01" />
        )}
      </g>
    </svg>
  )
}
