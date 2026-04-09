import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSocket } from '../hooks/useSocket.js'
import ConnectButton from '../components/wallet/ConnectButton.jsx'

const GAME_LABELS = {
  target_rush: '🎯 Target Rush',
  reflex_duel: '⚡ Reflex Duel',
  snake_arena: '🐍 Snake Arena',
}

const STATE_COLORS = {
  LOBBY: 'text-cyan border-cyan/30 bg-cyan/10',
  COUNTDOWN: 'text-amber border-amber/30 bg-amber/10',
  LIVE: 'text-pink border-pink/30 bg-pink/10',
  RESULT: 'text-slate-400 border-slate-600 bg-slate-800/30',
}

export default function Home() {
  const socket = getSocket()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    socket.emit('rooms:list', {}, ({ rooms }) => {
      setRooms(rooms)
      setLoading(false)
    })

    // Live updates
    const onUpdate = (rooms) => setRooms(rooms)
    socket.on('rooms:update', onUpdate)

    return () => socket.off('rooms:update', onUpdate)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-white font-body">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-xl text-pink text-glow-pink">solskill</span>
          <span className="font-heading font-bold text-xl text-slate-500">.gg</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/create" className="btn-primary text-sm py-2">
            + Create Room
          </Link>
          <ConnectButton />
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink/30 bg-pink/10 text-pink text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse-fast" />
          Live on Solana Devnet
        </div>
        <h1 className="text-5xl font-heading font-bold text-white mb-4 leading-tight">
          Compete. Prove your skill.<br />
          <span className="text-pink text-glow-pink">Get paid.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
          Real-time competitive mini-games. Winner takes the pot. No luck. No casino. Just skill.
        </p>
        <Link to="/create" className="btn-primary text-lg px-8 py-3.5">
          Create a Room →
        </Link>
      </div>

      {/* Live rooms feed */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-semibold text-white">
            Live Rooms
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping-fast" />
            {rooms.length} active
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse h-36" />
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <div className="text-5xl mb-4">🎮</div>
            <p className="font-heading text-lg">No rooms yet</p>
            <p className="text-sm mt-1">Be the first to create one</p>
            <Link to="/create" className="btn-primary mt-6 inline-block text-sm">
              Create Room
            </Link>
          </div>
        )}

        {!loading && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <Link key={room.id} to={`/r/${room.id}`} className="card p-5 hover:border-pink/40 transition-colors duration-150 group block">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${STATE_COLORS[room.state] ?? STATE_COLORS.LOBBY}`}>
                    {room.state}
                  </span>
                  <span className="text-xs text-slate-600 font-mono">{room.id}</span>
                </div>

                <h3 className="font-heading font-semibold text-white group-hover:text-pink transition-colors duration-150 mb-1">
                  {room.name}
                </h3>
                <p className="text-sm text-slate-500">{GAME_LABELS[room.game] ?? room.game}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <span>👥</span>
                    <span className="font-mono">{room.playerCount}/6</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.entryFee > 0 && (
                      <span className="text-xs font-mono text-amber font-bold">{room.entryFee} SOL</span>
                    )}
                    {room.entryFee === 0 && (
                      <span className="text-xs font-mono text-slate-600">free</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
