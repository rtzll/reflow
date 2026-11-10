import type { Handle, RemixNode } from 'remix/component'
import { HoverCard } from './hover-card.tsx'
import { Icon } from './icon.tsx'
import type { PopoverPlacement } from './popover.tsx'

export interface CitationSource {
  title: string
  href: string
  /** The site's name. Defaults to the link's host, without www. */
  site?: string
  /** A short excerpt shown in the preview. */
  description?: RemixNode
  /** The site's icon, such as a favicon. Defaults to a globe. */
  icon?: RemixNode
}

export interface CitationProps {
  /** The source, or several sources cited together. */
  sources: CitationSource | readonly CitationSource[]
  /** The first source's number. Several sources take the numbers that follow. Default 1. */
  index?: number
  /** `number` shows the source numbers; `site` shows the first site's name and how many more. Default number. */
  variant?: 'number' | 'site'
  /** Where links open, such as `_blank`, which also sets a safe `rel`. */
  target?: string
  /** Which side of the chip the preview opens on. Default top. */
  placement?: PopoverPlacement
  /** Milliseconds the pointer rests on the chip before the preview opens. Default 300. */
  openDelay?: number
  size?: 'default' | 'compact'
}

function siteOf(source: CitationSource) {
  if (source.site) return source.site
  try {
    return new URL(source.href).host.replace(/^www\./, '')
  } catch {
    return source.href
  }
}

/**
 * An inline citation in generated text: a small chip with the source's
 * number, or its site, that links to the source and previews it on hover or
 * focus, as a HoverCard. One chip can cite several sources; its preview
 * lists each with its site, title and an excerpt. Its accessible name says
 * what it cites, not only its number.
 */
export function Citation(handle: Handle<CitationProps>) {
  return () => {
    const { variant = 'number', index = 1, target, size } = handle.props
    const list: readonly CitationSource[] = Array.isArray(handle.props.sources)
      ? handle.props.sources
      : [handle.props.sources as CitationSource]
    const first = list[0]
    if (!first) return null
    const last = index + list.length - 1
    const described = list.map((source) => `${source.title} (${siteOf(source)})`).join('; ')
    const label =
      variant === 'site'
        ? `${list.length > 1 ? 'Sources' : 'Source'}: ${described}`
        : list.length > 1
          ? `Sources ${index} to ${last}: ${described}`
          : `Source ${index}: ${described}`
    const text =
      variant === 'site'
        ? `${siteOf(first)}${list.length > 1 ? ` +${list.length - 1}` : ''}`
        : list.length > 1
          ? `${index}–${last}`
          : String(index)
    const rel = target === '_blank' ? 'noopener noreferrer' : undefined

    return (
      <HoverCard
        placement={handle.props.placement ?? 'top'}
        openDelay={handle.props.openDelay ?? 300}
        size={size}
        renderTrigger={(trigger) => (
          <a
            class="rf-citation"
            href={first.href}
            target={target}
            rel={rel}
            data-variant={variant}
            data-size={size}
            aria-label={label}
            {...trigger}
          >
            {text}
          </a>
        )}
      >
        {/* Phrasing elements only: the chip usually sits in a paragraph. */}
        <span class="rf-citation-sources" role="list" data-density={size}>
          {list.map((source, offset) => (
            <span key={offset} class="rf-citation-source" role="listitem">
              <span class="rf-citation-meta">
                <span class="rf-citation-icon" aria-hidden="true">
                  {source.icon ?? <Icon name="globe" size={12} />}
                </span>
                <span class="rf-citation-site">{siteOf(source)}</span>
                {variant === 'number' && (
                  <span class="rf-citation-number">{String(index + offset)}</span>
                )}
              </span>
              <a class="rf-citation-title" href={source.href} target={target} rel={rel}>
                {source.title}
              </a>
              {source.description != null && (
                <span class="rf-citation-description">{source.description}</span>
              )}
            </span>
          ))}
        </span>
      </HoverCard>
    )
  }
}
