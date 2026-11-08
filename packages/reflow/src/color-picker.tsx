import { on, ref } from 'remix/component'
import type { Handle } from 'remix/component'
import * as menu from '@remix-run/ui/menu'
import * as popover from '@remix-run/ui/popover'
import type { ControlSize } from './basic.tsx'
import { Icon } from './icon.tsx'
import { fluidHover } from './interactive.tsx'
import { Tooltip } from './overlays.tsx'
import { Slider } from './range-color.tsx'

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch'
export type ColorSwatchItem = string | { color: string; label?: string }

export interface ParsedColor {
  h: number
  s: number
  v: number
  a: number
  r: number
  g: number
  b: number
  hex: string
  rgb: string
  hsl: string
  oklch: string
}

export interface ColorPickerProps {
  /** Hex (3, 4, 6 or 8 digits), rgb(a), hsl(a) or oklch. */
  value?: string
  defaultValue?: string
  /** Fires with the color in the current format plus the parsed color in every format. */
  onValueChange?: (value: string, parsed: ParsedColor) => void
  format?: ColorFormat
  defaultFormat?: ColorFormat
  onFormatChange?: (format: ColorFormat) => void
  /** Any CSS color. A `{ color, label }` swatch names its color in a tooltip. */
  swatches?: ColorSwatchItem[]
  /** The button is already hidden where `window.EyeDropper` is missing. */
  hideEyedropper?: boolean
  size?: ControlSize
  disabled?: boolean
  /** Accessible name of the picker. */
  label?: string
  /** Submits the color as hex (with alpha below 100%) with a form. */
  name?: string
  className?: string
  /** Inline panel (default) or a trigger that opens the panel in a popover. */
  variant?: 'inline' | 'popover'
  triggerLabel?: string
  triggerLabelPosition?: 'left' | 'right'
  /** Shows the six-digit hex next to the tile. Default true. */
  triggerShowValue?: boolean
  /** Adds an X inside the trigger that calls onTriggerRemove without opening the popover. */
  triggerShowRemove?: boolean
  onTriggerRemove?: () => void
  placement?: 'bottom-start' | 'right-start'
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Color math. One HSV + alpha tuple is canonical; every format derives from it.
// ---------------------------------------------------------------------------

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, n))
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s
  const hh = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r = 0,
    g = 0,
    b = 0
  if (hh < 1) {
    r = c
    g = x
  } else if (hh < 2) {
    r = x
    g = c
  } else if (hh < 3) {
    g = c
    b = x
  } else if (hh < 4) {
    g = x
    b = c
  } else if (hh < 5) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const m = v - c
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0,
    s = 0
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hh = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r = 0,
    g = 0,
    b = 0
  if (hh < 1) {
    r = c
    g = x
  } else if (hh < 2) {
    r = x
    g = c
  } else if (hh < 3) {
    g = c
    b = x
  } else if (hh < 4) {
    g = x
    b = c
  } else if (hh < 5) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const m = l - c / 2
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

function srgbToLinear(c: number) {
  c = c / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linearToSrgb(c: number) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return clamp01(v) * 255
}

function rgbToOklch(r: number, g: number, b: number) {
  const lr = srgbToLinear(r),
    lg = srgbToLinear(g),
    lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  let H = (Math.atan2(bb, a) * 180) / Math.PI
  if (H < 0) H += 360
  return { L, C: Math.sqrt(a * a + bb * bb), H }
}

