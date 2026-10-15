import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, startChat, streamTurn } from '../api'
import { formatTime, useCountdown } from '../hooks/useCountdown'
import { useVoiceEngine } from '../hooks/useVoice'
import { CorrectionItem } from './Corrections'
import { BulbIcon, ChevronLeftIcon, CloseIcon, MicIcon, MicOffIcon, StopIcon, TrophyIcon } from './Icons'
import Orb from './Orb'

let nextId = 1

const PHASE_TEXT = {
  connecting: ['Ulanmoqda...', 'Mikrofonga ruxsat bering'],
  listening: ['Tinglayapman', "Inglizcha gapiring — to'xtaganingizda o'zim yuboraman"],
  user: ['Eshityapman...', 'Gapirib bo\'lgach, biroz jim turing'],
  thinking: ["O'ylayapman...", 'Gapingizni tekshiryapman'],
  ai: ['Gapiryapman', "Gapimni bo'lish uchun aylanaga bosing"],
  muted: ["Mikrofon o'chiq", 'Davom etish uchun aylanaga bosing'],
  ended: ['Vaqt tugadi', "Natijalaringizni ko'ring yoki davom eting"],
  error: ['Mikrofon ishlamayapti', ''],
}

function errorText(error) {
  if (error?.name === 'NotAllowedError') {
    return "Mikrofonga ruxsat berilmadi. Manzil satridagi qulf belgisidan mikrofonga ruxsat bering."
  }
  if (error?.name === 'NotFoundError') return "Mikrofon topilmadi. Mikrofonni ulab, qayta urinib ko'ring."
  if (error?.message === 'unsupported') return "Bu brauzer ovoz yozishni qo'llab-quvvatlamaydi. Chrome yoki Edge'dan foydalaning."
  if (error instanceof ApiError) return error.message
  if ((error?.isAxiosError && !error.response) || error instanceof TypeError) {
    return "Serverga ulanib bo'lmadi. Backend ishlayotganini tekshiring."
  }
  return error?.response?.data?.message ?? "Xatolik yuz berdi. Qayta urinib ko'ring."
}

