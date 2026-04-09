import { useCallback, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getSocket } from './useSocket.js'

export function usePayToJoin() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const socket = getSocket()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState(null)

  const pay = useCallback(async ({ roomId, entryFee, escrowPubkey }) => {
    if (!publicKey) return { ok: false, error: 'Connecte ton wallet Phantom' }
    if (!escrowPubkey) return { ok: false, error: 'Adresse escrow manquante' }

    setPaying(true)
    setError(null)

    try {
      const lamports = Math.round(entryFee * LAMPORTS_PER_SOL)
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(escrowPubkey),
          lamports,
        })
      )

      const signature = await sendTransaction(tx, connection)

      // Attendre confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      // Dire au serveur de vérifier
      return new Promise((resolve) => {
        socket.emit('room:pay', {
          roomId,
          txSignature: signature,
          walletAddress: publicKey.toBase58(),
        }, ({ ok, error, pool }) => {
          setPaying(false)
          if (!ok) setError(error)
          resolve({ ok, error, pool })
        })
      })
    } catch (err) {
      setPaying(false)
      const msg = err.message?.includes('rejected') ? 'Transaction annulée' : err.message
      setError(msg)
      return { ok: false, error: msg }
    }
  }, [publicKey, connection, socket])

  return { pay, paying, error }
}
