import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { prefersReducedMotion } from '@remix-run/ui/animation'
import { Button } from './button.tsx'
import { CarouselDots } from './carousel-dots.tsx'
import { Icon } from './icon.tsx'

export interface CarouselProps {
  /** Names the carousel, such as "Featured projects". */
  label: string
  /** The slides, one per child. */
  children?: RemixNode
  /** Names each slide, for its announcement and its dot. */
  slideLabels?: readonly string[]
  /** The current slide, when controlled by the parent. */
  index?: number
  defaultIndex?: number
  /** Called when a button, a dot, a drag, a scroll or autoplay changes the slide. */
  onIndexChange?: (index: number) => void
  /** Shows CarouselDots under the slides. Default true. */
  dots?: boolean
  /** Shows previous and next buttons. Default true. */
  controls?: boolean
  /** Moves on after this many milliseconds, timed and shown by the dots, with a button to pause. */
  autoplay?: { duration: number }
  /** Where a slide comes to rest. Default start. */
  align?: 'start' | 'center'
  size?: 'default' | 'compact'
  class?: string
}

interface Drag {
  pointer: number
  x: number
  left: number
  /** The slide the drag began on. */
  from: number
  started: boolean
  samples: { time: number; x: number }[]
}

// A mouse drag starts past this distance, so a click stays a click.
const dragThreshold = 6
// How far a release keeps travelling, in milliseconds of its speed.
const throwTime = 220

function slidesOf(children: RemixNode): RemixNode[] {
  const list = Array.isArray(children) ? children.flat(Infinity as 1) : [children]
  return list.filter((child) => child != null && child !== false && child !== '') as RemixNode[]
}

/**
 * Slides in a row on a real scroll container: touch, trackpads, the
 * keyboard and screen readers scroll it natively, and CSS scroll snap
 * brings each slide to rest. Mice can drag it, with momentum. Previous and
 * next buttons and CarouselDots follow the slide in view and move it;
 * autoplay runs through the dots and pauses while the carousel is pointed
 * at or focused, or with its pause button. It is a labelled carousel whose
 * slides read as "3 of 7", and it touches nothing outside its own element.
 */
