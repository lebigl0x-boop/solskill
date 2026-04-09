import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSocket } from '../hooks/useSocket.js'
import ConnectButton from '../components/wallet/ConnectButton.jsx'

const GAMES = [
  { id: 'target_rush', label: '🎯 Target Rush', description: 'Click targets as fast as possible. Most hits wins.' },
]

export default function Create() {
  const socket = getSocket()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [game, setGame] = useState('target_rush')
  const [isPublic, setIsPublic] = useState(true)
  const [entryFee, setEntryFee] = useState('0.1')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return setError('Room name is required')
    if (!playerName.trim()) return setError('Your name is required')
    const fee = parseFloat(entryFee)
    if (isNaN(fee) || fee < 0) return setError('Entry fee invalide')
    setError(null)
    setLoading(true)

    socket.emit('room:create', {
      name: name.trim(),
      playerName: playerName.trim(),
      game,
      isPublic,
      entryFee: parseFloat(entryFee) || 0,
    }, ({ ok, room, error }) => {
      setLoading(false)
      if (ok) {
        // Pass playerName so Room.jsx skips the join screen
        navigate(`/r/${room.id}`, { state: { playerName: playerName.trim(), alreadyJoined: true } })
      } else {
        setError(error ?? 'Failed to create room')
      }
    })
  }

  return (
    <div className="min-h-screen bg-bg text-white font-body">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading font-bold text-xl text-pink text-glow-pink">solskill</span>
          <span className="font-heading font-bold text-xl text-slate-500">.gg</span>
        </Link>
        <ConnectButton />
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Create a Room</h1>
        <p className="text-slate-400 mb-10">Set up your game and share the link with friends or Twitch chat.</p>

        <div className="space-y-6">
          {/* Player name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Your name</label>
            <input
              className="input w-full"
              placeholder="e.g. speedrunner420"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={24}
            />
          </div>

          {/* Entry fee */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Entry fee <span className="text-slate-500 font-normal">(SOL devnet)</span>
            </label>
            <div className="relative">
              <input
                className="input w-full pr-16"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.1"
                value={entryFee}
                onChange={e => setEntryFee(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">SOL</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">0 = free to join</p>
          </div>

          {/* Room name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Room name</label>
            <input
              className="input w-full"
              placeholder="e.g. Friday night grind"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
            />
          </div>

          {/* Game selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Game</label>
            <div className="space-y-2">
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGame(g.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                    game === g.id
                      ? 'border-pink/60 bg-pink/10 glow-pink'
                      : 'border-border bg-surface hover:border-slate-600'
                  }`}
                >
                  <div className="font-heading font-semibold text-white">{g.label}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{g.description}</div>
                </button>
              ))}
              {/* Coming soon */}
              {['⚡ Reflex Duel', '🐍 Snake Arena'].map(label => (
                <div key={label} className="p-4 rounded-xl border border-border bg-surface/50 opacity-40 cursor-not-allowed">
                  <div className="font-heading font-semibold text-slate-400">{label}</div>
                  <div className="text-xs text-slate-600 mt-0.5">Coming soon</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Visibility</label>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 p-3 rounded-xl border transition-all duration-150 text-center ${
                  isPublic
                    ? 'border-cyan/60 bg-cyan/10 text-cyan'
                    : 'border-border text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-lg mb-0.5">🔓</div>
                <div className="text-sm font-semibold">Public</div>
                <div className="text-xs opacity-70">Listed on homepage</div>
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 p-3 rounded-xl border transition-all duration-150 text-center ${
                  !isPublic
                    ? 'border-amber/60 bg-amber/10 text-amber'
                    : 'border-border text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-lg mb-0.5">🔒</div>
                <div className="text-sm font-semibold">Private</div>
                <div className="text-xs opacity-70">Link only</div>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-pink/10 border border-pink/30 text-pink text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="btn-primary w-full text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Room →'}
          </button>
        </div>
      </div>
    </div>
  )
}
