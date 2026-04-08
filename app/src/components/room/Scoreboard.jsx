export default function Scoreboard({ scores, myId }) {
  const entries = Object.entries(scores)
    .map(([id, data]) => ({ id, name: data.name, score: data.score }))
    .sort((a, b) => b.score - a.score)

  if (entries.length === 0) return null

  const rankColors = ['text-amber', 'text-slate-300', 'text-amber/60']
  const rankIcons = ['🥇', '🥈', '🥉']

  return (
    <div className="card p-4">
      <h3 className="text-sm font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Live Scores
      </h3>
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isMe = entry.id === myId
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 ${
                isMe
                  ? 'bg-pink/10 border-pink/30'
                  : 'bg-bg border-border'
              }`}
            >
              <span className="text-lg w-6 text-center">
                {rankIcons[i] ?? `${i + 1}`}
              </span>
              <span className={`font-body flex-1 ${isMe ? 'text-pink font-semibold' : 'text-white'}`}>
                {entry.name}
                {isMe && <span className="ml-2 text-xs text-pink/70">(you)</span>}
              </span>
              <span className={`font-mono font-bold text-xl ${rankColors[i] ?? 'text-slate-400'} ${isMe ? 'text-glow-pink' : ''}`}>
                {entry.score}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
