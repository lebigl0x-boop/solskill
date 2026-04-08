import { getRoom, serializeRoom } from '../store.js'
import { validateClick, generateTarget } from '../games/targetRush.js'
import { endGame } from './roomHandler.js'

export function registerGameHandlers(io, socket) {

  // Client sends a click: { x, y, ts, targetId }
  socket.on('game:input', ({ x, y, ts, targetId }) => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = getRoom(roomId)
    if (!room || room.state !== 'LIVE' || !room.gameData) return

    const playerId = socket.id
    const currentTarget = room.gameData.targets[playerId]

    // Validate: target must match and click must be within radius
    if (!currentTarget || currentTarget.id !== targetId) return
    if (!validateClick({ target: currentTarget, clickX: x, clickY: y, clickTs: ts })) return

    // Hit confirmed — increment score
    room.gameData.scores[playerId] = (room.gameData.scores[playerId] ?? 0) + 1

    // Update player score in players map for live scoreboard
    const player = room.players.get(playerId)
    if (player) player.score = room.gameData.scores[playerId]

    // Generate next target for this player
    const nextTarget = generateTarget()
    room.gameData.targets[playerId] = nextTarget

    // Send next target only to this player
    socket.emit('game:target', { target: nextTarget, score: room.gameData.scores[playerId] })

    // Broadcast live scores to everyone in the room
    io.to(roomId).emit('game:scores', {
      scores: Object.fromEntries(
        Array.from(room.players.values()).map(p => [p.id, { name: p.name, score: p.score }])
      )
    })
  })

  // Chat message
  socket.on('chat:message', ({ text }) => {
    const roomId = socket.data.roomId
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return

    const player = room.players.get(socket.id)
    if (!player) return

    const maxLen = 200
    const sanitized = String(text).slice(0, maxLen)
    if (!sanitized.trim()) return

    const msg = {
      playerId: socket.id,
      playerName: player.name,
      text: sanitized,
      ts: Date.now(),
    }
    room.chat.push(msg)
    if (room.chat.length > 200) room.chat.shift()

    io.to(roomId).emit('chat:message', msg)
  })
}
