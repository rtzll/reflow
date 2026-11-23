/**
 * Records the microphone into an audio File and reports its loudness while
 * it records. Fills a gap in `@remix-run/ui` 0.14.0, which has nothing for
 * media capture; InputMessage uses it to attach a voice note.
 *
 * It records with MediaRecorder in the first container the browser supports
 * and reads the level from an AnalyserNode. `start()` asks for the
 * microphone; a refusal rejects with the browser's error. `stop()` resolves
 * with the recording, `cancel()` throws it away, and both release the
 * microphone.
 */
export interface VoiceRecording {
  start(): Promise<void>
  stop(): Promise<File | null>
  cancel(): void
  readonly recording: boolean
}

// Containers in order of preference; Safari records MP4.
const containers = [
  ['audio/webm;codecs=opus', 'webm'],
  ['audio/ogg;codecs=opus', 'ogg'],
  ['audio/mp4', 'm4a'],
] as const

export function voiceRecordingSupported() {
  return (
    typeof navigator !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** A file name such as `recording-14-05-32.webm`, from the time it ended. */
export function recordingName(extension: string, at = new Date()) {
  return `recording-${pad(at.getHours())}-${pad(at.getMinutes())}-${pad(at.getSeconds())}.${extension}`
}

export function createVoiceRecording(options: {
  /** Loudness from 0 to 1, about once a frame while recording. */
  onLevel?: (level: number) => void
}): VoiceRecording {
  let stream: MediaStream | undefined
  let recorder: MediaRecorder | undefined
  let context: AudioContext | undefined
  let frame = 0
  let chunks: Blob[] = []
  let format: (typeof containers)[number] = containers[0]

  function release() {
    cancelAnimationFrame(frame)
    stream?.getTracks().forEach((track) => track.stop())
    void context?.close()
    stream = undefined
    recorder = undefined
    context = undefined
    chunks = []
  }

  function meter(source: MediaStream) {
    context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(source).connect(analyser)
    const samples = new Float32Array(analyser.fftSize)
    const tick = () => {
      analyser.getFloatTimeDomainData(samples)
      let sum = 0
      for (const sample of samples) sum += sample * sample
      // Root mean square, scaled so speech fills most of the range.
      options.onLevel?.(Math.min(1, Math.sqrt(sum / samples.length) * 4))
      frame = requestAnimationFrame(tick)
    }
    tick()
  }

  return {
    get recording() {
      return recorder?.state === 'recording'
    },
    async start() {
      if (recorder) return
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      format = containers.find(([type]) => MediaRecorder.isTypeSupported(type)) ?? containers[0]
      recorder = new MediaRecorder(stream, { mimeType: format[0] })
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunks.push(event.data)
      })
      recorder.start()
      meter(stream)
    },
    stop() {
      const active = recorder
      if (!active) return Promise.resolve(null)
      return new Promise((resolve) => {
        active.addEventListener(
          'stop',
          () => {
            const type = format[0].split(';')[0]
            const file = chunks.length ? new File(chunks, recordingName(format[1]), { type }) : null
            release()
            resolve(file)
          },
          { once: true },
        )
        active.stop()
      })
    },
    cancel() {
      if (recorder?.state === 'recording') recorder.stop()
      release()
    },
  }
}
