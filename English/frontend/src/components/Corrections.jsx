import { typeLabel } from '../mistakeTypes'
import { ArrowRightIcon } from './Icons'

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Underlines the wrong fragments inside the learner's own sentence.
export function HighlightedText({ text, corrections }) {
  const fragments = [...new Set((corrections ?? []).map((c) => c.original).filter(Boolean))]
  if (!fragments.length) return text

  fragments.sort((a, b) => b.length - a.length)
  const pattern = new RegExp(`(${fragments.map(escapeRegExp).join('|')})`, 'g')

  return text.split(pattern).map((part, i) =>
    fragments.includes(part) ? (
      <mark key={i} className="mistake">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function CorrectionItem({ correction }) {
  return (
    <li className="correction">
      <div className="correction-diff">
        <span className="wrong">{correction.original}</span>
        <ArrowRightIcon size={16} className="arrow" />
        <span className="right">{correction.corrected}</span>
        {correction.type && <span className="tag">{typeLabel(correction.type)}</span>}
      </div>
      {correction.explanation && <p className="correction-why">{correction.explanation}</p>}
    </li>
  )
}
