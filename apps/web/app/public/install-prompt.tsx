import { clientEntry, on, type Handle } from 'remix/component'
import { settingRows, sharedSettingsHref } from './site-settings.ts'

export const reflowInstallCommand = 'pnpm add --save-exact @rtzll/reflow@0.1.0 remix@3.2.0'

export function buildInstallPrompt() {
  const settings = ['theme', 'accent', 'shape', 'density', 'hover', 'font', 'fontWeight']
    .flatMap((key) => {
      const value = document.documentElement.dataset[key]
      return value ? [`${key}: ${value}`] : []
    })
    .join(', ')
  const icons = document.documentElement.dataset.icons
  const iconPreference = icons
    ? ` The showcase icon preference is ${icons}; use compatible icons or consumer-supplied SVGs if appropriate. Reflow does not require an icon package.`
    : ''
  return `Build a Remix 3 application with Reflow, inspired by Fluid Functionalism. Install the published package and its Remix peer dependency from your app's root with ${reflowInstallCommand}. Follow https://github.com/rtzll/reflow/blob/main/docs/integration.md to serve @rtzll/reflow/styles.css and enable Remix's browser runtime. Use the Reflow skill at https://github.com/rtzll/reflow/blob/main/skills/reflow/SKILL.md for component guidance. Apply these showcase settings on the root element: ${settings}.${iconPreference} Reuse the documented components, preserve keyboard and form behavior, and respect reduced motion. Use the project's existing runtime dependencies.`
}

export const InstallPromptButton = clientEntry(
  import.meta.url,
  function InstallPromptButton(handle: Handle<{ skill?: boolean; topic?: string }>) {
    let status = ''
    let timer: ReturnType<typeof setTimeout> | undefined
    handle.signal.addEventListener('abort', () => clearTimeout(timer), {
      once: true,
    })
    async function copy() {
      try {
        const prompt = handle.props.skill
          ? 'Use the Reflow skill from skills/reflow/SKILL.md in the Reflow repository. Copy its folder into the project’s .agents/skills/reflow directory, read it, inspect the current Remix 3 UI, and apply the relevant component and interaction guidance within the requested scope. Repository: https://github.com/rtzll/reflow.'
          : buildInstallPrompt() +
            (handle.props.topic
              ? ` Focus on the ${handle.props.topic} system documented at /docs/${handle.props.topic} in the Reflow showcase.`
              : '')
        await navigator.clipboard.writeText(prompt)
        status = 'Copied'
      } catch {
        status = 'Copy failed. Check clipboard access.'
      }
      if (handle.signal.aborted) return
      handle.update()
      clearTimeout(timer)
      timer = setTimeout(() => {
        status = ''
        handle.update()
      }, 2200)
    }
    return () => (
      <span class="site-copy-action">
        <button
          type="button"
          class={
            handle.props.skill || handle.props.topic
              ? 'site-button site-button-secondary'
              : 'site-button site-button-primary'
          }
          mix={on('click', copy)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <path d={status === 'Copied' ? 'm5 12 4 4L19 6' : 'M8 8V4h12v12h-4M4 8h12v12H4z'} />
          </svg>
          {status === 'Copied'
            ? 'Copied'
            : handle.props.skill || handle.props.topic
              ? 'Copy prompt'
              : 'Copy install prompt'}
        </button>
        <span class="site-sr-only" role="status">
          {status}
        </span>
      </span>
    )
  },
)

export function SystemInstallation(handle: Handle<{ topic?: string; skill?: boolean }>) {
  return () => (
    <section class="site-doc-install system-install">
      <div>
        <h2>Installation</h2>
        <p>
          {handle.props.skill
            ? 'Add the Reflow skill to your project so your coding agent can use its component and interaction guidance.'
            : 'One prompt for your coding agent to set up Reflow and use this system in Remix.'}
        </p>
      </div>
      <InstallPromptButton skill={handle.props.skill} topic={handle.props.topic} />
    </section>
  )
}

/** The current page with the settings that differ from the defaults. */
export function currentShareHref() {
  const settings = Object.fromEntries(
    settingRows.map((row) => [row.key, document.documentElement.dataset[row.key] ?? '']),
  )
  return sharedSettingsHref(location.href, settings)
}

/** Copies a link that opens the current page with these settings. */
export const ShareSettingsButton = clientEntry(
  import.meta.url,
  function ShareSettingsButton(handle: Handle) {
    let copied = false
    let timer: ReturnType<typeof setTimeout> | undefined
    handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
    async function copy() {
      try {
        await navigator.clipboard.writeText(currentShareHref())
        copied = true
      } catch {
        copied = false
      }
      if (handle.signal.aborted) return
      handle.update()
      clearTimeout(timer)
      timer = setTimeout(() => {
        copied = false
        handle.update()
      }, 2200)
    }
    return () => (
      <span class="site-copy-action">
        <button
          type="button"
          class="site-icon-button"
          aria-label="Copy link with these settings"
          title="Copy link with these settings"
          mix={on('click', copy)}
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
            {copied ? (
              <path d="m5 12 4 4L19 6" />
            ) : (
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            )}
          </svg>
        </button>
        <span class="site-sr-only" role="status">
          {copied ? 'Link copied' : ''}
        </span>
      </span>
    )
  },
)
