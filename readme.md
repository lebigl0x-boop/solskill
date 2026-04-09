# 🎯 solskill.gg

> **Compete. Prove your skill. Get paid.**

SkillShot is a real-time competitive mini-game platform built on Solana.  
Create a room, invite friends or your Twitch chat, play skill-based games, winner takes the pot.  
No pure luck. No casino. Just you vs others — best player wins.

---

## 🎨 Artistic Direction

**"Retro Arcade meets Solana terminal"**

Imagine an arcade machine from 1987 that got rebuilt on-chain in 2025.

```
Color palette
─────────────
Background   #0A0A0F   near-black, deep space
Primary      #FF2D78   neon pink  (brand color, CTAs, highlights)
Secondary    #00FFF0   cyan       (scores, live elements)
Accent       #9945FF   Solana purple (wallet, on-chain stuff)
Warning      #FFB800   amber      (timers, countdowns)
Surface      #13131A   card backgrounds
Border       #1E1E2E   subtle separators
```

**Typography**
- Headings → `Space Grotesk` — modern, slightly techy
- Scores / numbers → `JetBrains Mono` — monospace, terminal feel
- Body → `Inter`

**Visual language**
- Scanline effect subtle en overlay sur les éléments de jeu (CRT vibes)
- Glow sur les éléments actifs (box-shadow neon pink/cyan)
- Particules pixel qui explosent sur chaque hit/événement
- Bordures légèrement arrondies mais pas trop smooth — pas une app SaaS
- Animations rapides et snappy — 150ms max, pas de transitions molles

**Références visuelles**
- `Cyberpunk 2077` UI — HUD net, info dense, couleurs tranchées
- `osu!` — clarté du jeu, feedback immédiat
- `pump.fun` — feed live, dense, addictif

---

## What is SkillShot?

Everyone can create a game room and challenge others.  
Winners are decided by **skill**, not randomness.  
Spectators can back their favorite player — they win if their pick wins.

```
Create a room  →  Share the link  →  Players join  →  Best score wins the pot
```

---

## Games (MVP)

### 🎯 Target Rush
Click/tap targets as fast as possible before the timer runs out.  
Most targets hit = winner. Simple. Pure reaction + precision.  
*Solo score attack or up to 6 players simultaneously.*

### ⚡ Reflex Duel
A signal flashes — first to click wins the round.  
Best of 5 rounds. Loser is eliminated.  
*1v1 or bracket tournament format.*

### 🐍 Snake Arena
Everyone plays Snake at the same time on the same grid.  
Longest snake when someone dies = winner.  
*2 to 8 players, shared canvas.*

### 🧠 Crypto Quiz *(coming)*
Questions about Solana, memecoins, crypto culture.  
First correct answer scores a point. Most points wins.  
*Perfect for Twitch streams.*

### 🏃 Endless Runner *(coming)*
Survive as long as possible. Furthest distance wins.  
*Async — everyone plays the same seed simultaneously.*

---

## Room system

Each room has a unique link: `skillshot.gg/r/abc123`

```
LOBBY → BETTING → COUNTDOWN → LIVE → RESULT
```

| State | What happens |
|---|---|
| **LOBBY** | Players join, host configures the game |
| **BETTING** | 30s window — spectators back a player |
| **COUNTDOWN** | 5s before game starts, builds tension |
| **LIVE** | Game runs, scores update in real time for everyone |
| **RESULT** | Winner displayed, payouts distributed automatically |

**Room types**
- 🔓 Public — appears in the homepage feed
- 🔒 Private — only accessible via link (for streamers)

---

## Anti-cheat

Score is **never trusted from the client.**

```
Client sends → raw input events (click positions + timestamps)
Server computes → actual score from those inputs
Server broadcasts → validated score to all players
```

Nobody can fake a score. The server is the only source of truth.

---

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind | Already mastered |
| Game engine | HTML5 Canvas + requestAnimationFrame | Lightweight, no dependency |
| Realtime | Socket.io | Room state sync, score broadcast |
| Backend | Node.js + Express | Score validation, room logic |
| Database | Supabase | Rooms, leaderboard, history |
| Wallet | `@solana/wallet-adapter` | Phantom auth |
| Swap | Jupiter API | SOL → $SHOT inline |
| Smart contract | Anchor (Rust) | Escrow bets, auto-payout |
| Randomness | Switchboard VRF | Game seeds, coinflip fairness |
| Deploy | Vercel + Railway | Free to start |

