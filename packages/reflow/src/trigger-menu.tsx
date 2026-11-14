import { anchor, type AnchorPoint } from '@remix-run/ui/anchor'
import { on, ref, type Handle, type MixInput, type RemixNode } from 'remix/component'
import { fluidHover } from './systems/fluid-hover.ts'

export interface TriggerMenuItem {
  label: string
  /** Replacement text, including the trigger if it should be kept. */
  value: string
}

export interface TriggerMenuTrigger {
  character: string
  label: string
  items: readonly TriggerMenuItem[]
}

export interface TriggerMenuFieldProps {
  mix: MixInput<HTMLTextAreaElement>
  'aria-controls'?: string
  'aria-activedescendant'?: string
  'aria-autocomplete'?: 'list'
}

export interface TriggerMenuProps {
  triggers: readonly TriggerMenuTrigger[]
  /** Spread these props onto the textarea and run its mix before custom key handling. */
  renderField: (props: TriggerMenuFieldProps) => RemixNode
}

interface Match {
  start: number
  end: number
  query: string
  trigger: TriggerMenuTrigger
}

function matchTrigger(
  field: HTMLTextAreaElement,
  triggers: readonly TriggerMenuTrigger[],
): Match | undefined {
  const caret = field.selectionStart
  if (caret !== field.selectionEnd) return
  const prefix = field.value.slice(0, caret)
  const start = prefix.search(/\S*$/)
  const word = prefix.slice(start)
  const trigger = triggers.find(({ character }) => character && word.startsWith(character))
  if (!trigger) return
  const query = word.slice(trigger.character.length)
  const tail = field.value.slice(caret).match(/^[\p{L}\p{N}_-]*/u)?.[0] ?? ''
  return { start, end: caret + tail.length, query, trigger }
}

const mirrorStyles = [
  'box-sizing',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font',
  'font-variation-settings',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-indent',
  'direction',
  'tab-size',
]