export default function ChatScreen({ settings, unit = null, onFinish, onExit }) {
  const { remaining, expired, extend } = useCountdown(settings.duration * 60)
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(true)
  const [muted, setMuted] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [toast, setToast] = useState(null)
  const [fatal, setFatal] = useState(null)
  const [ready, setReady] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)
  const startedAt = useRef(Date.now())
  const conversationId = useRef(null)

  // Latest values for the async voice loop, which outlives individual renders.
  const live = useRef({ expired, muted, messages })
  useEffect(() => {
    live.current = { expired, muted, messages }
  }, [expired, muted, messages])
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const engine = useVoiceEngine(handleUtterance)

  const resumeListening = useCallback(() => {
    if (alive.current && !live.current.expired && !live.current.muted) engine.listen()
  }, [engine])

  const say = useCallback(
    async (audioUrl) => {
      if (alive.current && audioUrl) await engine.play(audioUrl)
      resumeListening()
    },
    [engine, resumeListening],
  )

  const connect = useCallback(async () => {
    setFatal(null)
    try {
      await engine.init()
    } catch (err) {
      if (alive.current) setFatal(errorText(err))
      return
    }
    if (!alive.current) return
    setReady(true)
    try {
      const data = await startChat(settings)
      if (!alive.current) return
      setMessages([{ id: nextId++, role: 'assistant', content: data.reply }])
      setThinking(false)
      conversationId.current = data.conversation_id
      await say(data.audio_url)
    } catch (err) {
      if (!alive.current) return
      setThinking(false)
      setToast(errorText(err))
      resumeListening()
    }
  }, [engine, settings, say, resumeListening])

  useEffect(() => {
    let cancelled = false
    // Wait a tick so a StrictMode double mount only connects once.
    const id = setTimeout(() => !cancelled && connect(), 0)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUtterance(audio) {
    setThinking(true)
    setToast(null)
    let userMsg = null
    let replied = false

    try {
      await streamTurn(conversationId.current, audio, {
        transcript: ({ text }) => {
          if (!text || !alive.current) return
          userMsg = { id: nextId++, role: 'user', content: text, corrections: null }
          setMessages((m) => [...m, userMsg])
        },
        reply: ({ text, audio_url }) => {
          if (!alive.current) return
          replied = true
          setMessages((m) => [...m, { id: nextId++, role: 'assistant', content: text }])
          setThinking(false)
          say(audio_url)
        },
        check: ({ corrected, corrections }) => {
          if (!alive.current || !userMsg) return
          const checked = { ...userMsg, corrected, corrections }
          setMessages((m) => m.map((msg) => (msg.id === checked.id ? checked : msg)))
          setFeedback(checked)
        },
        error: ({ message }) => alive.current && setToast(message),
      })
    } catch (err) {
      if (alive.current) setToast(errorText(err))
    }

    // Nothing to answer (silence, noise or an error): go straight back to listening.
    if (alive.current && !replied) {
      setThinking(false)
      resumeListening()
    }
  }

  // Time is up: send what is being said right now, then stop listening.
  useEffect(() => {
    if (!expired) return
    if (engine.micState === 'speaking') engine.commit()
    else engine.pause()
  }, [expired]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMute() {
    if (muted) {
      setMuted(false)
      live.current.muted = false
      if (!thinking && !engine.aiSpeaking) resumeListening()
    } else {
      setMuted(true)
      engine.pause()
    }
  }

  function handleOrbTap() {
    if (fatal) return connect()
    if (engine.audio) return engine.stopSpeaking()
    if (engine.micState === 'speaking') return engine.commit()
    if (muted) return toggleMute()
  }

  const orbTapRef = useRef(handleOrbTap)
  useEffect(() => {
    orbTapRef.current = handleOrbTap
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || e.repeat || e.target.closest?.('button, input')) return
      e.preventDefault()
      orbTapRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const elapsed = () => Math.round((Date.now() - startedAt.current) / 1000)

  function finish() {
    engine.destroy()
    onFinish({ messages, conversationId: conversationId.current, secondsUsed: elapsed() })
  }

  function exit() {
    const started = messages.some((m) => m.role === 'user')
    if (!started || window.confirm('Suhbatni tugatib, chiqasizmi?')) {
      engine.destroy()
      onExit({ conversationId: conversationId.current, secondsUsed: elapsed() })
    }
  }

  let phase
  if (fatal) phase = 'error'
  else if (!ready) phase = 'connecting'
  else if (engine.aiSpeaking) phase = 'ai'
  else if (thinking) phase = 'thinking'
  else if (expired) phase = 'ended'
  else if (muted) phase = 'muted'
  else if (engine.micState === 'speaking') phase = 'user'
  else if (engine.micState === 'waiting') phase = 'listening'
  else phase = 'thinking'

  const [title, hint] = PHASE_TEXT[phase]
  const showTimeUp = expired && !thinking && !engine.audio
  const mistakeCount = messages.reduce((n, m) => n + (m.corrections?.length ?? 0), 0)
  const total = settings.duration * 60
  const progress = expired ? 1 : 1 - remaining / Math.max(total, remaining)

  return (
    <main className="voice">
      <header className="voice-top">
        <button className="icon-btn" onClick={exit} aria-label="Chiqish" title="Chiqish">
          <ChevronLeftIcon />
        </button>
        <div className="topic-pill" title={unit?.title_uz ?? (settings.topic || 'Erkin suhbat')}>
          {unit ? `${unit.number}-dars · ${unit.title_uz}` : settings.topic || 'Erkin suhbat'}
        </div>
        <div className={`timer-pill ${remaining <= 30 && !expired ? 'low' : ''}`} style={{ '--p': progress }}>
          <span className="timer-ring" />
          {formatTime(remaining)}
        </div>
      </header>

      {toast && (
        <div className="toast" role="alert">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Yopish">
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      <section className="stage">
        <Orb phase={phase} source={engine} onClick={handleOrbTap} />
        <div className="phase-text" aria-live="polite">
          <h2>{title}</h2>
          {fatal ? <p className="fatal">{fatal}</p> : hint && <p>{hint}</p>}
          {fatal && (
            <button className="btn-primary small" onClick={connect}>
              Qayta urinish
            </button>
          )}
        </div>
      </section>

      <section className="feedback-zone">
        {hintsOpen && unit ? (
          <HintPanel unit={unit} onClose={() => setHintsOpen(false)} />
        ) : feedback &&
          (feedback.corrections.length ? (
            <div className="feedback-card" key={feedback.id}>
              <div className="feedback-head">
                <span className="dot bad" />
                {feedback.corrections.length} ta xato
              </div>
              <ul className="correction-list">
                {feedback.corrections.map((c, i) => (
                  <CorrectionItem key={i} correction={c} />
                ))}
              </ul>
              {feedback.corrected && (
                <p className="feedback-correct">
                  <span>To'g'risi:</span> {feedback.corrected}
                </p>
              )}
            </div>
          ) : (
            <div className="feedback-card ok" key={feedback.id}>
              <span className="dot good" />
              Zo'r! Xatosiz gapirdingiz
            </div>
          ))}
      </section>

      {showTimeUp ? (
        <div className="time-up-sheet">
          <h3>
            <TrophyIcon size={22} />
            Vaqt tugadi!
          </h3>
          <p>
            {messages.filter((m) => m.role === 'user').length} marta gapirdingiz, {mistakeCount} ta xato topildi.
          </p>
          <div className="sheet-actions">
            <button
              className="btn-ghost"
              onClick={() => {
                extend(5 * 60)
                live.current.expired = false
                resumeListening()
              }}
            >
              +5 daqiqa
            </button>
            <button className="btn-primary" onClick={finish}>
              Natijalarni ko'rish
            </button>
          </div>
        </div>
      ) : (
        <footer className="voice-controls">
          <button
            className={`control ${muted ? 'off' : ''}`}
            onClick={toggleMute}
            disabled={!ready || expired}
            aria-pressed={muted}
            title={muted ? 'Mikrofonni yoqish' : "Mikrofonni o'chirish"}
          >
            {muted ? <MicOffIcon /> : <MicIcon />}
          </button>
          {unit && (
            <button
              className={`control hint ${hintsOpen ? 'on' : ''}`}
              onClick={() => setHintsOpen((o) => !o)}
              aria-pressed={hintsOpen}
              title="Yordamchi iboralar"
            >
              <BulbIcon />
            </button>
          )}
          <div className="mistake-counter" title="Topilgan xatolar">
            <strong>{mistakeCount}</strong>
            <span>xato</span>
          </div>
          <button className="control end" onClick={finish} title="Yakunlash">
            <StopIcon size={24} />
          </button>
        </footer>
      )}

    </main>
  )
}

// The lesson's phrases and words, for when the learner does not know what to say.
function HintPanel({ unit, onClose }) {
  return (
    <div className="feedback-card hint-panel">
      <div className="hint-head">
        <span>
          <BulbIcon size={18} />
          Shunday deyishingiz mumkin
        </span>
        <button onClick={onClose} aria-label="Yopish">
          <CloseIcon size={16} />
        </button>
      </div>
      <ul className="hint-phrases">
        {unit.phrases.map((p) => (
          <li key={p.en}>
            <strong>{p.en}</strong>
            <small>{p.uz}</small>
          </li>
        ))}
      </ul>
      <div className="chips small">
        {unit.vocabulary.map((w) => (
          <span key={w.en} className="chip static" title={w.uz}>
            {w.en}
          </span>
        ))}
      </div>
    </div>
  )
}
