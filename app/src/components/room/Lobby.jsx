import { useState } from 'react'

const GAME_LABELS = {
  target_rush: '🎯 Target Rush',
  reflex_duel: '⚡ Reflex Duel',
  snake_arena: '🐍 Snake Arena',
}

export default function Lobby({ room, socket, onStart, isHost }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/r/${room.id}`

  const copyLink = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={copyLink}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                copied
                  ? 'border-cyan/60 text-cyan bg-cyan/10'
                  : 'border-border text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy link'}
            </button>
          </div>
        </div>

        {/* Shareable link */}
        <div className="mt-4 p-3 bg-bg rounded-lg border border-border">
          <p className="text-xs text-slate-500 mb-1">Share with friends</p>
          <p className="font-mono text-sm text-slate-300 break-all">{link}</p>
        </div>
      </div>

      {/* Players */}
      <div className="card p-4">
        <h3 className="text-sm font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Players ({room.players.length}/6)
        </h3>
        <div className="space-y-2">
          {room.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-bg border border-border"
            >
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse-fast" />
              <span className="font-body text-white">{p.name}</span>
              {p.id === room.host && (
                <span className="ml-auto text-xs font-mono text-amber px-2 py-0.5 rounded bg-amber/10 border border-amber/20">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Start button (host only) */}
      {isHost && (
        <button
          onClick={onStart}
          disabled={room.players.length < 1}
          className="btn-primary text-center text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          START GAME →
        </button>
      )}
      {!isHost && (
        <div className="text-center text-slate-500 text-sm font-body">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  )
}
