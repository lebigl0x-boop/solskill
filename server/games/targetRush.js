// Server-side Target Rush logic
// Targets are generated server-side — client never decides what's valid

const TARGET_RADIUS = 40 // px, must match client canvas target size
const CLICK_WINDOW_MS = 5000 // max age of a click event we accept

export function generateTarget(canvasWidth = 800, canvasHeight = 500) {
  const margin = TARGET_RADIUS + 10
  return {
    x: Math.floor(Math.random() * (canvasWidth - margin * 2) + margin),
    y: Math.floor(Math.random() * (canvasHeight - margin * 2) + margin),
    radius: TARGET_RADIUS,
    createdAt: Date.now(),
    id: Math.random().toString(36).slice(2, 8),
  }
}

export function validateClick({ target, clickX, clickY, clickTs }) {
  if (!target) return false
  const now = Date.now()
  // Reject stale clicks
  if (now - clickTs > CLICK_WINDOW_MS) return false
  // Reject future clicks
  if (clickTs > now + 500) return false
  // Check hit radius
  const dx = target.x - clickX
  const dy = target.y - clickY
  return dx * dx + dy * dy <= target.radius * target.radius
}

export function initGame(room) {
  return {
    targets: {},       // playerId → current target
    scores: {},        // playerId → score
    startedAt: Date.now(),
    endsAt: Date.now() + room.config.duration,
    timer: null,
  }
}
