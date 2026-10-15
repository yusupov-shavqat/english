import { useEffect, useRef } from 'react'

// Animated voice orb. `phase` sets its colours and motion; `source.level` (0..1) makes it pulse with the voice.
export default function Orb({ phase = 'listening', source, onClick, label = 'English', size }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!source) return
    let frame
    const update = () => {
      ref.current?.style.setProperty('--level', source.level.toFixed(3))
      frame = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(frame)
  }, [source])

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      ref={ref}
      className="orb"
      data-phase={phase}
      onClick={onClick}
      style={size ? { '--orb-size': size } : undefined}
      type={onClick ? 'button' : undefined}
    >
      <span className="orb-glow" />
      <span className="orb-breath">
        <span className="orb-blob b1" />
        <span className="orb-blob b2" />
        <span className="orb-blob b3" />
        <span className="orb-core">
          <span className="orb-label">{label}</span>
        </span>
      </span>
    </Tag>
  )
}
