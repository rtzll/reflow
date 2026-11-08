import { ref, type Handle } from 'remix/component'

// Ruler and box-model presentation follows Fluid Functionalism's Inspect mode.
const controls = [
  'button',
  'a[href]',
  'input',
  'textarea',
  'select',
  'summary',
  '[role="button"]',
  '[role="tab"]',
  '[role="option"]',
  '[role^="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="slider"]',
].join(', ')
const rulerCorner = 22
const labelStep = 32

function inspectTarget(hit: Element, content: Element) {
  const icon = hit.closest('svg')
  if (icon && content.contains(icon)) return icon
  const part = hit.closest('[data-slot], img, canvas, video')
  const owner = hit.closest(controls)
  if (owner && content.contains(owner) && (!part || part === owner || !owner.contains(part)))
    return owner
  return hit
}

function rectInFrame(element: Element, frame: DOMRect) {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { x: left - frame.left, y: top - frame.top, width, height }
}

function colorLabel(color: string) {
  const channels = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(color)
  return channels
    ? '#' +
        channels
          .slice(1)
          .map((value) => Number(value).toString(16).padStart(2, '0'))
          .join('')
    : color
}

function readTarget(target: Element, hit: Element, frame: DOMRect) {
  const bounds = rectInFrame(target, frame)
  const css = getComputedStyle(target)
  const text = [hit, target].find(
    (element) =>
      element.matches('input, textarea, select') ||
      Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      ),
  )
  const font = text ? getComputedStyle(text) : undefined
  return {
    ...bounds,
    name: target.getAttribute('data-slot') || target.tagName.toUpperCase(),
    display: css.display,
    padding: css.padding,
    margin: css.margin,
    radius: css.borderRadius,
    gap: css.gap !== 'normal' && parseFloat(css.gap) > 0 ? css.gap : undefined,
    insets: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft].join(' '),
    font: font && {
      size: font.fontSize,
      lineHeight: font.lineHeight,
      family: font.fontFamily.split(',')[0].replace(/["']/g, ''),
      axes:
        font.fontVariationSettings === 'normal'
          ? `wght ${font.fontWeight}`
          : font.fontVariationSettings.replaceAll('"', '').replace(/,\s*/g, ' · '),
      tracking: font.letterSpacing === 'normal' ? '0' : font.letterSpacing,
      color: colorLabel(font.color),
    },
  }
}

function RulerLabels(
  handle: Handle<{ axis: 'x' | 'y'; start: number; length: number; edge: number }>,
) {
  return () => {
    const { axis, start, length, edge } = handle.props
    const first = Math.max(0, Math.ceil((rulerCorner - start) / labelStep))
    const last = Math.floor(Math.min(length, edge - 10 - start) / labelStep)
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => {
      const value = (first + index) * labelStep
      const position = start + value - rulerCorner
      return (
        <span
          key={value}
          class="doc-inspect-mark"
          style={axis === 'x' ? { left: position } : { top: position }}
        >
          {value}
        </span>
      )
    })
  }
}