function oklchToRgb(L: number, C: number, H: number) {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3
  return {
    r: clamp255(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp255(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp255(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  }
}

function to2hex(n: number) {
  return Math.round(clamp255(n)).toString(16).padStart(2, '0')
}

function rgbToHexStr(r: number, g: number, b: number, a: number) {
  if (a >= 1) return `#${to2hex(r)}${to2hex(g)}${to2hex(b)}`
  return `#${to2hex(r)}${to2hex(g)}${to2hex(b)}${to2hex(a * 255)}`
}

type Rgba = { r: number; g: number; b: number; a: number }

function parseHex(input: string): Rgba | null {
  const m = input.trim().match(/^#?([0-9a-fA-F]{3,8})$/)
  if (!m) return null
  let h = m[1]
  if (h.length === 3 || h.length === 4)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  if (h.length !== 6 && h.length !== 8) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  }
}

function alphaPart(token: string | undefined) {
  if (token === undefined) return 1
  return token.endsWith('%') ? parseFloat(token) / 100 : parseFloat(token)
}

export function parseColor(input: string): Rgba | null {
  const s = input.trim()
  if (!s) return null
  if (s.startsWith('#') || /^[0-9a-fA-F]{3,8}$/.test(s)) return parseHex(s)
  const call = /^(rgba?|hsla?|oklch)\(\s*([^)]+)\)$/i.exec(s)
  if (!call) return null
  const parts = call[2].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const kind = call[1].toLowerCase()
  const a = alphaPart(parts[3])
  if (kind.startsWith('rgb')) {
    const [r, g, b] = parts.slice(0, 3).map(parseFloat)
    if ([r, g, b, a].some(Number.isNaN)) return null
    return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: clamp01(a) }
  }
  if (kind.startsWith('hsl')) {
    const h = parseFloat(parts[0])
    const sat = parts[1].endsWith('%') ? parseFloat(parts[1]) / 100 : parseFloat(parts[1])
    const l = parts[2].endsWith('%') ? parseFloat(parts[2]) / 100 : parseFloat(parts[2])
    if ([h, sat, l, a].some(Number.isNaN)) return null
    const rgb = hslToRgb(h, clamp01(sat), clamp01(l))
    return { r: clamp255(rgb.r), g: clamp255(rgb.g), b: clamp255(rgb.b), a: clamp01(a) }
  }
  const L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0])
  const C = parseFloat(parts[1])
  const H = parseFloat(parts[2])
  if ([L, C, H, a].some(Number.isNaN)) return null
  const rgb = oklchToRgb(clamp01(L), Math.max(0, C), H)
  return { r: rgb.r, g: rgb.g, b: rgb.b, a: clamp01(a) }
}

let cssColorContext: CanvasRenderingContext2D | null = null

/** Parses a color, falling back to the browser for named colors. Client only. */
function resolveCssColor(input: string): Rgba | null {
  const direct = parseColor(input)
  if (direct) return direct
  const s = input.trim()
  if (!s || typeof document === 'undefined') return null
  cssColorContext ??= document.createElement('canvas').getContext('2d')
  const context = cssColorContext
  if (!context) return null
  context.fillStyle = '#000000'
  context.fillStyle = s
  const first = String(context.fillStyle)
  context.fillStyle = '#ffffff'
  context.fillStyle = s
  if (first !== String(context.fillStyle)) return null
  return parseColor(first)
}