---

## The Token : $SHOT

$SHOT is the native SPL token of SkillShot.  
Buy it with SOL directly on the platform. Use it to enter rooms and back players.

- **Entry fee** → paid in $SHOT, locked in escrow
- **Winner payout** → automatic from smart contract
- **Spectator bet** → back a player, win proportionally if they win
- **Platform fee** → 3% of each pot (protocol revenue)

---

## Project Structure

```
skillshot/
├── app/                        # React frontend
│   ├── components/
│   │   ├── games/
│   │   │   ├── TargetRush/     # Canvas game component
│   │   │   ├── ReflexDuel/
│   │   │   └── SnakeArena/
│   │   ├── room/
│   │   │   ├── Lobby.jsx
│   │   │   ├── Scoreboard.jsx  # Live scores, real-time
│   │   │   ├── Chat.jsx
│   │   │   └── BettingPanel.jsx
│   │   └── wallet/
│   │       ├── ConnectButton.jsx
│   │       └── ShotBalance.jsx
│   ├── pages/
│   │   ├── Home.jsx            # Live rooms feed
│   │   ├── Room.jsx            # Game room
│   │   └── Create.jsx          # Room creation
│   └── hooks/
│       ├── useRoom.js          # Room state via Socket.io
│       ├── useGame.js          # Game loop management
│       └── useWallet.js
│
├── server/
│   ├── socket/
│   │   ├── roomHandler.js      # Join/leave/state
│   │   └── gameHandler.js      # Input validation, score compute
│   ├── games/
│   │   ├── targetRush.js       # Server-side score logic
│   │   └── reflexDuel.js
│   └── routes/
│       └── rooms.js
│
└── contracts/                  # Anchor (Rust)
    ├── escrow/                 # Lock + release funds
    └── shot_token/             # $SHOT SPL token
```

---

## Roadmap

### v0.1 — Core ✅ DONE
- [x] Room creation + shareable link
- [x] Socket.io room state + live scoreboard
- [x] Target Rush game (Canvas, server-side anti-cheat)
- [x] Basic chat per room
- [x] Homepage with public rooms feed
- [x] Deploy — frontend Vercel, backend Railway

### v0.2 — SOL entry fees (devnet) 🔨 IN PROGRESS
- [ ] Phantom wallet connect (real tx, not just signature)
- [ ] Entry fee field on room creation (in SOL)
- [ ] Pay-to-join — Phantom signs tx → server validates on-chain
- [ ] Pool display in lobby (total SOL locked)
- [ ] Auto-payout to winner after game ends (centralized escrow)
- [ ] 3% platform fee

### v0.3 — Games
- [ ] Reflex Duel (1v1, best of 5)
- [ ] Snake Arena (2-8 players, shared canvas)
- [ ] Spectator view + betting system

### v0.4 — $SHOT Token
- [ ] $SHOT SPL token deployed (devnet → mainnet)
- [ ] Jupiter swap integration (SOL → $SHOT inline)
- [ ] Entry fees in $SHOT
- [ ] Spectator backing in $SHOT

### v1.0 — Smart contract + Launch
- [ ] Anchor escrow contract (replace centralized escrow)
- [ ] Smart contract audit
- [ ] Mainnet launch
- [ ] Win share card (Twitter/X)
- [ ] Crypto Quiz game
- [ ] Twitch overlay integration

---

## Getting Started

```bash
git clone https://github.com/you/skillshot
cd skillshot

# Frontend
cd app && npm install && npm run dev

# Backend
cd server && npm install && npm run dev

# Smart contracts (requires Anchor + Solana CLI)
cd contracts && anchor build && anchor test
```

---

## Why SkillShot wins

| Casino | SkillShot |
|---|---|
| Pure luck | Skill decides |
| Legally grey | Competitive gaming = clean |
| Anyone can rig it | On-chain, verifiable |
| Passive experience | Active, engaging |
| No replayability | You train, you improve, you come back |

---

*SkillShot is a competitive gaming platform. $SHOT is a utility token with no guaranteed value. Play responsibly.*
</thinking>