import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { getSocket } from '../hooks/useSocket.js'
import { useRoom } from '../hooks/useRoom.js'
import { useGame } from '../hooks/useGame.js'
import Lobby from '../components/room/Lobby.jsx'
import Scoreboard from '../components/room/Scoreboard.jsx'
import Chat from '../components/room/Chat.jsx'
import TargetRush from '../components/games/TargetRush.jsx'
import ConnectButton from '../components/wallet/ConnectButton.jsx'

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const socket = getSocket()

  // If navigating from Create, skip the join screen
  const navState = location.state ?? {}
  const [playerName, setPlayerName] = useState(navState.playerName ?? '')
  const [joined, setJoined] = useState(navState.alreadyJoined ?? false)
  const [nameInput, setNameInput] = useState('')
  const [joinError, setJoinError] = useState(null)
  const [escrowPubkey, setEscrowPubkey] = useState(null)
  const [payout, setPayout] = useState(null)

  const { room, error, countdown, gameResult, join, leave, start } = useRoom(roomId)
  const { target, score, liveScores, gameInfo, timeLeft, sendClick } = useGame()

  const myId = socket.id

  // Si le créateur arrive avec alreadyJoined, on re-join pour enregistrer le socket actuel
  useEffect(() => {
    if (navState.alreadyJoined && navState.playerName) {
      join(navState.playerName).then(res => {
        if (res?.escrowPubkey) setEscrowPubkey(res.escrowPubkey)
      })
    }
    // Récupérer l'adresse escrow
    socket.emit('escrow:pubkey', {}, ({ pubkey }) => setEscrowPubkey(pubkey))
  }, [])

  // Écouter le payout
  useEffect(() => {
    const onPayout = (data) => setPayout(data)
    socket.on('game:payout', onPayout)
    return () => socket.off('game:payout', onPayout)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (joined) leave()
    }
  }, [joined])

  const handleJoin = async () => {
    const name = nameInput.trim()
    if (!name) return setJoinError('Enter your name')
    setJoinError(null)
    const { ok, error } = await join(name)
    if (ok) {
      setPlayerName(name)
      setJoined(true)
    } else {
      setJoinError(error)
    }
  }

  // Name entry screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-1 mb-8 text-slate-500 hover:text-white transition-colors">
            <span>←</span>
            <span className="text-sm">Back to lobby</span>
          </Link>
          <div className="card p-8">
            <h1 className="text-2xl font-heading font-bold text-white mb-2">Join Room</h1>
            <p className="text-slate-400 text-sm mb-6">Room <span className="font-mono text-pink">{roomId}</span></p>

            <input
              className="input w-full mb-4"
              placeholder="Your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={24}
              autoFocus
            />

            {joinError && (
              <p className="text-pink text-sm mb-4">{joinError}</p>
            )}

            <button onClick={handleJoin} className="btn-primary w-full">
              Join →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-center p-6">
        <div>
          <p className="text-pink text-xl mb-4">{error}</p>
          <Link to="/" className="btn-secondary">Go home</Link>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-slate-500 font-mono animate-pulse">Loading room...</div>
      </div>
    )
  }

  const isHost = room.host === myId
  const scores = liveScores && Object.keys(liveScores).length > 0
    ? liveScores
    : Object.fromEntries(room.players.map(p => [p.id, { name: p.name, score: p.score }]))

  return (
    <div className="min-h-screen bg-bg text-white font-body">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-heading font-bold text-pink text-glow-pink">solskill.gg</Link>
          <span className="text-border">/</span>
          <span className="font-mono text-sm text-slate-400">{roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <ConnectButton />
          <button onClick={() => { leave(); navigate('/') }} className="btn-secondary text-sm py-2">
            Leave
          </button>
        </div>
      </nav>

      {/* Countdown overlay */}
      {room.state === 'COUNTDOWN' && countdown !== null && (
        <div className="fixed inset-0 bg-bg/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div
              key={countdown}
              className="text-[10rem] font-heading font-black text-pink text-glow-pink"
              style={{ animation: 'pulse 0.8s ease-out' }}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </div>
            <p className="text-slate-400 font-mono mt-4">Get ready...</p>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {room.state === 'RESULT' && gameResult && (
        <div className="fixed inset-0 bg-bg/95 z-50 flex items-center justify-center">
          <div className="text-center max-w-sm w-full px-6">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-heading font-black text-pink text-glow-pink mb-2">
              {gameResult.winner?.id === myId ? 'You won!' : `${gameResult.winner?.name} wins!`}
            </h2>
            <p className="text-slate-400 mb-2 font-mono">
              Score: <span className="text-cyan text-glow-cyan font-bold">{gameResult.winner?.score}</span> hits
            </p>
            {gameResult.pool > 0 && (
              <div className="my-3 p-3 rounded-lg bg-pink/10 border border-pink/30">
                <p className="text-pink font-mono font-bold text-lg">
                  💸 {(gameResult.pool * 0.97).toFixed(3)} SOL
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {payout ? (
                    <span className="text-cyan">✓ Envoyé — <a href={`https://explorer.solana.com/tx/${payout.signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="underline">voir tx</a></span>
                  ) : 'Payout en cours...'}
                </p>
              </div>
            )}

            {/* Final scores */}
            <div className="my-6 space-y-2">
              {Object.entries(gameResult.scores ?? {})
                .map(([id, s]) => ({ id, name: room.players.find(p => p.id === id)?.name ?? id, score: s }))
                .sort((a, b) => b.score - a.score)
                .map((entry, i) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                    <span className="font-body text-white">{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`} {entry.name}</span>
                    <span className="font-mono font-bold text-cyan">{entry.score}</span>
                  </div>
                ))}
            </div>

            <div className="flex gap-3">
              {isHost && (
                <button onClick={start} className="btn-primary flex-1">
                  Play Again
                </button>
              )}
              <button onClick={() => { leave(); navigate('/') }} className="btn-secondary flex-1">
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left: game area */}
          <div className="flex-1 min-w-0">
            {room.state === 'LOBBY' && (
              <Lobby room={room} socket={socket} onStart={start} isHost={isHost} escrowPubkey={escrowPubkey} myId={myId} />
            )}

            {(room.state === 'LIVE' || room.state === 'COUNTDOWN') && (
              <TargetRush
                target={target}
                score={score}
                timeLeft={timeLeft}
                duration={room.config?.duration ?? 30000}
                onHit={sendClick}
              />
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <Scoreboard scores={scores} myId={myId} />
            <Chat room={room} />
          </div>
        </div>
      </div>
    </div>
  )
}
