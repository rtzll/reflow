import { Carousel } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

export const carouselSlides = [
  { title: 'Fluid motion', text: 'Springs that keep their momentum.', hue: '#6366f1' },
  { title: 'Shared hover', text: 'One highlight that glides between items.', hue: '#14b8a6' },
  { title: 'Keyboard care', text: 'Every control reachable, every focus visible.', hue: '#f59e0b' },
  {
    title: 'Yours to theme',
    text: 'Colours, shapes and type from a few variables.',
    hue: '#ec4899',
  },
  {
    title: 'Native first',
    text: 'Real dialogs, popovers and scrolling underneath.',
    hue: '#22c55e',
  },
  { title: 'Small by default', text: 'No runtime dependencies beyond Remix.', hue: '#3b82f6' },
]

function Slide(handle: Handle<{ title: string; text: string; hue: string; href?: string }>) {
  return () => {
    const { title, text, hue, href } = handle.props
    const body = (
      <>
        <strong>{title}</strong>
        <span>{text}</span>
      </>
    )
    return href ? (
      <a class="doc-carousel-slide" href={href} style={{ '--slide-hue': hue }}>
        {body}
      </a>
    ) : (
      <div class="doc-carousel-slide" style={{ '--slide-hue': hue }}>
        {body}
      </div>
    )
  }
}

export interface CarouselDemoProps {
  variant: string
  size?: 'default' | 'compact'
  perView?: number
  align?: 'start' | 'center'
  autoplay?: boolean
  dots?: boolean
  controls?: boolean
}

/** The Carousel docs demos, gallery card and playground. */
export function CarouselDemo(handle: Handle<CarouselDemoProps>) {
  return () => {
    const { variant, size } = handle.props
    const titles = (count: number) => carouselSlides.slice(0, count).map((slide) => slide.title)
    const slides = (count: number, links = false) =>
      carouselSlides
        .slice(0, count)
        .map((slide) => (
          <Slide key={slide.title} {...slide} href={links ? `#${slide.title}` : undefined} />
        ))
    switch (variant) {
      case 'gallery':
        return (
          <Carousel
            class="doc-carousel"
            label="Reflow highlights"
            slideLabels={titles(4)}
            autoplay={{ duration: 3200 }}
          >
            {slides(4)}
          </Carousel>
        )
      case 'several':
        return (
          <Carousel
            class="doc-carousel doc-carousel-per-3"
            label="Highlights"
            slideLabels={titles(6)}
            size={size}
          >
            {slides(6)}
          </Carousel>
        )
      case 'center':
        return (
          <Carousel
            class="doc-carousel doc-carousel-peek"
            label="Highlights"
            align="center"
            slideLabels={titles(5)}
            defaultIndex={1}
            size={size}
          >
            {slides(5)}
          </Carousel>
        )
      case 'autoplay':
        return (
          <Carousel
            class="doc-carousel"
            label="Highlights"
            slideLabels={titles(4)}
            autoplay={{ duration: 3000 }}
            size={size}
          >
            {slides(4)}
          </Carousel>
        )
      case 'links':
        return (
          <Carousel class="doc-carousel" label="Articles" slideLabels={titles(4)} size={size}>
            {slides(4, true)}
          </Carousel>
        )
      case 'playground':
        return (
          <Carousel
            class={`doc-carousel doc-carousel-per-${handle.props.perView ?? 1}`}
            label="Highlights"
            slideLabels={titles(6)}
            align={handle.props.align}
            autoplay={handle.props.autoplay ? { duration: 3000 } : undefined}
            dots={handle.props.dots}
            controls={handle.props.controls}
            size={size}
          >
            {slides(6)}
          </Carousel>
        )
      default:
        return (
          <Carousel class="doc-carousel" label="Highlights" slideLabels={titles(4)} size={size}>
            {slides(4)}
          </Carousel>
        )
    }
  }
}
