import { Icon } from './icon.tsx'
import * as accordion from '@remix-run/ui/accordion'
import { type Handle, type RemixNode } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'

export interface AccordionItem {
  value: string
  title: RemixNode
  content: RemixNode
  disabled?: boolean
}

export type AccordionProps = accordion.AccordionContextProps & {
  items: readonly AccordionItem[]
  variant?: 'grouped' | 'separated'
  /** Highlight the whole expanded item or only the trigger on hover. */
  highlight?: 'item' | 'trigger'
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

export function Accordion(handle: Handle<AccordionProps>) {
  return () => {
    const {
      items,
      variant = 'grouped',
      highlight = 'item',
      headingLevel = 3,
      children: _children,
      ...props
    } = handle.props
    const Heading = `h${headingLevel}` as const
    return (
      <accordion.Context {...props}>
        <div
          class="rf-accordion"
          data-variant={variant}
          data-highlight={highlight}
          mix={[accordion.root(), fluidHover()]}
        >
          {variant === 'grouped' && (
            <div class="rf-highlight" aria-hidden="true" data-rf-hover-layer />
          )}
          <div class="rf-highlight rf-focus-ring" aria-hidden="true" data-rf-focus-layer />
          {items.map(({ value, title, content, disabled }) => (
            <accordion.ItemContext key={value} value={value} disabled={disabled}>
              <section class="rf-accordion-item" mix={accordion.item()}>
                <span class="rf-accordion-tint" aria-hidden="true" />
                <Heading>
                  <button
                    type="button"
                    class="rf-accordion-trigger"
                    data-rf-hover-item
                    mix={accordion.trigger()}
                  >
                    <span class="rf-accordion-label">
                      <span aria-hidden="true">{title}</span>
                      <span>{title}</span>
                    </span>
                    <span class="rf-accordion-chevron">
                      <Icon name="chevron-right" />
                    </span>
                  </button>
                </Heading>
                <div class="rf-accordion-panel" mix={accordion.content()}>
                  <div>
                    <div class="rf-accordion-content">{content}</div>
                  </div>
                </div>
              </section>
            </accordion.ItemContext>
          ))}
        </div>
      </accordion.Context>
    )
  }
}
