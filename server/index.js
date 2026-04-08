import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { registerRoomHandlers } from './socket/roomHandler.js'
import { registerGameHandlers } from './socket/gameHandler.js'
import { getPublicRooms } from './store.js'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
]

const app = express()
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
})

// REST: public rooms list (for initial load)
app.get('/rooms', (_req, res) => {
  res.json(getPublicRooms())
})

app.get('/health', (_req, res) => res.json({ ok: true }))

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`)

  registerRoomHandlers(io, socket)
  registerGameHandlers(io, socket)

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`solskill server running on http://localhost:${PORT}`)
})
