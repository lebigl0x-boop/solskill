import { useEffect, useRef, useCallback } from 'react'

const CANVAS_W = 800
const CANVAS_H = 500
const TARGET_RADIUS = 40

// Colors matching design system
const COLOR_BG = '#0A0A0F'
const COLOR_SURFACE = '#13131A'
const COLOR_BORDER = '#1E1E2E'
const COLOR_PINK = '#FF2D78'
const COLOR_CYAN = '#00FFF0'
const COLOR_AMBER = '#FFB800'

export default function TargetRush({ target, score, timeLeft, duration, onHit }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)
  const lastTargetRef = useRef(null)

  // Spawn pixel particles on hit
  const spawnParticles = useCallback((x, y) => {
    const count = 12
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = Math.random() * 3 + 2
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: Math.random() * 4 + 2,
        color: [COLOR_PINK, COLOR_CYAN, COLOR_AMBER][Math.floor(Math.random() * 3)],
      })
    }
  }, [])

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      // Background
      ctx.fillStyle = COLOR_BG
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Subtle grid
      ctx.strokeStyle = COLOR_BORDER
      ctx.lineWidth = 0.5
      const gridSize = 40
      for (let x = 0; x < CANVAS_W; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_H)
        ctx.stroke()
      }
      for (let y = 0; y < CANVAS_H; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_W, y)
        ctx.stroke()
      }

      // Current target
      if (target) {
        const { x, y, radius } = target
        const age = Date.now() - target.createdAt
        const pulse = Math.sin(Date.now() / 120) * 0.15 + 0.85

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5)
        gradient.addColorStop(0, `${COLOR_PINK}30`)
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Outer ring (pulsing)
        ctx.beginPath()
        ctx.arc(x, y, radius * pulse + 4, 0, Math.PI * 2)
        ctx.strokeStyle = `${COLOR_PINK}60`
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Main circle
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = COLOR_SURFACE
        ctx.fill()
        ctx.strokeStyle = COLOR_PINK
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Crosshair
        ctx.strokeStyle = COLOR_PINK
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.7
        ;[-1, 1].forEach(dir => {
          ctx.beginPath()
          ctx.moveTo(x + dir * (radius * 0.3), y)
          ctx.lineTo(x + dir * (radius * 0.8), y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(x, y + dir * (radius * 0.3))
          ctx.lineTo(x, y + dir * (radius * 0.8))
          ctx.stroke()
        })
        ctx.globalAlpha = 1

        // Inner dot
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = COLOR_PINK
        ctx.fill()
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.05
        p.vy += 0.1 // gravity
      }
      ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  // Trigger particles when target changes (= hit confirmed)
  useEffect(() => {
    if (lastTargetRef.current && target && lastTargetRef.current.id !== target.id) {
      spawnParticles(lastTargetRef.current.x, lastTargetRef.current.y)
    }
    lastTargetRef.current = target
  }, [target])

  const handleClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    onHit?.(x, y)
  }

  // Timer bar
  const progress = duration ? Math.max(0, (timeLeft ?? duration) / duration) : 1
  const timerColor = progress > 0.5 ? COLOR_CYAN : progress > 0.25 ? COLOR_AMBER : COLOR_PINK

  const timeLeftSec = timeLeft != null ? Math.ceil(timeLeft / 1000) : null

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Timer bar */}
      <div className="flex items-center gap-3">
        <span
          className="font-mono font-bold text-2xl w-12 text-right transition-colors duration-300"
          style={{ color: timerColor }}
        >
          {timeLeftSec ?? '--'}
        </span>
        <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: timerColor,
              boxShadow: `0 0 8px ${timerColor}80`,
            }}
          />
        </div>
        <span className="font-mono font-bold text-2xl text-pink text-glow-pink min-w-[3ch] text-left">
          {score}
        </span>
      </div>

      {/* Canvas */}
      <div className="scanline rounded-xl overflow-hidden border border-border glow-pink">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-auto block cursor-crosshair"
          onClick={handleClick}
        />
      </div>

      <p className="text-center text-xs text-slate-600 font-mono">
        Click the targets as fast as possible
      </p>
    </div>
  )
}
