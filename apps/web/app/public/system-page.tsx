import {
  Button,
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardDescription,
  Checkbox,
  ColorPicker,
  fluidHover,
  Input,
  motion,
  motionExit,
  reveal,
  ScrollArea,
  Select,
  Sidebar,
  Slider,
  Switch,
  Tabs,
} from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle, type RemixNode } from 'remix/component'
import { SystemInstallation } from './install-prompt.tsx'
import { FontPickerDialog } from './font-picker.tsx'
import { fontStylesheet, fontWeights, type GoogleFont } from './google-fonts.ts'
import { HoverComparison, HoverPlayback } from './system-hover-comparison.tsx'
import { RevealPresetDemo } from './system-reveal-demo.tsx'
import { SurfaceInvite, SurfaceTokens } from './system-surfaces-demo.tsx'
import { SizeToolbar } from './system-size-toolbar.tsx'
import { SkillComparison } from './skill-page.tsx'
import { highlightedCode } from './doc-preview.tsx'
import { PreviewInspector } from './preview-inspector.tsx'
import { MarkdownSpecimen } from './markdown-specimen.tsx'
import { playCopyError } from './showcase-sound.ts'

function SystemFrame(
  handle: Handle<{
    code: string
    children: RemixNode
    playback?: RemixNode
    onReplay?: () => void
  }>,
) {
  let showCode = false
  let revision = 0
  let copyStatus = ''
  let inspect = false
  let resetCopy: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(resetCopy), { once: true })
  async function copy() {
    try {
      await navigator.clipboard.writeText(handle.props.code)
      copyStatus = 'Copied'
    } catch {
      copyStatus = 'Copy failed'
      playCopyError()
    }
    if (handle.signal.aborted) return
    handle.update()
    clearTimeout(resetCopy)
    resetCopy = setTimeout(() => {
      copyStatus = ''
      handle.update()
    }, 2000)
  }
  return () => (
    <div class="site-preview-card system-frame">
      <div class="system-toolbar">
        <div role="group" aria-label="Demonstration view">
          <button
            type="button"
            aria-pressed={!showCode}
            mix={on('click', () => {
              showCode = false
              handle.update()
            })}
          >
            Preview
          </button>
          <button
            type="button"
            aria-pressed={showCode}
            mix={on('click', () => {
              showCode = true
              handle.update()
            })}
          >
            Code
          </button>
        </div>
        <div class="system-toolbar-actions">
          {!showCode && (
            <Switch
              label="Inspect"
              size="compact"
              checked={inspect}
              onCheckedChange={(value) => {
                inspect = value
                handle.update()
              }}
            />
          )}
          {handle.props.playback ?? (
            <button
              type="button"
              aria-label="Replay example"
              mix={on('click', () => {
                if (handle.props.onReplay) handle.props.onReplay()
                else revision++
                handle.update()
              })}
            >
              ↻
            </button>
          )}
        </div>
      </div>
      {showCode ? (
        <div class="system-code">
          <button type="button" mix={on('click', copy)}>
            {copyStatus || 'Copy'}
          </button>
          <pre tabIndex={0}>
            <code>{highlightedCode(handle.props.code)}</code>
          </pre>
          <span class="site-sr-only" role="status">
            {copyStatus}
          </span>
        </div>
      ) : (
        <div class="system-stage" key={revision}>
          {handle.props.children}
          {inspect && <PreviewInspector />}
        </div>
      )}
    </div>
  )
}

function SystemSection(
  handle: Handle<{ title: string; description?: string; children?: RemixNode }>,
) {
  return () => (
    <section class="site-doc-section system-section">
      <h2>{handle.props.title}</h2>
      {handle.props.description && <p>{handle.props.description}</p>}
      {handle.props.children}
    </section>
  )
}

function HoverComparisonFrame(handle: Handle) {
  let paused = false
  return () => (
    <SystemFrame
      code={`import { fluidHover } from '@rtzll/reflow'

<div mix={fluidHover({ nearest: true })}>
  <span class="rf-highlight rf-hover-highlight" data-rf-hover-layer />
  {folders.map(folder => (
    <button key={folder} type="button" data-rf-hover-item>{folder}</button>
  ))}
</div>`}
      playback={
        <HoverPlayback
          paused={paused}
          onToggle={() => {
            paused = !paused
            handle.update()
          }}
        />
      }
    >
      <HoverComparison paused={paused} />
    </SystemFrame>
  )
}

function HoverList(
  handle: Handle<{ nearest?: boolean; count?: number; math?: boolean; defaultSelected?: string }>,
) {
  let selected = handle.props.defaultSelected
  let moves = 0
  let row = ''
  let pointer = 0
  let center = 0
  let math = false
  const highlight = fluidHover({
    nearest: handle.props.nearest,
    selectedSelector: '[aria-pressed="true"]',
  })
  return () => (
    <div class="system-hover-demo">
      <div
        class="system-hover-list rf-scroll-area"
        data-show-math={math || undefined}
        aria-label="Hover demonstration"
        mix={[
          highlight,
          on<HTMLElement, 'pointermove'>('pointermove', (event) => {
            moves++
            const host = event.currentTarget
            pointer = Math.round(event.clientY - host.getBoundingClientRect().top + host.scrollTop)
            const buttons = Array.from(
              host.querySelectorAll<HTMLButtonElement>('[data-rf-hover-item]'),
            )
            const nearest = buttons.reduce<HTMLButtonElement | undefined>((closest, candidate) => {
              const distance = (node: HTMLElement) =>
                Math.abs(event.clientY - (node.getBoundingClientRect().top + node.offsetHeight / 2))
              return !closest || distance(candidate) < distance(closest) ? candidate : closest
            }, undefined)
            row = nearest?.textContent ?? ''
            center = nearest ? Math.round(nearest.offsetTop + nearest.offsetHeight / 2) : 0
            if (math || handle.props.count) handle.update()
          }),
        ]}
      >
        <span class="rf-highlight system-hover-surface" data-rf-hover-layer="" />
        <span class="rf-highlight system-selection-surface" data-rf-selection-layer="" />
        {(handle.props.count
          ? Array.from(
              { length: handle.props.count },
              (_, i) => `Message ${String(i + 1).padStart(3, '0')}`,
            )
          : ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash']
        ).map((label) => (
          <button
            key={label}
            type="button"
            data-rf-hover-item=""
            aria-pressed={label === selected}
            mix={on('click', () => {
              selected = label
              handle.update()
            })}
          >
            {math && <span aria-hidden="true" class="system-center-dot" />}
            {label}
            <span class="system-row-selected" aria-hidden="true">
              {selected === label ? '✓' : ''}
            </span>
          </button>
        ))}
        {math && (
          <span class="system-pointer-guide" aria-hidden="true" style={{ top: `${pointer}px` }} />
        )}
      </div>
      {handle.props.math && (
        <Switch
          label="Show the math"
          checked={math}
          onCheckedChange={(value) => {
            math = value
            handle.update()
          }}
        />
      )}
      {math && (
        <output class="system-hover-metrics">
          Pointer {pointer}px · nearest center {center}px · distance {Math.abs(pointer - center)}px
        </output>
      )}
      {handle.props.count && (
        <output class="system-hover-metrics">
          {moves} pointer moves · {row || 'Move over a row'} · one shared hover surface
        </output>
      )}
    </div>
  )
}