export function buildParsed(h: number, s: number, v: number, a: number): ParsedColor {
  const { r, g, b } = hsvToRgb(h, s, v)
  const hsl = rgbToHsl(r, g, b)
  const oklch = rgbToOklch(r, g, b)
  const alpha = Number(a.toFixed(3))
  const [R, G, B] = [Math.round(r), Math.round(g), Math.round(b)]
  const hslPart = `${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%`
  const oklchPart = `${(oklch.L * 100).toFixed(1)}% ${oklch.C.toFixed(3)} ${oklch.H.toFixed(1)}`
  return {
    h,
    s,
    v,
    a,
    r: R,
    g: G,
    b: B,
    hex: rgbToHexStr(r, g, b, a),
    rgb: a >= 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${alpha})`,
    hsl: a >= 1 ? `hsl(${hslPart})` : `hsla(${hslPart}, ${alpha})`,
    oklch: a >= 1 ? `oklch(${oklchPart})` : `oklch(${oklchPart} / ${alpha})`,
  }
}

const formatLabels: Record<ColorFormat, string> = {
  hex: 'HEX',
  rgb: 'RGB',
  hsl: 'HSL',
  oklch: 'OKLCH',
}
const formats = ['hex', 'rgb', 'hsl', 'oklch'] as const
const checker =
  'conic-gradient(var(--rf-checker-a) 0 25%, var(--rf-checker-b) 0 50%, var(--rf-checker-a) 0 75%, var(--rf-checker-b) 0)'

// ---------------------------------------------------------------------------
// Saturation square
// ---------------------------------------------------------------------------

interface SquareProps {
  h: number
  s: number
  v: number
  disabled?: boolean
  onChange: (s: number, v: number) => void
}

function SaturationSquare(handle: Handle<SquareProps>) {
  let dragging = false
  let hovered = false
  let ghost: { x: number; y: number } | null = null

  function point(event: PointerEvent, element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    return {
      x: clamp01((event.clientX - rect.left) / (rect.width || 1)),
      y: clamp01((event.clientY - rect.top) / (rect.height || 1)),
    }
  }

  return () => {
    const { h, s, v, disabled, onChange } = handle.props
    const { r, g, b } = hsvToRgb(h, s, v)
    return (
      <div
        class="rf-color-square"
        role="application"
        aria-label="Saturation and brightness"
        aria-roledescription="2D color slider"
        aria-valuetext={`Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`}
        tabIndex={disabled ? -1 : 0}
        data-dragging={dragging || undefined}
        style={{
          '--rf-color-hue': String(h),
          '--rf-color-x': s * 100 + '%',
          '--rf-color-y': (1 - v) * 100 + '%',
          '--rf-color-thumb': `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
        }}
        mix={[
          on<HTMLDivElement, 'pointerenter'>('pointerenter', () => {
            hovered = true
            handle.update()
          }),
          on<HTMLDivElement, 'pointerleave'>('pointerleave', () => {
            hovered = false
            ghost = null
            handle.update()
          }),
          on<HTMLDivElement, 'pointerdown'>('pointerdown', (event) => {
            if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
            event.preventDefault()
            event.currentTarget.focus({ preventScroll: true })
            dragging = true
            event.currentTarget.setPointerCapture(event.pointerId)
            const p = point(event, event.currentTarget)
            onChange(p.x, 1 - p.y)
            handle.update()
          }),
          on<HTMLDivElement, 'pointermove'>('pointermove', (event) => {
            const p = point(event, event.currentTarget)
            ghost = { x: p.x * 100, y: p.y * 100 }
            if (dragging) onChange(p.x, 1 - p.y)
            handle.update()
          }),
          on<HTMLDivElement, 'pointerup'>('pointerup', () => {
            dragging = false
            handle.update()
          }),
          on<HTMLDivElement, 'pointercancel'>('pointercancel', () => {
            dragging = false
            handle.update()
          }),
          on<HTMLDivElement, 'keydown'>('keydown', (event) => {
            if (disabled) return
            const step = event.shiftKey ? 0.1 : 0.01
            let nextS = s,
              nextV = v
            if (event.key === 'ArrowLeft') nextS = clamp01(s - step)
            else if (event.key === 'ArrowRight') nextS = clamp01(s + step)
            else if (event.key === 'ArrowUp') nextV = clamp01(v + step)
            else if (event.key === 'ArrowDown') nextV = clamp01(v - step)
            else return
            event.preventDefault()
            onChange(nextS, nextV)
          }),
        ]}
      >
        <div class="rf-color-plane" />
        <div class="rf-color-cursor" />
        {hovered && !dragging && ghost && (
          <div class="rf-color-ghost" style={{ left: ghost.x + '%', top: ghost.y + '%' }} />
        )}
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// Format menu
// ---------------------------------------------------------------------------

