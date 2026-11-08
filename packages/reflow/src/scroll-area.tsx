import { ref, type Handle, type RemixNode } from 'remix/component'
import { scrollFade } from './systems.ts'

export interface ScrollAreaProps {
  children: RemixNode
  label?: string
  orientation?: 'vertical' | 'horizontal' | 'both'
  fade?: boolean | number
  tabIndex?: number
  className?: string
  viewportClassName?: string
  style?: Record<string, string | number | undefined>
}

/** A native scroll viewport with a quiet, draggable desktop scrollbar. */
export function ScrollArea(handle: Handle<ScrollAreaProps>) {
  const viewportId = `${handle.id}-viewport`
  const lifecycle = ref<HTMLDivElement>((root, signal) => {
    const viewport = root.querySelector<HTMLDivElement>('.rf-scroll-viewport')!
    const content = root.querySelector<HTMLDivElement>('.rf-scroll-content')!
    const tracks = Array.from(root.querySelectorAll<HTMLElement>('[role="scrollbar"]'))
    let frame = 0
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    let hovered = false
    let dragging = false
    const finePointer = matchMedia('(pointer: fine)')

    function dimensions(horizontal: boolean) {
      const visible = horizontal ? viewport.clientWidth : viewport.clientHeight
      const total = horizontal ? viewport.scrollWidth : viewport.scrollHeight
      const maximum = Math.max(0, total - visible)
      const rtl = horizontal && getComputedStyle(viewport).direction === 'rtl'
      const position = horizontal
        ? rtl
          ? maximum + viewport.scrollLeft
          : viewport.scrollLeft
        : viewport.scrollTop
      return { visible, total, maximum, position, rtl }
    }

    function scroll(horizontal: boolean, position: number) {
      const state = dimensions(horizontal)
      const clamped = Math.max(0, Math.min(position, state.maximum))
      if (horizontal) viewport.scrollLeft = state.rtl ? clamped - state.maximum : clamped
      else viewport.scrollTop = clamped
    }

    function update() {
      frame = 0
      for (const track of tracks) {
        const horizontal = track.dataset.orientation === 'horizontal'
        const state = dimensions(horizontal)
        track.hidden = state.maximum < 1
        track.setAttribute('aria-valuemax', String(Math.round(state.maximum)))
        track.setAttribute('aria-valuenow', String(Math.round(state.position)))
        const length = (horizontal ? track.clientWidth : track.clientHeight) - 8
        const thumbSize = Math.min(
          length,
          Math.max(24, (length * state.visible) / Math.max(1, state.total)),
        )
        const start = 4 + ((length - thumbSize) * state.position) / Math.max(1, state.maximum)
        const thumb = track.firstElementChild as HTMLElement
        thumb.style[horizontal ? 'width' : 'height'] = `${thumbSize}px`
        thumb.style[horizontal ? 'left' : 'top'] = `${start}px`
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    function reveal() {
      root.dataset.scrollVisible = ''
      clearTimeout(hideTimer)
    }

    function hideLater() {
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        if (!hovered && !dragging && !root.matches(':focus-within'))
          delete root.dataset.scrollVisible
      }, 700)
    }

    for (const track of tracks) {
      const horizontal = track.dataset.orientation === 'horizontal'
      let pointer = -1
      let start = 0
      let position = 0
      track.addEventListener(
        'pointerdown',
        (event) => {
          if (event.button !== 0) return
          const state = dimensions(horizontal)
          if (!state.maximum) return
          event.preventDefault()
          reveal()
          dragging = true
          root.dataset.scrollDragging = ''
          pointer = event.pointerId
          const coordinate = horizontal ? event.clientX : event.clientY
          const thumb = track.firstElementChild as HTMLElement
          const thumbBox = thumb.getBoundingClientRect()
          const insideThumb = horizontal
            ? coordinate >= thumbBox.left && coordinate <= thumbBox.right
            : coordinate >= thumbBox.top && coordinate <= thumbBox.bottom
          if (!insideThumb) {
            const box = track.getBoundingClientRect()
            const length = (horizontal ? track.clientWidth : track.clientHeight) - 8
            const thumbSize = horizontal ? thumbBox.width : thumbBox.height
            scroll(
              horizontal,
              ((coordinate - (horizontal ? box.left : box.top) - 4 - thumbSize / 2) /
                Math.max(1, length - thumbSize)) *
                state.maximum,
            )
          }
          start = coordinate
          position = dimensions(horizontal).position
          track.setPointerCapture(event.pointerId)
          schedule()
        },
        { signal },
      )
      track.addEventListener(
        'pointermove',
        (event) => {
          if (event.pointerId !== pointer) return
          const state = dimensions(horizontal)
          const thumb = track.firstElementChild as HTMLElement
          const travel =
            (horizontal
              ? track.clientWidth - thumb.offsetWidth
              : track.clientHeight - thumb.offsetHeight) - 8
          const delta = (horizontal ? event.clientX : event.clientY) - start
          scroll(horizontal, position + (delta / Math.max(1, travel)) * state.maximum)
        },
        { signal },
      )
      function endDrag() {
        pointer = -1
        dragging = false
        delete root.dataset.scrollDragging
        hideLater()
      }
      track.addEventListener('lostpointercapture', endDrag, { signal })
      track.addEventListener(
        'pointerup',
        (event) => {
          if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId)
          endDrag()
        },
        { signal },
      )
      track.addEventListener(
        'keydown',
        (event) => {
          const state = dimensions(horizontal)
          const moves: Record<string, number> = {
            ArrowUp: -40,
            ArrowLeft: -40,
            ArrowDown: 40,
            ArrowRight: 40,
            PageUp: -state.visible,
            PageDown: state.visible,
          }
          if (event.key in moves) scroll(horizontal, state.position + moves[event.key])
          else if (event.key === 'Home') scroll(horizontal, 0)
          else if (event.key === 'End') scroll(horizontal, state.maximum)
          else return
          event.preventDefault()
        },
        { signal },
      )
    }

    viewport.addEventListener(
      'scroll',
      () => {
        schedule()
        reveal()
        hideLater()
      },
      { signal, passive: true },
    )
    root.addEventListener(
      'pointerenter',
      () => {
        hovered = true
        reveal()
      },
      { signal },
    )
    root.addEventListener(
      'pointerleave',
      () => {
        hovered = false
        hideLater()
      },
      { signal },
    )
    root.addEventListener('focusin', reveal, { signal })
    root.addEventListener('focusout', hideLater, { signal })
    const resize = new ResizeObserver(schedule)
    resize.observe(viewport)
    resize.observe(content)
    const mutation = new MutationObserver(schedule)
    mutation.observe(content, { childList: true, characterData: true, subtree: true })
    finePointer.addEventListener('change', schedule, { signal })
    root.dataset.scrollReady = ''
    schedule()
    signal.addEventListener(
      'abort',
      () => {
        resize.disconnect()
        mutation.disconnect()
        cancelAnimationFrame(frame)
        clearTimeout(hideTimer)
      },
      { once: true },
    )
  })

  return () => {
    const {
      orientation = 'vertical',
      label = 'Scrollable content',
      children,
      className = '',
      viewportClassName = '',
      style,
      fade,
      tabIndex = 0,
    } = handle.props
    const axes: ('vertical' | 'horizontal')[] =
      orientation === 'both' ? ['vertical', 'horizontal'] : [orientation]
    return (
      <div
        key={orientation}
        class={`rf-scroll-root ${className}`}
        data-orientation={orientation}
        style={style}
        mix={lifecycle}
      >
        <div
          id={viewportId}
          class={`rf-scroll-area rf-scroll-viewport ${viewportClassName}`}
          tabIndex={tabIndex}
          role="region"
          aria-label={label}
          mix={
            fade
              ? scrollFade({ orientation, distance: typeof fade === 'number' ? fade : undefined })
              : undefined
          }
        >
          <div class="rf-scroll-content">{children}</div>
        </div>
        {axes.map((axis) => (
          <div
            key={axis}
            class="rf-scroll-track"
            data-orientation={axis}
            role="scrollbar"
            tabIndex={tabIndex}
            aria-label={`${label} ${axis} scrollbar`}
            aria-controls={viewportId}
            aria-orientation={axis}
            aria-valuemin={0}
            aria-valuemax={0}
            aria-valuenow={0}
            hidden
          >
            <span class="rf-scroll-thumb" />
          </div>
        ))}
      </div>
    )
  }
}
