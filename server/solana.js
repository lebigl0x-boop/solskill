import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js'

export const connection = new Connection(
  process.env.SOLANA_RPC || clusterApiUrl('devnet'),
  'confirmed'
)

// Escrow keypair — chargé depuis variable d'env (JSON array ou base58)
// En dev local, on génère un keypair temporaire
function loadEscrowKeypair() {
  if (process.env.ESCROW_KEYPAIR) {
    try {
      const parsed = JSON.parse(process.env.ESCROW_KEYPAIR)
      return Keypair.fromSecretKey(Uint8Array.from(parsed))
    } catch {
      console.warn('[solana] ESCROW_KEYPAIR invalide, génération temporaire')
    }
  }
  const kp = Keypair.generate()
  console.warn('[solana] ⚠ Escrow temporaire (dev only):', kp.publicKey.toBase58())
  console.warn('[solana] Ajoute ESCROW_KEYPAIR en production !')
  return kp
}

export const escrowKeypair = loadEscrowKeypair()
export const escrowPubkey = escrowKeypair.publicKey.toBase58()

const PLATFORM_FEE = 0.03 // 3%

/**
 * Vérifie qu'un tx envoyé par le player est bien arrivé à l'escrow
 * avec le bon montant (en SOL).
 */
export async function verifyTransaction({ txSignature, expectedSOL, senderAddress }) {
  try {
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })
    if (!tx) return { ok: false, error: 'Transaction introuvable' }
    if (tx.meta?.err) return { ok: false, error: 'Transaction échouée on-chain' }

    const sender = new PublicKey(senderAddress)
    const escrow = new PublicKey(escrowPubkey)

    // Vérifie le transfert SOL vers l'escrow
    const expectedLamports = Math.round(expectedSOL * LAMPORTS_PER_SOL)
    const accountKeys = tx.transaction.message.staticAccountKeys ?? tx.transaction.message.accountKeys
    const escrowIndex = accountKeys.findIndex(k => k.toBase58() === escrowPubkey)
    const senderIndex = accountKeys.findIndex(k => k.toBase58() === senderAddress)

    if (escrowIndex === -1 || senderIndex === -1) {
      return { ok: false, error: 'Adresses incorrectes dans la tx' }
    }

    const escrowDiff = tx.meta.postBalances[escrowIndex] - tx.meta.preBalances[escrowIndex]
    if (escrowDiff < expectedLamports * 0.99) { // 1% de tolérance pour les fees
      return { ok: false, error: `Montant insuffisant: reçu ${escrowDiff / LAMPORTS_PER_SOL} SOL` }
    }

    return { ok: true, receivedSOL: escrowDiff / LAMPORTS_PER_SOL }
  } catch (err) {
    console.error('[solana] verifyTransaction error:', err)
    return { ok: false, error: 'Erreur vérification on-chain' }
  }
}

/**
 * Envoie les SOL au winner depuis le wallet escrow.
 * Platform fee de 3% retenu.
 */
export async function payoutWinner({ winnerAddress, totalPoolSOL }) {
  try {
    const winnerPubkey = new PublicKey(winnerAddress)
    const payoutSOL = totalPoolSOL * (1 - PLATFORM_FEE)
    const lamports = Math.round(payoutSOL * LAMPORTS_PER_SOL)

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: winnerPubkey,
        lamports,
      })
    )

    const sig = await sendAndConfirmTransaction(connection, tx, [escrowKeypair])
    console.log(`[payout] ${payoutSOL.toFixed(4)} SOL → ${winnerAddress} | tx: ${sig}`)
    return { ok: true, signature: sig, payoutSOL }
  } catch (err) {
    console.error('[payout] error:', err)
    return { ok: false, error: err.message }
  }
}
