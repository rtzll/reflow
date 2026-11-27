import { on, ref, type Handle } from 'remix/component'
import { classList } from './systems/styling.ts'

export type SparklineTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export interface SparklineProps {
  /** Numeric series samples plotted left to right. */
  values: readonly number[]
  /** Optional per-sample labels for hover/keyboard scrubbing. */
  labels?: readonly string[]
  /** Explicit lower Y bound; defaults to 0 or series minimum if negative. */
  min?: number
  /** Explicit upper Y bound; defaults to series maximum. */
  max?: number
  /** SVG viewport width in px. Default `96`. */
  width?: number
  /** SVG viewport height in px. Default `28`. */
  height?: number
  /** Semantic color tone. Default `'accent'`. */
  tone?: SparklineTone
  /** Renders a subtle area fill beneath the stroke. Default `true`. */
  fill?: boolean
  /** Enables pointer hover and keyboard arrow scrubbing across samples. Default `false`. */
  interactive?: boolean
  /** Called when the hovered or focused sample index changes (`null` on leave). */
  onActiveIndexChange?: (index: number | null) => void
  /** Accessible name when the sparkline is meaningful standalone; omitted renders decorative. */
  label?: string
  class?: string
}

export function computeSparklineGeometry(
  values: readonly number[],
  width: number,
  height: number,
  minProp?: number,
  maxProp?: number,
) {
  if (values.length === 0) return { line: '', area: '', points: [] as readonly [number, number][] }
  const finite = values.map((v) => (Number.isFinite(v) ? v : 0))
  const dataMin = Math.min(...finite)
  const dataMax = Math.max(...finite)
  const lo = minProp !== undefined ? minProp : Math.min(0, dataMin)
  const hi = maxProp !== undefined ? maxProp : dataMax === lo ? lo + 1 : dataMax
  const span = hi - lo || 1
  const padY = 3
  const usableH = Math.max(1, height - padY * 2)

  const points: [number, number][] = finite.map((val, idx) => {
    const x = finite.length === 1 ? width / 2 : (idx / (finite.length - 1)) * width
    const norm = Math.max(0, Math.min(1, (val - lo) / span))
    const y = height - padY - norm * usableH
    return [Number(x.toFixed(1)), Number(y.toFixed(1))]
  })

  if (points.length === 1) {
    const [x, y] = points[0]!
    return {
      line: `M 0 ${y} L ${width} ${y}`,
      area: `M 0 ${y} L ${width} ${y} L ${width} ${height} L 0 ${height} Z`,
      points: [[x, y] as const],
    }
  }

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  return { line, area, points }
}

/**
 * Compact inline SVG sparkline with semantic tones, translucent area fill,
 * and optional pointer/keyboard sample scrubbing.
 */
export function Sparkline(handle: Handle<SparklineProps>) {
  let activeIndex: number | null = null
  let svgEl: SVGSVGElement | null = null

  const mountSvg = ref<SVGSVGElement>((el, signal) => {
    svgEl = el
    signal.addEventListener(
      'abort',
      () => {
        if (svgEl === el) svgEl = null
      },
      { once: true },
    )
  })

  function setActive(next: number | null) {
    if (activeIndex === next) return
    activeIndex = next
    handle.props.onActiveIndexChange?.(next)
    void handle.update()
  }

  return () => {
    const props = handle.props
    const width = props.width ?? 96
    const height = props.height ?? 28
    const tone = props.tone ?? 'accent'
    const fill = props.fill ?? true
    const interactive = Boolean(props.interactive)
    const { line, area, points } = computeSparklineGeometry(
      props.values,
      width,
      height,
      props.min,
      props.max,
    )
    const activePoint = activeIndex !== null ? points[activeIndex] : undefined
    const activeVal = activeIndex !== null ? props.values[activeIndex] : undefined
    const activeLabel = activeIndex !== null ? props.labels?.[activeIndex] : undefined

    const svg = (
      <svg
        class={classList('rf-sparkline', !interactive ? props.class : undefined)}
        data-tone={tone}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role={props.label ? 'img' : undefined}
        aria-label={props.label}
        aria-hidden={props.label ? undefined : 'true'}
        mix={interactive ? mountSvg : undefined}
      >
        {fill && area && <path class="rf-sparkline-area" d={area} />}
        {line && <path class="rf-sparkline-line" d={line} />}
        {activePoint && (
          <>
            <line
              class="rf-sparkline-cursor"
              x1={activePoint[0]}
              y1={0}
              x2={activePoint[0]}
              y2={height}
            />
            <circle class="rf-sparkline-dot" cx={activePoint[0]} cy={activePoint[1]} r={3} />
          </>
        )}
      </svg>
    )

    if (!interactive || points.length === 0) return svg

    return (
      <div
        class={classList('rf-sparkline-wrap', props.class)}
        tabIndex={0}
        role="slider"
        aria-label={props.label ?? 'Sparkline samples'}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, props.values.length - 1)}
        aria-valuenow={activeIndex ?? Math.max(0, props.values.length - 1)}
        aria-valuetext={
          activeVal !== undefined
            ? `${activeLabel ? `${activeLabel}: ` : ''}${activeVal}`
            : undefined
        }
        mix={[
          on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
            if (points.length === 0) return
            const rect = (svgEl ?? event.currentTarget).getBoundingClientRect()
            if (rect.width <= 0) return
            const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
            setActive(Math.round(ratio * (points.length - 1)))
          }),
          on('pointerleave', () => setActive(null)),
          on('blur', () => setActive(null)),
          on<HTMLDivElement, 'keydown'>('keydown', (event) => {
            if (points.length === 0) return
            const cur = activeIndex ?? points.length - 1
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              setActive(Math.max(0, cur - 1))
            } else if (event.key === 'ArrowRight') {
              event.preventDefault()
              setActive(Math.min(points.length - 1, cur + 1))
            } else if (event.key === 'Home') {
              event.preventDefault()
              setActive(0)
            } else if (event.key === 'End') {
              event.preventDefault()
              setActive(points.length - 1)
            } else if (event.key === 'Escape') {
              setActive(null)
            }
          }),
        ]}
      >
        {svg}
        {activeVal !== undefined && activePoint && (
          <span
            class="rf-sparkline-readout"
            aria-live="polite"
            style={{ left: `${Math.max(0, Math.min(100, (activePoint[0] / width) * 100))}%` }}
          >
            {activeLabel ? `${activeLabel} · ` : ''}
            {activeVal}
          </span>
        )}
      </div>
    )
  }
}
