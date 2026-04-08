import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from './useSocket.js'

export function useGame() {
  const socket = getSocket()
  const [target, setTarget] = useState(null)
  const [score, setScore] = useState(0)
  const [liveScores, setLiveScores] = useState({})
  const [gameInfo, setGameInfo] = useState(null) // { endsAt, duration }
  const [timeLeft, setTimeLeft] = useState(null)
  const timerRef = useRef(null)
  const targetRef = useRef(null)

  // Keep targetRef in sync for click handler
  useEffect(() => { targetRef.current = target }, [target])

  useEffect(() => {
    const onTarget = ({ target: t, score: s }) => {
      setTarget(t)
      if (s !== undefined) setScore(s)
    }

    const onStart = ({ endsAt, duration }) => {
      setGameInfo({ endsAt, duration })
      setScore(0)
      // Start countdown
      const tick = () => {
        const left = Math.max(0, endsAt - Date.now())
        setTimeLeft(left)
        if (left > 0) {
          timerRef.current = requestAnimationFrame(tick)
        }
      }
      timerRef.current = requestAnimationFrame(tick)
    }

    const onScores = ({ scores }) => setLiveScores(scores)

    const onEnd = () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
      setTimeLeft(0)
      setTarget(null)
    }

    socket.on('game:target', onTarget)
    socket.on('game:start', onStart)
    socket.on('game:scores', onScores)
    socket.on('game:end', onEnd)

    return () => {
      socket.off('game:target', onTarget)
      socket.off('game:start', onStart)
      socket.off('game:scores', onScores)
      socket.off('game:end', onEnd)
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [])

  const sendClick = useCallback((x, y) => {
    const t = targetRef.current
    if (!t) return
    socket.emit('game:input', {
      x: Math.round(x),
      y: Math.round(y),
      ts: Date.now(),
      targetId: t.id,
    })
  }, [])

  return { target, score, liveScores, gameInfo, timeLeft, sendClick }
}