export function TriggerMenu(handle: Handle<TriggerMenuProps>) {
  let field: HTMLTextAreaElement | undefined
  let match: Match | undefined
  let dismissed: Match | undefined
  let options: readonly TriggerMenuItem[] = []
  let active = 0
  let composing = false
  let measureCaret: (() => void) | undefined
  const point: AnchorPoint = { x: 0, y: 0, height: 0 }
  const listId = handle.id + '-options'
  const optionId = (index: number) => listId + '-' + index
  const hover = fluidHover({ highlightedSelector: '[data-highlighted]', fastHover: true })

  function close() {
    if (!match) return
    match = undefined
    options = []
    void handle.update()
  }

  function refresh() {
    if (
      !field ||
      field.ownerDocument.activeElement !== field ||
      field.disabled ||
      field.readOnly ||
      composing
    )
      return close()
    const next = matchTrigger(field, handle.props.triggers)
    if (!next) {
      dismissed = undefined
      return close()
    }
    if (
      dismissed?.start === next.start &&
      dismissed.trigger === next.trigger &&
      dismissed.query === next.query
    )
      return close()
    dismissed = undefined
    const query = next.query.toLocaleLowerCase()
    const items = next.trigger.items.filter((item) =>
      item.label.toLocaleLowerCase().includes(query),
    )
    if (!items.length) return close()
    if (match?.query !== next.query || match.start !== next.start || match.trigger !== next.trigger)
      active = 0
    match = next
    options = items
    measureCaret?.()
    void handle.update()
  }

  function choose(item: TriggerMenuItem) {
    if (!field || !match) return
    const { start, end } = match
    const next = field.value.slice(end)
    const suffix = next && /^[\s.,!?;:)]/.test(next) ? '' : ' '
    field.setRangeText(item.value + suffix, start, end, 'end')
    dismissed = matchTrigger(field, handle.props.triggers)
    close()
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const fieldRef = ref<HTMLTextAreaElement>((element, signal) => {
    field = element
    const doc = element.ownerDocument
    let mirror: HTMLDivElement | undefined
    const marker = doc.createElement('span')

    measureCaret = () => {
      if (!match) return
      if (!mirror) {
        mirror = doc.createElement('div')
        mirror.className = 'rf-trigger-mirror'
        doc.body.append(mirror)
      }
      const style = getComputedStyle(element)
      for (const property of mirrorStyles)
        mirror.style.setProperty(property, style.getPropertyValue(property))
      mirror.style.lineHeight = style.lineHeight
      const rect = element.getBoundingClientRect()
      mirror.style.width = `${element.clientWidth + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)}px`
      mirror.style.whiteSpace = element.wrap === 'off' ? 'pre' : 'pre-wrap'
      const caret = element.selectionStart
      marker.textContent = element.value.slice(caret) || '\u200b'
      mirror.replaceChildren(doc.createTextNode(element.value.slice(0, caret)), marker)
      const caretRect = marker.getClientRects()[0]
      if (!caretRect) return
      point.x = Math.max(
        rect.left,
        Math.min(rect.right, rect.left + caretRect.left - element.scrollLeft),
      )
      point.y = Math.max(
        rect.top,
        Math.min(rect.bottom, rect.top + caretRect.top - element.scrollTop),
      )
      point.height = caretRect.height
    }
    const reposition = () => measureCaret?.()
    doc.addEventListener('selectionchange', refresh, { signal })
    doc.addEventListener('scroll', reposition, { capture: true, signal })
    doc.defaultView?.addEventListener('resize', reposition, { signal })
    signal.addEventListener(
      'abort',
      () => {
        mirror?.remove()
        field = undefined
        measureCaret = undefined
      },
      { once: true },
    )
  })

  const panelRef = ref<HTMLDivElement>((panel, signal) => {
    panel.showPopover()
    measureCaret?.()
    const stop = anchor(panel, point, { placement: 'bottom-start', offset: 6 })
    signal.addEventListener('abort', stop, { once: true })
  })

  return () => (
    <>
      {handle.props.renderField({
        'aria-autocomplete': handle.props.triggers.length ? 'list' : undefined,
        'aria-controls': match ? listId : undefined,
        'aria-activedescendant': match ? optionId(active) : undefined,
        mix: [
          fieldRef,
          on<HTMLTextAreaElement, 'input'>('input', (event) => {
            if (!event.isComposing) refresh()
          }),
          on<HTMLTextAreaElement, 'compositionstart'>('compositionstart', () => {
            composing = true
            close()
          }),
          on<HTMLTextAreaElement, 'compositionend'>('compositionend', () => {
            composing = false
            refresh()
          }),
          on('focus', refresh),
          on('blur', () => {
            dismissed = undefined
            close()
          }),
          on<HTMLTextAreaElement, 'keydown'>('keydown', (event) => {
            if (!match || event.isComposing || event.defaultPrevented) return
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              dismissed = match
              close()
            } else if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey
            ) {
              event.preventDefault()
              const item = options[active]
              if (item) choose(item)
            } else if (
              (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
              !event.shiftKey &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey
            ) {
              event.preventDefault()
              const delta = event.key === 'ArrowDown' ? 1 : -1
              active = (active + delta + options.length) % options.length
              void handle.update()
              handle.queueTask(() =>
                field?.ownerDocument
                  .getElementById(optionId(active))
                  ?.scrollIntoView({ block: 'nearest' }),
              )
            }
          }),
        ],
      })}
      {match && (
        <div
          class="rf-trigger-menu"
          popover="manual"
          id={listId}
          role="listbox"
          aria-label={match.trigger.label}
          mix={[panelRef, hover]}
        >
          <div class="rf-highlight" data-rf-hover-layer aria-hidden="true" />
          {options.map((item, index) => (
            <div
              key={item.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              data-highlighted={index === active || undefined}
              data-rf-hover-item
              mix={[
                on('mousedown', (event) => event.preventDefault()),
                on('click', () => choose(item)),
              ]}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
