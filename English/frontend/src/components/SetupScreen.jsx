import { useState } from 'react'
import { recommendedLevel } from '../profile'
import { HeadphonesIcon, MicIcon } from './Icons'
import MemoryCard from './MemoryCard'

const PRESETS = [5, 10, 15, 20]

const LEVELS = [
  { value: 'beginner', label: "Boshlang'ich", hint: 'A1–A2' },
  { value: 'intermediate', label: "O'rta", hint: 'B1–B2' },
  { value: 'advanced', label: 'Yuqori', hint: 'C1–C2' },
]

const TOPIC_IDEAS = ['Travel', 'Movies', 'Food', 'My job', 'Hobbies', 'Technology', 'Sport']

export default function SetupScreen({ user, initial, onStart }) {
  const [settings, setSettings] = useState(initial)
  const [customOpen, setCustomOpen] = useState(!PRESETS.includes(initial.duration))
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }))

  const recommended = recommendedLevel(user.profile)
  const durationValid = Number.isInteger(settings.duration) && settings.duration >= 1 && settings.duration <= 120

  return (
    <div className="setup">
      <MemoryCard user={user} />

      <form
        className="glass setup-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (durationValid) onStart(settings)
        }}
      >
        <fieldset>
          <legend>
            <span className="step">1</span> Suhbat davomiyligi
          </legend>
          <div className="chips">
            {PRESETS.map((m) => (
              <button
                type="button"
                key={m}
                className={`chip ${!customOpen && settings.duration === m ? 'active' : ''}`}
                onClick={() => {
                  setCustomOpen(false)
                  update({ duration: m })
                }}
              >
                {m} daq
              </button>
            ))}
            <button type="button" className={`chip ${customOpen ? 'active' : ''}`} onClick={() => setCustomOpen(true)}>
              Boshqa
            </button>
          </div>
          {customOpen && (
            <label className="custom-duration">
              <input
                type="number"
                min="1"
                max="120"
                value={Number.isNaN(settings.duration) ? '' : settings.duration}
                onChange={(e) => update({ duration: parseInt(e.target.value, 10) })}
                autoFocus
              />
              <span>daqiqa (1–120)</span>
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend>
            <span className="step">2</span> Darajangiz
          </legend>
          <div className="segmented">
            {LEVELS.map((l) => (
              <button
                type="button"
                key={l.value}
                className={settings.level === l.value ? 'active' : ''}
                onClick={() => update({ level: l.value })}
              >
                <strong>{l.label}</strong>
                <small>{l.hint}</small>
                {recommended === l.value && <span className="recommended">tavsiya</span>}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span className="step">3</span> Mavzu <span className="muted">— ixtiyoriy</span>
          </legend>
          <input
            type="text"
            className="text-input"
            placeholder="Bo'sh qoldirsangiz, English mavzuni o'zi tanlaydi"
            value={settings.topic}
            maxLength={200}
            onChange={(e) => update({ topic: e.target.value })}
          />
          <div className="chips small">
            {TOPIC_IDEAS.map((t) => (
              <button
                type="button"
                key={t}
                className={`chip ${settings.topic === t ? 'active' : ''}`}
                onClick={() => update({ topic: settings.topic === t ? '' : t })}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span className="step">4</span> Xatolar qaysi tilda tushuntirilsin?
          </legend>
          <div className="segmented two">
            {[
              ['uz', "O'zbekcha"],
              ['en', 'English'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={settings.explanationLanguage === value ? 'active' : ''}
                onClick={() => update({ explanationLanguage: value })}
              >
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn-primary large" disabled={!durationValid}>
          <MicIcon />
          Suhbatni boshlash
        </button>
        <p className="tip">
          <HeadphonesIcon size={18} />
          Quloqchin bilan gaplashsangiz, English sizni yanada aniqroq eshitadi.
        </p>
      </form>
    </div>
  )
}
