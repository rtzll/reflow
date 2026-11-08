import { on, type Handle } from 'remix/component'
import { CarouselDots } from '@rtzll/reflow'

const slides = ['Inbox', 'Drafts', 'Sent', 'Archive']
const slideNames = (count: number) =>
  Array.from({ length: count }, (_, index) => slides[index] ?? `Slide ${index + 1}`)

export function CarouselExample(
  handle: Handle<{ count?: number; autoplay?: boolean; duration?: number }>,
) {
  let index = 0
  let direction = 1
  let paused = false

  return () => {
    const { count = 4, autoplay, duration = 3000 } = handle.props
    const names = slideNames(count)
    const active = index % names.length
    return (
      <div class="example-carousel">
        <div
          class="example-carousel-card"
          mix={[
            on('pointerenter', () => {
              paused = true
              handle.update()
            }),
            on('pointerleave', () => {
              paused = false
              handle.update()
            }),
          ]}
        >
          <span key={active} style={{ '--slide-from': `${direction * 12}px` }}>
            {names[active]}
          </span>
        </div>
        <CarouselDots
          count={names.length}
          current={active}
          labels={names.map((name) => `Show ${name}`)}
          autoplay={autoplay ? { duration, paused } : undefined}
          onChange={(value) => {
            direction = value < active && !(active === names.length - 1 && value === 0) ? -1 : 1
            index = value
            handle.update()
          }}
        />
      </div>
    )
  }
}

export function carouselExampleCode(count = 4, autoplay = false) {
  return `const slides = ${JSON.stringify(slideNames(count))}
let index = 0${autoplay ? '\nlet paused = false' : ''}
const selectSlide = (value: number) => { index = value; handle.update() }

<div style={{ display: 'grid', justifyItems: 'center', gap: '12px' }}>
  <div style={{ display: 'grid', placeItems: 'center', width: '160px', height: '160px', border: '1px solid var(--rf-border)', borderRadius: 'var(--rf-panel-radius)' }}${
    autoplay
      ? ` mix={[
    on('pointerenter', () => { paused = true; handle.update() }),
    on('pointerleave', () => { paused = false; handle.update() }),
  ]}`
      : ''
  }>
    {slides[index]}
  </div>
  <CarouselDots count={slides.length} current={index} onChange={selectSlide}
    labels={slides.map((name) => 'Show ' + name)}${autoplay ? '\n    autoplay={{ duration: 3000, paused }}' : ''} />
</div>`
}
