import { Button, fluidHover, InputCopy, Tabs } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import { SystemInstallation } from './install-prompt.tsx'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

type DemoKind = 'tabs' | 'menu' | 'copy' | 'press'
const labels = ['Overview', 'Activity', 'Settings']
const rows = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash']
const counts = [12, 3, 48, 210, 7]

export function SkillComparison(handle: Handle<{ kind: DemoKind }>) {
  let selections = [0, 0]
  let hovered = -1
  let previewCopySide: number | null = null
  let playing = true
  let inside = false
  let focused = false
  let visible = false
  let reduced = false
  let beat = 0
  let cursor = { x: 0, y: 0, show: false, down: false }
  let root: HTMLElement | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let mounted = true
  const canPlay = () =>
    mounted && !document.hidden && playing && visible && !inside && !focused && !reduced
  function pause() {
    clearTimeout(timer)
    cursor.show = false
    cursor.down = false
    hovered = -1
    previewCopySide = null
    root
      ?.querySelectorAll('[data-demo-pressed]')
      .forEach((node) => node.removeAttribute('data-demo-pressed'))
    handle.update()
  }
  function schedule() {
    clearTimeout(timer)
    if (canPlay()) timer = setTimeout(tick, 650)
    else pause()
  }
  async function tick() {
    if (!canPlay() || !root) return
    const side = Math.floor(beat / 6) % 2
    const index = [1, 2, 0][Math.floor(beat / 2) % 3]
    const selector = handle.props.kind === 'tabs' ? '[role="tab"]' : 'button'
    const nodes = root.querySelectorAll<HTMLElement>(`[data-comparison-side="${side}"] ${selector}`)
    const node = nodes[index % nodes.length]
    if (!node) return
    const box = node.getBoundingClientRect()
    const container = root.getBoundingClientRect()
    cursor = {
      x: box.left - container.left + box.width * 0.6,
      y: box.top - container.top + box.height * 0.65,
      show: true,
      down: beat % 2 === 1,
    }
    if (handle.props.kind === 'menu' && side === 1) hovered = index
    if (beat % 2) {
      if (handle.props.kind === 'tabs' || handle.props.kind === 'menu') selections[side] = index
      if (handle.props.kind === 'press') node.setAttribute('data-demo-pressed', '')
      if (handle.props.kind === 'copy') previewCopySide = side
      // Scripted feedback never writes to the visitor's clipboard.
    } else {
      previewCopySide = null
      root
        .querySelectorAll('[data-demo-pressed]')
        .forEach((item) => item.removeAttribute('data-demo-pressed'))
    }
    beat = (beat + 1) % 12
    await handle.update()
    schedule()
  }
  const lifecycle = ref<HTMLElement>((element, signal) => {
    root = element
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    reduced = media.matches
    media.addEventListener(
      'change',
      () => {
        reduced = media.matches
        schedule()
      },
      { signal },
    )
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        schedule()
      },
      { threshold: 0.35 },
    )
    observer.observe(element)
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) pause()
        else schedule()
      },
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        mounted = false
        clearTimeout(timer)
        observer.disconnect()
      },
      { once: true },
    )
  })
  const choose = (side: number, index: number) => {
    selections[side] = index
    handle.update()
  }
  function sideContent(side: number) {
    const generic = side === 0
    if (handle.props.kind === 'tabs')
      return generic ? (
        <div class="skill-generic-tabs" role="tablist" aria-label="Generic tabs">
          {labels.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selections[0] === i}
              mix={on('click', () => choose(0, i))}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <Tabs
          label="Reflow tabs"
          value={labels[selections[1]]}
          onValueChange={(value) => choose(1, labels.indexOf(value))}
          items={labels.map((label) => ({ value: label, label }))}
        />
      )
    if (handle.props.kind === 'menu')
      return (
        <div
          class="skill-menu"
          data-generic={generic || undefined}
          mix={
            !generic &&
            fluidHover({
              highlightedSelector: '[data-highlighted]',
              selectedSelector: '[aria-pressed="true"]',
            })
          }
        >
          {!generic && (
            <>
              <span data-rf-hover-layer="" class="rf-highlight rf-hover-highlight" />
              <span data-rf-selection-layer="" class="rf-highlight rf-selection-highlight" />
            </>
          )}
          {rows.map((label, i) => (
            <button
              key={label}
              type="button"
              data-rf-hover-item=""
              data-highlighted={(!generic && hovered === i) || undefined}
              aria-pressed={selections[side] === i}
              mix={[
                on('click', () => choose(side, i)),
                on('pointerenter', () => {
                  if (!generic) {
                    hovered = i
                    handle.update()
                  }
                }),
                on('focus', () => {
                  if (!generic) {
                    hovered = i
                    handle.update()
                  }
                }),
              ]}
            >
              <span class="skill-menu-label">
                <span>{label}</span>
                <span aria-hidden="true">{label}</span>
              </span>
              <small>{counts[i]}</small>
              <span class="skill-check" aria-hidden="true">
                {selections[side] === i ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )
    if (handle.props.kind === 'copy')
      return generic ? (
        <div class="skill-generic-copy">
          <code>skills/reflow/SKILL.md</code>
          <button
            type="button"
            mix={on('click', async () => {
              try {
                await navigator.clipboard.writeText('skills/reflow/SKILL.md')
                choose(0, 1)
              } catch {
                choose(0, 2)
                playCopyError()
              }
            })}
          >
            {selections[0] === 1 || previewCopySide === 0
              ? 'Copied!'
              : selections[0] === 2
                ? 'Failed'
                : 'Copy'}
          </button>
        </div>
      ) : (
        <InputCopy
          value="skills/reflow/SKILL.md"
          onCopy={playCopySuccess}
          align="left"
          data-demo-copied={previewCopySide === 1 || undefined}
        />
      )
    return (
      <div class="skill-press">
        {['Skip', 'Continue'].map((label, i) =>
          generic ? (
            <button
              key={label}
              type="button"
              class="skill-generic-button"
              data-wide={i === 1 || undefined}
            >
              {label}
            </button>
          ) : (
            <Button
              key={label}
              size={i === 0 ? 'compact' : 'default'}
              style={{ width: i === 1 ? '100%' : undefined }}
            >
              {label}
            </Button>
          ),
        )}
      </div>
    )
  }
  return () => (
    <div class="skill-demo-shell">
      <div
        class="skill-comparison"
        data-kind={handle.props.kind}
        mix={[
          lifecycle,
          on('pointerenter', () => {
            inside = true
            pause()
          }),
          on('pointerleave', () => {
            inside = false
            schedule()
          }),
          on('focusin', (event) => {
            focused = (event.target as HTMLElement).matches(':focus-visible')
            schedule()
          }),
          on('focusout', (event) => {
            if (!root?.contains(event.relatedTarget as Node | null)) {
              focused = false
              schedule()
            }
          }),
        ]}
      >
        {[0, 1].map((side) => (
          <div class="skill-side" key={side}>
            <div class="skill-stage" data-comparison-side={side}>
              {sideContent(side)}
            </div>
            <div class="skill-caption">
              {side === 0 ? '❌ Generic AI output' : '✓ With the skill'}
            </div>
          </div>
        ))}
        <span
          class="skill-cursor"
          aria-hidden="true"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${cursor.down ? 0.85 : 1})`,
            opacity: cursor.show ? 1 : 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="m4 4 7.07 17 2.51-7.39L21 11.07z" />
          </svg>
        </span>
      </div>
      <div class="skill-playback">
        <button
          type="button"
          aria-label="Replay demonstration"
          mix={on('click', () => {
            beat = 0
            selections = [0, 0]
            playing = true
            schedule()
            handle.update()
          })}
        >
          ↻ Replay
        </button>
        <button
          type="button"
          aria-pressed={!playing}
          mix={on('click', () => {
            playing = !playing
            schedule()
            handle.update()
          })}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  )
}

export const SkillPage = clientEntry(import.meta.url, function SkillPage() {
  return () => (
    <div class="skill-page">
      <SystemInstallation skill />
      <section class="site-doc-section">
        <h2>What it does</h2>
        <ol class="skill-timeline">
          <li>
            <strong>Reads your stack</strong>
            <p>Identifies your Remix setup, existing components, and conventions.</p>
          </li>
          <li>
            <strong>Suggests improvements</strong>
            <p>Starts with the layout, feedback, and motion your users will notice.</p>
          </li>
          <li>
            <strong>Aligns your UI</strong>
            <p>Uses the Reflow components that fit and applies their shared design rules.</p>
          </li>
        </ol>
      </section>
      <section class="site-doc-section">
        <h2>What it knows</h2>
        <p>
          The skill records the interaction rules, values, and edge cases behind the components. It
          covers stable label widths, fluid hover, fixed-pixel button presses, accessible form
          controls, theme tokens, and interruptible motion. Read it at{' '}
          <code>skills/reflow/SKILL.md</code>.
        </p>
      </section>
      <section class="site-doc-section">
        <h2>Examples</h2>
        <p>Watch each demonstration, or move your pointer inside to try it yourself.</p>
        {(
          [
            ['tabs', 'Tabs', 'Active labels gain weight while neighboring tabs stay in place.'],
            ['menu', 'Menu', 'One highlight moves between the items under your pointer.'],
            ['copy', 'Copy field', 'Click anywhere in the field to copy its value.'],
            ['press', 'Button press', 'The surface contracts by one pixel on every side.'],
          ] as const
        ).map(([kind, title, description]) => (
          <section class="skill-example" key={kind}>
            <h3>{title}</h3>
            <p>{description}</p>
            <SkillComparison kind={kind} />
          </section>
        ))}
      </section>
    </div>
  )
})
