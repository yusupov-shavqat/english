import { useEffect, useState } from 'react'
import { fetchUnits } from '../api'
import { CheckIcon, GraduationIcon } from './Icons'
import { Stars } from './Stars'

export default function UnitsScreen({ onOpen }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUnits()
      .then(setData)
      .catch(() => setError("Darslarni yuklab bo'lmadi. Sahifani yangilab ko'ring."))
  }, [])

  if (error) return <p className="form-error">{error}</p>
  if (!data) return <div className="units-loading"><span className="spinner" /></div>

  const done = data.units.filter((u) => u.progress.completed).length
  const levels = ['A1', 'A2']

  return (
    <div className="units">
      <section className="glass course-progress">
        <div>
          <h2>
            <GraduationIcon size={20} />
            Kurs bo'yicha yo'lingiz
          </h2>
          <p>
            {done} / {data.units.length} ta dars tugallandi
          </p>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${(done / data.units.length) * 100}%` }} />
        </div>
      </section>

      {levels.map((level) => (
        <section key={level} className="unit-group">
          <h3 className="level-title">
            <span className="level-badge">{level}</span>
            {level === 'A1' ? "Boshlang'ich" : 'Asosiy'}
          </h3>
          <ul className="unit-list">
            {data.units
              .filter((u) => u.level === level)
              .map((u) => {
                const isNext = u.slug === data.next
                return (
                  <li key={u.slug}>
                    <button
                      className={`glass unit-card ${u.progress.completed ? 'done' : ''} ${isNext ? 'next' : ''}`}
                      onClick={() => onOpen(u.slug)}
                    >
                      <span className="unit-number">
                        {u.progress.completed ? <CheckIcon size={20} /> : u.number}
                      </span>
                      <span className="unit-text">
                        <strong>{u.title_uz}</strong>
                        <small>{u.title}</small>
                      </span>
                      <span className="unit-side">
                        {isNext ? <span className="next-badge">Keyingi dars</span> : <Stars count={u.progress.stars} />}
                      </span>
                    </button>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
