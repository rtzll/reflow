import { clientEntry, on, type Handle } from 'remix/component'

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
  return `Build a Remix 3 application with Reflow, inspired by Fluid Functionalism. Use the Reflow workspace at https://github.com/rtzll/reflow. Read docs/development.md and skills/reflow/SKILL.md. Install the locked workspace dependencies with pnpm install --frozen-lockfile and run pnpm dev to inspect the examples. Use the reusable @rtzll/reflow package and its stylesheet, with Remix's component runtime and official UI primitives. Apply these showcase settings on the root element: ${settings}.${iconPreference} Reuse the documented components, preserve keyboard and form behavior, and respect reduced motion. Use the project's existing runtime dependencies.`
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
