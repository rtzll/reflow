import { on, ref, type Handle } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'

export interface CarouselDotsProps {
  count: number
  current: number
  onChange: (index: number) => void
  labels?: readonly string[]
  label?: string
  progressDuration?: number
  autoplay?: { duration: number; paused?: boolean }
}

export function CarouselDots(handle: Handle<CarouselDotsProps>) {
  const trackVisibility = ref((element, signal) => {
    const observer = new IntersectionObserver(([entry]) =>
      element.toggleAttribute('data-rf-onscreen', entry?.isIntersecting ?? false),
    )
    observer.observe(element)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })
  return () => {
    const {
      count,
      current,
      onChange,
      labels,
      label = 'Choose a slide',
      progressDuration,
      autoplay,
    } = handle.props
    const duration = autoplay?.duration ?? progressDuration
    return (
      <nav
        class="rf-carousel-dots"
        aria-label={label}
        data-rf-autoplay={autoplay ? '' : undefined}
        data-rf-paused={autoplay?.paused ? '' : undefined}
        mix={[
          fluidHover({ axis: 'x', nearest: true, fastHover: true }),
          autoplay && trackVisibility,
        ]}
      >
        <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
        {Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => (
          <button
            key={index}
            type="button"
            data-rf-hover-item
            aria-label={labels?.[index] ?? `Go to slide ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
            mix={on('click', () => onChange(index))}
          >
            <span aria-hidden="true" class="rf-carousel-dot">
              {index === current ? (
                <span
                  style={{ animationDuration: `${duration && duration > 0 ? duration : 0}ms` }}
                  mix={autoplay && on('animationend', () => onChange((current + 1) % count))}
                />
              ) : null}
            </span>
          </button>
        ))}
      </nav>
    )
  }
}
