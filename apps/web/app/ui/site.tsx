import { Icon as ReflowIcon, Kbd, Switch, type IconName } from '@rtzll/reflow'
import type { Handle, RemixNode } from 'remix/component'
import type { ExampleImages } from '../assets.ts'
import { samplesFor } from '../public/code-block-example.tsx'
import { routes } from '../routes.ts'
import { PlaygroundControls } from '../public/doc-playground.tsx'
import { ApiPropTable } from '../public/api-prop-table.tsx'
import { DocPreview } from '../public/doc-preview.tsx'
import { apiDescription, componentReference } from '../component-reference.ts'
import { fontWeights } from '../public/google-fonts.ts'
import { fontCatalog } from '../public/google-font-catalog.ts'
import { SiteControls } from '../public/site-controls.tsx'
import {
  InstallPromptButton,
  reflowInstallCommand,
  ResetSettingsButton,
  ShareSettingsButton,
} from '../public/install-prompt.tsx'
import { ShowcaseSoundButton } from '../public/showcase-sound-button.tsx'
import { AccentPicker } from '../public/accent-picker.tsx'

import { settingRows, settingLabel, readSettings, type Settings } from '../public/site-settings.ts'
export { readSettings } from '../public/site-settings.ts'

export interface ShowcaseComponent {
  slug: string
  name: string
  description: string
  preview?: RemixNode
  controls?: RemixNode
  source?: string
  code?: string
  category?: string
  props?: readonly { name: string; type: string; description: string; defaultValue?: string }[]
}

export interface ShowcaseProps {
  page: 'gallery' | 'docs' | 'component'
  components: readonly ShowcaseComponent[]
  slug?: string
  query?: string
  settings?: Settings
  images: ExampleImages
}

interface PageLink {
  name: string
  href: string
}

// Settings live in cookies, so internal links stay clean. Shared links add them
// on purpose; the server saves them and redirects to the clean URL.
function pageHref(path: string, query: Record<string, string> = {}) {
  let search = new URLSearchParams(query).toString()
  return search ? `${path}?${search}` : path
}

function Icon(
  handle: Handle<{ name: 'arrow' | 'search' | 'menu' | 'chevron' | 'copy' | 'github' }>,
) {
  return () => {
    const names = {
      arrow: 'arrow-right',
      search: 'search',
      menu: 'menu',
      chevron: 'chevron-down',
      copy: 'copy',
    } satisfies Record<string, IconName>
    const { name } = handle.props
    if (name !== 'github') return <ReflowIcon name={names[name]} />
    const paths = {
      github:
        'M9 19c-4 1.3-4-2-6-2m12 4v-3.4c0-1 .1-1.4-.5-2 3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19.3 5a5 5 0 0 0-.1-3.6s-1.2-.4-3.9 1.4a13 13 0 0 0-7 0C5.6 1 4.4 1.4 4.4 1.4A5 5 0 0 0 4.3 5 5.2 5.2 0 0 0 3 8.9c0 5.2 3.2 6.4 6.2 6.7-.4.4-.5 1-.5 2V21',
    }
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d={paths[name]} />
      </svg>
    )
  }
}

function HeadingControls(
  handle: Handle<{ previous?: PageLink; next?: PageLink; soundEnabled: boolean }>,
) {
  return () => {
    let { previous, next, soundEnabled } = handle.props
    return (
      <div class="site-heading-controls">
        <ShowcaseSoundButton enabled={soundEnabled} />
        <nav class="site-page-arrows" aria-label="Adjacent pages">
          {(['previous', 'next'] as const).map((direction) => {
            let link = direction === 'previous' ? previous : next
            let name = direction === 'previous' ? 'Previous' : 'Next'
            let label = link ? `${name}: ${link.name}` : `No ${direction} page`
            return link ? (
              <a
                key={direction}
                class={`site-icon-button site-arrow-${direction}`}
                href={link.href}
                aria-label={label}
                title={link.name}
              >
                <Icon name="arrow" />
              </a>
            ) : (
              <button
                key={direction}
                type="button"
                class={`site-icon-button site-arrow-${direction}`}
                disabled
                aria-label={label}
              >
                <Icon name="arrow" />
              </button>
            )
          })}
        </nav>
      </div>
    )
  }
}

