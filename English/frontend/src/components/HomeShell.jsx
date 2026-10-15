import { ChatIcon, GraduationIcon, LogoutIcon } from './Icons'
import Logo from './Logo'
import Orb from './Orb'

const TABS = [
  { id: 'units', label: 'Darslar', hint: "Mavzu o'rganib, gaplashing", Icon: GraduationIcon },
  { id: 'free', label: 'Erkin suhbat', hint: 'Istalgan mavzuda', Icon: ChatIcon },
]

// Signed-in home: brand bar, greeting and the Lessons / Free talk switch.
export default function HomeShell({ user, tab, onTab, onLogout, children }) {
  const initial = user.name?.trim().charAt(0).toUpperCase() || '?'

  return (
    <main className="home">
      <nav className="user-bar">
        <Logo size={36} />
        <span className="app-name">English</span>
        <span className="user-chip">
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="user-name">{user.name}</span>
        </span>
        <button type="button" className="btn-ghost small" onClick={onLogout}>
          <LogoutIcon size={16} />
          Chiqish
        </button>
      </nav>

      <header className="hero compact">
        <Orb phase="idle" size="110px" />
        <h1>
          Salom, <span className="gradient-text">{user.name}</span>!
        </h1>
      </header>

      <div className="segmented two home-tabs" role="tablist">
        {TABS.map(({ id, label, hint, Icon: TabIcon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => onTab(id)}
          >
            <TabIcon size={20} />
            <strong>{label}</strong>
            <small>{hint}</small>
          </button>
        ))}
      </div>

      {children}
    </main>
  )
}
