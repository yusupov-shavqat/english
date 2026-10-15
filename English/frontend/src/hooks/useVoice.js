import { useEffect, useRef, useState } from 'react'

const MIME_TYPES = [
  ['audio/webm;codecs=opus', 'webm'],
  ['audio/webm', 'webm'],
  ['audio/mp4', 'mp4'],
  ['audio/ogg;codecs=opus', 'ogg'],
]

// Voice-activity detection tuning (RMS loudness 0..1, times in ms).
const SPEECH_THRESHOLD = 0.03
const SPEECH_START_MS = 150
const SILENCE_END_MS = 1300
const MIN_SPEECH_MS = 400
const MAX_UTTERANCE_MS = 60000
const IDLE_RESTART_MS = 20000

function pickFormat() {
  if (typeof MediaRecorder === 'undefined') return null
  return MIME_TYPES.find(([type]) => MediaRecorder.isTypeSupported(type)) ?? ['', 'webm']
}

/**
 * Hands-free voice loop: listens on the microphone, detects when the learner starts and
 * stops talking, hands each finished utterance to `onUtterance`, and plays AI speech.
 * `level` is a smoothed 0..1 loudness of whoever is talking, for the visuals.
 */
class VoiceEngine {
  level = 0
  micState = 'off' // off | waiting | speaking
  aiSpeaking = false

  constructor({ utteranceHandler, onChange }) {
    this.utteranceHandler = utteranceHandler
    this.onChange = onChange
    this.listening = false
    this.recorder = null
    this.chunks = []
    this.audio = null
    this.playToken = 0
    this.resetVad()
    this.tick = this.tick.bind(this)
  }

  // Shared promise, so a double mount (React StrictMode) opens the microphone once.
  init() {
    this.initPromise ??= this.setup().catch((err) => {
      this.initPromise = null
      throw err
    })
    return this.initPromise
  }

  async setup() {
    this.format = pickFormat()
    if (!this.format || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    this.ctx = new AudioContext()
    await this.ctx.resume()
    this.micAnalyser = this.ctx.createAnalyser()
    this.micAnalyser.fftSize = 1024
    this.ctx.createMediaStreamSource(this.stream).connect(this.micAnalyser)
    this.aiAnalyser = this.ctx.createAnalyser()
    this.aiAnalyser.fftSize = 1024
    this.aiAnalyser.connect(this.ctx.destination)
    this.buffer = new Uint8Array(1024)
    this.frame = requestAnimationFrame(this.tick)
  }

  set(patch) {
    Object.assign(this, patch)
    this.onChange()
  }

  resetVad() {
    this.inSpeech = false
    this.speechMs = 0
    this.silenceMs = 0
  }

  startRecorder() {
    const recorder = new MediaRecorder(this.stream, this.format[0] ? { mimeType: this.format[0] } : undefined)
    const chunks = []
    recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data)
    recorder.start()
    this.recorder = recorder
    this.chunks = chunks
    this.recorderStarted = performance.now()
  }

  stopRecorder() {
    const { recorder, chunks } = this
    this.recorder = null
    if (!recorder || recorder.state === 'inactive') return Promise.resolve(null)
    return new Promise((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
      recorder.stop()
    })
  }

  listen() {
    if (!this.stream || this.listening) return
    this.resetVad()
    this.listening = true
    this.startRecorder()
    this.set({ micState: 'waiting' })
  }

  pause() {
    this.listening = false
    this.resetVad()
    this.stopRecorder()
    this.set({ micState: 'off' })
  }

  // Ends the current utterance now and sends it if it contained speech.
  async commit() {
    if (!this.listening) return
    const spoke = this.inSpeech && performance.now() - this.speechStarted >= MIN_SPEECH_MS
    this.listening = false
    this.resetVad()
    this.set({ micState: 'off' })
    const blob = await this.stopRecorder()
    if (spoke && blob?.size) this.utteranceHandler.current({ blob, filename: `speech.${this.format[1]}` })
    else this.listen()
  }

  rms(analyser) {
    analyser.getByteTimeDomainData(this.buffer)
    let sum = 0
    for (const v of this.buffer) {
      const x = (v - 128) / 128
      sum += x * x
    }
    return Math.sqrt(sum / this.buffer.length)
  }

  tick() {
    const now = performance.now()
    const dt = this.lastTick ? now - this.lastTick : 16
    this.lastTick = now

    const micLevel = this.rms(this.micAnalyser)
    const source = this.audio ? this.rms(this.aiAnalyser) : micLevel
    const target = Math.min(1, source * 6)
    this.level += (target - this.level) * (target > this.level ? 0.45 : 0.12)

    if (this.listening) {
      if (micLevel > SPEECH_THRESHOLD) {
        this.speechMs += dt
        this.silenceMs = 0
        if (!this.inSpeech && this.speechMs >= SPEECH_START_MS) {
          this.inSpeech = true
          this.speechStarted = now - this.speechMs
          this.set({ micState: 'speaking' })
        }
      } else if (this.inSpeech) {
        this.silenceMs += dt
        if (this.silenceMs >= SILENCE_END_MS) this.commit()
      } else {
        this.speechMs = Math.max(0, this.speechMs - dt)
        // Drop long stretches of silence so uploads stay small.
        if (now - this.recorderStarted > IDLE_RESTART_MS) {
          this.stopRecorder()
          this.startRecorder()
        }
      }
      if (this.inSpeech && now - this.speechStarted > MAX_UTTERANCE_MS) this.commit()
    }

    this.frame = requestAnimationFrame(this.tick)
  }

  stopSpeaking() {
    this.playToken++
    const audio = this.audio
    this.audio = null
    if (audio) {
      audio.pause()
      audio.dispatchEvent(new Event('ended'))
    }
    if (this.aiSpeaking) this.set({ aiSpeaking: false })
  }

  // Plays an audio URL; resolves when playback ends or is interrupted.
  play(url) {
    this.stopSpeaking()
    const token = this.playToken
    const audio = new Audio(url)
    if (this.ctx) this.ctx.createMediaElementSource(audio).connect(this.aiAnalyser)
    this.audio = audio
    // Only count as speaking once sound actually starts, not while the audio is still loading.
    audio.onplaying = () => token === this.playToken && !this.aiSpeaking && this.set({ aiSpeaking: true })
    return new Promise((resolve) => {
      const done = () => {
        audio.onended = audio.onerror = audio.onplaying = null
        if (token === this.playToken) {
          this.audio = null
          this.set({ aiSpeaking: false })
        }
        resolve()
      }
      audio.onended = done
      audio.onerror = done
      audio.play().catch(done)
    })
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    this.stopSpeaking()
    this.listening = false
    this.stopRecorder()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.ctx?.close().catch(() => {})
    this.stream = null
    this.ctx = null
  }
}

export function useVoiceEngine(onUtterance) {
  const callback = useRef(onUtterance)
  useEffect(() => {
    callback.current = onUtterance
  })

  const [, rerender] = useState(0)
  const [engine] = useState(
    () =>
      new VoiceEngine({
        utteranceHandler: callback,
        onChange: () => rerender((n) => n + 1),
      }),
  )

  useEffect(() => () => engine.destroy(), [engine])

  return engine
}
