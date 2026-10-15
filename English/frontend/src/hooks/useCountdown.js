import { useCallback, useEffect, useState } from 'react'

// Counts down to a fixed end time, so the timer never drifts even if the tab sleeps.
export function useCountdown(durationSeconds) {
  const [endAt, setEndAt] = useState(() => Date.now() + durationSeconds * 1000)
  const [remaining, setRemaining] = useState(durationSeconds)

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endAt])

  const extend = useCallback((seconds) => {
    setEndAt((prev) => Math.max(prev, Date.now()) + seconds * 1000)
  }, [])

  const stop = useCallback(() => setEndAt(Date.now()), [])

  return { remaining, expired: remaining === 0, extend, stop }
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
