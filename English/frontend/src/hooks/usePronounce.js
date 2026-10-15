import { useCallback, useEffect, useRef, useState } from 'react'
import { speechUrl } from '../api'

// Plays single words and example sentences; one at a time, with links cached per text.
export function usePronounce() {
  const [playing, setPlaying] = useState(null)
  const urls = useRef(new Map())
  const audio = useRef(null)

  const stop = useCallback(() => {
    audio.current?.pause()
    audio.current = null
    setPlaying(null)
  }, [])

  const play = useCallback(
    async (text) => {
      stop()
      setPlaying(text)
      try {
        let url = urls.current.get(text)
        if (!url) {
          url = await speechUrl(text)
          urls.current.set(text, url)
        }
        const a = new Audio(url)
        audio.current = a
        a.onended = a.onerror = () => audio.current === a && setPlaying(null)
        await a.play()
      } catch {
        setPlaying((cur) => (cur === text ? null : cur))
      }
    },
    [stop],
  )

  useEffect(() => () => audio.current?.pause(), [])

  return { playing, play, stop }
}
