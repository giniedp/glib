import { type IRect, type IVec2 } from '@gglib/math'
import type { Device } from './Device'
import { type Ownable, ResourceOwnership } from './resources/ResourceOwnership'
import type { Texture } from './resources/Texture'

/**
 * A character of a {@link SpriteFont}
 *
 * @public
 */
export interface SpriteFontGlyph {
  /**
   * The character
   */
  char: string
  /**
   * Area of the glyph in the font texture in pixels. Empty for characters without ink, e.g. the space
   */
  source: IRect
  /**
   * Horizontal offset of the glyph area from the pen position
   */
  offsetX: number
  /**
   * Vertical offset of the glyph area from the top of the line
   */
  offsetY: number
  /**
   * Horizontal distance from this character to the next one
   */
  advance: number
}

/**
 * Constructor options for {@link SpriteFont}
 *
 * @public
 */
export interface SpriteFontOptions {
  texture: Texture
  glyphs: SpriteFontGlyph[]
  lineSpacing: number
  spacing?: number
  defaultCharacter?: string | null
  kerning?: Map<number, number>
}

/**
 * A bitmap font that is drawn with `SpriteBatch.drawString`
 *
 * @public
 * @remarks
 * Use {@link createSpriteFont} to generate a font with canvas at runtime.
 * The glyphs are white, tint them with the color of `drawString`.
 */
export class SpriteFont implements Ownable {
  /**
   * The ownership state of this font
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * The texture with all glyphs
   */
  public readonly texture: Texture

  /**
   * The glyphs by code point
   */
  public readonly glyphs = new Map<number, SpriteFontGlyph>()

  /**
   * Vertical distance between two lines in pixels
   */
  public lineSpacing: number

  /**
   * Additional horizontal distance between two characters in pixels
   */
  public spacing: number

  /**
   * Character that is drawn in place of characters that the font doesn't contain.
   * With `null` those characters are skipped
   */
  public get defaultCharacter(): string | null {
    return this.defaultGlyph?.char ?? null
  }
  public set defaultCharacter(value: string | null) {
    this.defaultGlyph = value ? (this.glyphs.get(value.codePointAt(0)) ?? null) : null
  }

  private defaultGlyph: SpriteFontGlyph | null = null

  /**
   * Kerning adjustments by character pair, see {@link SpriteFont.kerningKey}
   */
  public readonly kerning: Map<number, number>

  /**
   * All characters of this font
   */
  public get characters(): string[] {
    return Array.from(this.glyphs.values(), (it) => it.char)
  }

  public constructor(options: SpriteFontOptions) {
    this.texture = this.ownership.adopt(options.texture)
    for (const glyph of options.glyphs) {
      this.glyphs.set(glyph.char.codePointAt(0), glyph)
    }
    this.lineSpacing = options.lineSpacing
    this.spacing = options.spacing ?? 0
    this.defaultCharacter = options.defaultCharacter ?? null
    this.kerning = options.kerning ?? new Map()
  }

  /**
   * Key of a character pair in {@link SpriteFont.kerning}
   */
  public static kerningKey(first: number, second: number): number {
    return first * 0x110000 + second
  }

  /**
   * Gets the glyph of a code point, or of the {@link SpriteFont.defaultCharacter} if the font doesn't contain it
   */
  public getGlyph(codePoint: number): SpriteFontGlyph | null {
    return this.glyphs.get(codePoint) ?? this.defaultGlyph
  }

  /**
   * Gets the kerning adjustment between two characters
   */
  public getKerning(first: number, second: number): number {
    return this.kerning.size ? (this.kerning.get(SpriteFont.kerningKey(first, second)) ?? 0) : 0
  }

  /**
   * Starts the layout of a text. Iterate the glyphs with {@link SpriteFontCursor.next}
   *
   * @param cursor - a cursor to reuse, avoids an allocation
   */
  public layout(text: string, cursor?: SpriteFontCursor): SpriteFontCursor {
    return (cursor ?? new SpriteFontCursor()).reset(this, text)
  }

  /**
   * Measures the size of the text in pixels: the width of the widest line and the height of all lines
   */
  public measureString(text: string, out?: IVec2): IVec2 {
    out ??= { x: 0, y: 0 }
    const cursor = this.layout(text, measureCursor)
    let width = 0
    while (cursor.next()) {
      width = Math.max(width, cursor.x + cursor.glyph.advance)
    }
    out.x = width
    out.y = (cursor.line + 1) * this.lineSpacing
    return out
  }

