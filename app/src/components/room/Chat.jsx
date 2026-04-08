import { useState, useEffect, useRef } from 'react'
import { getSocket } from '../../hooks/useSocket.js'

export default function Chat({ room }) {
  const socket = getSocket()
  const [messages, setMessages] = useState(room?.chat ?? [])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (room?.chat) setMessages(room.chat)
  }, [room?.id])

  useEffect(() => {
    const onMsg = (msg) => setMessages(prev => [...prev.slice(-99), msg])
    socket.on('chat:message', onMsg)
    return () => socket.off('chat:message', onMsg)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    socket.emit('chat:message', { text })
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="card flex flex-col h-64">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-heading font-semibold text-slate-400 uppercase tracking-wider">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-semibold text-cyan mr-2">{msg.playerName}</span>
            <span className="text-slate-300">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <input
          className="input flex-1 text-sm py-2"
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          maxLength={200}
        />
        <button
          onClick={send}
          className="px-4 py-2 bg-pink/20 border border-pink/40 text-pink rounded-lg text-sm font-semibold hover:bg-pink/30 transition-all duration-150 active:scale-95"
        >
          →
        </button>
      </div>
    </div>
  )
}
