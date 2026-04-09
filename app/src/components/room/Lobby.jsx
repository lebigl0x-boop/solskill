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
          <div className="mt-5">
            {/* Pool hero */}
            <div className="bg-bg rounded-xl p-5 border border-pink/20 text-center mb-3">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Pool actuelle</div>
              <div className="text-5xl font-mono font-black text-pink text-glow-pink">
                {(room.pool ?? 0).toFixed(3)}
                <span className="text-2xl ml-2 text-pink/60">SOL</span>
              </div>
              <div className="text-sm text-slate-500 mt-2">
                Winner gets <span className="text-cyan font-bold">{((room.pool ?? 0) * 0.97).toFixed(3)} SOL</span>
                <span className="text-slate-600"> (3% platform fee)</span>
              </div>
            </div>
            {/* Bid info */}
            <div className="flex gap-2 text-sm text-slate-500 font-mono">
              <span className="px-3 py-1 rounded bg-surface border border-border">
                Bid <span className="text-amber font-bold">{room.entryFee} SOL</span> par joueur
              </span>
              <span className="px-3 py-1 rounded bg-surface border border-border">
                {room.players.filter(p => p.paid).length}/{room.players.length} payé
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pay to join */}
      {room.entryFee > 0 && !hasPaid && (
        <div className="card p-5 border-amber/30 bg-amber/5">
          <h3 className="font-heading font-semibold text-amber mb-1">💰 Place ton bid</h3>
          <p className="text-slate-500 text-xs mb-4">Tout le monde mise le même montant — winner takes all.</p>
          {!publicKey ? (
            <p className="text-slate-400 text-sm">Connecte ton wallet Phantom pour miser.</p>
          ) : (
            <>
              {payError && <p className="text-pink text-sm mb-3">{payError}</p>}
              <button
                onClick={handlePay}
                disabled={paying}
                className="btn-primary w-full py-4 text-lg disabled:opacity-60"
              >
                {paying
                  ? '⏳ Confirmation en cours...'
                  : `Miser ${room.entryFee} SOL →`}
              </button>
              <p className="text-xs text-slate-600 text-center mt-2">Phantom va s'ouvrir pour confirmer</p>
            </>
          )}
        </div>
      )}

      {room.entryFee > 0 && hasPaid && (
        <div className="card p-4 border-cyan/20 bg-cyan/5 text-center">
          <span className="text-cyan font-mono text-sm">✓ Bid confirmé — {room.entryFee} SOL dans la pool</span>
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
