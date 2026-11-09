import { prefersReducedMotion, spring } from '@remix-run/ui/animation'
import { ref } from 'remix/component'

// The reference's tiers are framer-motion springs of 80, 160 and 240ms. Framer
// reads `duration` as roughly the settle time; Remix reads it as a perceptual
// duration and settles later. These values are fitted so each Remix spring
// tracks the reference curve.
// The CSS tokens --rf-spring-* in foundations.css are the same curves.
export const motion = {
  fast: spring({ duration: 56, bounce: 0 }),
  moderate: spring({ duration: 110, bounce: 0 }),
  slow: spring({ duration: 176, bounce: 0.12 }),
}

export const motionExit = {
  fast: '60ms ease-out',
  moderate: '120ms ease-out',
  slow: '160ms ease-out',
} as const

export const revealPresets = {
  landing: { tier: 'slow', distance: 12, scale: 0.94, step: 100, scrollStart: 12, scroll: 120 },
  'landing-subtle': {
    tier: 'slow',
    distance: 8,
    scale: 0.98,
    step: 60,
    scrollStart: 8,
    scroll: 60,
  },
  product: { tier: 'moderate', distance: 0, scale: 1, step: 60 },
  'product-subtle': { tier: 'moderate', distance: 0, scale: 1, step: 40 },
} as const

export interface RevealOptions {
  /** Tie entrance and exit progress to the nearest scroll viewport. */
  scroll?: boolean
  preset?: keyof typeof revealPresets
  /** Position among siblings. The preset determines the stagger interval. */
  index?: number
  /** Override the delay in milliseconds. */
  delay?: number
}

/** Reveal an element once when it reaches the viewport. Server markup stays visible. */
export function reveal(options: RevealOptions = {}) {
  return ref((element, signal) => {
    if (!(element instanceof HTMLElement) || prefersReducedMotion()) return
    const preset = options.preset ? revealPresets[options.preset] : undefined
    if (options.scroll && CSS.supports('animation-timeline', 'view()')) {
      const scrollPreset =
        options.preset === 'landing-subtle'
          ? revealPresets['landing-subtle']
          : revealPresets.landing
      element.dataset.rfRevealScroll = ''
      element.style.setProperty('--rf-reveal-distance', `${scrollPreset.distance}px`)
      element.style.setProperty('--rf-reveal-scale', String(scrollPreset.scale))
      element.style.setProperty('--rf-reveal-scroll-start', `${scrollPreset.scrollStart}px`)
      element.style.setProperty('--rf-reveal-scroll-range', `${scrollPreset.scroll}px`)
      signal.addEventListener(
        'abort',
        () => {
          delete element.dataset.rfRevealScroll
        },
        { once: true },
      )
      return
    }
    const delay = Math.max(0, options.delay ?? (options.index ?? 0) * (preset?.step ?? 0))
    let animation: Animation | undefined
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      animation = element.animate(
        [
          {
            opacity: preset ? 0 : 0.3,
            translate: `0 ${preset?.distance ?? 6}px`,
            scale: preset?.scale ?? 1,
          },
          { opacity: 1, translate: '0 0', scale: 1 },
        ],
        {
          ...(preset
            ? motion[preset.tier]
            : { duration: 230, easing: 'cubic-bezier(.18,.8,.25,1)' }),
          delay,
          fill: 'backwards',
        },
      )
    })
    observer.observe(element)
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.addEventListener(
      'change',
      () => {
        if (reducedMotion.matches) {
          observer.disconnect()
          animation?.cancel()
        }
      },
      { signal },
    )
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        animation?.cancel()
      },
      { once: true },
    )
  })
}

export interface ScrollFadeOptions {
  orientation?: 'vertical' | 'horizontal' | 'both'
  distance?: number
}

/** Fade only edges with hidden content while retaining native scrolling. */
export function scrollFade({ orientation = 'vertical', distance = 20 }: ScrollFadeOptions = {}) {
  return ref<HTMLElement>((element, signal) => {
    if (!(element instanceof HTMLElement)) return
    element.dataset.rfScrollFade = orientation
    const size = Math.max(0, distance)
    let frame = 0
    function update() {
      frame = 0
      const maximumX = Math.max(0, element.scrollWidth - element.clientWidth)
      const positionX =
        getComputedStyle(element).direction === 'rtl'
          ? maximumX + element.scrollLeft
          : element.scrollLeft
      const left = Math.min(size, positionX)
      const right = Math.min(size, maximumX - positionX)
      const top = Math.min(size, element.scrollTop)
      const bottom = Math.min(size, element.scrollHeight - element.clientHeight - element.scrollTop)
      for (const [edge, value] of Object.entries({ left, right, top, bottom })) {
        element.style.setProperty(`--rf-scroll-fade-${edge}`, `${Math.max(0, value)}px`)
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const resize = new ResizeObserver(schedule)
    function observeContent() {
      resize.disconnect()
      resize.observe(element)
      for (const child of element.children) resize.observe(child)
      schedule()
    }
    const mutation = new MutationObserver(observeContent)
    mutation.observe(element, { childList: true, subtree: true, characterData: true })
    element.addEventListener('scroll', schedule, { passive: true, signal })
    observeContent()
    signal.addEventListener(
      'abort',
      () => {
        resize.disconnect()
        mutation.disconnect()
        cancelAnimationFrame(frame)
      },
      { once: true },
    )
  })
}
