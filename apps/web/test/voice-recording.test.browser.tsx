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
  ok($('button[aria-label="Record a voice note"]'))
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
