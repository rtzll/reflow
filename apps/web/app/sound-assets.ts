import { SPRITE_DATA, type SoundName } from 'button-sounds'
import { fileURLToPath } from 'node:url'

// Each file contains several takes. The guitar and tonal switches make their
// distinctive on/off sound on release.
const recordings = {
  tap: ['hi75-space', 'down'],
  select: ['hi75-soft', 'down'],
  navigate: ['hi75-knob', 'down'],
  tick: ['hi75-knob', 'down'],
  toggle: ['guitar-toggle-on', 'up'],
  toggleOff: ['guitar-toggle-off', 'up'],
  open: ['lock-open', 'up'],
  close: ['lock-closed', 'up'],
  ready: ['tonal-on', 'up'],
  success: ['tonal-on', 'up'],
  error: ['low-thumps', 'down'],
  warning: ['tonal-off', 'up'],
  attention: ['hi75-knob', 'up'],
} as const satisfies Record<string, readonly [SoundName, 'up' | 'down']>

type ButtonRecording = keyof typeof recordings
type Recording = ButtonRecording | 'swooshIn' | 'swooshOut'
export type SoundCue = Exclude<Recording, 'toggleOff'>
export type SoundAssets = Record<Recording, { href: string; samples: [number, number][] }>

function soundFile(name: SoundName) {
  return fileURLToPath(import.meta.resolve(`button-sounds/assets/${name}.mp3`))
}

const swooshFile = fileURLToPath(new URL('./public/surface-swoosh.mp3', import.meta.url))
export const soundFiles = [
  ...new Set(Object.values(recordings).map(([name]) => soundFile(name))),
  swooshFile,
]

export async function getSoundAssets(href: (file: string) => string | Promise<string>) {
  // Two original filtered-noise sweeps share a file. Offsets and lengths are in ms.
  const swoosh = await href(swooshFile)
  const result = {
    swooshIn: { href: swoosh, samples: [[0, 180]] },
    swooshOut: { href: swoosh, samples: [[250, 145]] },
  } as SoundAssets
  for (const cue of Object.keys(recordings) as ButtonRecording[]) {
    const [name, phase] = recordings[cue]
    result[cue] = {
      href: await href(soundFile(name)),
      samples: Object.entries(SPRITE_DATA[name])
        .filter(([id]) => id.startsWith(phase))
        .map(([, range]) => range),
    }
  }
  return result
}
