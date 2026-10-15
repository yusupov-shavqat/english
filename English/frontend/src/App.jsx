import { useCallback, useEffect, useState } from 'react'
import { fetchMe, finishChat, handleUnauthorized, hasToken, logout, setToken } from './api'
import AuthScreen from './components/AuthScreen'
import ChatScreen from './components/ChatScreen'
import HomeShell from './components/HomeShell'
import LessonScreen from './components/LessonScreen'
import Logo from './components/Logo'
import SetupScreen from './components/SetupScreen'
import SummaryScreen from './components/SummaryScreen'
import UnitsScreen from './components/UnitsScreen'

const SETTINGS_KEY = 'tutor-settings'
const DEFAULT_SETTINGS = { duration: 5, level: 'intermediate', topic: '', explanationLanguage: 'uz' }

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage may be blocked; settings just won't be remembered.
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(hasToken)
  // home | lesson | chat | summary
  const [screen, setScreen] = useState('home')
  const [tab, setTab] = useState('units')
  const [lessonSlug, setLessonSlug] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  // The practice session in progress: chat settings plus the lesson unit, if any.
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  // Remounts the chat so every session starts fresh.
  const [sessionKey, setSessionKey] = useState(0)

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    setScreen('home')
  }, [])

  useEffect(() => {
    handleUnauthorized(signOut)
    if (!hasToken()) return
    fetchMe()
      .then(setUser)
      .catch(() => signOut())
      .finally(() => setBooting(false))
  }, [signOut])

  const refreshUser = () => fetchMe().then(setUser).catch(() => {})

  // Saves the session and lets English update what she remembers about the learner.
  const closeSession = (conversationId, secondsUsed) => {
    if (!conversationId) return Promise.resolve({})
    return finishChat(conversationId, secondsUsed).finally(refreshUser)
  }

  const beginChat = (next) => {
    setSession(next)
    setSessionKey((k) => k + 1)
    setScreen('chat')
  }

  const startFreeTalk = (next) => {
    setSettings(next)
    saveSettings(next)
    beginChat({ settings: next, unit: null })
  }

  const startPractice = (unit, duration) => {
    beginChat({ settings: { ...settings, duration, unit: unit.slug }, unit })
  }

  const backHome = () => setScreen(session?.unit ? 'lesson' : 'home')

  if (booting) {
    return (
      <main className="boot">
        <div className="boot-splash">
          <Logo size={96} alt="English" />
          <span className="boot-name">English</span>
          <span className="boot-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </main>
    )
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  if (screen === 'lesson') {
    return <LessonScreen slug={lessonSlug} onBack={() => setScreen('home')} onPractice={startPractice} />
  }

  if (screen === 'chat') {
    return (
      <ChatScreen
        key={sessionKey}
        settings={session.settings}
        unit={session.unit}
        onExit={({ conversationId, secondsUsed }) => {
          closeSession(conversationId, secondsUsed).catch(() => {})
          backHome()
        }}
        onFinish={(r) => {
          setResult({ ...r, unit: session.unit, memory: 'saving' })
          setScreen('summary')
          closeSession(r.conversationId, r.secondsUsed)
            .then(({ profile, unit }) => setResult((cur) => ({ ...cur, memory: 'saved', profile, unitResult: unit })))
            .catch(() => setResult((cur) => ({ ...cur, memory: 'failed' })))
        }}
      />
    )
  }

  if (screen === 'summary') {
    return (
      <SummaryScreen
        result={result}
        onRestart={() => beginChat(session)}
        onBack={backHome}
        backLabel={session?.unit ? 'Darsga qaytish' : 'Bosh sahifa'}
      />
    )
  }

  return (
    <HomeShell user={user} tab={tab} onTab={setTab} onLogout={() => logout().finally(signOut)}>
      {tab === 'units' ? (
        <UnitsScreen
          onOpen={(slug) => {
            setLessonSlug(slug)
            setScreen('lesson')
          }}
        />
      ) : (
        <SetupScreen user={user} initial={settings} onStart={startFreeTalk} />
      )}
    </HomeShell>
  )
}
