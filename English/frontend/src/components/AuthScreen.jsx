import { useEffect, useRef, useState } from 'react'
import { login, register } from '../api'
import { CapsLockIcon, EyeIcon, EyeOffIcon, LockIcon, MicIcon, TargetIcon, TrendUpIcon } from './Icons'
import Logo from './Logo'

const MIN_USERNAME = 3
const MAX_USERNAME = 30
const MIN_PASSWORD = 6
const USERNAME_RE = /^[a-z0-9_-]+$/i
const STRENGTH_LABELS = ['', 'Zaif', "O'rtacha", 'Kuchli']

function fieldErrors(error) {
  const errors = error?.response?.data?.errors
  if (errors) return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]))
  if (!error?.response) return { form: "Serverga ulanib bo'lmadi. Backend ishlayotganini tekshiring." }
  if (error.response.status === 429) return { form: "Juda ko'p urinish. Bir daqiqadan so'ng qayta urinib ko'ring." }
  return { form: error.response.data?.message ?? "Xatolik yuz berdi. Qayta urinib ko'ring." }
}

// Mirrors the rules in AuthController, so obvious mistakes never need a round trip.
function validate(form, isRegister) {
  const errors = {}
  const name = form.name.trim()
  const username = form.username.trim()

  if (isRegister && !name) errors.name = 'Ismingizni kiriting.'

  if (!username) errors.username = 'Loginni kiriting.'
  else if (username.length < MIN_USERNAME) errors.username = "Login kamida 3 ta belgidan iborat bo'lsin."
  else if (username.length > MAX_USERNAME) errors.username = "Login 30 ta belgidan oshmasin."
  else if (!USERNAME_RE.test(username)) {
    errors.username = "Login faqat lotin harflari, raqam, - va _ dan iborat bo'lishi mumkin."
  }

  if (!form.password) errors.password = 'Parolni kiriting.'
  else if (isRegister && form.password.length < MIN_PASSWORD) {
    errors.password = "Parol kamida 6 ta belgidan iborat bo'lsin."
  }

  return errors
}

function passwordStrength(password) {
  if (!password) return { level: 0, label: '' }

  let points = 0
  if (password.length >= MIN_PASSWORD) points += 1
  if (password.length >= 10) points += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1
  if (/\d/.test(password)) points += 1
  if (/[^a-z0-9]/i.test(password)) points += 1

  const level = Math.min(3, Math.ceil(points / 2))
  return { level, label: STRENGTH_LABELS[level] }
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [capsOn, setCapsOn] = useState(false)
  const firstField = useRef(null)
  const isRegister = mode === 'register'
  const strength = passwordStrength(form.password)

  // Focus whichever field comes first, so typing can start right away.
  useEffect(() => {
    firstField.current?.focus()
  }, [mode])

  const update = (key) => (e) => {
    const { value } = e.target
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((er) => ({ ...er, [key]: undefined, form: undefined }))
  }

  const trackCaps = (e) => setCapsOn(Boolean(e.getModifierState?.('CapsLock')))

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setRevealed(false)
    setCapsOn(false)
  }

  async function submit(e) {
    e.preventDefault()

    const found = validate(form, isRegister)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setBusy(true)
    setErrors({})
    try {
      const user = isRegister
        ? await register(form.name.trim(), form.username.trim(), form.password)
        : await login(form.username.trim(), form.password)
      onAuthenticated(user)
    } catch (err) {
      setErrors(fieldErrors(err))
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <div className="brand-lockup">
          <Logo size={78} alt="English" />
          <span className="brand-text">
            <strong className="brand-name">English</strong>
            <span className="brand-tag">AI English Tutor</span>
          </span>
        </div>

        <h2>Ingliz tilida erkin va ishonch bilan gaplashing</h2>

        <ul className="brand-points">
          <li>
            <span className="point-icon">
              <MicIcon size={20} />
            </span>
            <span>Ovozli suhbat — English bilan jonli gaplashib o'rganasiz.</span>
          </li>
          <li>
            <span className="point-icon">
              <TargetIcon size={20} />
            </span>
            <span>Darslar darajangizga qarab moslashib boradi.</span>
          </li>
          <li>
            <span className="point-icon">
              <TrendUpIcon size={20} />
            </span>
            <span>Xatolaringiz tahlil qilinadi, progessingiz saqlanadi.</span>
          </li>
        </ul>

        <p className="brand-foot">Har bir mashg'ulot shu akkauntga bog'lanadi.</p>
      </section>

      <section className="auth-card">
        <header className="auth-head">
          <h2>{isRegister ? 'Akkaunt yarating' : 'Akkauntingizga kiring'}</h2>
          <p>
            {isRegister
              ? "Bir daqiqada ro'yxatdan o'tib, gaplashishni boshlang."
              : 'Davom etish uchun login va parolingizni kiriting.'}
          </p>
        </header>

        <form className="glass auth-form" onSubmit={submit} noValidate>
          <div className="segmented two" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={!isRegister ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              <strong>Kirish</strong>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={isRegister ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              <strong>Ro'yxatdan o'tish</strong>
            </button>
          </div>

          {isRegister && (
            <div className="field">
              <label htmlFor="auth-name">Ismingiz</label>
              <input
                id="auth-name"
                ref={firstField}
                className={`text-input ${errors.name ? 'invalid' : ''}`}
                value={form.name}
                onChange={update('name')}
                placeholder="Masalan: Aziz"
                autoComplete="given-name"
                maxLength={60}
                required
              />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-username">Login</label>
            <input
              id="auth-username"
              ref={isRegister ? null : firstField}
              className={`text-input ${errors.username ? 'invalid' : ''}`}
              value={form.username}
              onChange={update('username')}
              placeholder="masalan: aziz_2000"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={30}
              required
            />
            {errors.username && <small className="field-error">{errors.username}</small>}
          </div>

          <div className="field">
            <label htmlFor="auth-password">Parol</label>
            <div className="password-field">
              <input
                id="auth-password"
                className={`text-input ${errors.password ? 'invalid' : ''}`}
                type={revealed ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                onKeyDown={trackCaps}
                onKeyUp={trackCaps}
                onBlur={() => setCapsOn(false)}
                placeholder={isRegister ? 'Kamida 6 ta belgi' : 'Parolingiz'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="reveal"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                aria-pressed={revealed}
              >
                {revealed ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {capsOn && (
              <small className="caps-hint" role="status">
                <CapsLockIcon size={16} />
                Caps Lock yoqilgan
              </small>
            )}
            {isRegister && (
              <div className="strength" data-level={strength.level}>
                <span className="strength-track" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <small role="status">{strength.label || 'Kamida 6 ta belgi'}</small>
              </div>
            )}
            {errors.password && <small className="field-error">{errors.password}</small>}
          </div>

          {errors.form && <div className="form-error">{errors.form}</div>}

          <button type="submit" className="btn-primary large" disabled={busy}>
            {busy ? 'Kutib turing...' : isRegister ? 'Akkaunt ochish' : 'Kirish'}
          </button>

          <p className="auth-note">
            <LockIcon size={16} />
            Parolingiz shifrlangan holda saqlanadi.
          </p>
        </form>
      </section>
    </main>
  )
}

