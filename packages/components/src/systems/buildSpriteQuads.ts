import type { SpriteComponent } from '../components/SpriteComponent'

/**
 * Receives the quads of a sprite, see {@link buildSpriteQuads}
 *
 * @public
 */
export interface SpriteQuadSink {
  /**
   * Called for each quad. `(x0, y0)` is the bottom left corner in local space with texcoord `(u0, v0)`
   */
  quad(x0: number, y0: number, x1: number, y1: number, u0: number, v0: number, u1: number, v1: number): void
}

const xs = new Float64Array(4)
const us = new Float64Array(4)
const ys = new Float64Array(4)
const vs = new Float64Array(4)

/**
 * Splits a sprite into quads, considering source rectangle, pivot, 9-slice, tiling and flip
 *
 * @public
 * @param sprite - the sprite
 * @param textureWidth - texture width in pixels
 * @param textureHeight - texture height in pixels
 * @param sink - receives the quads
 * @returns the number of quads
 */
export function buildSpriteQuads(
  sprite: SpriteComponent,
  textureWidth: number,
  textureHeight: number,
  sink: SpriteQuadSink,
): number {
  const w = sprite.width
  const h = sprite.height
  if (!w || !h || textureWidth <= 0 || textureHeight <= 0) {
    return 0
  }
  const sx = sprite.sourceX
  const sy = sprite.sourceY
  const sw = sprite.sourceWidth || textureWidth - sx
  const sh = sprite.sourceHeight || textureHeight - sy

  // local rectangle, y is up. The pivot is in image space, y is down
  const left = -sprite.pivotX * w
  const right = left + w
  const top = sprite.pivotY * h
  const bottom = top - h

  // edges of the columns and rows, from left to right and top to bottom
  let n = 1
  const { sliceTop, sliceRight, sliceBottom, sliceLeft } = sprite
  if (sliceTop || sliceRight || sliceBottom || sliceLeft) {
    n = 3
    const ppu = sprite.pixelsPerUnit || 1
    // borders shrink if they don't fit into the sprite
    const bx = (sliceLeft + sliceRight) / ppu
    const by = (sliceTop + sliceBottom) / ppu
    const kx = bx > Math.abs(w) ? Math.abs(w) / bx : 1
    const ky = by > Math.abs(h) ? Math.abs(h) / by : 1
    xs[1] = left + (sliceLeft / ppu) * kx * Math.sign(w)
    xs[2] = right - (sliceRight / ppu) * kx * Math.sign(w)
    us[1] = (sx + sliceLeft) / textureWidth
    us[2] = (sx + sw - sliceRight) / textureWidth
    ys[1] = top - (sliceTop / ppu) * ky * Math.sign(h)
    ys[2] = bottom + (sliceBottom / ppu) * ky * Math.sign(h)
    vs[1] = (sy + sliceTop) / textureHeight
    vs[2] = (sy + sh - sliceBottom) / textureHeight
  }
  xs[0] = left
  xs[n] = right
  us[0] = sx / textureWidth
  us[n] = (sx + sw) / textureWidth
  ys[0] = top
  ys[n] = bottom
  vs[0] = sy / textureHeight
  vs[n] = (sy + sh) / textureHeight

  // the center column and row are tiled
  const center = n === 3 ? 1 : 0
  const tilesX = Math.max(1, Math.floor(sprite.tilesX))
  const tilesY = Math.max(1, Math.floor(sprite.tilesY))
  // flipping mirrors the positions, so asymmetric slices flip as well
  const mirrorX = left + right
  const mirrorY = top + bottom

  let count = 0
  for (let r = 0; r < n; r++) {
    const ya = ys[r + 1]
    const yb = ys[r]
    const va = vs[r + 1]
    const vb = vs[r]
    if (ya === yb) {
      continue
    }
    const ny = r === center ? tilesY : 1
    const stepY = (yb - ya) / ny
    for (let c = 0; c < n; c++) {
      const xa = xs[c]
      const xb = xs[c + 1]
      if (xa === xb) {
        continue
      }
      const ua = us[c]
      const ub = us[c + 1]
      const nx = c === center ? tilesX : 1
      const stepX = (xb - xa) / nx
      for (let j = 0; j < ny; j++) {
        let y0 = ya + j * stepY
        let y1 = y0 + stepY
        if (sprite.flipY) {
          y0 = mirrorY - y0
          y1 = mirrorY - y1
        }
        for (let i = 0; i < nx; i++) {
          let x0 = xa + i * stepX
          let x1 = x0 + stepX
          if (sprite.flipX) {
            x0 = mirrorX - x0
            x1 = mirrorX - x1
          }
          sink.quad(x0, y0, x1, y1, ua, va, ub, vb)
          count++
        }
      }
    }
  }
  return count
}
