import { SparkleIcon } from './Icons'

// What English remembers about the learner; grows after every conversation.
export default function MemoryCard({ user }) {
  const { profile, stats } = user

  if (!profile) {
    return (
      <section className="glass memory empty">
        <div className="memory-icon">
          <SparkleIcon size={22} />
        </div>
        <p>
          Birinchi suhbatdan so'ng English sizni eslab qoladi: qiziqishlaringiz, darajangiz va ko'p qiladigan xatolaringiz.
          Keyingi suhbatlar shunga moslashadi.
        </p>
      </section>
    )
  }

  return (
    <section className="glass memory">
      <div className="memory-head">
        <h2>English siz haqingizda eslaydi</h2>
        {profile.level && <span className="level-badge">{profile.level}</span>}
      </div>

      <div className="memory-stats">
        <div>
          <strong>{stats.sessions}</strong>
          <span>suhbat</span>
        </div>
        <div>
          <strong>{stats.minutes}</strong>
          <span>daqiqa</span>
        </div>
        <div>
          <strong>{profile.interests?.length ?? 0}</strong>
          <span>qiziqish</span>
        </div>
      </div>

      {profile.weak_points?.length > 0 && (
        <div className="memory-block">
          <h3>Ustida ishlayapmiz</h3>
          <ul className="memory-list weak">
            {profile.weak_points.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {profile.strengths?.length > 0 && (
        <div className="memory-block">
          <h3>Yaxshi chiqyapti</h3>
          <ul className="memory-list strong">
            {profile.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {profile.interests?.length > 0 && (
        <div className="chips small tags">
          {profile.interests.map((i) => (
            <span key={i} className="chip static">
              {i}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
