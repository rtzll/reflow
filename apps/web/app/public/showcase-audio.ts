import type { SoundAssets, SoundCue } from '../sound-assets.ts'

let enabled = false
let latestCue = 0
let context: AudioContext | undefined
let output: GainNode | undefined
let recordings: SoundAssets | undefined
const buffers = new Map<string, Promise<AudioBuffer>>()

export function setSoundEnabled(next: boolean) {
  if (enabled === next) return
  enabled = next
  latestCue++
  // Disconnect anything still playing. Re-enabling gets a fresh output.
  output?.disconnect()
  output = undefined
}

export async function unlockSound() {
  if (!enabled || navigator.userActivation?.hasBeenActive === false) return false
  try {
    context ??= new AudioContext()
    if (context.state !== 'running') await context.resume()
    return context.state === 'running'
  } catch {
    return false
  }
}

function loadRecording(audio: AudioContext, href: string) {
  let pending = buffers.get(href)
  if (!pending) {
    pending = fetch(href)
      .then((response) => {
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`)
        return response.arrayBuffer()
      })
      .then((bytes) => audio.decodeAudioData(bytes))
      .catch((error) => {
        buffers.delete(href)
        throw error
      })
    buffers.set(href, pending)
  }
  return pending
}

interface CueOptions {
  direction?: 'forward' | 'back'
  emphasis?: 'subtle'
  volume?: number
}

export async function play(cue: SoundCue, options: CueOptions = {}) {
  const requested = ++latestCue
  if (!(await unlockSound()) || !context || requested !== latestCue) return
  try {
    recordings ??= JSON.parse(
      document.getElementById('showcase-recordings')!.textContent,
    ) as SoundAssets
    const back = options.direction === 'back'
    const { href, samples } = recordings[cue === 'toggle' && back ? 'toggleOff' : cue]
    const buffer = await loadRecording(context, href)
    // On a cold load, a newer action or mute can supersede this cue during decode.
    if (requested !== latestCue || context.state !== 'running') return
    if (!output) {
      output = context.createGain()
      output.gain.value = 0.35
      output.connect(context.destination)
    }
    const [start, duration] = samples[Math.floor(Math.random() * samples.length)]
    const source = context.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = back && cue !== 'toggle' ? 0.9 : 1
    const gain = context.createGain()
    gain.gain.value = (options.emphasis === 'subtle' ? 0.75 : 1) * (options.volume ?? 1)
    source.connect(gain).connect(output)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
    source.start(0, start / 1000, duration / 1000)
  } catch {
    // A missing or undecodable recording must never interrupt the interaction.
  }
}
