import { StarIcon } from './Icons'

// Lesson rating. One shared component so the course list and the result card agree.
export function Stars({ count = 0, big = false }) {
  return (
    <span className={big ? 'stars big' : 'stars'} aria-label={`${count} / 3 yulduz`}>
      {[1, 2, 3].map((i) => (
        <StarIcon key={i} className={i <= count ? 'on' : ''} />
      ))}
    </span>
  )
}
