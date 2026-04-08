// Wallet connect — placeholder until v0.3 (Anchor + $SHOT)
export default function ConnectButton() {
  return (
    <button
      onClick={() => alert('Wallet connect arrives in v0.3 with $SHOT token!')}
      className="flex items-center gap-2 bg-surface border border-purple/40 text-slate-300 font-heading text-sm px-4 py-2 rounded-lg hover:border-purple/80 hover:text-purple transition-all duration-150"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
      Connect Wallet
    </button>
  )
}