function AxisBlock(
  handle: Handle<{ axis: 'x' | 'y' | 'both'; hint: string; children: RemixNode }>,
) {
  return () => (
    <div class="system-axis">
      <div class="system-axis-label">
        <code>axis="{handle.props.axis}"</code>
        <span>{handle.props.hint}</span>
      </div>
      {handle.props.children}
    </div>
  )
}

const folders = [
  { label: 'Inbox', description: 'Everything new lands here.' },
  { label: 'Drafts', description: 'Unsent, saved as you type.' },
  { label: 'Sent', description: 'Delivered and archived.' },
  { label: 'Trash', description: 'Emptied after 30 days.' },
]

function GridDemo(handle: Handle) {
  let selected: string | undefined
  return () => (
    <CardGroup columns={2} border="outlined" separated>
      {folders.map(({ label, description }) => (
        <Card
          key={label}
          label={label}
          selected={selected === label}
          onClick={() => {
            selected = label
            handle.update()
          }}
        >
          <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </CardGroup>
  )
}

function SplitListDemo(handle: Handle) {
  let selected = '#workspace-chat'
  const groups = [
    { label: 'Workspace', names: ['Chat', 'Agents', 'Knowledge'] },
    { label: 'Account', names: ['Profile', 'Settings'] },
  ]
  const sections = groups.map((group) => ({
    label: group.label,
    items: group.names.map((label) => ({
      label,
      href: `#${group.label.toLowerCase()}-${label.toLowerCase()}`,
      onClick(event: MouseEvent) {
        event.preventDefault()
        selected = (event.currentTarget as HTMLAnchorElement).getAttribute('href')!
        handle.update()
      },
    })),
  }))
  return () => (
    <div class="system-split-list">
      <Sidebar label="Workspace example" sections={sections} activeHref={selected}>
        <div class="system-navigation-result" role="status">
          {selected.split('-').at(-1)} workspace
        </div>
      </Sidebar>
    </div>
  )
}

const motionTiers = [
  {
    speed: 'fast',
    timing: '0.08s · bounce 0',
    usage: 'hover, fades',
    exit: '60ms',
    settle: 220,
    width: 140,
  },
  {
    speed: 'moderate',
    timing: '0.16s · bounce 0',
    usage: 'dropdowns, tabs',
    exit: '120ms',
    settle: 400,
    width: 260,
  },
  {
    speed: 'slow',
    timing: '0.24s · bounce 0.12',
    usage: 'dialogs, drawers',
    exit: '160ms',
    settle: 560,
    width: 420,
  },
] as const

function MotionDemo(handle: Handle) {
  let active = false
  function toggle() {
    active = !active
    handle.update()
  }
  return () => (
    <SystemFrame
      onReplay={toggle}
      code={`import { motion } from '@rtzll/reflow'

style={{ transition: \`left \${motion.moderate}\` }}`}
    >
      <div class="system-motion-demo">
        {motionTiers.map(({ speed, timing, usage }) => (
          <div class="system-motion-row" key={speed}>
            <div>
              <strong>{speed}</strong>
              <code>{timing}</code>
              <span>{usage}</span>
            </div>
            <button
              class="system-motion-track"
              type="button"
              aria-label={`Run the ${speed} spring`}
              data-at-end={active || undefined}
              style={{ '--system-motion-curve': String(motion[speed]) }}
              mix={on('click', toggle)}
            >
              <span />
            </button>
          </div>
        ))}
        <p>Click a track or replay to run all three springs.</p>
      </div>
    </SystemFrame>
  )
}

function MotionReference(handle: Handle) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const active = new Set<string>()
  handle.signal.addEventListener(
    'abort',
    () => {
      for (const timer of timers.values()) clearTimeout(timer)
    },
    { once: true },
  )

  return () => (
    <div class="system-motion-reference">
      {motionTiers.map(({ speed, timing, usage, exit, settle, width }) => (
        <div key={speed}>
          <strong>{speed}</strong>
          <span>
            → <code>motion.{speed}</code> {timing}
          </span>
          <span>
            ← <code>motionExit.{speed}</code> {exit} · ease-out
          </span>
          <button
            class="system-motion-track"
            type="button"
            aria-label={`Play ${speed} enter then exit`}
            data-at-end={active.has(speed) || undefined}
            style={{
              width: `${width}px`,
              '--system-motion-curve': active.has(speed)
                ? String(motion[speed])
                : motionExit[speed],
            }}
            mix={on('click', () => {
              clearTimeout(timers.get(speed))
              active.add(speed)
              handle.update()
              timers.set(
                speed,
                setTimeout(() => {
                  active.delete(speed)
                  timers.delete(speed)
                  handle.update()
                }, settle),
              )
            })}
          >
            <span />
          </button>
          <span>{usage}</span>
        </div>
      ))}
    </div>
  )
}

function ExitExample(handle: Handle<{ fastExit?: boolean }>) {
  let open = false
  return () => {
    const { fastExit } = handle.props
    const timing = open || !fastExit ? motion.slow : motionExit.slow
    return (
      <div>
        <div class="system-exit-stage" aria-hidden="true">
          <div
            class="system-mini-dialog"
            style={{
              opacity: open ? 1 : 0,
              transform: `scale(${open ? 1 : 0.95})`,
              transition: `opacity ${timing}, transform ${timing}`,
            }}
          >
            <strong>Workspace updated</strong>
            <p>Your changes are ready.</p>
          </div>
        </div>
        <Button
          variant="secondary"
          aria-label={`Toggle the modal with the ${fastExit ? 'faster' : 'same'} exit speed`}
          aria-pressed={open}
          mix={on('click', () => {
            open = !open
            handle.update()
          })}
        >
          Toggle modal
        </Button>
        <span>{fastExit ? 'Faster exit' : 'Same entrance and exit'}</span>
      </div>
    )
  }
}

function ExitDemo() {
  return () => (
    <div class="system-exit-demo">
      <div class="system-exit-pair">
        <ExitExample />
        <ExitExample fastExit />
      </div>
      <p>
        Toggle one, then the other. Both open on <code>motion.slow</code>.
      </p>
    </div>
  )
}

function ScrollRevealDemo(handle: Handle) {
  let subtle = false
  let progress = 0
  let host: HTMLElement | undefined
  const listen = ref<HTMLDivElement>((element, signal) => {
    host = element
    const viewport = element.querySelector<HTMLElement>('.rf-scroll-viewport')!
    viewport.addEventListener(
      'scroll',
      () => {
        const next = Math.round(
          (viewport.scrollTop / Math.max(1, viewport.scrollHeight - viewport.clientHeight)) * 100,
        )
        if (progress !== next) {
          progress = next
          handle.update()
        }
      },
      { signal, passive: true },
    )
  })
  return () => (
    <div class="system-scroll-reveal">
      <div class="example-row">
        <Switch
          label="Subtle scroll reveal"
          checked={subtle}
          onCheckedChange={(value) => {
            subtle = value
            progress = 0
            handle.update()
          }}
        />
        <Button
          variant="ghost"
          size="compact"
          mix={on('click', () =>
            host?.querySelector('.rf-scroll-viewport')?.scrollTo({ top: 0, behavior: 'instant' }),
          )}
        >
          Replay scroll
        </Button>
      </div>
      <div key={String(subtle)} mix={listen}>
        <ScrollArea label="Scroll reveal preview" style={{ height: '340px' }} fade>
          <div class="system-reveal-landing">
            <header>
              <span class="example-note">Tidepool</span>
              <h3>One inbox. Clear next steps.</h3>
              <p>Scroll to explore the sections below.</p>
            </header>
            {[
              'Every message in one place',
              'A clear owner for every thread',
              'Quiet reminders, on your terms',
              'A calmer way to work',
            ].map((title) => (
              <section
                key={title}
                mix={reveal({ preset: subtle ? 'landing-subtle' : 'landing', scroll: true })}
              >
                <h3>{title}</h3>
                <p>
                  Support, sales, and billing share the same workspace. Thoughtful details keep the
                  next action clear.
                </p>
              </section>
            ))}
          </div>
        </ScrollArea>
      </div>
      <output class="system-hover-metrics">Scroll progress {progress}%</output>
    </div>
  )
}

const releaseNotes = Array.from(
  { length: 24 },
  (_, index) => `v1.${23 - index}.0 — maintenance release`,
)
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const cities = [
  'Amsterdam',
  'Berlin',
  'Copenhagen',
  'Dublin',
  'Helsinki',
  'Lisbon',
  'London',
  'Madrid',
  'Oslo',
  'Paris',
  'Prague',
  'Stockholm',
  'Vienna',
  'Warsaw',
  'Zurich',
]

function ReleaseRows() {
  return () => (
    <ul class="system-release-rows">
      {releaseNotes.map((release) => (
        <li key={release}>{release}</li>
      ))}
    </ul>
  )
}

function ScrollProblem() {
  return () => (
    <div class="system-scroll-comparison">
      <figure>
        <div
          class="system-scroll-native"
          role="region"
          aria-label="Native overflow example"
          tabIndex={0}
        >
          <ReleaseRows />
        </div>
        <figcaption>
          <span aria-hidden="true">❌</span> Native overflow may hide the scrollbar
        </figcaption>
      </figure>
      <figure>
        <ScrollArea className="system-scroll-comparison-area" label="Scrollable example" fade>
          <ReleaseRows />
        </ScrollArea>
        <figcaption>
          <span aria-hidden="true">✅</span> ScrollArea shows the thumb and fades the edge
        </figcaption>
      </figure>
    </div>
  )
}

function ScrollDemo(handle: Handle<{ horizontal?: boolean; fade?: boolean; both?: boolean }>) {
  return () => {
    const orientation = handle.props.both
      ? 'both'
      : handle.props.horizontal
        ? 'horizontal'
        : 'vertical'
    return (
      <ScrollArea
        className={`system-scroll system-scroll-${orientation}`}
        orientation={orientation}
        fade={handle.props.fade}
        label="Scrollable example"
      >
        {handle.props.both ? (
          <table class="system-overflow-table">
            <thead>
              <tr>
                <th scope="col">City</th>
                {months.map((month) => (
                  <th scope="col" key={month}>
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((city, row) => (
                <tr key={city}>
                  <th scope="row">{city}</th>
                  {months.map((month, column) => (
                    <td key={month}>{(((row + 3) * (column + 7) * 37) % 900) + 100}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : handle.props.horizontal ? (
          <div class="system-scroll-months">
            {months.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        ) : (
          <ReleaseRows />
        )}
      </ScrollArea>
    )
  }
}

const typeRoles = [
  ['Display', 'A page title'],
  ['Title', 'A section title'],
  ['Subtitle', 'A subsection title'],
  ['Body', 'A line of body text'],
  ['Caption', 'A caption below a figure'],
  ['Micro', 'A compact annotation'],
] as const

function TypeScale() {
  return () => (
    <div class="system-type-scale">
      {typeRoles.map(([name, specimen]) => {
        const role = name.toLowerCase()
        return (
          <div key={role}>
            <span
              style={{
                fontSize: `var(--rf-text-${role})`,
                lineHeight: `var(--rf-leading-${role})`,
                fontFamily: ['display', 'title'].includes(role)
                  ? 'var(--rf-heading-font)'
                  : undefined,
              }}
            >
              {specimen}
            </span>
            <code>
              {name} · --rf-text-{role}
            </code>
          </div>
        )
      })}
    </div>
  )
}

function DensityDemo(handle: Handle) {
  let density = 'compact'
  let query = ''
  let measured = ''
  let selected = ['Design system']
  const measurement = ref<HTMLDivElement>((element, signal) => {
    const input = element.querySelector('input')!
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(input)
      const next = `${Math.round(input.getBoundingClientRect().height)}px control · ${style.fontSize} type · ${style.lineHeight} line height`
      if (measured !== next) {
        measured = next
        handle.update()
      }
    })
    observer.observe(input)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })
  return () => (
    <div class="system-density-demo">
      <Tabs
        label="Region density"
        value={density}
        onValueChange={(value) => {
          density = value
          handle.update()
        }}
        items={[
          { value: 'default', label: 'Default' },
          { value: 'compact', label: 'Compact' },
        ]}
      />
      <div data-density={density} class="system-density-region" mix={measurement}>
        <Input
          aria-label="Filter example projects"
          placeholder="Filter projects…"
          value={query}
          mix={on<HTMLInputElement, 'input'>('input', (event) => {
            query = event.currentTarget.value
            handle.update()
          })}
        />
        {['Design system', 'Website', 'Mobile app']
          .filter((label) => label.toLowerCase().includes(query.toLowerCase()))
          .map((label) => (
            <Checkbox
              key={label}
              label={label}
              checked={selected.includes(label)}
              onCheckedChange={(checked) => {
                selected = checked
                  ? [...selected, label]
                  : selected.filter((item) => item !== label)
                handle.update()
              }}
            />
          ))}
        <span class="example-note" role="status">
          {selected.length} selected
        </span>
      </div>
      <output class="system-hover-metrics">{measured}</output>
    </div>
  )
}

function SurfaceDemo(handle: Handle) {
  let range: [number, number] = [1, 4]
  return () => {
    let layers: RemixNode = (
      <p class="example-note">The innermost surface follows the selected range.</p>
    )
    for (let level = range[1]; level >= range[0]; level--) {
      layers = (
        <div
          class="system-elevation-layer"
          data-level={level}
          style={{ background: `var(--rf-surface-${level})` }}
        >
          <code>surface-{level}</code>
          {layers}
        </div>
      )
    }
    return (
      <div class="system-elevation-demo">
        <Slider
          label="Surface range"
          min={1}
          max={8}
          step={1}
          value={range}
          showSteps
          onChange={(value) => {
            if (Array.isArray(value)) {
              range = value
              handle.update()
            }
          }}
        />
        <div class="system-elevation-stack">{layers}</div>
      </div>
    )
  }
}

function HeadingDemo(handle: Handle) {
  let font = 'inter'
  let custom: GoogleFont | undefined
  let weight = 'auto'
  let open = false
  let invoker: HTMLElement | null = null
  function browse() {
    invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null
    open = true
    handle.update()
  }
  function close() {
    open = false
    handle.update()
    handle.queueTask(() => invoker?.focus({ preventScroll: true }))
  }
  function choose(next: GoogleFont) {
    if (weight !== 'auto') {
      const nearest = fontWeights(next).reduce((best, candidate) =>
        Math.abs(candidate - Number(weight)) < Math.abs(best - Number(weight)) ? candidate : best,
      )
      weight = String(nearest)
    }
    custom = next
    font = 'custom'
    close()
  }
  return () => {
    const customActive = font === 'custom' && custom
    const fontFamily = customActive
      ? `${JSON.stringify(customActive.n)}, var(--rf-font)`
      : font === 'geist-serif'
        ? '"Geist Serif", serif'
        : 'var(--rf-font)'
    const weightOverride =
      customActive && weight !== 'auto' ? Number(weight) : font === 'geist-serif' ? 400 : undefined
    return (
      <div class="site-preview-card">
        <div class="system-stage">
          <div class="system-heading-demo">
            <div class="system-heading-controls">
              <Tabs
                label="Heading font"
                value={font}
                onValueChange={(value) => {
                  if (value === 'custom' && !custom) browse()
                  else {
                    font = value
                    handle.update()
                  }
                }}
                items={[
                  { value: 'inter', label: 'Inter' },
                  { value: 'geist-serif', label: 'Geist Serif' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
              <div class="system-heading-actions">
                {customActive && (
                  <Select
                    label="Heading weight"
                    value={weight}
                    options={[
                      { value: 'auto', label: 'Auto' },
                      ...fontWeights(customActive).map((value) => ({
                        value: String(value),
                        label: String(value),
                      })),
                    ]}
                    onValueChange={(value) => {
                      weight = value ?? 'auto'
                      handle.update()
                    }}
                  />
                )}
                <Button variant="secondary" mix={on('click', browse)}>
                  Browse Google Fonts
                </Button>
              </div>
            </div>
            {customActive && <link rel="stylesheet" href={fontStylesheet(customActive)} />}
            <div class="system-heading-sample" style={{ fontFamily }}>
              <h3 style={{ fontWeight: weightOverride ?? 700 }}>Getting started</h3>
              <h3 style={{ fontWeight: weightOverride ?? 550 }}>Install the components you need</h3>
              <p>Body text stays in Inter, so only the hierarchy changes voice.</p>
            </div>
          </div>
        </div>
        <FontPickerDialog
          open={open}
          selected={custom?.n ?? ''}
          onClose={close}
          onChoose={choose}
        />
      </div>
    )
  }
}

function NumberDemo(handle: Handle) {
  let count = 1099
  return () => (
    <div class="system-number-demo">
      <div class="system-number-pair">
        <div>
          <span class="example-note">Proportional figures</span>
          <p>{count} events</p>
        </div>
        <div>
          <span class="example-note">Tabular figures</span>
          <p style={{ fontVariantNumeric: 'tabular-nums' }}>{count} events</p>
        </div>
      </div>
      <Button
        variant="tertiary"
        mix={on('click', () => {
          count++
          handle.update()
        })}
      >
        Add an event
      </Button>
    </div>
  )
}

function SpacingDemo(handle: Handle) {
  let gap = 16
  return () => (
    <div class="system-spacing-demo">
      <Slider
        label="Paragraph spacing"
        min={0}
        max={40}
        step={4}
        value={gap}
        formatValue={(value) => `${value}px`}
        onChange={(value) => {
          if (typeof value === 'number') {
            gap = value
            handle.update()
          }
        }}
      />
      <article class="system-prose">
        <h3>A clear rhythm</h3>
        <p style={{ marginTop: `${gap}px` }}>
          Space belongs above the next block, where a new thought begins.
        </p>
        <p style={{ marginTop: `${gap}px` }}>
          As content grows, the paragraphs retain their line height and alignment.
        </p>
      </article>
    </div>
  )
}

const typographyTweaks = [
  {
    title: 'Trimmed labels',
    property: 'text-box: trim-both cap alphabetic',
    plain: 'Font box',
    adjusted: 'Trimmed cap and baseline',
    sample: 'Dashboard',
    kind: 'trim',
  },
  {
    title: 'Balanced headings',
    property: 'text-wrap: balance',
    plain: 'Normal wrapping',
    adjusted: 'Balanced wrapping',
    sample: 'A quieter place for your team to do its best work',
    kind: 'balance',
  },
  {
    title: 'Pretty paragraphs',
    property: 'text-wrap: pretty',
    plain: 'Normal wrapping',
    adjusted: 'Pretty wrapping',
    sample:
      'A shared workspace gives your team a place to make decisions, keep a record, and move forward together.',
    kind: 'pretty',
  },
] as const

function TypographyComparison(handle: Handle<{ tweak: (typeof typographyTweaks)[number] }>) {
  return () => (
    <div class="system-type-comparison" data-tweak={handle.props.tweak.kind}>
      {[handle.props.tweak.plain, handle.props.tweak.adjusted].map((label, index) => (
        <figure key={label} data-adjusted={index === 1 || undefined}>
          <div>
            <p>{handle.props.tweak.sample}</p>
          </div>
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function TokenTable(
  handle: Handle<{ rows: readonly (readonly string[])[]; headings?: readonly string[] }>,
) {
  return () => (
    <div class="site-props-scroll">
      <table class="site-props">
        <thead>
          <tr>
            {(handle.props.headings ?? ['Token', 'Default', 'Compact']).map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {handle.props.rows.map(([name, value, compact]) => (
            <tr key={name}>
              <th>
                <code>{name}</code>
              </th>
              <td>{value}</td>
              <td>{compact ?? value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const SystemPage = clientEntry(
  import.meta.url,
  function SystemPage(handle: Handle<{ slug: string }>) {
    return () => {
      switch (handle.props.slug) {
        case 'fluid-hover':
          return (
            <div class="system-page">
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection
                title="Blink or glide"
                description="Watch both cursors. The highlight on the left blinks out in every gap. The highlight on the right stays visible and glides from one row to the next."
              >
                <HoverComparisonFrame />
              </SystemSection>
              <SystemSection
                title="Show the math"
                description="With nearest enabled, the closest row stays highlighted even in the gaps."
              >
                <SystemFrame
                  code={
                    '<div mix={fluidHover({ nearest: true })}>\n  <span class="rf-highlight" data-rf-hover-layer />\n  <button data-rf-hover-item>Inbox</button>\n</div>'
                  }
                >
                  <HoverList nearest math defaultSelected="Inbox" />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="3 axes"
                description="Nearest hover follows the tab strip, runs down the list, or finds the closest card in the grid."
              >
                <SystemFrame
                  code={
                    'fluidHover({ axis: "x", nearest: true })\nfluidHover({ axis: "y", nearest: true })\nfluidHover({ axis: "both", nearest: true })'
                  }
                >
                  <div class="system-axes">
                    <AxisBlock axis="x" hint="Strips · tabs">
                      <Tabs
                        label="Folders"
                        defaultValue="Library"
                        items={['Library', 'Recents', 'Favorites', 'Settings'].map((label) => ({
                          value: label,
                          label,
                        }))}
                      />
                    </AxisBlock>
                    <AxisBlock axis="y" hint="Lists · menus, tables, radios">
                      <HoverList nearest />
                    </AxisBlock>
                    <AxisBlock axis="both" hint="Grids · card groups">
                      <GridDemo />
                    </AxisBlock>
                  </div>
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="When to split a list"
                description="Keep related choices together. Separate workspace navigation from account actions."
              >
                <SystemFrame code={'<Sidebar sections={[workspace, account]} />'}>
                  <SplitListDemo />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="What it costs"
                description="Two hundred rows share a single hover element. Move through the list to see the event count."
              >
                <SystemFrame
                  code={'fluidHover({ nearest: true }) // one surface shared by 200 rows'}
                >
                  <HoverList nearest count={200} defaultSelected="Message 001" />
                </SystemFrame>
              </SystemSection>
              <div class="system-hover-guidance">
                <SystemSection title="Use when">
                  <ul>
                    <li>Every row or card can be clicked.</li>
                    <li>Items are close together and remain in place.</li>
                    <li>Menus, tabs, and grids present related choices.</li>
                  </ul>
                </SystemSection>
                <SystemSection title="Skip when">
                  <ul>
                    <li>An accidental click has serious consequences.</li>
                    <li>Only some items can be clicked.</li>
                    <li>Large gaps separate the items, or rows shift during scrolling.</li>
                  </ul>
                </SystemSection>
              </div>
              <SystemSection
                title="Reduced motion"
                description="With reduced motion enabled, the highlight remains available without traveling between rows. The scripted comparison stops, and the lists still respond to your pointer."
              />
              <SystemSection
                title="Reference"
                description="Attach the fluidHover mix to a positioned list or grid. Keep focus, roles, and keyboard handling on its controls."
              >
                <h3>Options</h3>
                <TokenTable
                  headings={['Option', 'Type', 'Purpose']}
                  rows={[
                    [
                      'axis',
                      'x | y | both',
                      'The dimension used to measure proximity. Defaults to y.',
                    ],
                    ['nearest', 'boolean', 'Keep the highlight active in gaps. Defaults to false.'],
                    [
                      'highlightedSelector',
                      'string',
                      'Read the highlighted row from a primitive or scripted demonstration.',
                    ],
                    ['selectedSelector', 'string', 'Track a separate selection surface.'],
                  ]}
                />
                <h3>Returns</h3>
                <p>
                  The mix array can be assigned to the host element’s <code>mix</code> prop or
                  combined with its other mixes.
                </p>
                <h3>Highlight layers</h3>
                <TokenTable
                  headings={['Attribute', 'Element', 'Purpose']}
                  rows={[
                    ['data-rf-hover-item', 'Interactive row', 'Marks a target inside the host.'],
                    ['data-rf-hover-layer', 'Direct child', 'Draws the shared hover surface.'],
                    [
                      'data-rf-selection-layer',
                      'Direct child',
                      'Optionally draws the separate selection surface.',
                    ],
                  ]}
                />
                <p>
                  Use <code>rf-highlight</code> for layer geometry and{' '}
                  <code>rf-hover-highlight</code> for the standard hover color.
                </p>
              </SystemSection>
            </div>
          )
        case 'motion':
          return (
            <div class="system-page">
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection
                title="Three speeds"
                description="Small changes should feel quick. Use fast for hover and fades, moderate for dropdowns and tabs, and slow for larger transitions such as dialogs and drawers. The moderate spring settles without overshooting, so it works well for panels that need to land precisely."
              >
                <MotionDemo />
              </SystemSection>
              <SystemSection
                title="Slow in, faster out"
                description="Both panels open with the slow spring. Compare a panel that closes with the same spring against one that uses a shorter exit."
              >
                <SystemFrame
                  code={
                    'import { motion, motionExit } from "@rtzll/reflow"\nstyle={{ transition: `opacity ${open ? motion.slow : motionExit.slow}` }}'
                  }
                >
                  <ExitDemo />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="All tokens"
                description="Click a track to see it enter on the spring and return on the exit curve."
              >
                <MotionReference />
                <h3>Reduced motion</h3>
                <p>
                  Reflow reduces travel and decorative loops according to the operating system
                  preference. Controls retain their state and focus feedback.
                </p>
              </SystemSection>
            </div>
          )
        case 'reveal':
          return (
            <div class="system-page">
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection
                title="Landing"
                description="Use a default or subtle entrance for a page people read from top to bottom. Each section arrives when it reaches the viewport."
              >
                <RevealPresetDemo />
              </SystemSection>
              <SystemSection
                title="Product"
                description="Give a frequently visited workspace a short entrance. The product presets keep vertical position and scale steady."
              >
                <RevealPresetDemo product />
                <p>
                  For slow data, keep the final rows’ footprint in the loading placeholders. Replace
                  the placeholders when data arrives and stagger the real rows with the product
                  preset.
                </p>
              </SystemSection>
              <div class="system-hover-guidance">
                <SystemSection title="Set it up">
                  <ul>
                    <li>
                      Include the product screenshot in the hero when it appears on first paint.
                    </li>
                    <li>Keep the header, sidebar, and footer outside the reveal groups.</li>
                    <li>
                      Set <code>scroll: true</code> for content that should follow scroll progress.
                    </li>
                    <li>
                      Use <code>overflow: clip</code> when you need clipping without a new scroll
                      container.
                    </li>
                  </ul>
                </SystemSection>
                <SystemSection title="Built in">
                  <ul>
                    <li>Landing uses the slow spring, product uses the moderate spring.</li>
                    <li>Indices apply the same stagger interval to related elements.</li>
                    <li>Browsers without scroll timelines use the entrance animation.</li>
                    <li>Reduced motion keeps the content still.</li>
                  </ul>
                </SystemSection>
              </div>
              <SystemSection title="Reference">
                <h3>Presets</h3>
                <TokenTable
                  headings={['Preset', 'Travel / scale', 'Stagger']}
                  rows={[
                    ['landing', '12px / 0.94', '100ms'],
                    ['landing-subtle', '8px / 0.98', '60ms'],
                    ['product', '0px / 1', '60ms'],
                    ['product-subtle', '0px / 1', '40ms'],
                  ]}
                />
                <h3>Loading</h3>
                <p>
                  Mount the real rows as their data becomes available. Keep the placeholder and
                  loaded rows at the same height to avoid shifting the layout.
                </p>
                <SystemFrame
                  code={
                    'import { reveal } from "@rtzll/reflow"\n\n<li mix={reveal({ preset: "product", index })}>{thread.subject}</li>'
                  }
                >
                  <p>Apply the reveal mix to the loaded row and pass its index for the stagger.</p>
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="Scroll-linked sections"
                description="Sections arrive as they enter the viewport and leave as they cross its top. Scroll in either direction to reverse the progress."
              >
                <SystemFrame
                  code={'<section mix={reveal({ preset: "landing", scroll: true })}>…</section>'}
                >
                  <ScrollRevealDemo />
                </SystemFrame>
              </SystemSection>
            </div>
          )
        case 'scrollbars':
          return (
            <div class="system-page">
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection
                title="The problem"
                description="On platforms that hide native scrollbars until you scroll, a clipped list can look like it simply ends. Compare the same release notes with a custom thumb and a fade at the edge."
              >
                <SystemFrame
                  code={
                    '<div style={{ overflowY: "auto", height: "224px" }}><ReleaseRows /></div>\n<ScrollArea fade style={{ height: "224px" }}><ReleaseRows /></ScrollArea>'
                  }
                >
                  <ScrollProblem />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="The scrollbar"
                description="The thumb rests narrow and low contrast, then widens when you reach for it. Scroll with a wheel or trackpad, drag the thumb, or use the keyboard. On touch-primary devices the component uses the platform’s native scrolling gestures."
              />
              <SystemSection
                title="The fade"
                description="A fade marks the edges with hidden content. At the true start or end, that edge clears."
              >
                <SystemFrame
                  code={'<ScrollArea fade label="Release notes"><ReleaseRows /></ScrollArea>'}
                >
                  <ScrollDemo fade />
                </SystemFrame>
              </SystemSection>
              <SystemSection title="Examples">
                <h3>Horizontal</h3>
                <p>
                  A row of months is wider than its container. The fade marks the side with more
                  content.
                </p>
                <SystemFrame
                  code={'<ScrollArea orientation="horizontal" fade><MonthCards /></ScrollArea>'}
                >
                  <ScrollDemo horizontal fade />
                </SystemFrame>
                <h3>Double overflow</h3>
                <p>
                  A table is taller and wider than its viewport. Set <code>orientation="both"</code>{' '}
                  to expose both axes.
                </p>
                <SystemFrame
                  code={'<ScrollArea orientation="both"><CityMetricsTable /></ScrollArea>'}
                >
                  <ScrollDemo both />
                </SystemFrame>
              </SystemSection>
              <SystemSection title="API reference">
                <h3>ScrollArea</h3>
                <TokenTable
                  headings={['Property', 'Value', 'Purpose']}
                  rows={[
                    [
                      'ScrollArea.orientation',
                      'vertical | horizontal | both',
                      'Visible scrollbar axes',
                    ],
                    ['ScrollArea.fade', 'boolean', 'Fade content edges'],
                    [
                      'ScrollArea.viewportClassName',
                      'string',
                      'Style the native scrolling viewport',
                    ],
                    ['.rf-scroll-area', 'CSS class', 'Native scroll container'],
                    ['scrollFade.orientation', 'vertical | horizontal | both', 'Edges to fade'],
                    ['scrollFade.distance', '20px', 'Maximum edge fade'],
                    ['Coarse pointer', 'Native scrollbar', 'Retains platform gestures'],
                  ]}
                />
              </SystemSection>
            </div>
          )
        case 'sizes':
          return (
            <div class="system-page">
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection title="The principle">
                <p>
                  A button next to a select next to a tab should land at the same height. Each size
                  scales text, icons, and padding together.
                </p>
                <p>
                  Use compact controls in dense, data-heavy regions. Default gives everyday controls
                  more room.
                </p>
                <SystemFrame
                  code={
                    '<div data-density="default"><Toolbar /></div>\n<div data-density="compact"><Toolbar /></div>'
                  }
                >
                  <SizeToolbar />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="Typography scale"
                description="Compact reduces type size and line height together, preserving the hierarchy at a smaller size."
              >
                <p>
                  See the full scale in <a href="/docs/typography">Typography</a>. Press S outside a
                  field to switch between densities.
                </p>
              </SystemSection>
              <SystemSection
                title="Compact regions"
                description="Set density on an ancestor to scale a whole group. Switch the example and compare the measured control height."
              >
                <SystemFrame
                  code={
                    '<section data-density="compact">\n  <Input aria-label="Search" />\n  <Button>Search</Button>\n</section>'
                  }
                >
                  <DensityDemo />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="Token reference"
                description="Inspect either toolbar row to measure the controls alongside the tokens below."
              >
                <TokenTable
                  rows={[
                    ['--rf-control-height', '36px', '28px'],
                    ['--rf-control-padding', '12px', '10px'],
                    ['--rf-text-display', '28px', '24px'],
                    ['--rf-text-title', '16px', '15px'],
                    ['--rf-text-body', '13px', '12px'],
                    ['--rf-text-caption', '12px', '11px'],
                    ['--rf-text-micro', '11px', '10px'],
                    ['--rf-leading-body', '20px', '18px'],
                    ['--rf-gap', '8px', '4px'],
                    ['--rf-icon-size', '16px', '14px'],
                  ]}
                />
              </SystemSection>
              <SystemSection
                title="Regional density reference"
                description="Use data-density on an element to set the inherited CSS tokens. A nested region can override its ancestor’s density."
              >
                <TokenTable
                  headings={['Attribute', 'Values', 'Scope']}
                  rows={[['data-density', 'default | compact', 'Element and descendants']]}
                />
              </SystemSection>
              <SystemSection
                title="Component size prop"
                description="Use the size prop to override density for one control."
              >
                <TokenTable
                  headings={['Prop', 'Values', 'Components']}
                  rows={[
                    ['size', 'default | compact', 'Tabs, Select, and other controls'],
                    ['size', 'default | compact | icon | icon-compact', 'Button'],
                  ]}
                />
              </SystemSection>
            </div>
          )
        case 'surfaces':
          return (
            <div class="system-page">
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection title="The problem">
                <p>
                  In light mode, shadows distinguish white surfaces. In dark mode, raised surfaces
                  are also lighter.
                </p>
                <p>
                  A fixed background can make a dropdown blend into its dialog. In this example,
                  both the invite panel and the menu use surface 5.
                </p>
                <SystemFrame
                  code={
                    '/* Both elements use the same fixed fill. */\n.invite-panel, .role-menu { background: var(--rf-surface-5); }'
                  }
                >
                  <SurfaceInvite flat />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="The solution"
                description="Choose the background token for the substrate, then give nested panels a higher level."
              >
                <h3>Tokens</h3>
                <p>
                  Eight background levels work in both themes. In light mode, levels 3–8 share a
                  white fill and elevation comes from the shadow.
                </p>
                <SystemFrame code={'style={{ background: "var(--rf-surface-3)" }}'}>
                  <SurfaceTokens />
                </SystemFrame>
                <h3>Substrate</h3>
                <p>
                  A floating control sits above the surface that contains it. Compare a two-level
                  elevation over a page, panel, and dialog.
                </p>
                <SystemFrame
                  code={
                    'const elevated = Math.min(substrate + 2, 8)\nstyle={{ background: `var(--rf-surface-${elevated})` }}'
                  }
                >
                  <div class="system-substrates">
                    {[1, 3, 5].map((level, index) => (
                      <div key={level} style={{ background: `var(--rf-surface-${level})` }}>
                        <strong>
                          {['On the page', 'Inside a popover', 'Inside a dialog'][index]}
                        </strong>
                        <div style={{ background: `var(--rf-surface-${level + 2})` }}>
                          <Checkbox label="Notifications" defaultChecked />
                          <Checkbox label="Weekly digest" />
                        </div>
                        <code>
                          surface-{level} → surface-{level + 2}
                        </code>
                      </div>
                    ))}
                  </div>
                </SystemFrame>
                <h3>Elevated</h3>
                <p>
                  Apply the chosen background and elevation shadow to the panel. Choose a stronger
                  contrast between nested surfaces when the contents need a distinct boundary.
                </p>
                <SystemFrame
                  code={
                    'style={{ background: "var(--rf-surface-5)", boxShadow: "var(--rf-elevation)" }}'
                  }
                >
                  <div class="system-surface-stack">
                    <div>
                      <strong>Workspace</strong>
                      <div>
                        <strong>Settings</strong>
                        <Input aria-label="Workspace name" defaultValue="Studio" />
                        <Switch label="Notifications" defaultChecked />
                      </div>
                    </div>
                  </div>
                </SystemFrame>
                <h3>Move through levels</h3>
                <p>
                  Drag either thumb to choose which levels to nest. Each layer is one step above its
                  parent.
                </p>
                <SystemFrame
                  code={
                    '<Slider min={1} max={8} value={range} onChange={setRange} />\n// Render each selected level with its --rf-surface-N token.'
                  }
                >
                  <SurfaceDemo />
                </SystemFrame>
              </SystemSection>
              <SystemSection title="Examples">
                <h3>Invite dialog</h3>
                <p>
                  Give the role menu a separate surface so it is distinguishable from the
                  surrounding panel.
                </p>
                <SystemFrame
                  code={
                    '.invite-panel { background: var(--rf-surface-5); }\n.role-menu { background: var(--rf-surface-7); }'
                  }
                >
                  <SurfaceInvite />
                </SystemFrame>
                <h3>Color picker</h3>
                <p>
                  A color picker pairs a raised editing panel with a format control. Open the
                  control and switch between color formats.
                </p>
                <SystemFrame
                  code={'<ColorPicker variant="inline" defaultValue="#6B97FF" swatches={[]} />'}
                >
                  <div class="system-surface-color">
                    <ColorPicker variant="inline" defaultValue="#6B97FF" swatches={[]} />
                  </div>
                </SystemFrame>
              </SystemSection>
              <SystemSection title="Reference">
                <TokenTable
                  headings={['Token', 'Light', 'Dark']}
                  rows={[
                    ['--rf-surface-1', '#fafafa', '#171717'],
                    ['--rf-surface-2', '#fcfcfc', '#1e1e1e'],
                    ['--rf-surface-3', '#ffffff', '#252525'],
                    ['--rf-surface-4', '#ffffff', '#2c2c2c'],
                    ['--rf-surface-5', '#ffffff', '#333333'],
                    ['--rf-surface-6', '#ffffff', '#3a3a3a'],
                    ['--rf-surface-7', '#ffffff', '#414141'],
                    ['--rf-surface-8', '#ffffff', '#484848'],
                  ]}
                />
              </SystemSection>
            </div>
          )
        case 'typography':
          return (
            <div class="system-page">
              <p class="system-intro">
                A small set of type rules does most of the work. The same sizes, weights, and text
                colors apply to page titles, controls, and Markdown, so each piece keeps its place
                in the hierarchy.
              </p>
              <SystemInstallation topic={handle.props.slug} />
              <SystemSection title="5 rules">
                <ul class="system-type-rules">
                  <li>
                    Six shared type roles cover everything from page titles to the smallest
                    annotation.
                  </li>
                  <li>
                    Regular is for body text, semibold is for headings and selected items, and bold
                    is for page titles.
                  </li>
                  <li>Use foreground and muted for text.</li>
                  <li>
                    Set body text in Inter Variable. Use Inter, Geist Serif, or a selected Google
                    Fonts family for headings.
                  </li>
                  <li>Use one paragraph style across the site.</li>
                </ul>
              </SystemSection>
              <SystemSection title="5 no-gos">
                <ul class="system-type-rules">
                  <li>Avoid uppercase for hierarchy. Use size and weight.</li>
                  <li>Leave letter spacing to Inter’s optical sizing.</li>
                  <li>Start a section with its title.</li>
                  <li>
                    Give Markdown the same type roles and text colors as the rest of the site.
                  </li>
                  <li>Use a text color token for hierarchy and leave opacity at full strength.</li>
                </ul>
              </SystemSection>
              <SystemSection
                title="The scale"
                description="Each role pairs a font size with a line height. Press S outside a field to compare compact density."
              >
                <SystemFrame
                  code={
                    'style={{ fontSize: "var(--rf-text-title)", lineHeight: "var(--rf-leading-title)" }}'
                  }
                >
                  <TypeScale />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="Heading font"
                description="Compare Inter and Geist Serif, or browse Google Fonts to try another family and weight in the specimen."
              >
                <HeadingDemo />
              </SystemSection>
              <SystemSection
                title="Markdown"
                description="Markdown uses the same type roles, including nested lists, to-dos, tables, and fenced code. Edit the source to see how the styles hold up."
              >
                <SystemFrame
                  code={'<article class="system-markdown">{renderMarkdown(source)}</article>'}
                >
                  <MarkdownSpecimen />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="Spacing"
                description="Give a new block its space above. The Markdown specimen uses these gaps, and the comparison lets you vary the paragraph spacing while its line height stays constant."
              >
                <TokenTable
                  headings={['Markdown gap', 'Value', 'Placement']}
                  rows={[
                    ['Heading section', '28px', 'Above a second-level heading'],
                    ['Heading subsection', '20px', 'Above a lower-level heading'],
                    ['Block gap', '12px', 'Between consecutive blocks'],
                    ['List item', '4px', 'Between list items'],
                    ['Divider', '24px', 'Around a rule'],
                  ]}
                />
                <SystemFrame
                  code={
                    '<p style={{ marginTop: "16px", lineHeight: "var(--rf-leading-body)" }}>…</p>'
                  }
                >
                  <SpacingDemo />
                </SystemFrame>
              </SystemSection>
              <SystemSection
                title="5 tweaks"
                description="Small adjustments keep labels steady, padding visible, and wrapped text even."
              >
                <h3>Weight without reflow</h3>
                <p>
                  Reserve the heavier label width so selection keeps neighboring controls in place.
                </p>
                <SkillComparison kind="tabs" />
                <h3>Steady numbers</h3>
                <p>Tabular figures keep counters aligned as their digits change.</p>
                <SystemFrame code={'style={{ fontVariantNumeric: "tabular-nums" }}'}>
                  <NumberDemo />
                </SystemFrame>
                {typographyTweaks.map((tweak) => (
                  <div class="system-type-tweak" key={tweak.kind}>
                    <h3>{tweak.title}</h3>
                    <p>
                      <code>{tweak.property}</code>
                    </p>
                    <TypographyComparison tweak={tweak} />
                  </div>
                ))}
              </SystemSection>
              <SystemSection title="Reference">
                <TokenTable
                  headings={['Token', 'Value', 'Purpose']}
                  rows={[
                    ['--rf-font', 'Inter, system-ui, sans-serif', 'Body and controls'],
                    ['--rf-heading-font', 'Selected heading family', 'Titles and headings'],
                    ['--rf-weight-normal', 'wght 400 / opsz 14', 'Regular text'],
                    ['--rf-weight-strong', 'wght 550 / opsz 18', 'Emphasized labels'],
                    ['--rf-weight-bold', 'wght 700 / opsz 25', 'Page titles'],
                  ]}
                />
              </SystemSection>
            </div>
          )
      }
      return null
    }
  },
)
