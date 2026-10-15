import { useEffect, useState } from 'react'
import { fetchUnit } from '../api'
import { usePronounce } from '../hooks/usePronounce'
import { BulbIcon, ChevronLeftIcon, MicIcon, SpeakerIcon, TargetIcon } from './Icons'

const DURATIONS = [3, 5, 10]

function SpeakButton({ text, pronounce }) {
  const active = pronounce.playing === text
  return (
    <button
      type="button"
      className={`speak ${active ? 'active' : ''}`}
      onClick={() => (active ? pronounce.stop() : pronounce.play(text))}
      aria-label={`Tinglash: ${text}`}
      title="Tinglash"
    >
      <SpeakerIcon size={16} />
    </button>
  )
}

export default function LessonScreen({ slug, onBack, onPractice }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(5)
  const pronounce = usePronounce()

  useEffect(() => {
    fetchUnit(slug)
      .then(setData)
      .catch(() => setError("Darsni yuklab bo'lmadi."))
  }, [slug])

  if (error || !data) {
    return (
      <main className="lesson">
        <button className="icon-btn" onClick={onBack} aria-label="Orqaga">
          <ChevronLeftIcon />
        </button>
        {error ? <p className="form-error">{error}</p> : <div className="units-loading"><span className="spinner" /></div>}
      </main>
    )
  }

  const { unit } = data
  // Stripped placeholders ("I'm ... years old") read badly aloud, so only full sentences get a speaker.
  const speakable = (text) => !text.includes('...')

  return (
    <main className="lesson">
      <header className="lesson-head">
        <button className="icon-btn" onClick={onBack} aria-label="Darslarga qaytish" title="Darslarga qaytish">
          <ChevronLeftIcon />
        </button>
        <span className="lesson-kicker">
          {unit.number}-dars · <span className="level-badge">{unit.level}</span>
        </span>
      </header>

      <section className="lesson-hero">
        <h1>{unit.title_uz}</h1>
        <p className="lesson-en">{unit.title}</p>
        <p className="lesson-goal">
          <TargetIcon size={18} />
          <span>{unit.goal_uz}</span>
        </p>
      </section>

      <section className="glass panel">
        <h2>
          <span className="step">1</span> Yangi so'zlar
        </h2>
        <ul className="vocab-grid">
          {unit.vocabulary.map((w) => (
            <li key={w.en}>
              <SpeakButton text={w.en} pronounce={pronounce} />
              <span>
                <strong>{w.en}</strong>
                <small>{w.uz}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass panel">
        <h2>
          <span className="step">2</span> Grammatika: {unit.grammar.title}
        </h2>
        <p className="grammar-text">{unit.grammar.explanation_uz}</p>
        <ul className="patterns">
          {unit.grammar.patterns.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <h3 className="sub-title">Misollar</h3>
        <ul className="examples">
          {unit.grammar.examples.map((ex) => (
            <li key={ex.en}>
              <SpeakButton text={ex.en} pronounce={pronounce} />
              <span>
                <strong>{ex.en}</strong>
                <small>{ex.uz}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass panel">
        <h2>
          <span className="step">3</span> Tayyor iboralar
        </h2>
        <p className="muted-text">Suhbatda shu qoliplardan foydalaning — nuqtalar o'rniga o'zingiz haqingizda ayting.</p>
        <ul className="examples">
          {unit.phrases.map((ph) => (
            <li key={ph.en}>
              {speakable(ph.en) ? <SpeakButton text={ph.en} pronounce={pronounce} /> : <span className="speak placeholder" />}
              <span>
                <strong>{ph.en}</strong>
                <small>{ph.uz}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass panel practice-cta">
        <h2>
          <span className="step">4</span> Endi English bilan gaplashing
        </h2>
        <p className="muted-text">
          English shu mavzuda oddiy savollar beradi. Qiynalsangiz, namuna gap aytib beradi.{' '}
          <BulbIcon size={16} className="inline-icon" />
          tugmasi esa shu iboralarni ko'rsatadi.
        </p>
        <div className="chips">
          {DURATIONS.map((m) => (
            <button key={m} type="button" className={`chip ${duration === m ? 'active' : ''}`} onClick={() => setDuration(m)}>
              {m} daqiqa
            </button>
          ))}
        </div>
        <button className="btn-primary large" onClick={() => onPractice(unit, duration)}>
          <MicIcon />
          Gaplashishni boshlash
        </button>
      </section>
    </main>
  )
}
