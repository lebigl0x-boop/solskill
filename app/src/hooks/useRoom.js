import { useState, useEffect, useCallback } from 'react'
import { getSocket } from './useSocket.js'

export function useRoom(roomId) {
  const socket = getSocket()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [gameResult, setGameResult] = useState(null)

  useEffect(() => {
    if (!roomId) return

    // Fetch current state on mount
    socket.emit('room:get', { roomId }, ({ ok, room, error }) => {
      if (ok) setRoom(room)
      else setError(error)
    })

    const onState = (r) => setRoom(r)
    const onCountdown = ({ count }) => setCountdown(count)
    const onEnd = (result) => {
      setGameResult(result)
      setCountdown(null)
    }

    socket.on('room:state', onState)
    socket.on('game:countdown', onCountdown)
    socket.on('game:end', onEnd)

    return () => {
      socket.off('room:state', onState)
      socket.off('game:countdown', onCountdown)
      socket.off('game:end', onEnd)
    }
  }, [roomId])

  const join = useCallback((playerName) => {
    return new Promise((resolve) => {
      socket.emit('room:join', { roomId, playerName }, ({ ok, room, error }) => {
        if (ok) { setRoom(room); resolve({ ok }) }
        else { setError(error); resolve({ ok, error }) }
      })
    })
  }, [roomId])

  const leave = useCallback(() => {
    socket.emit('room:leave')
    setRoom(null)
  }, [])

  const start = useCallback(() => {
    socket.emit('room:start', {}, ({ ok, error }) => {
      if (!ok) setError(error)
    })
  }, [])

  const sendChat = useCallback((text) => {
    socket.emit('chat:message', { text })
  }, [])

  return { room, error, countdown, gameResult, join, leave, start, sendChat, socket }
}
