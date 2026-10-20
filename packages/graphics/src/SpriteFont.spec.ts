import { beforeAll, describe, expect, it } from 'vitest'
import type { Device } from './Device'
import { createSpriteFont, SpriteFont, SpriteFontGlyph } from './SpriteFont'
import { WebglDevice } from './webgl'

describe('SpriteFont', () => {
  let device: Device
  let font: SpriteFont

  beforeAll(async () => {
    device = await new WebglDevice({}).ready
    font = await createSpriteFont(device, { family: 'monospace', size: 20 })
  })

  it('contains the printable ASCII characters', () => {
    expect(font.characters.length).toBe(95)
    expect(font.getGlyph('A'.codePointAt(0))?.char).toBe('A')
  })

  it('falls back to the default character', () => {
    expect(font.getGlyph('€'.codePointAt(0))?.char).toBe('?')
  })

  it('skips missing characters without default character', async () => {
    const f = await createSpriteFont(device, { characters: 'ab', defaultCharacter: null })
    expect(f.getGlyph('c'.codePointAt(0))).toBeNull()
    expect(f.measureString('acb').x).toBe(f.measureString('ab').x)
    f.dispose()
  })

  it('has no ink for the space', () => {
    const space = font.getGlyph(32)
    expect(space.source.width).toBe(0)
    expect(space.advance).toBeGreaterThan(0)
  })

  it('packs glyphs without overlap inside the texture', () => {
    const boxes = [...font.glyphs.values()].map((it) => it.source).filter((it) => it.width > 0)
    for (const a of boxes) {
      expect(a.x + a.width).toBeLessThanOrEqual(font.texture.width)
      expect(a.y + a.height).toBeLessThanOrEqual(font.texture.height)
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
        expect(overlap).toBe(false)
      }
    }
  })

  it('measures the widest line and all lines', () => {
    const advance = font.getGlyph('M'.codePointAt(0)).advance
    const size = font.measureString('MMM\nM')
    expect(size.x).toBeCloseTo(advance * 3)
    expect(size.y).toBe(font.lineSpacing * 2)
  })

  it('adds spacing between characters', () => {
    const before = font.measureString('MMM').x
    font.spacing = 2
    expect(font.measureString('MMM').x).toBeCloseTo(before + 4)
    font.spacing = 0
  })

  it('measures trailing empty lines', () => {
    expect(font.measureString('a\n\n').y).toBe(font.lineSpacing * 3)
    expect(font.measureString('').y).toBe(font.lineSpacing)
  })

  it('steps over surrogate pairs as one character', () => {
    const glyphs: string[] = []
    const cursor = font.layout('a😀b')
    while (cursor.next()) {
      glyphs.push(cursor.glyph.char)
    }
    expect(glyphs).toEqual(['a', '?', 'b'])
  })

  it('lays out glyphs like it measures', () => {
    const positions: Array<[SpriteFontGlyph, number, number]> = []
    const cursor = font.layout('ab\nc')
    while (cursor.next()) {
      positions.push([cursor.glyph, cursor.x, cursor.y])
    }
    expect(positions.map(([g, x, y]) => [g.char, y])).toEqual([
      ['a', 0],
      ['b', 0],
      ['c', font.lineSpacing],
    ])
    expect(positions[1][1]).toBeCloseTo(positions[0][0].advance)
  })

  it('disposes its texture', async () => {
    const f = await createSpriteFont(device, { characters: 'x' })
    f.dispose()
    expect(f.texture.ownership.isFinalized).toBe(true)
  })
})
