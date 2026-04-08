import { nanoid } from 'nanoid'
import {
  createRoom, getRoom, deleteRoom, serializeRoom, getPublicRooms, rooms
} from '../store.js'
import { initGame, generateTarget } from '../games/targetRush.js'

export function registerRoomHandlers(io, socket) {

  // Create a new room
  socket.on('room:create', ({ name, game = 'target_rush', isPublic = true, playerName = 'Player' }, cb) => {
    const id = nanoid(6).toUpperCase()
    const room = createRoom({ id, name, host: socket.id, hostName: playerName, isPublic, game })

    // Join the socket room
    socket.join(id)
    room.players.set(socket.id, { id: socket.id, name: playerName, score: 0 })

    // Store room ref on socket for cleanup
    socket.data.roomId = id
    socket.data.playerName = playerName

    console.log(`[room:create] ${id} by ${playerName}`)
    cb?.({ ok: true, room: serializeRoom(room) })

    // Broadcast updated public list
    io.emit('rooms:update', getPublicRooms())
  })

  // Join an existing room
  socket.on('room:join', ({ roomId, playerName = 'Player' }, cb) => {
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    if (room.state !== 'LOBBY') return cb?.({ ok: false, error: 'Game already started' })
    if (room.players.size >= 6) return cb?.({ ok: false, error: 'Room is full' })

    // Cancel grace-period deletion if room was waiting
    if (room._deleteTimer) {
      clearTimeout(room._deleteTimer)
      room._deleteTimer = null
    }

    socket.join(roomId)
    room.players.set(socket.id, { id: socket.id, name: playerName, score: 0 })
    socket.data.roomId = roomId
    socket.data.playerName = playerName

    console.log(`[room:join] ${playerName} → ${roomId}`)
    cb?.({ ok: true, room: serializeRoom(room) })

    // Notify everyone in room
    io.to(roomId).emit('room:state', serializeRoom(room))
    io.emit('rooms:update', getPublicRooms())
  })

  // Leave room
  socket.on('room:leave', () => {
    handleLeave(io, socket)
  })

  // Start game (host only)
  socket.on('room:start', (_, cb) => {
    const roomId = socket.data.roomId
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    if (room.host !== socket.id) return cb?.({ ok: false, error: 'Not host' })
    if (room.state !== 'LOBBY') return cb?.({ ok: false, error: 'Already started' })
    if (room.players.size < 1) return cb?.({ ok: false, error: 'Need at least 1 player' })

    startCountdown(io, room)
    cb?.({ ok: true })
  })

  // Get room state
  socket.on('room:get', ({ roomId }, cb) => {
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    cb?.({ ok: true, room: serializeRoom(room) })
  })

  // List public rooms
  socket.on('rooms:list', (_, cb) => {
    cb?.({ rooms: getPublicRooms() })
  })

  socket.on('disconnect', () => {
    handleLeave(io, socket)
  })
}

function handleLeave(io, socket) {
  const roomId = socket.data.roomId
  if (!roomId) return
  const room = getRoom(roomId)
  if (!room) return

  room.players.delete(socket.id)
  socket.leave(roomId)
  socket.data.roomId = null

  if (room.players.size === 0) {
    // Grace period: wait 10s before deleting (allows reconnects)
    if (room.gameData?.timer) clearTimeout(room.gameData.timer)
    room._deleteTimer = setTimeout(() => {
      if (rooms.has(roomId) && getRoom(roomId).players.size === 0) {
        deleteRoom(roomId)
        io.emit('rooms:update', getPublicRooms())
        console.log(`[room:delete] ${roomId} (empty after grace)`)
      }
    }, 10000)
    console.log(`[room:grace] ${roomId} — deleting in 10s if still empty`)
  } else {
    // Transfer host if needed
    if (room.host === socket.id) {
      room.host = room.players.keys().next().value
      room.hostName = room.players.get(room.host).name
    }
    io.to(roomId).emit('room:state', serializeRoom(room))
  }

  io.emit('rooms:update', getPublicRooms())
}

function startCountdown(io, room) {
  room.state = 'COUNTDOWN'
  io.to(room.id).emit('room:state', serializeRoom(room))
  io.emit('rooms:update', getPublicRooms())

  let count = 5
  const tick = () => {
    io.to(room.id).emit('game:countdown', { count })
    count--
    if (count >= 0) {
      setTimeout(tick, 1000)
    } else {
      startGame(io, room)
    }
  }
  setTimeout(tick, 1000)
}

function startGame(io, room) {
  room.state = 'LIVE'
  room.gameData = initGame(room)

  // Give each player their first target
  for (const [playerId] of room.players) {
    room.gameData.targets[playerId] = generateTarget()
    room.gameData.scores[playerId] = 0
    io.to(playerId).emit('game:target', { target: room.gameData.targets[playerId] })
  }

  io.to(room.id).emit('room:state', serializeRoom(room))
  io.to(room.id).emit('game:start', {
    endsAt: room.gameData.endsAt,
    duration: room.config.duration,
  })

  // End game timer
  room.gameData.timer = setTimeout(() => endGame(io, room), room.config.duration)
  console.log(`[game:start] ${room.id} (${room.config.duration}ms)`)
}

export function endGame(io, room) {
  if (room.state !== 'LIVE') return
  if (room.gameData?.timer) {
    clearTimeout(room.gameData.timer)
    room.gameData.timer = null
  }

  room.state = 'RESULT'

  // Write final scores to players map
  for (const [playerId, player] of room.players) {
    player.score = room.gameData?.scores?.[playerId] ?? 0
  }

  // Determine winner
  let winner = null
  let topScore = -1
  for (const [playerId, player] of room.players) {
    if (player.score > topScore) {
      topScore = player.score
      winner = { id: playerId, name: player.name, score: player.score }
    }
  }

  io.to(room.id).emit('room:state', serializeRoom(room))
  io.to(room.id).emit('game:end', { winner, scores: room.gameData?.scores ?? {} })
  io.emit('rooms:update', getPublicRooms())

  console.log(`[game:end] ${room.id} — winner: ${winner?.name} (${winner?.score})`)

  // Auto-cleanup after 60s
  setTimeout(() => {
    if (rooms.has(room.id)) {
      deleteRoom(room.id)
      io.emit('rooms:update', getPublicRooms())
    }
  }, 60000)
}
