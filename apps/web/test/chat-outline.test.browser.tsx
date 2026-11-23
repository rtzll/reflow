import { ChatMessage, ChatOutline } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

const turns = ['First question', 'Second question', 'Third question']

function frames(count = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve())
    step(count)
  })
}

// A transcript without the stylesheet: a scrolling box of tall messages.
function Transcript() {
  return () => (
    <div>
      <header>
        <ChatOutline items={turns.map((label, index) => ({ id: `turn-${index}`, label }))} />
      </header>
      <div class="scroller" style={{ height: '300px', overflowY: 'auto' }}>
        {turns.map((label, index) => (
          <ChatMessage id={`turn-${index}`} role="user" animate={false}>
            <div style={{ height: '600px' }}>{label}</div>
          </ChatMessage>
        ))}
      </div>
    </div>
  )
}

function rows() {
  return [...document.querySelectorAll('[role="menuitemradio"]')] as HTMLElement[]
}

async function open(
  $: (selector: string) => Element | null,
  act: (fn: () => void) => Promise<void>,
) {
  await act(() => ($('button[aria-label="Conversation outline"]') as HTMLButtonElement).click())
  await frames()
}

it('renders nothing without turns', async (t) => {
  const { $, cleanup } = render(
    <div class="host">
      <ChatOutline items={[]} />
    </div>,
  )
  t.after(cleanup)
  equal($('.host')?.innerHTML, '')
})

it('lists the turns and checks the one in view as the transcript scrolls', async (t) => {
  const { $, act, cleanup } = render(<Transcript />)
  t.after(cleanup)
  await frames()
  await open($, act)
  equal(
    rows()
      .map((row) => row.textContent?.trim())
      .join('|'),
    turns.join('|'),
  )
  equal(rows()[0].getAttribute('aria-checked'), 'true')
  await act(() => (document.activeElement as HTMLElement | null)?.blur())
  const scroller = $('.scroller') as HTMLElement
  scroller.scrollTop = 1250
  scroller.dispatchEvent(new Event('scroll'))
  await frames(3)
  await act(() => {})
  equal(rows()[2].getAttribute('aria-checked'), 'true')
})

it('scrolls a chosen turn to the top and focuses it', async (t) => {
  const { $, act, cleanup } = render(<Transcript />)
  t.after(cleanup)
  await frames()
  await open($, act)
  await act(() => rows()[1].click())
  // Reduced motion or not, wait for the scroll to settle.
  for (let frame = 0; frame < 60; frame++) await frames(1)
  const scroller = $('.scroller') as HTMLElement
  const target = $('#turn-1') as HTMLElement
  const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top
  ok(Math.abs(offset - 16) <= 1, `the message sits 16px below the top, not ${offset}px`)
  equal(document.activeElement, target)
})

it('adds a search field past eight turns', async (t) => {
  const many = Array.from({ length: 9 }, (_, index) => ({
    id: `m-${index}`,
    label: `Turn ${index + 1}`,
  }))
  const { $, act, cleanup } = render(<ChatOutline items={many} />)
  t.after(cleanup)
  await open($, act)
  ok(document.querySelector('input[placeholder="Search messages…"]'))
})
