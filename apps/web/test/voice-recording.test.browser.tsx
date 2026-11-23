import { InputMessage } from '@rtzll/reflow'
import { equal, match, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

// Stands in for the microphone: a quiet tone from an oscillator, so the tests
// need no device or permission prompt.
function fakeMicrophone(t: { after: (fn: () => void) => void }, refuse = false) {
  const devices = navigator.mediaDevices
  const original = devices.getUserMedia
  const contexts: AudioContext[] = []
  devices.getUserMedia = async () => {
    if (refuse) throw new DOMException('Permission denied', 'NotAllowedError')
    const context = new AudioContext()
    contexts.push(context)
    const tone = context.createOscillator()
    const destination = context.createMediaStreamDestination()
    tone.connect(destination)
    tone.start()
    return destination.stream
  }
  t.after(() => {
    devices.getUserMedia = original
    for (const context of contexts) void context.close()
  })
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

it('records a voice note and attaches it as an audio file', async (t) => {
  fakeMicrophone(t)
  let attached: File[] = []
  const { $, act, cleanup } = render(
    <InputMessage voice onFilesChange={(files) => (attached = files)} onSend={() => {}} />,
  )
  t.after(cleanup)
  await act(() => ($('button[aria-label="Record a voice note"]') as HTMLButtonElement).click())
  await wait(50)
  await act(() => {})
  const status = $('.rf-composer-voice[role="status"]') as HTMLElement
  ok(status, 'the recording controls replace the microphone button')
  match(status.textContent ?? '', /Recording 0:0\d/)
  equal($('button[aria-label="Record a voice note"]'), null)
  await wait(300)
  await act(() => ($('button[aria-label="Attach recording"]') as HTMLButtonElement).click())
  for (let tries = 0; tries < 40 && !attached.length; tries++) await wait(25)
  await act(() => {})
  equal(attached.length, 1)
  match(attached[0].name, /^recording-\d\d-\d\d-\d\d\.(webm|ogg|m4a)$/)
  ok(attached[0].type.startsWith('audio/'))
  ok(attached[0].size > 0)
  equal($('.rf-composer-voice'), null)
  // With a file to send, the main button sends again.
  ok($('button[aria-label="Send message"]'))
  equal($('button[aria-label="Record a voice note"]'), null)
})

it('records from the main button only while there is nothing to send', async (t) => {
  const { $, act, cleanup } = render(<InputMessage voice onSend={() => {}} />)
  t.after(cleanup)
  const record = $('button[aria-label="Record a voice note"]') as HTMLButtonElement
  ok(record.classList.contains('rf-composer-send'))
  equal(record.getAttribute('aria-keyshortcuts'), 'Alt+Shift+V')
  equal($('button[aria-label="Send message"]'), null)
  const field = $('textarea') as HTMLTextAreaElement
  await act(() => {
    field.value = 'Hello'
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  ok($('button[aria-label="Send message"]'))
  equal($('button[aria-label="Record a voice note"]'), null)
})

it('starts and attaches a recording with the keyboard shortcut', async (t) => {
  fakeMicrophone(t)
  let attached: File[] = []
  const { $, act, cleanup } = render(
    <InputMessage voice onFilesChange={(files) => (attached = files)} onSend={() => {}} />,
  )
  t.after(cleanup)
  const field = $('textarea') as HTMLTextAreaElement
  const press = () =>
    field.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'V',
        code: 'KeyV',
        altKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
  await act(press)
  await wait(50)
  await act(() => {})
  ok($('.rf-composer-voice'), 'the shortcut starts a recording')
  await wait(200)
  await act(press)
  for (let tries = 0; tries < 40 && !attached.length; tries++) await wait(25)
  equal(attached.length, 1)
})

it('turns the shortcut off with null', async (t) => {
  const { $, cleanup } = render(<InputMessage voice voiceShortcut={null} onSend={() => {}} />)
  t.after(cleanup)
  equal($('button[aria-label="Record a voice note"]')?.getAttribute('aria-keyshortcuts'), null)
})

it('draws stop as a filled square', async (t) => {
  const { $, cleanup } = render(<InputMessage status="streaming" onSend={() => {}} />)
  t.after(cleanup)
  ok($('button[aria-label="Stop response"]')?.hasAttribute('data-stop'))
})

it('throws a cancelled recording away', async (t) => {
  fakeMicrophone(t)
  let attached: File[] = []
  const { $, act, cleanup } = render(
    <InputMessage voice onFilesChange={(files) => (attached = files)} onSend={() => {}} />,
  )
  t.after(cleanup)
  await act(() => ($('button[aria-label="Record a voice note"]') as HTMLButtonElement).click())
  await wait(50)
  await act(() => {})
  await act(() => ($('button[aria-label="Cancel recording"]') as HTMLButtonElement).click())
  await wait(100)
  equal(attached.length, 0)
  equal($('.rf-composer-voice'), null)
})

it('says so when the microphone is blocked', async (t) => {
  fakeMicrophone(t, true)
  const { $, act, cleanup } = render(<InputMessage voice onSend={() => {}} />)
  t.after(cleanup)
  await act(() => ($('button[aria-label="Record a voice note"]') as HTMLButtonElement).click())
  await wait(20)
  await act(() => {})
  equal($('[role=alert]')?.textContent, 'Microphone access was blocked.')
  equal($('.rf-composer-voice'), null)
})
