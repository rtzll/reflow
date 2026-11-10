import { ChatMessage, Citation, type CitationSource, type PopoverPlacement } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

// A small lettered tile stands in for a favicon, so the docs load nothing remote.
function tile(letter: string, color: string) {
  return (
    <svg viewBox="0 0 16 16">
      <rect width="16" height="16" rx="3" fill={color} />
      <text x="8" y="11.5" fill="white" font-size="10" font-family="system-ui" text-anchor="middle">
        {letter}
      </text>
    </svg>
  )
}

export const citationSources: CitationSource[] = [
  {
    title: 'Ten principles for good design',
    href: 'https://www.vitsoe.com/us/about/good-design',
    description:
      'Good design is innovative, useful, aesthetic, understandable, unobtrusive, honest, long-lasting, thorough, environmentally friendly, and as little design as possible.',
  },
  {
    title: 'The Design of Everyday Things',
    href: 'https://mitpress.mit.edu/9780262525671/',
    description:
      'Why some products satisfy while others frustrate: good design makes what you can do, and what just happened, easy to see.',
  },
  {
    title: 'Aesthetic–Usability Effect',
    href: 'https://lawsofux.com/aesthetic-usability-effect/',
    site: 'Laws of UX',
    description: 'Users often perceive aesthetically pleasing design as design that’s more usable.',
  },
]

const withIcons: CitationSource[] = citationSources.map((source, index) => ({
  ...source,
  icon: tile(['V', 'M', 'L'][index]!, ['#111827', '#9f1239', '#4338ca'][index]!),
}))

export interface CitationDemoProps {
  variant: string
  size?: 'default' | 'compact'
  style?: 'number' | 'site'
  count?: number
  placement?: PopoverPlacement
}

/** The Citation docs demos, gallery reply and playground. */
export function CitationDemo(handle: Handle<CitationDemoProps>) {
  return () => {
    const { variant, size } = handle.props
    const [rams, norman, laws] = citationSources as [CitationSource, CitationSource, CitationSource]
    switch (variant) {
      case 'multiple':
        return (
          <p class="doc-citation-text" data-density={size}>
            Most of what makes an interface feel good is invisible: it does what you expect, and
            tells you what just happened.
            <Citation index={1} sources={citationSources} size={size} />
          </p>
        )
      case 'site':
        return (
          <p class="doc-citation-text" data-density={size}>
            Good design is as little design as possible.
            <Citation variant="site" sources={rams} size={size} /> People even judge prettier
            interfaces as easier to use.
            <Citation variant="site" sources={[laws, norman]} size={size} />
          </p>
        )
      case 'icons':
        return (
          <p class="doc-citation-text" data-density={size}>
            Each source can bring its own icon, such as a favicon.
            <Citation index={1} sources={withIcons} size={size} />
          </p>
        )
      case 'chat':
        return (
          <div class="example-chat-thread">
            <ChatMessage role="user" animate={false}>
              What does “good design” actually mean?
            </ChatMessage>
            <ChatMessage role="assistant" animate={false}>
              Mostly that you stop noticing it.
              <Citation index={1} sources={rams} /> It lets you do what you came to do, and it feels
              right while you do it.
              <Citation index={2} sources={[norman, laws]} />
            </ChatMessage>
          </div>
        )
      case 'playground': {
        const count = Math.max(1, Math.min(3, handle.props.count ?? 1))
        return (
          <p class="doc-citation-text" data-density={size}>
            Good design is unobtrusive: it lets you do what you came to do.
            <Citation
              index={1}
              variant={handle.props.style}
              sources={citationSources.slice(0, count)}
              placement={handle.props.placement}
              size={size}
            />
          </p>
        )
      }
      default:
        return (
          <p class="doc-citation-text" data-density={size}>
            Good design is unobtrusive and honest.
            <Citation index={1} sources={rams} size={size} /> It makes clear what you can do and
            what just happened.
            <Citation index={2} sources={norman} size={size} />
          </p>
        )
    }
  }
}