interface SidebarProps {
  components: readonly ShowcaseComponent[]
  settings: Settings
  page: ShowcaseProps['page']
  slug?: string
  search: string
}

function Sidebar(handle: Handle<SidebarProps>) {
  return () => {
    let { components, settings, page, slug, search } = handle.props
    let systems = components.filter((component) => component.category?.toLowerCase() === 'system')
    let controls = components.filter((component) => !component.category)
    let group = (label: string, entries: readonly ShowcaseComponent[]) => (
      <div class="site-nav-group">
        <h2 class="site-rail-label">
          {label}
          <span>{entries.length}</span>
        </h2>
        <ul aria-label={label}>
          {entries.map((entry) => (
            <li key={entry.slug}>
              <a
                href={pageHref(routes.component.href({ slug: entry.slug }))}
                aria-current={page === 'component' && slug === entry.slug ? 'page' : undefined}
              >
                {entry.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
    return (
      <nav class="site-nav" aria-label="Reflow pages">
        <button
          class="site-search"
          type="button"
          data-site-search-trigger=""
          aria-label="Search Reflow"
        >
          <Icon name="search" />
          <span>Search</span>
          <span class="site-search-shortcut" aria-hidden="true">
            <Kbd keys="mod+k" size="compact" />
          </span>
        </button>
        <ul class="site-primary-nav">
          <li>
            <a
              href={pageHref(routes.gallery.href())}
              aria-current={page === 'gallery' && !search ? 'page' : undefined}
            >
              Showcase
            </a>
          </li>
          <li>
            <a
              href={pageHref(routes.docs.href())}
              aria-current={page === 'docs' ? 'page' : undefined}
            >
              Introduction
            </a>
          </li>
          <li>
            <a href={routes.apps.href()} data-rmx-document="">
              Apps
            </a>
          </li>
        </ul>
        {systems.length ? group('System', systems) : null}
        {group('Components', controls)}
      </nav>
    )
  }
}

function SettingIcon(handle: Handle<{ setting: string; value: string }>) {
  return () => (
    <span
      class="site-setting-icon"
      data-setting-icon={handle.props.setting}
      data-value={handle.props.value}
      aria-hidden="true"
    >
      {handle.props.setting === 'shape' ? <span class="site-radius-icon" /> : null}
      {handle.props.setting === 'accent' ? <span class="site-accent-swatch" /> : null}
      {handle.props.setting === 'theme' ? (
        <>
          <ReflowIcon name="monitor" data-theme-icon="system" />
          <ReflowIcon name="sun" data-theme-icon="light" />
          <ReflowIcon name="moon" data-theme-icon="dark" />
        </>
      ) : null}
    </span>
  )
}

function AppearancePanel(handle: Handle<{ settings: Settings; variant?: 'rail' | 'sheet' }>) {
  return () => {
    let { settings, variant = 'rail' } = handle.props
    const customFont = fontCatalog.find((font) => `google:${font.n}` === settings.font)
    const availableWeights = customFont ? fontWeights(customFont).map(String) : []
    const github = (
      <a
        class="site-icon-button"
        href="https://github.com/rtzll/reflow"
        aria-label="Reflow on GitHub"
        title="Reflow on GitHub"
      >
        <Icon name="github" />
      </a>
    )
    return (
      <section class="site-settings" aria-label="Appearance">
        <div class={variant === 'sheet' ? 'site-sheet-heading' : 'site-settings-heading'}>
          <h2>Appearance</h2>
          {variant === 'rail' ? (
            <>
              <ResetSettingsButton settings={settings} />
              <ShareSettingsButton />
            </>
          ) : null}
          {github}
        </div>
        {settingRows.map((row) => (
          <div
            key={row.key}
            class="site-setting"
            data-font-weight-row={row.key === 'fontWeight' ? '' : undefined}
            hidden={row.key === 'fontWeight' && !settings.font.startsWith('google:')}
          >
            <span>{row.label}</span>
            <details class="site-setting-dropdown" data-setting-menu={row.key} name="site-settings">
              <summary
                data-setting-trigger={row.key}
                aria-label={`${row.label}: ${settingLabel(settings[row.key])}`}
                aria-haspopup={row.key === 'accent' ? 'dialog' : 'menu'}
                aria-controls={`${handle.id}-${row.key}-options`}
              >
                {row.key !== 'accent' && (
                  <SettingIcon setting={row.key} value={settings[row.key]} />
                )}
                <span data-setting-label="">{settingLabel(settings[row.key])}</span>
                {row.shortcut ? <Kbd size="compact">{row.shortcut}</Kbd> : null}
                {row.key === 'accent' ? (
                  <SettingIcon setting={row.key} value={settings[row.key]} />
                ) : (
                  <Icon name="chevron" />
                )}
              </summary>
              {row.key === 'accent' ? (
                <div
                  class="site-accent-panel"
                  id={`${handle.id}-${row.key}-options`}
                  role="dialog"
                  aria-label="Accent"
                  tabindex={-1}
                >
                  <AccentPicker accent={settings.accent} theme={settings.theme} />
                </div>
              ) : (
                <div class="site-setting-options" id={`${handle.id}-${row.key}-options`}>
                  <div role="menu" aria-label={row.label}>
                    {row.options.map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="menuitemradio"
                        tabIndex={-1}
                        data-setting={row.key}
                        data-value={value}
                        hidden={
                          row.key === 'fontWeight' &&
                          value !== 'auto' &&
                          !availableWeights.includes(value)
                        }
                        aria-checked={settings[row.key] === value}
                      >
                        <SettingIcon setting={row.key} value={value} />
                        <span>{settingLabel(value)}</span>
                        <span class="site-setting-check" aria-hidden="true">
                          ✓
                        </span>
                      </button>
                    ))}
                    {row.key === 'font' && (
                      <>
                        <button
                          type="button"
                          role="menuitemradio"
                          tabIndex={-1}
                          data-font-current=""
                          data-setting="font"
                          data-value={settings.customFont ?? ''}
                          hidden={!settings.customFont}
                          aria-checked={settings.font === settings.customFont}
                        >
                          <span data-font-name="">
                            {settings.customFont ? settingLabel(settings.customFont) : ''}
                          </span>
                          <span class="site-setting-check" aria-hidden="true">
                            ✓
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={-1}
                          aria-haspopup="dialog"
                          data-font-browse=""
                        >
                          Browse Google Fonts…
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </details>
          </div>
        ))}
        <label class="site-setting site-sound-setting">
          <span>Sound effects</span>
          <Switch
            size="compact"
            defaultChecked={settings.soundEnabled}
            disabled
            data-site-sound-switch=""
          />
        </label>
        <div class="site-settings-install">
          <InstallPromptButton />
        </div>
      </section>
    )
  }
}

function ShortcutsButton() {
  return () => (
    <button class="site-shortcuts-button" type="button" data-site-shortcuts="">
      <Icon name="menu" /> Keyboard shortcuts <Kbd size="compact">?</Kbd>
    </button>
  )
}

function SiteCredit() {
  return () => (
    <div class="site-credit">
      <div>
        <span>Inspired by</span>
        <a href="https://www.fluidfunctionalism.com/">Fluid Functionalism</a>
      </div>
      <div>
        <span>Sounds by</span>
        <a href="https://buttons.joshwcomeau.com/">Josh W. Comeau</a>
      </div>
    </div>
  )
}

export function CopyCode(handle: Handle<{ code: string; language?: string }>) {
  return () => (
    <div class="site-code">
      <pre tabindex={0}>
        <code>{handle.props.code}</code>
      </pre>
      <button
        class="site-icon-button"
        type="button"
        aria-label="Copy code"
        title="Copy code"
        data-site-copy=""
        hidden
      >
        <Icon name="copy" />
      </button>
      <span class="site-sr-only" aria-live="polite" data-site-copy-status="" />
    </div>
  )
}

function CopyAction(handle: Handle<{ text: string; label: string }>) {
  return () => (
    <span class="site-copy-action">
      <button
        class="site-button site-button-primary"
        type="button"
        data-site-copy=""
        data-site-copy-text={handle.props.text}
        hidden
      >
        <Icon name="copy" /> {handle.props.label}
      </button>
      <span class="site-sr-only" aria-live="polite" data-site-copy-status="" />
    </span>
  )
}

// A docs preview carries only the CodeBlock samples it shows.
function previewImages(images: ExampleImages, variant: string | undefined): ExampleImages {
  return images.code ? { ...images, code: samplesFor(images.code, variant) } : images
}

const galleryOrder = [
  'carousel',
  'queued-stack',
  'hover-card',
  'toaster',
  'time-grid',
  'bar-chart',
  'code-block',
  'diff-view',
  'data-table',
  'avatar',
  'command-menu',
  'select',
  'thinking-indicator',
  'sidebar',
  'radio-group',
  'kbd',
  'tabs',
  'breadcrumb',
  'segmented-control',
  'thinking-steps',
  'time-field',
  'ask-user-questions',
  'checkbox-group',
  'slider',
  'banner',
  'dropdown',
  'accordion',
  'input-copy',
  'input-message',
  'input-group',
  'button',
  'card',
  'alert-dialog',
  'calendar',
  'date-picker',
  'chat-message',
  'popover',
  'drawer',
  'color-picker',
  'switch',
  'combobox',
  'markdown',
  'citation',
]

const fullWidthCards = new Set(['code-block', 'diff-view'])
const halfWidthCards = new Set(['time-grid', 'bar-chart', 'breadcrumb', 'segmented-control'])

const wideCards = new Set([
  'markdown',
  'input-message',
  'color-picker',
  'card',
  'command-menu',
  'sidebar',
  'thinking-steps',
  'ask-user-questions',
  'banner',
  'accordion',
  'carousel',
  'data-table',
  'calendar',
  'chat-message',
  'toaster',
])

const tallCards = new Set([
  'color-picker',
  'command-menu',
  'sidebar',
  'thinking-steps',
  'ask-user-questions',
  'carousel',
  'chat-message',
])
const rightCards = new Set([
  'input-message',
  'color-picker',
  'command-menu',
  'thinking-steps',
  'banner',
  'carousel',
  'calendar',
])

function sortEntries(entries: readonly ShowcaseComponent[], order: readonly string[]) {
  let rank = new Map(order.map((slug, index) => [slug, index]))
  return [...entries].sort(
    (a, b) =>
      (rank.get(a.slug) ?? Infinity) - (rank.get(b.slug) ?? Infinity) ||
      a.name.localeCompare(b.name),
  )
}

function Gallery(
  handle: Handle<{ components: readonly ShowcaseComponent[]; settings: Settings; search: string }>,
) {
  return () => {
    let { components, settings, search } = handle.props
    let term = search.trim().toLowerCase()
    const bySlug = new Map(components.map((component) => [component.slug, component]))
    const entries = term
      ? sortEntries(
          components.filter((component) =>
            `${component.name} ${component.slug} ${component.description}`
              .toLowerCase()
              .includes(term),
          ),
          galleryOrder,
        )
      : galleryOrder.flatMap((slug) => {
          const entry = bySlug.get(slug)
          return entry?.preview != null ? [entry] : []
        })
    return (
      <>
        <header class="site-gallery-heading">
          <div class="site-title-row">
            <h1>{term ? 'Search results' : 'Reflow'}</h1>
            <HeadingControls
              next={{ href: pageHref(routes.docs.href()), name: 'Introduction' }}
              soundEnabled={settings.soundEnabled}
            />
          </div>
          <p>{term ? `Results for “${search}”.` : 'Fluid components for Remix.'}</p>
          <div class="site-actions">
            {!term && <InstallPromptButton />}
            <a class="site-button site-button-secondary" href={pageHref(routes.docs.href())}>
              Learn more
            </a>
            <a
              class="site-button site-button-ghost"
              href={routes.docsIndex.href()}
              data-rmx-document
            >
              Markdown index
            </a>
          </div>
        </header>
        {entries.length ? (
          <div class="site-gallery" data-search-results={term ? true : undefined}>
            {entries.map((entry) => (
              <article
                key={entry.slug}
                class="site-preview-card"
                data-component={entry.slug}
                data-full-width={fullWidthCards.has(entry.slug) ? '' : undefined}
                data-half-width={halfWidthCards.has(entry.slug) ? '' : undefined}
                data-wide={wideCards.has(entry.slug) ? '' : undefined}
                data-tall={tallCards.has(entry.slug) ? '' : undefined}
                data-right={rightCards.has(entry.slug) ? '' : undefined}
              >
                <div class="site-preview-stage" data-sound-scope="">
                  {entry.preview ?? <p class="site-preview-placeholder">{entry.description}</p>}
                </div>
                <footer class="site-preview-footer">
                  <a
                    href={pageHref(routes.component.href({ slug: entry.slug }))}
                    aria-label={`View ${entry.name} documentation`}
                  >
                    {entry.name}
                  </a>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <p class="site-empty">
            {term
              ? 'No components match your search.'
              : 'Component previews will appear here as they become available.'}
          </p>
        )}
      </>
    )
  }
}

export const introductionSummary = 'Why these components feel different.'

function MarkdownLink(handle: Handle<{ href: string }>) {
  return () => (
    <a class="doc-markdown-link" href={handle.props.href} data-rmx-document>
      View as Markdown
    </a>
  )
}

function Introduction(handle: Handle<{ settings: Settings; next?: ShowcaseComponent }>) {
  return () => {
    let { settings, next } = handle.props
    return (
      <article class="site-doc">
        <header>
          <div class="site-title-row">
            <h1>Introduction</h1>
            <HeadingControls
              soundEnabled={settings.soundEnabled}
              previous={{ href: pageHref(routes.gallery.href()), name: 'Showcase' }}
              next={
                next
                  ? {
                      href: pageHref(routes.component.href({ slug: next.slug })),
                      name: next.name,
                    }
                  : undefined
              }
            />
          </div>
          <p>{introductionSummary}</p>
          <MarkdownLink href={routes.docsMarkdown.href()} />
        </header>
        {introductionContent()}
      </article>
    )
  }
}

export function introductionContent() {
  return (
    <>
      <section class="site-doc-prose">
        <div>
          <h2>Motion that communicates</h2>
          <p>
            A transition can show how two elements relate. When adjacent choices share a surface,
            you can see that they belong to the same selection. When a tab indicator moves, it shows
            where your attention should go. Reflow uses shared timing and surface treatments so
            those cues feel familiar across components.
          </p>
        </div>
        <div>
          <h2>Hover as preview</h2>
          <p>
            Move through a list or menu and the highlight follows the pointer to the next target. It
            gives you a chance to see what will respond before you click. Buttons use small changes
            in weight and fill, and keyboard navigation keeps its own visible focus cue.
          </p>
        </div>
        <div>
          <h2>Spring motion</h2>
          <p>
            Fast, moderate, and slow spring curves cover short feedback, moving indicators, and
            larger reveals. When you change direction quickly, the animation follows the latest
            target. Reflow also respects the system preference for reduced motion.
          </p>
        </div>
        <div>
          <h2>Native to Remix</h2>
          <p>
            Components use the Remix component runtime, official UI primitives, and browser APIs.
            The showcase renders the same components you can install from npm. Style them with the
            shared tokens for surfaces, type, sizes, and radii, or supply your own content in their
            slots.
          </p>
        </div>
        <div>
          <h2>Customize with the Appearance panel</h2>
          <p>
            Try a different theme, accent, heading font, radius, size, icon family, or hover style.
            Changes update the examples as you make them. Use <Kbd size="compact">T</Kbd>,{' '}
            <Kbd size="compact">A</Kbd>, and <Kbd size="compact">R</Kbd> to cycle theme, accent, and
            radius from the keyboard. Your settings are remembered on this device. To share a
            particular look, copy a link with your settings from the panel.
          </p>
        </div>
      </section>
      <section id="installation" class="site-doc-section site-intro-install">
        <h2>Installation</h2>
        <div>
          <p>
            <span aria-hidden="true">1</span> Install Reflow and Remix from your app's root.
          </p>
          <CopyCode language="sh" code={reflowInstallCommand} />
        </div>
        <div>
          <p>
            <span aria-hidden="true">2</span> Import the components you need.
          </p>
          <CopyCode code="import { Button } from '@rtzll/reflow'" />
        </div>
        <p>
          Serve <code>@rtzll/reflow/styles.css</code> through the Remix asset server and enable
          Remix's browser runtime for interactive components. Follow the{' '}
          <a href="https://github.com/rtzll/reflow/blob/main/docs/integration.md">
            integration guide
          </a>{' '}
          for the full setup.
        </p>
        <p>
          <a href="https://www.npmjs.com/package/@rtzll/reflow">View on npm</a> ·{' '}
          <a href="https://github.com/rtzll/reflow/releases">Release notes</a>
        </p>
      </section>
      <section class="site-doc-section">
        <h2>Icons</h2>
        <p>
          The Appearance panel previews Lucide, Tabler, Phosphor, and HugeIcons. Reflow's built-in
          icons render as SVG, and components with icon slots also accept your own SVG or Remix
          nodes. Choose the icons that fit your application.
        </p>
        <CopyCode code={'<Button leadingIcon={<Icon name="plus" />}>New project</Button>'} />
      </section>
    </>
  )
}

function ComponentDoc(
  handle: Handle<{
    component?: ShowcaseComponent
    settings: Settings
    previous?: PageLink
    next?: PageLink
    showCode?: boolean
    query?: string
    images: ExampleImages
  }>,
) {
  return () => {
    const { component, settings, previous, next, showCode, images } = handle.props
    if (!component)
      return (
        <article class="site-doc">
          <header>
            <h1>Component not found</h1>
          </header>
          <a href={pageHref(routes.docs.href())}>Back to documentation</a>
        </article>
      )
    const { module, importCode, examples, api, playground } = componentReference(component)
    const sectionId = (title: string) =>
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-$/, '')
    return (
      <article class="site-doc" data-doc-component={component.slug}>
        <header>
          <div class="site-title-row">
            <h1>{component.slug === 'skill' ? '/reflow skill' : component.name}</h1>
            <HeadingControls previous={previous} next={next} soundEnabled={settings.soundEnabled} />
          </div>
          <p>{component.description}</p>
          <MarkdownLink href={routes.componentMarkdown.href({ slug: component.slug })} />
        </header>
        {component.category === 'system' ? (
          component.preview
        ) : (
          <>
            {!component.category && (
              <section class="site-doc-install">
                <div>
                  <h2>Installation</h2>
                  <p>Import from {module}.</p>
                </div>
                <CopyAction label="Copy import" text={importCode} />
              </section>
            )}
            {playground && (
              <section
                class="site-doc-section"
                id={sectionId(playground.title)}
                data-rmx-key={`playground:${component.slug}`}
              >
                <h2>{playground.title}</h2>
                <DocPreview
                  {...playground}
                  query={component.slug === 'pagination' ? handle.props.query : undefined}
                  initialCode={showCode}
                  images={previewImages(images, undefined)}
                />
                {component.controls}
              </section>
            )}
            {examples.map((example) => (
              <section
                key={example.variant}
                class="site-doc-section"
                id={sectionId(example.title)}
                data-rmx-key={`example:${component.slug}:${example.variant}`}
              >
                <h2>{example.title}</h2>
                {example.description && <p>{example.description}</p>}
                <DocPreview {...example} images={previewImages(images, example.variant)} />
              </section>
            ))}
            {api.length > 0 && (
              <section class="site-doc-section doc-api-section" id="api-reference">
                <h2>API Reference</h2>
                <p>{apiDescription}</p>
                {api.map((section) => (
                  <section key={section.name} class="doc-api-component">
                    <h3>{section.name}</h3>
                    {section === api[0] && section.props.length > 12 ? (
                      <div role="region" aria-label={`${section.name} API reference`}>
                        <ApiPropTable
                          name={section.name}
                          path={routes.component.href({ slug: component.slug })}
                          search={handle.props.query ?? ''}
                          rows={section.props}
                        />
                      </div>
                    ) : (
                      <div
                        class="site-props-scroll"
                        tabIndex={0}
                        role="region"
                        aria-label={`${section.name} API reference`}
                      >
                        <table class="site-props">
                          <thead>
                            <tr>
                              <th scope="col">Prop</th>
                              <th scope="col">Type</th>
                              <th scope="col">Default</th>
                              <th scope="col">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.props.map((prop) => (
                              <tr key={prop.name}>
                                <th scope="row">
                                  <code>{prop.name}</code>
                                  {prop.required && (
                                    <span class="doc-required" title="Required">
                                      *
                                    </span>
                                  )}
                                </th>
                                <td>
                                  <code>{prop.type}</code>
                                </td>
                                <td>
                                  <code>{prop.defaultValue ?? '—'}</code>
                                </td>
                                <td>{prop.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              </section>
            )}
          </>
        )}
        <nav class="doc-bottom-nav" aria-label="Continue reading">
          {previous && (
            <a href={previous.href}>
              <small>Previous</small>
              <span>← {previous.name}</span>
            </a>
          )}
          {next && (
            <a href={next.href}>
              <small>Next</small>
              <span>{next.name} →</span>
            </a>
          )}
        </nav>
      </article>
    )
  }
}

export function Showcase(handle: Handle<ShowcaseProps>) {
  return () => {
    let { components, page, slug, images, query = '' } = handle.props
    let settings = handle.props.settings ?? readSettings(query)
    let params = new URLSearchParams(query)
    let search = params.get('q')?.trim().slice(0, 80) ?? ''
    let currentIndex = components.findIndex((entry) => entry.slug === slug)
    let previous = components[currentIndex - 1]
    let next = currentIndex >= 0 ? components[currentIndex + 1] : undefined

    return (
      <div class="site-layout">
        <SiteControls
          pages={components.map(({ name, slug, description, category }) => ({
            name,
            slug,
            description,
            category,
          }))}
        />
        <button
          class="site-icon-button site-reopen-left"
          type="button"
          data-site-reopen="left"
          aria-label="Expand navigation"
          title="Expand navigation ["
        >
          <ReflowIcon name="panel-left" />
        </button>
        <button
          class="site-icon-button site-reopen-right"
          type="button"
          data-site-reopen="right"
          aria-label="Expand properties"
          title="Expand properties ]"
        >
          <ReflowIcon name="panel-left" />
        </button>
        <a class="site-skip" href="#main">
          Skip to content
        </a>
        <details class="site-mobile">
          <summary class="site-icon-button site-mobile-toggle" aria-controls="site-mobile-panel">
            <span class="site-mobile-open-icon">
              <ReflowIcon name="panel-left" />
              <span class="site-sr-only">Open navigation</span>
            </span>
            <span class="site-mobile-close-icon">
              <ReflowIcon name="x" />
              <span class="site-sr-only">Close navigation</span>
            </span>
          </summary>
          <dialog
            open
            id="site-mobile-panel"
            class="site-mobile-panel"
            aria-label="Navigation and appearance"
            tabindex={-1}
          >
            <div class="site-mobile-content">
              <AppearancePanel settings={settings} variant="sheet" />
              <SiteCredit />
              <Sidebar
                components={components}
                settings={settings}
                page={page}
                slug={slug}
                search={search}
              />
              <ShortcutsButton />
            </div>
          </dialog>
        </details>
        <aside class="site-left">
          <Sidebar
            components={components}
            settings={settings}
            page={page}
            slug={slug}
            search={search}
          />
        </aside>
        <main id="main" class="site-main">
          {page === 'gallery' ? (
            <Gallery components={components} settings={settings} search={search} />
          ) : null}
          {page === 'docs' ? <Introduction settings={settings} next={components[0]} /> : null}
          {page === 'component' ? (
            <ComponentDoc
              component={components[currentIndex]}
              settings={settings}
              images={images}
              showCode={params.get('view') === 'code'}
              query={handle.props.query}
              previous={
                previous
                  ? {
                      href: pageHref(routes.component.href({ slug: previous.slug })),
                      name: previous.name,
                    }
                  : { href: pageHref(routes.docs.href()), name: 'Introduction' }
              }
              next={
                next
                  ? {
                      href: pageHref(routes.component.href({ slug: next.slug })),
                      name: next.name,
                    }
                  : undefined
              }
            />
          ) : null}
        </main>
        <aside class="site-right">
          <AppearancePanel settings={settings} />
          {page === 'component' &&
            components[currentIndex] &&
            !components[currentIndex].category && (
              <div data-rmx-key={`playground-controls:${components[currentIndex].slug}`}>
                <PlaygroundControls
                  slug={components[currentIndex].slug}
                  name={components[currentIndex].name}
                />
              </div>
            )}
          <div class="site-rail-footer">
            <ShortcutsButton />
            <SiteCredit />
          </div>
        </aside>
      </div>
    )
  }
}
