import { on, ref, type Handle } from 'remix/component'
import { Button, Icon, Sidebar, type IconName } from '@rtzll/reflow'

// The staged comparison follows Fluid Functionalism's MIT Sidebar documentation.
const groups: readonly { label: string; items: readonly { label: string; icon: IconName }[] }[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Chat', icon: 'message-circle' },
      { label: 'Agents', icon: 'brain' },
      { label: 'Knowledge', icon: 'book' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Runs', icon: 'play' },
      { label: 'Evals', icon: 'star' },
      { label: 'Settings', icon: 'settings' },
    ],
  },
]
const items = groups.flatMap((group) => group.items)
const durations = [900, 1600, 1600, 1600, 1600, 1500]

function Cursor(handle: Handle<{ x: number; y: number }>) {
  return () => (
    <svg
      class="doc-rail-cursor"
      style={{ transform: `translate(${handle.props.x}px, ${handle.props.y}px)` }}
      viewBox="0 0 24 24"
      width="18"
      height="18"
    >
      <path d="m4 4 7.07 17 2.51-7.39L21 11.07z" stroke-width="1.5" stroke-linejoin="round" />
    </svg>
  )
}

export function SidebarComparison(handle: Handle) {
  let phase = 0
  let paused = false
  let inView = false
  let reduced = false
  let timer: ReturnType<typeof setTimeout> | undefined
  function schedule() {
    clearTimeout(timer)
    if (paused || reduced || !inView) return
    timer = setTimeout(() => {
      phase = (phase + 1) % durations.length
      handle.update()
      schedule()
    }, durations[phase])
  }
  const observe = ref((node, signal) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        schedule()
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      reduced = preference.matches
      schedule()
      handle.update()
    }
    preference.addEventListener('change', sync, { signal })
    sync()
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        clearTimeout(timer)
      },
      { once: true },
    )
  })

  return () => {
    const index = reduced ? 1 : phase - 1
    const engaged = index >= 0 && index < 4
    const y = index < 3 ? 56 + index * 36 : 177
    return (
      <div
        class="doc-rail-comparison"
        mix={observe}
        data-paused={paused || undefined}
        data-reduced={reduced || undefined}
      >
        {!reduced && (
          <Button
            size="compact"
            variant="ghost"
            mix={on('click', () => {
              paused = !paused
              schedule()
              handle.update()
            })}
          >
            {paused ? 'Play comparison' : 'Pause comparison'}
          </Button>
        )}
        <div class="doc-rail-pair">
          <figure>
            <div class="doc-rail-scene" aria-hidden="true">
              <div class="doc-rail-icons">
                <span class="rf-sidebar-tile">A</span>
                {groups.map((group, groupIndex) => (
                  <div key={group.label}>
                    {group.items.map((item, i) => (
                      <span
                        key={item.label}
                        data-active={(engaged && index === groupIndex * 3 + i) || undefined}
                      >
                        <Icon name={item.icon} />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              {engaged && (
                <span key={index} class="doc-rail-tip" style={{ top: `${y - 10}px` }}>
                  {items[index].label}
                </span>
              )}
              {!reduced && <Cursor x={engaged ? 20 : 210} y={engaged ? y + 2 : 260} />}
            </div>
            <figcaption>Icon rail · one tooltip at a time</figcaption>
          </figure>
          <figure>
            <div class="doc-rail-scene" aria-hidden="true">
              <span class="doc-rail-trigger">
                <Icon name="panel-left" />
              </span>
              <div class="doc-rail-peek" data-engaged={engaged || undefined} inert>
                <Sidebar
                  fixed
                  defaultWidth={176}
                  minWidth={176}
                  activeHref="#chat"
                  header={
                    <div class="rf-sidebar-row">
                      <span class="rf-sidebar-tile">A</span>
                      <span>Aurora AI</span>
                    </div>
                  }
                  sections={groups.map((group) => ({
                    label: group.label,
                    items: group.items.map((item) => ({
                      label: item.label,
                      icon: <Icon name={item.icon} />,
                      href: '#' + item.label.toLowerCase(),
                      actions: item.label === 'Chat' ? <Icon name="more-vertical" /> : undefined,
                    })),
                  }))}
                >
                  {null}
                </Sidebar>
              </div>
              {!reduced && (
                <Cursor
                  x={index === 0 ? 26 : engaged ? 72 : 210}
                  y={index === 0 ? 26 : engaged ? 90 : 260}
                />
              )}
            </div>
            <figcaption>Peek on hover · both sections and all six labels</figcaption>
          </figure>
        </div>
      </div>
    )
  }
}