  /**
   * Immediately finalizes this font and its texture
   */
  public dispose() {
    this.ownership.finalize()
  }
}

/**
 * Iterates the glyphs of a text and their positions, see {@link SpriteFont.layout}
 *
 * @public
 * @remarks
 * `\n` starts a new line, `\r` is ignored. Characters without a glyph are skipped.
 *
 * @example
 * ```ts
 * const cursor = font.layout(text)
 * while (cursor.next()) {
 *   // cursor.glyph at cursor.x, cursor.y
 * }
 * ```
 */
export class SpriteFontCursor {
  /**
   * The current glyph
   */
  public glyph: SpriteFontGlyph | null = null
  /**
   * Pen position of the current glyph relative to the left of the text
   */
  public x = 0
  /**
   * Top of the line of the current glyph relative to the top of the text
   */
  public y = 0
  /**
   * Index of the current line
   */
  public line = 0

  private font: SpriteFont
  private text = ''
  private index = 0
  private pen = 0
  private prev = -1

  /**
   * Starts over with the given font and text
   */
  public reset(font: SpriteFont, text: string): this {
    this.font = font
    this.text = text
    this.index = 0
    this.pen = 0
    this.prev = -1
    this.line = 0
    this.glyph = null
    this.x = 0
    this.y = 0
    return this
  }

  /**
   * Moves to the next glyph
   *
   * @returns `false` at the end of the text
   */
  public next(): boolean {
    const font = this.font
    const text = this.text
    while (this.index < text.length) {
      const code = text.codePointAt(this.index)
      this.index += code > 0xffff ? 2 : 1
      if (code === 10) {
        this.pen = 0
        this.prev = -1
        this.line++
        continue
      }
      if (code === 13) {
        continue
      }
      const glyph = font.getGlyph(code)
      if (!glyph) {
        continue
      }
      if (this.prev >= 0) {
        this.pen += font.spacing + font.getKerning(this.prev, code)
      }
      this.glyph = glyph
      this.x = this.pen
      this.y = this.line * font.lineSpacing
      this.pen += glyph.advance
      this.prev = code
      return true
    }
    this.glyph = null
    return false
  }
}

// measureString runs to completion synchronously, so one cursor serves all fonts
const measureCursor = new SpriteFontCursor()

/**
 * Options for {@link createSpriteFont}
 *
 * @public
 */
export interface CreateSpriteFontOptions {
  /**
   * The CSS font family. Defaults to `sans-serif`
   */
  family?: string
  /**
   * The font size in pixels. Defaults to `16`
   */
  size?: number
  /**
   * The CSS font weight, e.g. `bold` or `700`
   */
  weight?: string | number
  /**
   * The CSS font style, e.g. `italic`
   */
  style?: string
  /**
   * The characters to include. Defaults to the printable ASCII characters
   */
  characters?: string
  /**
   * Character that is drawn in place of missing characters. Defaults to `?`, `null` skips missing characters
   */
  defaultCharacter?: string | null
  /**
   * Additional horizontal distance between two characters in pixels. Defaults to `0`
   */
  spacing?: number
  /**
   * Vertical distance between two lines in pixels. Defaults to the line height of the font
   */
  lineSpacing?: number
  /**
   * Whether to measure kerning of all character pairs. Defaults to `false`
   */
  kerning?: boolean
  /**
   * Draws an outline around the glyphs. The fill is white, so tinting tints the fill and the outline
   */
  outline?: { width: number; color: string }
  /**
   * Empty pixels around each glyph in the texture, prevents bleeding of neighbors when the text is scaled.
   * Defaults to `2`
   */
  padding?: number
}

const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')

type Canvas2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/**
 * Generates a {@link SpriteFont} by drawing the characters with canvas
 *
 * @public
 * @remarks
 * Waits for web fonts to load, system fonts resolve immediately.
 * Generate the font at the size it is displayed with, scaled bitmap text gets blurry.
 *
 * @example
 * ```ts
 * const font = await createSpriteFont(device, { family: 'Arial', size: 32 })
 * spriteBatch.begin()
 * spriteBatch.drawString(font, 'Hello World', 10, 10)
 * spriteBatch.end()
 * spriteBatch.draw()
 * ```
 */
