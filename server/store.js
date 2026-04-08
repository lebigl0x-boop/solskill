// In-memory store — rooms Map
// Room schema:
// {
//   id: string,
//   name: string,
//   host: string,          // socket.id of creator
//   hostName: string,
//   state: 'LOBBY' | 'COUNTDOWN' | 'LIVE' | 'RESULT',
//   isPublic: boolean,
//   game: 'target_rush',
//   players: Map<socketId, { id, name, score }>,
//   chat: [{ playerId, playerName, text, ts }],
//   config: { duration: number },   // game duration in ms
//   gameData: any,                  // runtime game state
//   createdAt: number,
// }

export const rooms = new Map()

export function createRoom({ id, name, host, hostName, isPublic, game, config }) {
  const room = {
    id,
    name,
    host,
    hostName,
    state: 'LOBBY',
    isPublic,
    game,
    players: new Map(),
    chat: [],
    config: { duration: 30000, ...config },
    gameData: null,
    createdAt: Date.now(),
  }
  rooms.set(id, room)
  return room
}

export function getRoom(id) {
  return rooms.get(id)
}

export function deleteRoom(id) {
  rooms.delete(id)
}

export function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    host: room.host,
    hostName: room.hostName,
    state: room.state,
    isPublic: room.isPublic,
    game: room.game,
    players: Array.from(room.players.values()),
    chat: room.chat.slice(-50), // last 50 messages
    config: room.config,
    createdAt: room.createdAt,
  }
}

export function getPublicRooms() {
  return Array.from(rooms.values())
    .filter(r => r.isPublic)
    .map(r => ({
      id: r.id,
      name: r.name,
      hostName: r.hostName,
      state: r.state,
      game: r.game,
      playerCount: r.players.size,
      createdAt: r.createdAt,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}
