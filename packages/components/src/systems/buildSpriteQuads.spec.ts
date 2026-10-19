import { describe, expect, it } from 'vitest'
import { SpriteComponent } from '../components/SpriteComponent'
import { buildSpriteQuads, SpriteQuadSink } from './buildSpriteQuads'

type Quad = [number, number, number, number, number, number, number, number]

function build(sprite: SpriteComponent, width = 100, height = 50) {
  const quads: Quad[] = []
  const sink: SpriteQuadSink = {
    quad: (...args) => quads.push(args),
  }
  const count = buildSpriteQuads(sprite, width, height, sink)
  expect(count).toBe(quads.length)
  return quads
}

describe('buildSpriteQuads', () => {
  it('builds one quad around the center pivot', () => {
    const quads = build(new SpriteComponent({ width: 2, height: 4 }))
    // bottom left corner gets the bottom left texcoord, v is down
    expect(quads).toEqual([[-1, -2, 1, 2, 0, 1, 1, 0]])
  })

  it('uses the pivot in image space', () => {
    const quads = build(new SpriteComponent({ width: 2, height: 4, pivotX: 0, pivotY: 0 }))
    expect(quads).toEqual([[0, -4, 2, 0, 0, 1, 1, 0]])
    const feet = build(new SpriteComponent({ width: 2, height: 4, pivotX: 0.5, pivotY: 1 }))
    expect(feet).toEqual([[-1, 0, 1, 4, 0, 1, 1, 0]])
  })

  it('maps the source rectangle', () => {
    const quads = build(new SpriteComponent({ sourceX: 10, sourceY: 5, sourceWidth: 20, sourceHeight: 10 }))
    expect(quads[0].slice(4)).toEqual([0.1, 0.3, 0.3, 0.1])
    // zero size extends to the edge of the texture
    const rest = build(new SpriteComponent({ sourceX: 50, sourceY: 25 }))
    expect(rest[0].slice(4)).toEqual([0.5, 1, 1, 0.5])
  })

  it('flips by mirroring positions', () => {
    const quads = build(new SpriteComponent({ width: 2, height: 4, pivotX: 0, pivotY: 0, flipX: true, flipY: true }))
    expect(quads).toEqual([[2, 0, 0, -4, 0, 1, 1, 0]])
  })

  it('tiles the whole sprite', () => {
    const quads = build(new SpriteComponent({ width: 4, height: 2, pivotX: 0, pivotY: 1, tilesX: 2, tilesY: 2 }))
    expect(quads.map((q) => q.slice(0, 4))).toEqual([
      [0, 0, 2, 1],
      [2, 0, 4, 1],
      [0, 1, 2, 2],
      [2, 1, 4, 2],
    ])
    for (const q of quads) {
      expect(q.slice(4)).toEqual([0, 1, 1, 0])
    }
  })

  it('builds 9 slices with borders in pixels per unit', () => {
    const sprite = new SpriteComponent({ width: 4, height: 3, pivotX: 0, pivotY: 1, pixelsPerUnit: 10 })
    sprite.setSlice(10)
    const quads = build(sprite)
    expect(quads.length).toBe(9)
    // rows are built from top to bottom. Top left corner: 1 unit wide and high, the 10 px corner of the texture
    expect(quads[0]).toEqual([0, 2, 1, 3, 0, 0.2, 0.1, 0])
    // center
    expect(quads[4]).toEqual([1, 1, 3, 2, 0.1, 0.8, 0.9, 0.2])
  })

  it('shrinks borders that do not fit', () => {
    const sprite = new SpriteComponent({ width: 1, height: 1, pivotX: 0, pivotY: 1, pixelsPerUnit: 10 })
    sprite.setSlice(10)
    const quads = build(sprite)
    // the borders take the whole sprite, the empty center row and column are skipped
    expect(quads.length).toBe(4)
    expect(quads[0].slice(0, 4)).toEqual([0, 0.5, 0.5, 1])
  })

  it('tiles the center of 9 slices', () => {
    const sprite = new SpriteComponent({ width: 4, height: 4, pixelsPerUnit: 10, tilesX: 3, tilesY: 2 })
    sprite.setSlice(10)
    expect(build(sprite).length).toBe(4 + 2 * 3 + 2 * 2 + 3 * 2)
  })

  it('skips empty sprites', () => {
    expect(build(new SpriteComponent({ width: 0 }))).toEqual([])
  })
})