export async function createSpriteFont(device: Device, options?: CreateSpriteFontOptions): Promise<SpriteFont> {
  const size = options?.size ?? 16
  const font = [options?.style, options?.weight, `${size}px`, options?.family ?? 'sans-serif'].filter(Boolean).join(' ')
  const defaultCharacter = options?.defaultCharacter === undefined ? '?' : options.defaultCharacter
  const outline = options?.outline?.width > 0 ? options.outline : null
  const padding = (options?.padding ?? 2) + Math.ceil(outline?.width ?? 0)

  const chars = [...new Set([...(options?.characters ?? ASCII), ...(defaultCharacter ?? '')])]
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.load(font, chars.join(''))
  }

  const ctx = createContext(1, 1)
  ctx.font = font
  const lineMetrics = ctx.measureText('Mg')
  const ascent = Math.ceil(lineMetrics.fontBoundingBoxAscent ?? size * 0.8)
  const descent = Math.ceil(lineMetrics.fontBoundingBoxDescent ?? size * 0.2)

  // measure the ink box of each character relative to the pen position on the baseline
  const glyphs: SpriteFontGlyph[] = []
  const baselines: number[] = []
  for (const char of chars) {
    const m = ctx.measureText(char)
    const left = Math.floor(-m.actualBoundingBoxLeft)
    const right = Math.ceil(m.actualBoundingBoxRight)
    const top = Math.floor(-m.actualBoundingBoxAscent)
    const bottom = Math.ceil(m.actualBoundingBoxDescent)
    const empty = right <= left || bottom <= top
    glyphs.push({
      char,
      source: {
        x: 0,
        y: 0,
        width: empty ? 0 : right - left + padding * 2,
        height: empty ? 0 : bottom - top + padding * 2,
      },
      offsetX: left - padding,
      offsetY: ascent + top - padding,
      advance: m.width,
    })
    baselines.push(padding - top)
  }

  // shelf pack, tallest glyphs first
  const order = glyphs.map((_, i) => i).filter((i) => glyphs[i].source.width > 0)
  order.sort((a, b) => glyphs[b].source.height - glyphs[a].source.height)
  const area = order.reduce((sum, i) => sum + glyphs[i].source.width * glyphs[i].source.height, 0)
  const maxGlyphWidth = order.reduce((max, i) => Math.max(max, glyphs[i].source.width), 1)
  let width = 64
  while (width * width < area * 1.2 || width < maxGlyphWidth) {
    width *= 2
  }
  let x = 0
  let y = 0
  let shelf = 0
  for (const i of order) {
    const source = glyphs[i].source
    if (x + source.width > width) {
      x = 0
      y += shelf
      shelf = 0
    }
    source.x = x
    source.y = y
    x += source.width
    shelf = Math.max(shelf, source.height)
  }
  const height = Math.max(1, y + shelf)

  const atlas = createContext(width, height)
  atlas.font = font
  atlas.textBaseline = 'alphabetic'
  atlas.fillStyle = '#fff'
  if (outline) {
    atlas.strokeStyle = outline.color
    atlas.lineWidth = outline.width * 2
    atlas.lineJoin = 'round'
  }
  for (const i of order) {
    const glyph = glyphs[i]
    const penX = glyph.source.x - glyph.offsetX
    const penY = glyph.source.y + baselines[i]
    if (outline) {
      atlas.strokeText(glyph.char, penX, penY)
    }
    atlas.fillText(glyph.char, penX, penY)
  }

  let kerning: Map<number, number> | undefined
  if (options?.kerning) {
    kerning = new Map()
    for (const a of glyphs) {
      for (const b of glyphs) {
        const value = ctx.measureText(a.char + b.char).width - a.advance - b.advance
        if (Math.abs(value) > 0.01) {
          kerning.set(SpriteFont.kerningKey(a.char.codePointAt(0), b.char.codePointAt(0)), value)
        }
      }
    }
  }

  const texture = device.createTexture({
    name: `SpriteFont ${font}`,
    source: atlas.canvas as HTMLCanvasElement,
    width,
    height,
    format: 'rgba8unorm',
  })

  return new SpriteFont({
    texture,
    glyphs,
    lineSpacing: options?.lineSpacing ?? ascent + descent,
    spacing: options?.spacing,
    defaultCharacter,
    kerning,
  })
}

function createContext(width: number, height: number): Canvas2D {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas.getContext('2d')
  }
  return new OffscreenCanvas(width, height).getContext('2d')
}
