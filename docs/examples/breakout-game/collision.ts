import { clamp, IRect, Rect } from '@gglib/math'

export type HitAxis = 'x' | 'y'

export function getCircleRectHit(ball: IRect, rect: IRect): HitAxis | null {
  const radius = ball.width / 2
  const cx = ball.x + radius
  const cy = ball.y + radius

  const closestX = clamp(cx, rect.x, Rect.endX(rect))
  const closestY = clamp(cy, rect.y, Rect.endY(rect))

  const dx = cx - closestX
  const dy = cy - closestY
  const distSq = dx * dx + dy * dy

  if (distSq > radius * radius) return null

  // Center is directly above/below the rect's x-span -> flat face hit (top/bottom).
  if (dx === 0) return 'y'
  // Center is directly left/right of the rect's y-span -> flat face hit (left/right).
  if (dy === 0) return 'x'

  // Corner region: closest point is a corner of the rect. Pick the axis
  // the ball is more "aligned" with — i.e. the one it penetrated less to
  // get here — so a near-miss corner clip still bounces sensibly.
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}
