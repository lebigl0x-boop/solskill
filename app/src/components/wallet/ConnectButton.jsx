import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

export default function ConnectButton() {
  const { publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()

  if (connecting) {
    return (
      <button className="btn-secondary opacity-60 cursor-not-allowed text-sm" disabled>
        Connecting...
      </button>
    )
  }

  if (publicKey) {
    const addr = publicKey.toBase58()
    const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 bg-surface border border-purple/40 text-purple font-mono text-sm px-4 py-2 rounded-lg hover:border-purple/80 hover:bg-purple/10 transition-all duration-150"
      >
        <span className="w-2 h-2 rounded-full bg-purple glow-purple inline-block" />
        {short}
      </button>
    )
  }

  return (
    <button
      onClick={() => setVisible(true)}
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
