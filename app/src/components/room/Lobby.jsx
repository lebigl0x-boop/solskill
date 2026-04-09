import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { usePayToJoin } from '../../hooks/usePayToJoin.js'

const GAME_LABELS = {
  target_rush: '🎯 Target Rush',
  reflex_duel: '⚡ Reflex Duel',
  snake_arena: '🐍 Snake Arena',
}

export default function Lobby({ room, socket, onStart, isHost, escrowPubkey, myId }) {
  const [copied, setCopied] = useState(false)
  const { publicKey } = useWallet()
  const { pay, paying, error: payError } = usePayToJoin()

  const link = `${window.location.origin}/r/${room.id}`
  const me = room.players.find(p => p.id === myId)
  const hasPaid = me?.paid ?? room.entryFee === 0
  const allPaid = room.players.every(p => p.paid)

  const copyLink = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePay = async () => {
    await pay({ roomId: room.id, entryFee: room.entryFee, escrowPubkey })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Room header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500 mb-1 tracking-widest uppercase">
              Room · {room.id}
            </div>
            <h2 className="text-2xl font-heading font-bold text-white">{room.name}</h2>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
              <span>{GAME_LABELS[room.game] ?? room.game}</span>
              <span className="text-border">·</span>
              <span className={room.isPublic ? 'text-cyan' : 'text-amber'}>
                {room.isPublic ? '🔓 Public' : '🔒 Private'}
              </span>
            </div>
          </div>
          <button
            onClick={copyLink}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-150 ${
              copied ? 'border-cyan/60 text-cyan bg-cyan/10' : 'border-border text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            {copied ? '✓ Copied!' : '📋 Copy link'}
          </button>
        </div>

        {/* Pool */}
        {room.entryFee > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-bg rounded-lg p-3 border border-border text-center">
              <div className="text-xs text-slate-500 mb-1 font-mono">Entry fee</div>
              <div className="text-lg font-mono font-bold text-amber">{room.entryFee} SOL</div>
            </div>
            <div className="bg-bg rounded-lg p-3 border border-pink/20 text-center">
              <div className="text-xs text-slate-500 mb-1 font-mono">Pool total</div>
              <div className="text-lg font-mono font-bold text-pink text-glow-pink">{(room.pool ?? 0).toFixed(3)} SOL</div>
            </div>
            <div className="bg-bg rounded-lg p-3 border border-cyan/20 text-center">
              <div className="text-xs text-slate-500 mb-1 font-mono">Winner gets</div>
              <div className="text-lg font-mono font-bold text-cyan">
                {((room.pool ?? 0) * 0.97).toFixed(3)} SOL
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pay to join */}
      {room.entryFee > 0 && !hasPaid && (
        <div className="card p-5 border-amber/30">
          <h3 className="font-heading font-semibold text-amber mb-3">💰 Pay to play</h3>
          {!publicKey ? (
            <p className="text-slate-400 text-sm">Connecte ton wallet Phantom pour payer l'entry fee.</p>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-4">
                Envoie <span className="text-white font-bold">{room.entryFee} SOL</span> (devnet) pour rejoindre la partie.
                La pool sera automatiquement envoyée au winner.
              </p>
              {payError && <p className="text-pink text-sm mb-3">{payError}</p>}
              <button
                onClick={handlePay}
                disabled={paying}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {paying ? '⏳ Transaction en cours...' : `Pay ${room.entryFee} SOL (devnet) →`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Players */}
      <div className="card p-4">
        <h3 className="text-sm font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Players ({room.players.length}/6)
        </h3>
        <div className="space-y-2">
          {room.players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg border border-border">
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse-fast" />
              <span className="font-body text-white flex-1">{p.name}</span>
              {room.entryFee > 0 && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${p.paid ? 'text-cyan bg-cyan/10 border border-cyan/20' : 'text-amber bg-amber/10 border border-amber/20'}`}>
                  {p.paid ? '✓ paid' : 'pending'}
                </span>
              )}
              {p.id === room.host && (
                <span className="text-xs font-mono text-amber px-2 py-0.5 rounded bg-amber/10 border border-amber/20">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start */}
      {isHost && (
        <button
          onClick={onStart}
          disabled={!allPaid}
          title={!allPaid ? 'Tous les joueurs doivent payer avant de commencer' : ''}
          className="btn-primary text-center text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {allPaid ? 'START GAME →' : `En attente des paiements (${room.players.filter(p=>p.paid).length}/${room.players.length})`}
        </button>
      )}
      {!isHost && (
        <div className="text-center text-slate-500 text-sm">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  )
}