function FormatMenu(
  handle: Handle<{
    value: ColorFormat
    disabled?: boolean
    onChange: (format: ColorFormat) => void
  }>,
) {
  const highlight = fluidHover({ highlightedSelector: '[data-highlighted]' })
  return () => {
    const { value, disabled, onChange } = handle.props
    return (
      <div
        class="rf-color-format"
        mix={menu.onMenuSelect((event) =>
          onChange((event.item.value ?? event.item.name) as ColorFormat),
        )}
      >
        <menu.Context label="Color format">
          <button
            type="button"
            class="rf-color-format-trigger"
            disabled={disabled}
            mix={menu.trigger({ placement: 'bottom-start', offset: 6 })}
          >
            <span>{formatLabels[value]}</span>
            <Icon name="chevron-down" size={14} />
          </button>
          <div
            class="rf-menu-surface rf-dropdown-surface rf-color-format-surface"
            mix={menu.popover()}
          >
            <div class="rf-menu-list" mix={[menu.list(), highlight]}>
              <span class="rf-highlight rf-menu-hover" aria-hidden="true" data-rf-hover-layer />
              {formats.map((format) => (
                <div
                  key={format}
                  class="rf-menu-item"
                  data-rf-hover-item
                  mix={menu.item({
                    name: format,
                    value: format,
                    label: formatLabels[format],
                    type: 'radio',
                    checked: format === value,
                  })}
                >
                  <span class="rf-menu-label" data-label={formatLabels[format]}>
                    <span>{formatLabels[format]}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </menu.Context>
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// Value fields
// ---------------------------------------------------------------------------

interface FieldProps {
  value: string
  ariaLabel: string
  label?: string
  disabled?: boolean
  onCommit: (next: string) => void
  prefix?: string
  scrub?: boolean
  min?: number
  max?: number
  wrap?: boolean
  step?: number
  largeStep?: number
  decimals?: number
  percent?: boolean
}

function ColorField(handle: Handle<FieldProps>) {
  let draft: string | undefined
  let editing = false
  let scrubbing: { id: number; x: number; start: number; moved: boolean } | undefined
  let input: HTMLInputElement | null = null

  const inputRef = ref((node, signal) => {
    if (!(node instanceof HTMLInputElement)) return
    input = node
    signal.addEventListener(
      'abort',
      () => {
        if (input === node) input = null
      },
      { once: true },
    )
  })

  function numeric(text: string) {
    return parseFloat(text.replace('%', ''))
  }

  function commitNumber(n: number) {
    const { min, max, wrap, decimals, percent, onCommit } = handle.props
    let bounded = n
    if (wrap && min != null && max != null) {
      if (bounded < min || bounded > max) {
        const range = max - min
        bounded = ((((bounded - min) % range) + range) % range) + min
      }
    } else {
      if (min != null) bounded = Math.max(min, bounded)
      if (max != null) bounded = Math.min(max, bounded)
    }
    const text = decimals != null ? bounded.toFixed(decimals) : String(Math.round(bounded))
    draft = undefined
    onCommit(percent ? `${text}%` : text)
    handle.update()
  }

  function finish(commit: boolean) {
    const text = draft
    draft = undefined
    editing = false
    if (commit && text !== undefined && text !== handle.props.value) {
      const n = numeric(text)
      const { min, max, scrub, onCommit } = handle.props
      if (!Number.isNaN(n) && (scrub || min != null || max != null)) commitNumber(n)
      else onCommit(text)
    }
    handle.update()
  }

  return () => {
    const {
      value,
      ariaLabel,
      label,
      disabled,
      prefix,
      scrub,
      step = 1,
      largeStep = 10,
    } = handle.props
    const shown = draft ?? value
    const field = (
      <div
        class="rf-color-field"
        data-scrub={scrub || undefined}
        data-editing={editing || undefined}
        data-align={scrub ? 'center' : undefined}
      >
        <span
          class="rf-color-field-body"
          mix={
            scrub
              ? [
                  on<HTMLSpanElement, 'pointerdown'>('pointerdown', (event) => {
                    if (disabled || editing || !event.isPrimary || event.button !== 0) return
                    scrubbing = {
                      id: event.pointerId,
                      x: event.clientX,
                      start: numeric(value),
                      moved: false,
                    }
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }),
                  on<HTMLSpanElement, 'pointermove'>('pointermove', (event) => {
                    if (!scrubbing || scrubbing.id !== event.pointerId) return
                    const travel = event.clientX - scrubbing.x
                    if (!scrubbing.moved && Math.abs(travel) < 2) return
                    scrubbing.moved = true
                    if (Number.isNaN(scrubbing.start)) return
                    commitNumber(scrubbing.start + Math.round(travel) * step)
                  }),
                  on<HTMLSpanElement, 'pointerup'>('pointerup', () => {
                    const moved = scrubbing?.moved
                    scrubbing = undefined
                    if (moved) return
                    editing = true
                    handle.update()
                    handle.queueTask(() => {
                      input?.focus()
                      input?.select()
                    })
                  }),
                  on<HTMLSpanElement, 'pointercancel'>('pointercancel', () => {
                    scrubbing = undefined
                  }),
                ]
              : undefined
          }
        >
          {prefix && (
            <span class="rf-color-field-prefix" aria-hidden="true">
              {prefix}
            </span>
          )}
          <input
            type="text"
            aria-label={ariaLabel}
            inputMode={scrub ? 'numeric' : 'text'}
            autocomplete="off"
            spellcheck={false}
            disabled={disabled}
            value={shown}
            mix={[
              inputRef,
              on<HTMLInputElement, 'focus'>('focus', (event) => {
                editing = true
                event.currentTarget.select()
                handle.update()
              }),
              on<HTMLInputElement, 'input'>('input', (event) => {
                draft = event.currentTarget.value
                handle.update()
              }),
              on<HTMLInputElement, 'blur'>('blur', () => finish(true)),
              on<HTMLInputElement, 'keydown'>('keydown', (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                } else if (event.key === 'Escape') {
                  draft = undefined
                  event.currentTarget.blur()
                } else if (scrub && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                  event.preventDefault()
                  const base = numeric(draft ?? value)
                  if (Number.isNaN(base)) return
                  commitNumber(
                    base + (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? largeStep : step),
                  )
                  input?.select()
                }
              }),
            ]}
          />
        </span>
      </div>
    )
    if (!label) return field
    return (
      <Tooltip
        content={label}
        delayDuration={300}
        renderTrigger={({ mix, ...props }) => (
          <div class="rf-color-field-wrap" {...props} mix={mix}>
            {field}
          </div>
        )}
      />
    )
  }
}

// ---------------------------------------------------------------------------
// Eyedropper
// ---------------------------------------------------------------------------

type EyeDropperConstructor = new () => {
  open(options?: { signal: AbortSignal }): Promise<{ sRGBHex: string }>
}

function EyedropperButton(handle: Handle<{ disabled?: boolean; onPick: (hex: string) => void }>) {
  let constructor: EyeDropperConstructor | undefined
  handle.queueTask(() => {
    const found = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper
    if (!found) return
    constructor = found
    handle.update()
  })
  return () => {
    if (!constructor) return null
    const Dropper = constructor
    return (
      <button
        type="button"
        class="rf-color-eyedropper"
        aria-label="Pick color from screen"
        disabled={handle.props.disabled}
        mix={on<HTMLButtonElement, 'click'>('click', async (_event, signal) => {
          try {
            const picked = await new Dropper().open({ signal })
            if (!signal.aborted) handle.props.onPick(picked.sRGBHex)
          } catch {
            // Escape closes the platform picker.
          }
        })}
      >
        <Icon name="pipette" size={16} />
      </button>
    )
  }
}

// ---------------------------------------------------------------------------
// Tile and swatches
// ---------------------------------------------------------------------------

function ColorTile(handle: Handle<{ color: string }>) {
  return () => (
    <span class="rf-color-tile" aria-hidden="true">
      <span style={{ background: handle.props.color }} />
    </span>
  )
}

function SwatchStrip(
  handle: Handle<{
    swatches: ColorSwatchItem[]
    current: string
    disabled?: boolean
    onPick: (color: string) => void
  }>,
) {
  const hover = fluidHover({ axis: 'both' })
  return () => {
    const { swatches, current, disabled, onPick } = handle.props
    const currentParsed = parseColor(current)
    const currentHex = currentParsed
      ? rgbToHexStr(
          currentParsed.r,
          currentParsed.g,
          currentParsed.b,
          currentParsed.a,
        ).toLowerCase()
      : ''
    return (
      <div class="rf-color-swatches" role="group" aria-label="Swatches" mix={hover}>
        <span class="rf-highlight rf-color-swatch-hover" aria-hidden="true" data-rf-hover-layer />
        {swatches.map((swatch, index) => {
          const color = typeof swatch === 'string' ? swatch : swatch.color
          const label = typeof swatch === 'string' ? undefined : swatch.label
          const resolved = resolveCssColor(color)
          const normalized = resolved
            ? rgbToHexStr(resolved.r, resolved.g, resolved.b, resolved.a).toLowerCase()
            : color.toLowerCase()
          const selected = normalized === currentHex
          const cell = (mix?: unknown, extra?: Record<string, unknown>) => (
            <button
              type="button"
              class="rf-color-swatch"
              aria-label={label ?? `Select color ${color}`}
              aria-pressed={selected}
              disabled={disabled}
              data-rf-hover-item
              data-selected={selected || undefined}
              {...extra}
              mix={[on<HTMLButtonElement, 'click'>('click', () => onPick(color)), mix as never]}
            >
              <span class="rf-color-swatch-band" aria-hidden="true" />
              <span class="rf-color-swatch-face" style={{ '--rf-color-swatch': color }}>
                <span />
              </span>
            </button>
          )
          return label ? (
            <Tooltip
              key={`${color}-${index}`}
              content={label}
              delayDuration={300}
              sideOffset={2}
              renderTrigger={({ mix, ...props }) => cell(mix, props)}
            />
          ) : (
            <span key={`${color}-${index}`} class="rf-color-swatch-slot">
              {cell()}
            </span>
          )
        })}
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// ColorPicker
// ---------------------------------------------------------------------------

type Hsva = { h: number; s: number; v: number; a: number }

export function ColorPicker(handle: Handle<ColorPickerProps>) {
  const defaultColor = '#6B97FF'
  const initial = handle.props.value ?? handle.props.defaultValue ?? defaultColor
  let localValue = initial
  let localFormat: ColorFormat = handle.props.defaultFormat ?? 'hex'
  let hsv: Hsva = startColor(initial)
  let oklchHue: number | null = null
  let lastEmitted = ''
  let syncedValue = handle.props.value
  let open = handle.props.defaultOpen ?? false

  function startColor(text: string): Hsva {
    const p = parseColor(text)
    if (!p) return { h: 0, s: 1, v: 1, a: 1 }
    const next = rgbToHsv(p.r, p.g, p.b)
    return { h: next.s === 0 ? 0 : next.h, s: next.s, v: next.v, a: p.a }
  }

  function setOpen(next: boolean) {
    if (handle.props.open === undefined) open = next
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  return () => {
    const props = handle.props
    const {
      value,
      onValueChange,
      swatches,
      hideEyedropper,
      size,
      disabled,
      label = 'Color',
      name,
      className,
    } = props
    const controlled = value !== undefined
    const format = props.format ?? localFormat

    if (controlled && value !== syncedValue) {
      syncedValue = value
      const p = value !== lastEmitted ? parseColor(value) : null
      if (p) {
        oklchHue = null
        const next = rgbToHsv(p.r, p.g, p.b)
        hsv = { h: next.s === 0 ? hsv.h : next.h, s: next.s, v: next.v, a: p.a }
      }
    }

    const parsed = buildParsed(hsv.h, hsv.s, hsv.v, hsv.a)
    const formatted = parsed[format]

    function emit(next: Hsva, nextFormat = format) {
      hsv = next
      const p = buildParsed(next.h, next.s, next.v, next.a)
      const text = p[nextFormat]
      lastEmitted = text
      if (!controlled) localValue = text
      onValueChange?.(text, p)
      void handle.update()
    }

    function updateHsv(patch: Partial<Hsva>) {
      if (disabled) return
      emit({ ...hsv, ...patch })
    }

    function commitColor(input: string) {
      const p = resolveCssColor(input)
      if (!p) return
      oklchHue = null
      const next = rgbToHsv(p.r, p.g, p.b)
      emit({ h: next.s === 0 ? hsv.h : next.h, s: next.s, v: next.v, a: p.a })
    }

    function changeFormat(next: ColorFormat) {
      if (props.format === undefined) localFormat = next
      props.onFormatChange?.(next)
      emit(hsv, next)
    }

    function channel(key: string, text: string) {
      const n = Number(text)
      const { r, g, b } = parsed
      if (key === 'alpha') return updateHsv({ a: clamp01(n / 100) })
      if (key === 'r' || key === 'g' || key === 'b') {
        oklchHue = null
        const next = rgbToHsv(key === 'r' ? n : r, key === 'g' ? n : g, key === 'b' ? n : b)
        return updateHsv({ h: next.s === 0 ? hsv.h : next.h, s: next.s, v: next.v })
      }
      if (key === 'hh' || key === 'hs' || key === 'hl') {
        if (key === 'hh') oklchHue = null
        const hsl = rgbToHsl(r, g, b)
        const h = key === 'hh' ? n : hsl.h
        const s = key === 'hs' ? n / 100 : hsl.s
        const l = key === 'hl' ? n / 100 : hsl.l
        const rgb = hslToRgb(h, clamp01(s), clamp01(l))
        const next = rgbToHsv(rgb.r, rgb.g, rgb.b)
        return updateHsv({ h: next.s === 0 ? h : next.h, s: next.s, v: next.v })
      }
      const current = rgbToOklch(r, g, b)
      const baseHue = oklchHue ?? current.H
      const L = key === 'ol' ? n / 100 : current.L
      const C = key === 'oc' ? n : current.C
      const H = key === 'oh' ? n : baseHue
      oklchHue = H
      const rgb = oklchToRgb(clamp01(L), Math.max(0, C), H)
      const next = rgbToHsv(rgb.r, rgb.g, rgb.b)
      updateHsv({ h: next.s === 0 ? hsv.h : next.h, s: next.s, v: next.v })
    }

    const alphaPercent = Math.round(hsv.a * 100)
    const solid = `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`
    const transparent = `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 0)`

    function fields() {
      const alpha = (
        <ColorField
          value={`${alphaPercent}%`}
          ariaLabel="Alpha"
          label="Alpha"
          disabled={disabled}
          scrub
          percent
          min={0}
          max={100}
          onCommit={(text) => channel('alpha', text.replace('%', ''))}
        />
      )
      if (format === 'hex') {
        return (
          <div class="rf-color-values" data-format="hex">
            <ColorField
              value={parsed.hex.replace(/^#/, '').toUpperCase()}
              ariaLabel="Hex value"
              label="Hex"
              disabled={disabled}
              prefix="#"
              onCommit={(text) => commitColor(text.startsWith('#') ? text : `#${text}`)}
            />
            {alpha}
          </div>
        )
      }
      const labels =
        format === 'rgb'
          ? ['Red', 'Green', 'Blue']
          : format === 'hsl'
            ? ['Hue', 'Saturation', 'Lightness']
            : ['Lightness', 'Chroma', 'Hue']
      const keys =
        format === 'rgb'
          ? ['r', 'g', 'b']
          : format === 'hsl'
            ? ['hh', 'hs', 'hl']
            : ['ol', 'oc', 'oh']
      let texts: string[]
      if (format === 'rgb') texts = [parsed.r, parsed.g, parsed.b].map(String)
      else if (format === 'hsl') {
        const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b)
        texts = [Math.round(hsl.h), Math.round(hsl.s * 100), Math.round(hsl.l * 100)].map(String)
      } else {
        const o = rgbToOklch(parsed.r, parsed.g, parsed.b)
        texts = [(o.L * 100).toFixed(0), o.C.toFixed(2), (oklchHue ?? o.H).toFixed(0)]
      }
      const limits =
        format === 'rgb'
          ? [
              [0, 255],
              [0, 255],
              [0, 255],
            ]
          : format === 'hsl'
            ? [
                [0, 360],
                [0, 100],
                [0, 100],
              ]
            : [
                [0, 100],
                [0, 0.4],
                [0, 360],
              ]
      return (
        <div class="rf-color-values" data-format={format}>
          {labels.map((text, index) => (
            <ColorField
              key={format + text}
              value={texts[index]}
              ariaLabel={text}
              label={text}
              disabled={disabled}
              scrub
              min={limits[index][0]}
              max={limits[index][1]}
              wrap={(format === 'hsl' || format === 'oklch') && text === 'Hue'}
              decimals={format === 'oklch' && index === 1 ? 2 : undefined}
              step={format === 'oklch' && index === 1 ? 0.01 : 1}
              largeStep={format === 'oklch' && index === 1 ? 0.1 : 10}
              onCommit={(next) => channel(keys[index], next)}
            />
          ))}
          {alpha}
        </div>
      )
    }

    const panel = (
      <div
        class={className ? 'rf-color-picker ' + className : 'rf-color-picker'}
        role="group"
        aria-label={label}
        data-density={size}
        data-disabled={disabled || undefined}
        data-in-popover={props.variant === 'popover' || undefined}
        mix={ref((element, signal) => {
          element.closest('form')?.addEventListener(
            'reset',
            (event) => {
              queueMicrotask(() => {
                if (event.defaultPrevented || signal.aborted) return
                const current = handle.props
                if (current.value === undefined) {
                  localValue = current.defaultValue ?? defaultColor
                  hsv = startColor(localValue)
                  oklchHue = null
                }
                if (current.format === undefined) localFormat = current.defaultFormat ?? 'hex'
                void handle.update()
              })
            },
            { signal },
          )
        })}
      >
        {name && (
          <input type="hidden" name={name} value={parsed.hex.toUpperCase()} disabled={disabled} />
        )}
        <SaturationSquare
          h={hsv.h}
          s={hsv.s}
          v={hsv.v}
          disabled={disabled}
          onChange={(s, v) => updateHsv({ s, v })}
        />
        <div class="rf-color-rails">
          <Slider
            label="Hue"
            showLabel={false}
            value={Math.round(hsv.h)}
            min={0}
            max={360}
            step={1}
            showValue={false}
            hideFill
            disabled={disabled}
            thumbColor={`hsl(${hsv.h}, 100%, 50%)`}
            thumbBorderColor="rgba(255,255,255,0.9)"
            trackStyle={{
              background:
                'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
              borderColor: 'transparent',
            }}
            onChange={(next) => {
              oklchHue = null
              updateHsv({ h: typeof next === 'number' ? next : next[0] })
            }}
          />
          <Slider
            label="Alpha"
            showLabel={false}
            value={alphaPercent}
            min={0}
            max={100}
            step={1}
            showValue={false}
            hideFill
            disabled={disabled}
            thumbColor={solid}
            thumbBorderColor="rgba(255,255,255,0.9)"
            trackStyle={{
              backgroundImage: `linear-gradient(to right, ${transparent} 0%, ${solid} 98%), ${checker}`,
              backgroundSize: '100% 100%, 8px 8px',
              borderWidth: 0,
            }}
            onChange={(next) => updateHsv({ a: (typeof next === 'number' ? next : next[0]) / 100 })}
          />
        </div>
        <div class="rf-color-tools">
          <FormatMenu value={format} disabled={disabled} onChange={changeFormat} />
          {!hideEyedropper && <EyedropperButton disabled={disabled} onPick={commitColor} />}
        </div>
        {fields()}
        {swatches && swatches.length > 0 && (
          <SwatchStrip
            swatches={swatches}
            current={parsed.hex}
            disabled={disabled}
            onPick={commitColor}
          />
        )}
      </div>
    )

    if (props.variant !== 'popover') return panel

    const isOpen = props.open ?? open
    const tileColor = parsed.hex
    const valueText = parsed.hex.slice(0, 7).replace(/^#/, '').toUpperCase()
    const triggerLabel = props.triggerLabel
    const labelPosition = props.triggerLabelPosition ?? 'left'
    const showValue = props.triggerShowValue ?? true
    const labelNode = triggerLabel && <span class="rf-color-trigger-label">{triggerLabel}</span>
    const content = (
      <>
        {labelPosition === 'left' && labelNode}
        <ColorTile color={tileColor} />
        {showValue && <span class="rf-color-trigger-value">{valueText}</span>}
        {labelPosition === 'right' && labelNode}
      </>
    )
    const placement = props.placement ?? 'bottom-start'
    const remove = props.triggerShowRemove
    const trigger = (
      <button
        type="button"
        class="rf-color-trigger"
        disabled={disabled}
        aria-label={triggerLabel ? `${triggerLabel}: ${valueText}` : `Color ${valueText}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={`${handle.id}-panel`}
        data-rf-hover-item
        mix={[
          !remove && popover.anchor({ placement, offset: 6 }),
          popover.focusOnHide(),
          on('click', () => setOpen(!isOpen)),
        ]}
      >
        {content}
      </button>
    )

    return (
      <div class="rf-color-popover" data-density={size} data-remove={remove || undefined}>
        <popover.Context>
          {remove ? (
            <div
              class="rf-color-trigger-field"
              mix={[fluidHover({ axis: 'x' }), popover.anchor({ placement, offset: 6 })]}
            >
              <span
                class="rf-highlight rf-color-trigger-hover"
                aria-hidden="true"
                data-rf-hover-layer
              />
              {trigger}
              <button
                type="button"
                class="rf-color-remove"
                aria-label="Remove color"
                data-rf-hover-item
                disabled={disabled}
                mix={on('click', () => props.onTriggerRemove?.())}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ) : (
            trigger
          )}
          <div
            class="rf-menu-surface rf-color-popover-surface"
            id={`${handle.id}-panel`}
            role="dialog"
            aria-label={label}
            mix={[
              popover.surface({
                open: isOpen,
                closeOnAnchorClick: false,
                onHide: () => {
                  if (isOpen) setOpen(false)
                },
              }),
              on<HTMLDivElement, 'toggle'>('toggle', (event) => {
                if (event.newState === 'open')
                  event.currentTarget
                    .querySelector<HTMLElement>('.rf-color-square')
                    ?.focus({ preventScroll: true })
              }),
            ]}
          >
            {panel}
          </div>
        </popover.Context>
      </div>
    )
  }
}

/** The panel in a popover behind a tile and hex trigger. */
export function ColorPickerPopover(handle: Handle<Omit<ColorPickerProps, 'variant'>>) {
  return () => <ColorPicker {...handle.props} variant="popover" />
}