export function PreviewInspector(handle: Handle<{ contentSelector?: string; rulers?: boolean }>) {
  let origin: ReturnType<typeof rectInFrame> | undefined
  let measurement: ReturnType<typeof readTarget> | undefined
  let frame: DOMRect | undefined
  let overlay: HTMLDivElement | undefined
  let target: Element | undefined
  let hit: Element | undefined

  function placeLabel() {
    const label = overlay?.querySelector<HTMLElement>('.doc-inspect-label')
    if (!label || !overlay || !measurement) return
    const { top, left, width } = overlay.getBoundingClientRect()
    const { offsetWidth, offsetHeight } = label
    const center = measurement.x + measurement.width / 2
    const minX = Math.max(8, 8 - left)
    const maxX = Math.min(width, document.documentElement.clientWidth - left) - offsetWidth - 8
    const above = measurement.y - offsetHeight - 8
    const below = measurement.y + measurement.height + 8
    const minY = 8 - top
    const maxY = document.documentElement.clientHeight - top - offsetHeight - 8
    label.style.left = `${Math.max(minX, Math.min(center - offsetWidth / 2, maxX))}px`
    label.style.top = `${Math.max(minY, Math.min(top + above >= 8 ? above : below, maxY))}px`
  }

  const connect = ref<HTMLDivElement>((element, signal) => {
    overlay = element
    const stage = element.parentElement
    const content = handle.props.contentSelector
      ? stage?.querySelector(handle.props.contentSelector)
      : stage
    if (!stage || !content) return
    const specimen = content.firstElementChild
    let animation = 0
    const observer = new ResizeObserver(schedule)
    observer.observe(stage)
    if (specimen && specimen !== element) observer.observe(specimen)

    function schedule() {
      if (animation) return
      animation = requestAnimationFrame(() => {
        animation = 0
        frame = element.getBoundingClientRect()
        origin = specimen ? rectInFrame(specimen, frame) : undefined
        measurement =
          target && hit && content?.contains(target) ? readTarget(target, hit, frame) : undefined
        void handle.update()
      })
    }

    function select(next: EventTarget | null) {
      const nextHit =
        next instanceof Element &&
        next !== stage &&
        next !== content &&
        content?.contains(next) &&
        !element.contains(next)
          ? next
          : undefined
      if (nextHit === hit) return
      hit = nextHit
      const nextTarget = hit && content ? inspectTarget(hit, content) : undefined
      if (target !== nextTarget) {
        if (target && target !== specimen) observer.unobserve(target)
        target = nextTarget
        if (target && target !== specimen) observer.observe(target)
      }
      schedule()
    }

    stage.addEventListener('pointermove', (event) => select(event.target), { signal })
    stage.addEventListener('pointerdown', (event) => select(event.target), { signal })
    stage.addEventListener('pointerleave', () => select(null), { signal })
    stage.addEventListener('focusin', (event) => select(event.target), { signal })
    stage.addEventListener('focusout', (event) => select(event.relatedTarget), { signal })
    window.addEventListener('scroll', placeLabel, { signal, capture: true, passive: true })
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        cancelAnimationFrame(animation)
      },
      { once: true },
    )
    schedule()
  })

  return () => {
    const box = measurement
    if (box) handle.queueTask(placeLabel)
    return (
      <div class="doc-inspector" aria-hidden="true" mix={connect}>
        <div class="doc-inspector-drawing">
          {handle.props.rulers !== false && frame && origin && (
            <>
              <div
                class="doc-inspect-ruler doc-inspect-ruler-x"
                style={{ '--inspect-origin': `${origin.x}px` }}
              >
                {box && (
                  <span
                    class="doc-inspect-band"
                    style={{ left: box.x - rulerCorner, width: box.width }}
                  />
                )}
                <RulerLabels axis="x" start={origin.x} length={origin.width} edge={frame.width} />
              </div>
              <div
                class="doc-inspect-ruler doc-inspect-ruler-y"
                style={{ '--inspect-origin': `${origin.y}px` }}
              >
                {box && (
                  <span
                    class="doc-inspect-band"
                    style={{ top: box.y - rulerCorner, height: box.height }}
                  />
                )}
                <RulerLabels axis="y" start={origin.y} length={origin.height} edge={frame.height} />
              </div>
            </>
          )}
          {box && (
            <>
              {[box.x, box.x + box.width].map((left, index) => (
                <span key={index} class="doc-inspect-guide doc-inspect-guide-x" style={{ left }} />
              ))}
              {[box.y, box.y + box.height].map((top, index) => (
                <span key={index} class="doc-inspect-guide doc-inspect-guide-y" style={{ top }} />
              ))}
              <span
                class="doc-inspect-box"
                style={{
                  left: box.x,
                  top: box.y,
                  width: box.width,
                  height: box.height,
                  borderWidth: box.insets,
                }}
              />
            </>
          )}
        </div>
        {box && (
          <div class="doc-inspect-label">
            <div class="doc-inspect-name">{box.name}</div>
            <div>
              {box.display} · {Math.round(box.width)} × {Math.round(box.height)}
            </div>
            <div>
              padding {box.padding} · margin {box.margin}
            </div>
            <div>
              radius {box.radius}
              {box.gap ? ` · gap ${box.gap}` : ''}
            </div>
            {box.font && (
              <>
                <div>
                  font {box.font.size} / {box.font.lineHeight}
                </div>
                <div>
                  {box.font.family} · {box.font.axes}
                </div>
                <div>
                  tracking {box.font.tracking} · {box.font.color}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }
}
