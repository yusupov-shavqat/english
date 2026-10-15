import { formatTime } from '../hooks/useCountdown'
import { typeLabel } from '../mistakeTypes'
import { CorrectionItem, HighlightedText } from './Corrections'
import { AlertIcon, BookIcon, ChatIcon, ClockIcon, MicIcon, SparkleIcon, TrendUpIcon, TrophyIcon } from './Icons'
import { Stars } from './Stars'

function verdict(accuracy, count) {
  if (!count) return ['Bu safar gaplashmadingiz', "Keyingi safar bemalol gapiring — xato qilishdan qo'rqmang!", ChatIcon]
  if (accuracy >= 80) {
    return ['Ajoyib natija!', 'Gaplaringizning aksariyati xatosiz. Shu tarzda davom eting!', TrophyIcon]
  }
  if (accuracy >= 50) {
    return ['Yaxshi harakat!', "Ba'zi xatolar bor. Quyidagilarni bir ko'rib chiqing.", TrendUpIcon]
  }
  return ["O'rganish davom etadi", "Xatolar — o'sishning bir qismi. Quyidagi tuzatishlarni o'qib chiqing.", BookIcon]
}

export default function SummaryScreen({ result, onRestart, onBack, backLabel }) {
  const userMessages = result.messages.filter((m) => m.role === 'user')
  const withMistakes = userMessages.filter((m) => m.corrections?.length)
  const totalMistakes = withMistakes.reduce((n, m) => n + m.corrections.length, 0)
  const accuracy = userMessages.length
    ? Math.round(((userMessages.length - withMistakes.length) / userMessages.length) * 100)
    : 0
  const [title, subtitle, VerdictIcon] = verdict(accuracy, userMessages.length)

  const byType = {}
  for (const m of withMistakes) {
    for (const c of m.corrections) {
      const label = typeLabel(c.type)
      byType[label] = (byType[label] ?? 0) + 1
    }
  }
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1])

  return (
    <main className="summary">
      <header className="summary-hero">
        <div className="score-ring" style={{ '--score': accuracy }}>
          <div>
            <strong>{accuracy}%</strong>
            <span>xatosiz</span>
          </div>
        </div>
        <h1 className="hero-title">
          <VerdictIcon size={26} />
          {title}
        </h1>
        <p>{subtitle}</p>
      </header>

      {result.unit && <UnitResult unit={result.unit} outcome={result.unitResult} saving={result.memory === 'saving'} />}

      <section className="stats">
        <div className="stat glass">
          <span className="stat-icon">
            <ClockIcon size={18} />
          </span>
          <span className="stat-value">{formatTime(result.secondsUsed)}</span>
          <span className="stat-label">Suhbat vaqti</span>
        </div>
        <div className="stat glass">
          <span className="stat-icon">
            <MicIcon size={18} />
          </span>
          <span className="stat-value">{userMessages.length}</span>
          <span className="stat-label">Marta gapirdingiz</span>
        </div>
        <div className="stat glass">
          <span className="stat-icon">
            <AlertIcon size={18} />
          </span>
          <span className="stat-value">{totalMistakes}</span>
          <span className="stat-label">Topilgan xato</span>
        </div>
      </section>

      {typeRows.length > 0 && (
        <section className="glass panel">
          <h2>Ko'proq e'tibor bering</h2>
          <ul className="type-bars">
            {typeRows.map(([label, count]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="bar">
                  <span style={{ width: `${(count / typeRows[0][1]) * 100}%` }} />
                </span>
                <span className="count">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {withMistakes.length > 0 && (
        <section className="glass panel">
          <h2>Barcha xatolar</h2>
          <ol className="review-list">
            {withMistakes.map((m) => (
              <li key={m.id}>
                <p className="said">
                  <span className="label">Siz aytdingiz</span>
                  <span>
                    <HighlightedText text={m.content} corrections={m.corrections} />
                  </span>
                </p>
                {m.corrected && (
                  <p className="should">
                    <span className="label">To'g'risi</span>
                    {m.corrected}
                  </p>
                )}
                <ul className="correction-list">
                  {m.corrections.map((c, i) => (
                    <CorrectionItem key={i} correction={c} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {userMessages.length > 0 && <MemoryStatus result={result} />}

      <div className="summary-actions">
        <button className="btn-ghost large" onClick={onBack}>
          {backLabel}
        </button>
        <button className="btn-primary large" onClick={onRestart}>
          {result.unit ? 'Yana mashq qilish' : 'Yana gaplashish'}
        </button>
      </div>
    </main>
  )
}

function MemoryStatus({ result }) {
  if (result.memory === 'saving') {
    return (
      <section className="glass panel memory-status">
        <span className="spinner" aria-hidden="true" />
        English bu suhbatni eslab qolmoqda...
      </section>
    )
  }
  if (result.memory !== 'saved' || !result.profile) return null

  const { weak_points: weak = [], level } = result.profile
  return (
    <section className="glass panel">
      <div className="memory-head">
        <h2>
          <SparkleIcon size={20} />
          English eslab qoldi
        </h2>
        {level && <span className="level-badge">{level}</span>}
      </div>
      {weak.length > 0 ? (
        <>
          <p className="muted-text">Keyingi suhbatlarda shu mavzularni ko'proq mashq qilasiz:</p>
          <ul className="memory-list weak">
            {weak.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted-text">Keyingi suhbat siz uchun yanada moslashtiriladi.</p>
      )}
    </section>
  )
}

function UnitResult({ unit, outcome, saving }) {
  return (
    <section className={`glass unit-result ${outcome?.completed ? 'done' : ''}`}>
      <div>
        <span className="label">
          {unit.number}-dars · {unit.level}
        </span>
        <h2>{unit.title_uz}</h2>
        {saving && <p className="muted-text">Natija saqlanmoqda...</p>}
        {outcome && <p>{unitMessage(outcome)}</p>}
      </div>
      {outcome && <Stars count={outcome.stars} big />}
    </section>
  )
}

function unitMessage(o) {
  if (o.completed) return `Dars tugallandi! Eng yaxshi natijangiz: ${o.best_score ?? 0}%`
  if (o.spoken < o.needed) return `Darsni tugatish uchun kamida ${o.needed} marta gapiring (bu safar: ${o.spoken}).`
  return `Bu safar ${o.score}% xatosiz. Darsni tugatish uchun ${o.pass_score}% kerak — iboralarni takrorlab, yana urinib ko'ring!`
}