export function Carousel(handle: Handle<CarouselProps>) {
  let viewport: HTMLElement | null = null
  let localIndex = handle.props.defaultIndex ?? 0
  let shownIndex = -1
  let hovered = false
  let focused = false
  let userPaused = false
  let drag: Drag | undefined
  let suppressClick = false
  // While a scroll we started is in flight, its scroll events do not move the index.
  let steering: number | undefined
  let steerTimer: ReturnType<typeof setTimeout> | undefined
  let frame = 0
  // How many slides can come to rest; with several in view, the last few
  // share the end. Zero until measured, which counts every slide.
  let reachable = 0
  handle.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(steerTimer)
      cancelAnimationFrame(frame)
    },
    { once: true },
  )

  const count = () => slidesOf(handle.props.children).length
  const stops = () => Math.min(count(), reachable || count())
  const current = () =>
    Math.min(Math.max(0, handle.props.index ?? localIndex), Math.max(0, stops() - 1))

  function slideAt(index: number) {
    return viewport?.querySelectorAll<HTMLElement>(':scope > .rf-carousel-slide')[index]
  }

  // Where a slide comes to rest, within the range the viewport can scroll.
  // Measured from the slide's box against the viewport's, so it holds in
  // either direction: right to left, scrollLeft runs from 0 down to minus
  // the scroll width.
  function restingLeft(slide: HTMLElement) {
    if (!viewport) return 0
    const style = getComputedStyle(viewport)
    const rtl = style.direction === 'rtl'
    const padding = parseFloat(style.scrollPaddingInlineStart) || 0
    const frame = viewport.getBoundingClientRect()
    const box = slide.getBoundingClientRect()
    const left =
      handle.props.align === 'center'
        ? viewport.scrollLeft + (box.left + box.width / 2) - (frame.left + frame.width / 2)
        : rtl
          ? viewport.scrollLeft + (box.right - frame.right) + padding
          : viewport.scrollLeft + (box.left - frame.left) - padding
    const max = viewport.scrollWidth - viewport.clientWidth
    return rtl ? Math.min(0, Math.max(-max, left)) : Math.min(max, Math.max(0, left))
  }

  function measure() {
    if (!viewport) return
    const slides = Array.from(viewport.querySelectorAll<HTMLElement>(':scope > .rf-carousel-slide'))
    // Not laid out in a row, such as without the stylesheet: every slide counts.
    if (slides.some((slide) => slide.offsetTop !== slides[0]!.offsetTop)) {
      if (reachable !== 0) {
        reachable = 0
        void handle.update()
      }
      return
    }
    const end = viewport.scrollWidth - viewport.clientWidth
    const last = slides.findIndex((slide) => Math.abs(restingLeft(slide)) >= end - 1)
    const next = last === -1 ? slides.length : last + 1
    if (next === reachable) return
    reachable = next
    void handle.update()
  }

  function scrollToSlide(index: number, smooth = true) {
    const slide = slideAt(index)
    if (!viewport || !slide) return
    steering = index
    clearTimeout(steerTimer)
    steerTimer = setTimeout(() => (steering = undefined), 900)
    viewport.scrollTo({
      left: restingLeft(slide),
      behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant',
    })
  }

  function select(index: number, scroll = true) {
    const next = Math.min(Math.max(0, index), Math.max(0, stops() - 1))
    if (scroll) scrollToSlide(next)
    if (next === current()) return
    localIndex = next
    handle.props.onIndexChange?.(next)
    void handle.update()
  }

  // The slide whose resting place is nearest a scroll position.
  function nearest(left: number) {
    if (!viewport) return 0
    let best = 0
    let distance = Infinity
    const slides = viewport.querySelectorAll<HTMLElement>(':scope > .rf-carousel-slide')
    slides.forEach((slide, index) => {
      const gap = Math.abs(restingLeft(slide) - left)
      if (gap < distance) {
        distance = gap
        best = index
      }
    })
    return best
  }

  function onScroll() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (!viewport || drag?.started) return
      if (steering !== undefined) return
      const index = nearest(viewport.scrollLeft)
      if (index !== current()) select(index, false)
    })
  }

  function endDrag(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId || !viewport) return
    const finished = drag
    drag = undefined
    if (!finished.started) return
    viewport.removeAttribute('data-dragging')
    suppressClick = true
    const recent = finished.samples.filter((sample) => sample.time > performance.now() - 100)
    const first = recent[0]
    const last = recent[recent.length - 1]
    const velocity =
      first && last && last.time > first.time ? (last.x - first.x) / (last.time - first.time) : 0
    // A throw travels on, but at most a view's worth of slides from where the
    // drag began: one at a time when a slide fills the view.
    const sample = slideAt(0)
    const perView = sample
      ? Math.max(1, Math.round(viewport.clientWidth / Math.max(1, sample.offsetWidth)))
      : 1
    const landed = nearest(viewport.scrollLeft - velocity * throwTime)
    select(Math.min(finished.from + perView, Math.max(finished.from - perView, landed)))
  }

  const viewportMix = ref((node, signal) => {
    if (!(node instanceof HTMLElement)) return
    viewport = node
    const options = { signal }
    node.addEventListener('scroll', onScroll, { signal, passive: true })
    const resize = new ResizeObserver(() => measure())
    resize.observe(node)
    signal.addEventListener('abort', () => resize.disconnect(), { once: true })
    measure()
    node.addEventListener(
      'scrollend',
      () => {
        steering = undefined
        clearTimeout(steerTimer)
        onScroll()
      },
      options,
    )
    node.addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        drag = {
          pointer: event.pointerId,
          x: event.clientX,
          left: node.scrollLeft,
          from: nearest(node.scrollLeft),
          started: false,
          samples: [{ time: performance.now(), x: event.clientX }],
        }
      },
      options,
    )
    node.addEventListener(
      'pointermove',
      (event) => {
        if (!drag || drag.pointer !== event.pointerId) return
        const dx = event.clientX - drag.x
        if (!drag.started) {
          if (Math.abs(dx) < dragThreshold) return
          drag.started = true
          node.setAttribute('data-dragging', '')
          window.getSelection()?.removeAllRanges()
          try {
            node.setPointerCapture(event.pointerId)
          } catch {
            // Synthetic pointers have nothing to capture.
          }
        }
        node.scrollLeft = drag.left - dx
        drag.samples.push({ time: performance.now(), x: event.clientX })
        if (drag.samples.length > 8) drag.samples.shift()
      },
      options,
    )
    // Links and images are draggable by default; a native drag would cancel
    // the pointer and take over the slides' drag, so the carousel keeps it.
    node.addEventListener('dragstart', (event) => event.preventDefault(), options)
    node.addEventListener('pointerup', endDrag, options)
    node.addEventListener('pointercancel', endDrag, options)
    // A drag that ends over a link does not follow it.
    node.addEventListener(
      'click',
      (event) => {
        if (!suppressClick) return
        suppressClick = false
        event.preventDefault()
        event.stopPropagation()
      },
      { capture: true, signal },
    )
    node.addEventListener('pointerdown', () => (suppressClick = false), { signal, capture: true })
    signal.addEventListener(
      'abort',
      () => {
        if (viewport === node) viewport = null
      },
      { once: true },
    )
  })

  return () => {
    const { label, children, slideLabels, size, autoplay, align = 'start' } = handle.props
    const slides = slidesOf(children)
    const total = slides.length
    const positions = stops()
    const index = current()
    // A controlled index set from outside brings its slide into view.
    if (shownIndex !== -1 && shownIndex !== index && steering !== index && !drag?.started)
      handle.queueTask(() => scrollToSlide(index))
    if (shownIndex === -1 && index > 0) handle.queueTask(() => scrollToSlide(index, false))
    shownIndex = index
    const paused = userPaused || hovered || focused
    const rotating = Boolean(autoplay) && !paused
    const showDots = handle.props.dots ?? true
    const showControls = handle.props.controls ?? true
    const names = slideLabels ?? []

    return (
      <section
        class={handle.props.class ? `rf-carousel ${handle.props.class}` : 'rf-carousel'}
        aria-roledescription="carousel"
        aria-label={label}
        data-density={size}
        data-align={align}
        mix={[
          on('pointerenter', (event) => {
            if (event.pointerType === 'touch') return
            hovered = true
            void handle.update()
          }),
          on('pointerleave', () => {
            hovered = false
            void handle.update()
          }),
          on('focusin', () => {
            if (focused) return
            focused = true
            void handle.update()
          }),
          on('focusout', (event) => {
            const next = event.relatedTarget
            if (next instanceof Node && event.currentTarget.contains(next)) return
            focused = false
            void handle.update()
          }),
        ]}
      >
        <div
          class="rf-carousel-viewport"
          tabIndex={0}
          aria-live={rotating ? 'off' : 'polite'}
          mix={viewportMix}
        >
          {slides.map((slide, position) => (
            <div
              key={position}
              class="rf-carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={
                names[position]
                  ? `${names[position]}, ${position + 1} of ${total}`
                  : `${position + 1} of ${total}`
              }
              data-current={position === index || undefined}
            >
              {slide}
            </div>
          ))}
        </div>
        {(showControls || showDots || autoplay) && positions > 1 && (
          <div class="rf-carousel-controls">
            {showControls && (
              <Button
                variant="ghost"
                size="icon-compact"
                aria-label="Previous slide"
                disabled={index === 0}
                mix={on('click', () => select(index - 1))}
              >
                <Icon name="chevron-left" />
              </Button>
            )}
            {showDots && (
              <CarouselDots
                count={positions}
                current={index}
                label={`Choose a slide in ${label}`}
                labels={Array.from({ length: positions }, (_, position) =>
                  names[position] ? `Show ${names[position]}` : `Show slide ${position + 1}`,
                )}
                autoplay={autoplay ? { duration: autoplay.duration, paused } : undefined}
                onChange={(next) => select(next)}
              />
            )}
            {showControls && (
              <Button
                variant="ghost"
                size="icon-compact"
                aria-label="Next slide"
                disabled={index === positions - 1}
                mix={on('click', () => select(index + 1))}
              >
                <Icon name="chevron-right" />
              </Button>
            )}
            {autoplay && (
              <Button
                variant="ghost"
                size="icon-compact"
                class="rf-carousel-play"
                aria-label={userPaused ? 'Play slides' : 'Pause slides'}
                mix={on('click', () => {
                  userPaused = !userPaused
                  void handle.update()
                })}
              >
                <Icon name={userPaused ? 'play' : 'pause'} />
              </Button>
            )}
          </div>
        )}
      </section>
    )
  }
}
