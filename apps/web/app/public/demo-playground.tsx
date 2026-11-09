import { fluidHover } from '@rtzll/reflow'
import { clientEntry, on, ref, type Handle } from 'remix/component'
import {
  initialPlayground,
  PlaygroundControls,
  PlaygroundExample,
  type PlaygroundValues,
} from './doc-playground.tsx'

export const DemoPlayground = clientEntry(
  import.meta.url,
  function DemoPlayground(handle: Handle<{ slug: string; fit: boolean; avatar: string }>) {
    let values = initialPlayground(handle.props.slug)
    let revision = 0
    let ready = false
    const listen = ref((_element, signal) => {
      ready = true
      void handle.update()
      window.addEventListener(
        'reflow:playground',
        ((event: CustomEvent<{ slug: string; values: PlaygroundValues }>) => {
          if (event.detail.slug !== handle.props.slug) return
          values = event.detail.values
          revision++
          handle.update()
        }) as EventListener,
        { signal },
      )
    })
    return () => (
      <fieldset
        class="site-demo-example demo-hydration"
        disabled={!ready}
        data-fit={handle.props.fit ? '' : undefined}
        mix={listen}
      >
        <PlaygroundExample
          key={revision}
          slug={handle.props.slug}
          values={values}
          avatar={handle.props.avatar}
        />
      </fieldset>
    )
  },
)

export const DemoPagination = clientEntry(
  import.meta.url,
  function DemoPagination(
    handle: Handle<{ currentHref: string; links: readonly { href: string; name: string }[] }>,
  ) {
    const highlight = fluidHover({ axis: 'both', fastHover: true })
    return () => (
      <nav class="site-demo-pagination" aria-label="Choose a slide" mix={highlight}>
        <span class="rf-highlight" aria-hidden="true" data-rf-hover-layer="" />
        {handle.props.links.map(({ href, name }) => (
          <a
            key={href}
            href={href}
            aria-label={`Go to ${name}`}
            aria-current={href === handle.props.currentHref ? 'page' : undefined}
            title={name}
            data-rf-hover-item=""
          />
        ))}
      </nav>
    )
  },
)

export const DemoCustomize = clientEntry(
  import.meta.url,
  function DemoCustomize(handle: Handle<{ slug: string; name: string }>) {
    const dismiss = ref((element, signal) => {
      if (!(element instanceof HTMLDetailsElement)) return
      document.addEventListener(
        'click',
        (event) => {
          if (event.target instanceof Node && !element.contains(event.target)) element.open = false
        },
        { signal },
      )
    })

    return () => (
      <details
        class="site-demo-customize"
        mix={[
          dismiss,
          on<HTMLDetailsElement, 'keydown'>('keydown', (event) => {
            if (event.key !== 'Escape' || event.defaultPrevented || !event.currentTarget.open)
              return
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.open = false
            event.currentTarget.querySelector('summary')?.focus({ preventScroll: true })
          }),
          on<HTMLDetailsElement, 'focusout'>('focusout', (event) => {
            if (
              event.relatedTarget instanceof Node &&
              !event.currentTarget.contains(event.relatedTarget)
            )
              event.currentTarget.open = false
          }),
        ]}
      >
        <summary
          class="site-icon-button"
          aria-label={`Customize ${handle.props.name}`}
          title={`Customize ${handle.props.name}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m14 6 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" />
          </svg>
        </summary>
        <div class="site-demo-settings" role="region" aria-label={`Customize ${handle.props.name}`}>
          <PlaygroundControls slug={handle.props.slug} name={handle.props.name} />
        </div>
      </details>
    )
  },
)
