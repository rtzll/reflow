import { fluidHover } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

const folders = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash']
const cursorPath = [2, 210, 2, 210, 2, 210, 2]
const cursorOffsets = [0, 2, 4, 4.8, 5.6, 5.9, 6.2].map((time) => time / 6.2)

export function HoverComparison(handle: Handle<{ paused: boolean }>) {
  const lifecycle = ref<HTMLDivElement>((root, signal) => {
    const lists = [...root.querySelectorAll<HTMLElement>('.system-hover-comparison-list')]
    const cursors = lists.map((list) => list.querySelector<SVGElement>('svg')!)
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let elapsed = 0
    let previous: number | undefined
    let frame = 0
    let visible = false

    const highlight = (list: HTMLElement, row?: HTMLButtonElement) => {
      const current = list.querySelector('[data-highlighted]')
      if (current === row) return
      current?.removeAttribute('data-highlighted')
      row?.setAttribute('data-highlighted', '')
    }

    function animate(now: number) {
      frame = 0
      if (
        !visible ||
        document.hidden ||
        media.matches ||
        root.matches(':hover, :has(:focus-visible)')
      ) {
        previous = undefined
        root.removeAttribute('data-script-playing')
        lists.forEach((list) => highlight(list))
        return
      }
      if (!handle.props.paused && previous !== undefined) elapsed += now - previous
      previous = now
      const progress = (elapsed % 6200) / 6200
      const leg = cursorOffsets.findIndex((offset) => offset > progress)
      const fraction =
        (progress - cursorOffsets[leg - 1]) / (cursorOffsets[leg] - cursorOffsets[leg - 1])
      const eased = (1 - Math.cos(Math.PI * fraction)) / 2
      const y = cursorPath[leg - 1] + (cursorPath[leg] - cursorPath[leg - 1]) * eased
      root.setAttribute('data-script-playing', '')
      lists.forEach((list, side) => {
        cursors[side].style.transform = `translateY(${y}px)`
        const buttons = [...list.querySelectorAll('button')]
        const row =
          side === 0
            ? buttons.find(
                (button) => y >= button.offsetTop && y < button.offsetTop + button.offsetHeight,
              )
            : nearestRow(list, y)
        highlight(list, row)
      })
      schedule()
    }

    function schedule() {
      if (!frame && !signal.aborted) frame = requestAnimationFrame(animate)
    }

    function pointer(event: PointerEvent) {
      const list = event.currentTarget as HTMLElement
      root.removeAttribute('data-script-playing')
      lists.forEach((other) => {
        if (other !== list) highlight(other)
      })
      if (list === lists[1]) {
        highlight(list, nearestRow(list, event.clientY - list.getBoundingClientRect().top))
      } else highlight(list)
    }

    lists.forEach((list) => {
      list.addEventListener('pointermove', pointer, { signal, passive: true })
      list.addEventListener('pointerleave', () => highlight(list), { signal })
    })
    // Finish the scripted frame before handing control to pointer or keyboard.
    root.addEventListener('pointerenter', schedule, { signal })
    root.addEventListener('pointerleave', schedule, { signal })
    root.addEventListener('focusin', schedule, { signal })
    root.addEventListener('focusout', schedule, { signal })
    media.addEventListener('change', schedule, { signal })
    document.addEventListener('visibilitychange', schedule, { signal })
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        schedule()
      },
      { threshold: 0.35 },
    )
    observer.observe(root)
    signal.addEventListener(
      'abort',
      () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
      },
      { once: true },
    )
  })

  return () => (
    <div class="system-hover-comparison" mix={lifecycle}>
      {['Plain hover blinks at every gap', 'Fluid hover glides across the gaps'].map(
        (label, side) => (
          <div key={label}>
            <div
              class="system-hover-comparison-list"
              data-fluid={side === 1 || undefined}
              mix={side === 1 && fluidHover({ highlightedSelector: '[data-highlighted]' })}
            >
              {side === 1 && (
                <span class="rf-highlight system-hover-surface" data-rf-hover-layer="" />
              )}
              {folders.map((folder) => (
                <button key={folder} type="button" data-rf-hover-item="">
                  {folder}
                </button>
              ))}
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                <path d="m4 4 7.07 17 2.51-7.39L21 11.07z" />
              </svg>
            </div>
            <p>
              <span aria-hidden="true">{side === 0 ? '❌' : '✅'}</span> {label}
            </p>
          </div>
        ),
      )}
    </div>
  )
}

function nearestRow(list: HTMLElement, y: number) {
  const buttons = [...list.querySelectorAll('button')]
  const distance = (button: HTMLButtonElement) =>
    Math.abs(button.offsetTop + button.offsetHeight / 2 - y)
  return buttons.reduce((nearest, button) =>
    distance(button) < distance(nearest) ? button : nearest,
  )
}

export function HoverPlayback(handle: Handle<{ paused: boolean; onToggle: () => void }>) {
  return () => (
    <button
      type="button"
      aria-label={handle.props.paused ? 'Play' : 'Pause'}
      mix={on('click', () => handle.props.onToggle())}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d={handle.props.paused ? 'm8 5 12 7-12 7z' : 'M9 5v14m6-14v14'} />
      </svg>
    </button>
  )
}
