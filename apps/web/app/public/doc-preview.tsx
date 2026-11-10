import type { ExampleImages } from '../assets.ts'
import { clientEntry, on, ref, type Handle, type RemixNode } from 'remix/component'
import { Icon, Switch } from '@rtzll/reflow'
import { Example } from './examples.tsx'
import { PreviewInspector } from './preview-inspector.tsx'
import { documentationCode, playgroundFragment } from './documentation-code.ts'
import { ComponentDemo } from './component-demos.tsx'
import { playCopyError } from './showcase-sound.ts'
import { initialPlayground, PlaygroundExample, type PlaygroundValues } from './doc-playground.tsx'

const sharedPlaygroundDefaults = new Set([
  'color-picker',
  'combobox',
  'command-menu',
  'date-picker',
  'dropdown',
  'input-message',
  'sidebar',
  'slider',
  'thinking-steps',
  'toaster',
  'drawer',
  'code-block',
  'citation',
  'avatar',
  'chat-layout',
])

interface DocPreviewProps {
  slug: string
  variant?: string
  images: ExampleImages
  code: string
  initialCode?: boolean
}

export function highlightedCode(code: string): RemixNode[] {
  const tokens = code.split(
    /(\/\/[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:import|from|const|let|return|function|true|false|null|undefined|async|await)\b|\b\d+(?:\.\d+)?\b|<\/?[A-Z][\w.]*)/g,
  )
  return tokens.map((token, index) => {
    const kind = token.startsWith('//')
      ? 'comment'
      : /^["']/.test(token)
        ? 'string'
        : /^<\/?[A-Z]/.test(token)
          ? 'tag'
          : /^(?:import|from|const|let|return|function|true|false|null|undefined|async|await)$/.test(
                token,
              )
            ? 'keyword'
            : /^\d/.test(token)
              ? 'number'
              : undefined
    return kind ? (
      <span key={index} class={`doc-token-${kind}`}>
        {token}
      </span>
    ) : (
      token
    )
  })
}

export const DocPreview = clientEntry(
  import.meta.url,
  function DocPreview(handle: Handle<DocPreviewProps>) {
    let codeVisible = handle.props.initialCode ?? false
    let ready = false
    let playground: PlaygroundValues | undefined =
      !handle.props.variant && sharedPlaygroundDefaults.has(handle.props.slug)
        ? initialPlayground(handle.props.slug)
        : undefined
    const listenPlayground = ref((_element, signal) => {
      ready = true
      handle.update()
      if (handle.props.variant) return
      window.addEventListener(
        'reflow:playground',
        ((event: CustomEvent<{ slug: string; values: PlaygroundValues }>) => {
          if (event.detail.slug !== handle.props.slug) return
          playground = event.detail.values
          revision++
          handle.update()
        }) as EventListener,
        { signal },
      )
    })
    function changeTab(next: boolean) {
      codeVisible = next
      if (!handle.props.variant) {
        const url = new URL(location.href)
        if (next) url.searchParams.set('view', 'code')
        else url.searchParams.delete('view')
        history.replaceState(null, '', url)
      }
      handle.update()
    }
    let inspect = false
    let revision = 0
    // A streaming example reports whether it is playing, paused or finished;
    // the header button then plays, pauses and replays it, as in the
    // reference. Other examples keep a plain replay.
    let playback: 'playing' | 'paused' | 'finished' | undefined
    let stage: HTMLElement | null = null
    const trackPlayback = ref((element, signal) => {
      if (!(element instanceof HTMLElement)) return
      stage = element
      element.addEventListener(
        'reflow:playback',
        ((event: CustomEvent<{ state: 'playing' | 'paused' | 'finished' }>) => {
          playback = event.detail.state
          handle.update()
        }) as EventListener,
        { signal },
      )
    })
    function playOrReplay() {
      if (playback === 'playing' || playback === 'paused') {
        const action = playback === 'playing' ? 'pause' : 'play'
        stage
          ?.closest('[data-component-preview]')
          ?.dispatchEvent(new CustomEvent('reflow:playback-control', { detail: { action } }))
        return
      }
      playback = undefined
      revision++
      handle.update()
    }
    let copied = false
    let copyFailed = false
    return () => {
      const code = documentationCode(
        handle.props.slug,
        playground ? playgroundFragment(handle.props.slug, playground) : handle.props.code,
      )
      const playbackLabel =
        playback === 'playing'
          ? 'Pause example'
          : playback === 'paused'
            ? 'Play example'
            : 'Replay example'
      return (
        <div class="site-preview-card doc-preview" data-component-preview="" mix={listenPlayground}>
          <div class="doc-preview-toolbar">
            <div class="doc-preview-tabs" role="tablist" aria-label="Example view">
              <button
                type="button"
                disabled={!ready}
                role="tab"
                id={`${handle.id}-preview-tab`}
                aria-selected={!codeVisible}
                aria-controls={`${handle.id}-preview`}
                tabindex={codeVisible ? -1 : 0}
                mix={[
                  on('click', () => {
                    changeTab(false)
                  }),
                  on<HTMLElement, 'keydown'>('keydown', (event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                      event.preventDefault()
                      changeTab(true)
                      handle
                        .update()
                        .then(() => document.getElementById(`${handle.id}-code-tab`)?.focus())
                    }
                  }),
                ]}
              >
                Preview
              </button>
              <button
                type="button"
                disabled={!ready}
                role="tab"
                id={`${handle.id}-code-tab`}
                aria-selected={codeVisible}
                aria-controls={`${handle.id}-code`}
                tabindex={codeVisible ? 0 : -1}
                mix={[
                  on('click', () => {
                    changeTab(true)
                  }),
                  on<HTMLElement, 'keydown'>('keydown', (event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                      event.preventDefault()
                      changeTab(false)
                      handle
                        .update()
                        .then(() => document.getElementById(`${handle.id}-preview-tab`)?.focus())
                    }
                  }),
                ]}
              >
                Code
              </button>
            </div>
            <div class="doc-preview-actions">
              {!codeVisible && (
                <Switch
                  label="Inspect"
                  disabled={!ready}
                  size="compact"
                  checked={inspect}
                  onCheckedChange={(value) => {
                    inspect = value
                    handle.update()
                  }}
                />
              )}
              <button
                type="button"
                disabled={!ready}
                class="site-icon-button"
                title={playbackLabel}
                aria-label={playbackLabel}
                mix={on('click', playOrReplay)}
              >
                <Icon
                  name={
                    playback === 'playing' ? 'pause' : playback === 'paused' ? 'play' : 'rotate-ccw'
                  }
                />
              </button>
            </div>
          </div>
          <div
            role="tabpanel"
            id={`${handle.id}-preview`}
            aria-labelledby={`${handle.id}-preview-tab`}
            hidden={codeVisible}
          >
            <div
              class="site-preview-stage doc-preview-stage"
              data-playground={!handle.props.variant ? '' : undefined}
              data-component={handle.props.slug}
              data-variant={handle.props.variant}
              data-inspecting={inspect ? '' : undefined}
              mix={trackPlayback}
            >
              <fieldset class="doc-example-content demo-hydration" disabled={!ready} key={revision}>
                {playground ? (
                  <PlaygroundExample
                    slug={handle.props.slug}
                    values={playground}
                    avatar={handle.props.images.sidebarAvatar}
                    samples={handle.props.images.code}
                  />
                ) : handle.props.variant ? (
                  <ComponentDemo
                    slug={handle.props.slug}
                    variant={handle.props.variant}
                    images={handle.props.images}
                  />
                ) : (
                  <Example slug={handle.props.slug} />
                )}
              </fieldset>
              {inspect && !codeVisible && (
                <PreviewInspector
                  key={revision}
                  contentSelector=".doc-example-content"
                  rulers={handle.props.slug !== 'sidebar' || !!handle.props.variant}
                />
              )}
            </div>
          </div>
          <div
            role="tabpanel"
            id={`${handle.id}-code`}
            aria-labelledby={`${handle.id}-code-tab`}
            hidden={!codeVisible}
            class="doc-code-panel"
          >
            <div class="doc-code-meta">
              <span>TSX</span>
              <button
                type="button"
                disabled={!ready}
                class="site-button site-button-ghost"
                mix={on('click', async () => {
                  try {
                    await navigator.clipboard.writeText(code)
                    copied = true
                    copyFailed = false
                  } catch {
                    copyFailed = true
                    playCopyError()
                  }
                  handle.update()
                })}
              >
                {copyFailed ? 'Copy failed' : copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
            <pre tabindex={0}>
              <code>{highlightedCode(code)}</code>
            </pre>
            <span role="status" class="site-sr-only">
              {copied ? 'Code copied.' : copyFailed ? 'Could not copy code.' : ''}
            </span>
          </div>
        </div>
      )
    }
  },
)
