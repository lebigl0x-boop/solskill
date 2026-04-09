import { nanoid } from 'nanoid'
import {
  createRoom, getRoom, deleteRoom, serializeRoom, getPublicRooms, rooms
} from '../store.js'
import { initGame, generateTarget } from '../games/targetRush.js'
import { escrowPubkey, verifyTransaction, payoutWinner } from '../solana.js'

export function registerRoomHandlers(io, socket) {

  // Exposer l'adresse escrow au client
  socket.on('escrow:pubkey', (_, cb) => {
    cb?.({ pubkey: escrowPubkey })
  })

  // Create a new room
  socket.on('room:create', ({ name, game = 'target_rush', isPublic = true, playerName = 'Player', entryFee = 0 }, cb) => {
    const id = nanoid(6).toUpperCase()
    const room = createRoom({ id, name, host: socket.id, hostName: playerName, isPublic, game, entryFee })

    socket.join(id)
    // Host rejoint sans payer (il a créé la room — son fee compte quand il "pay to join")
    // Host doit aussi payer son bid (comme tout le monde)
    room.players.set(socket.id, { id: socket.id, name: playerName, score: 0, paid: entryFee === 0 })
    socket.data.roomId = id
    socket.data.playerName = playerName

    console.log(`[room:create] ${id} by ${playerName} (${entryFee} SOL entry)`)
    cb?.({ ok: true, room: serializeRoom(room), escrowPubkey })

    io.emit('rooms:update', getPublicRooms())
  })

  // Vérifier le paiement d'un joueur
  socket.on('room:pay', async ({ roomId, txSignature, walletAddress }, cb) => {
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    if (room.state !== 'LOBBY') return cb?.({ ok: false, error: 'Game already started' })

    // Pas de fee requis
    if (room.entryFee === 0) return cb?.({ ok: true })

    // Vérification on-chain
    const result = await verifyTransaction({
      txSignature,
      expectedSOL: room.entryFee,
      senderAddress: walletAddress,
    })

    if (!result.ok) return cb?.({ ok: false, error: result.error })

    // Enregistre le paiement
    room.paidPlayers.add(walletAddress)
    room.pool += result.receivedSOL

    // Met à jour le joueur comme "paid"
    const player = room.players.get(socket.id)
    if (player) {
      player.paid = true
      player.walletAddress = walletAddress
    }
    socket.data.walletAddress = walletAddress

    console.log(`[room:pay] ${walletAddress} → ${roomId} | pool: ${room.pool} SOL`)
    io.to(roomId).emit('room:state', serializeRoom(room))
    cb?.({ ok: true, pool: room.pool })
  })

  // Join an existing room
  socket.on('room:join', ({ roomId, playerName = 'Player' }, cb) => {
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    if (room.state !== 'LOBBY') return cb?.({ ok: false, error: 'Game already started' })
    if (room.players.size >= 6) return cb?.({ ok: false, error: 'Room is full' })

    if (room._deleteTimer) {
      clearTimeout(room._deleteTimer)
      room._deleteTimer = null
    }

    socket.join(roomId)
    const existing = room.players.get(socket.id)
    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: existing?.score ?? 0,
      paid: existing?.paid ?? room.entryFee === 0,
    })
    socket.data.roomId = roomId
    socket.data.playerName = playerName

    console.log(`[room:join] ${playerName} → ${roomId}`)
    cb?.({ ok: true, room: serializeRoom(room), escrowPubkey })

    io.to(roomId).emit('room:state', serializeRoom(room))
    io.emit('rooms:update', getPublicRooms())
  })

  // Leave room
  socket.on('room:leave', () => handleLeave(io, socket))

  // Start game (host only)
  socket.on('room:start', (_, cb) => {
    const roomId = socket.data.roomId
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    if (room.host !== socket.id) return cb?.({ ok: false, error: 'Not host' })
    if (room.state !== 'LOBBY') return cb?.({ ok: false, error: 'Already started' })
    if (room.players.size < 1) return cb?.({ ok: false, error: 'Need at least 1 player' })

    // Vérifie que tous ont payé
    const unpaid = Array.from(room.players.values()).filter(p => !p.paid)
    if (unpaid.length > 0) {
      return cb?.({ ok: false, error: `${unpaid.map(p => p.name).join(', ')} n'ont pas encore payé` })
    }

    startCountdown(io, room)
    cb?.({ ok: true })
  })

  // Get room state
  socket.on('room:get', ({ roomId }, cb) => {
    const room = getRoom(roomId)
    if (!room) return cb?.({ ok: false, error: 'Room not found' })
    cb?.({ ok: true, room: serializeRoom(room), escrowPubkey })
  })

  // List public rooms
  socket.on('rooms:list', (_, cb) => {
    cb?.({ rooms: getPublicRooms() })
  })

  socket.on('disconnect', () => handleLeave(io, socket))
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
    if (room.gameData?.timer) clearTimeout(room.gameData.timer)
    room._deleteTimer = setTimeout(() => {
      if (rooms.has(roomId) && getRoom(roomId).players.size === 0) {
        deleteRoom(roomId)
        io.emit('rooms:update', getPublicRooms())
        console.log(`[room:delete] ${roomId} (empty after grace)`)
      }
    }, 60000)
  } else {
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
    if (count >= 0) setTimeout(tick, 1000)
    else startGame(io, room)
  }
  setTimeout(tick, 1000)
}

function startGame(io, room) {
  room.state = 'LIVE'
  room.gameData = initGame(room)

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

  room.gameData.timer = setTimeout(() => endGame(io, room), room.config.duration)
  console.log(`[game:start] ${room.id} (${room.config.duration}ms)`)
}

export async function endGame(io, room) {
  if (room.state !== 'LIVE') return
  if (room.gameData?.timer) {
    clearTimeout(room.gameData.timer)
    room.gameData.timer = null
  }

  room.state = 'RESULT'

  for (const [playerId, player] of room.players) {
    player.score = room.gameData?.scores?.[playerId] ?? 0
  }

  let winner = null
  let topScore = -1
  for (const [playerId, player] of room.players) {
    if (player.score > topScore) {
      topScore = player.score
      winner = { id: playerId, name: player.name, score: player.score, walletAddress: player.walletAddress }
    }
  }

  io.to(room.id).emit('room:state', serializeRoom(room))
  io.to(room.id).emit('game:end', { winner, scores: room.gameData?.scores ?? {}, pool: room.pool })
  io.emit('rooms:update', getPublicRooms())

  console.log(`[game:end] ${room.id} — winner: ${winner?.name} (${winner?.score}) | pool: ${room.pool} SOL`)

  // Payout automatique si pool > 0 et wallet connu
  if (room.pool > 0 && winner?.walletAddress) {
    const payout = await payoutWinner({
      winnerAddress: winner.walletAddress,
      totalPoolSOL: room.pool,
    })
    if (payout.ok) {
      io.to(room.id).emit('game:payout', { signature: payout.signature, payoutSOL: payout.payoutSOL })
    } else {
      console.error(`[payout] FAILED for ${room.id}:`, payout.error)
    }
  }

  setTimeout(() => {
    if (rooms.has(room.id)) {
      deleteRoom(room.id)
      io.emit('rooms:update', getPublicRooms())
    }
  }, 60000)
}
