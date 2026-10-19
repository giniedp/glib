import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { Texture } from '@gglib/graphics'
import { type IVec4, vec4 } from '@gglib/math'

/**
 * Constructor options for {@link SpriteComponent}. See the component fields for details
 *
 * @public
 */
export interface SpriteComponentOptions {
  texture?: Texture | null
  sourceX?: number
  sourceY?: number
  sourceWidth?: number
  sourceHeight?: number
  width?: number
  height?: number
  pivotX?: number
  pivotY?: number
  color?: IVec4
  flipX?: boolean
  flipY?: boolean
  tilesX?: number
  tilesY?: number
  sliceTop?: number
  sliceRight?: number
  sliceBottom?: number
  sliceLeft?: number
  pixelsPerUnit?: number
}

/**
 * Draws a textured quad in the local XY plane of the entity
 *
 * @public
 * @remarks
 * The component only holds data, the `SpriteSystem` renders all active sprites.
 * Position, rotation and scale come from the transform of the entity.
 *
 * Source rectangle and pivot are given in image space: `(0, 0)` is the top left of the image.
 * The quad itself is upright in the y-up local space of the entity.
 *
 * Sprites are ordered by depth. Pixels with an alpha below the `alphaCutoff` of the `SpriteSystem` are discarded.
 */
export class SpriteComponent implements GameComponent {
  public readonly entity: GameEntity

  /**
   * The texture to draw. If not set, a white quad is drawn that can be tinted with {@link color}
   */
  public texture: Texture | null = null
  /**
   * Left edge of the source rectangle in pixels
   */
  public sourceX = 0
  /**
   * Top edge of the source rectangle in pixels
   */
  public sourceY = 0
  /**
   * Width of the source rectangle in pixels. `0` means up to the right edge of the texture
   */
  public sourceWidth = 0
  /**
   * Height of the source rectangle in pixels. `0` means up to the bottom edge of the texture
   */
  public sourceHeight = 0
  /**
   * Width of the sprite in local units
   */
  public width = 1
  /**
   * Height of the sprite in local units
   */
  public height = 1
  /**
   * Horizontal pivot, `0` is the left and `1` the right edge
   */
  public pivotX = 0.5
  /**
   * Vertical pivot, `0` is the top and `1` the bottom edge
   */
  public pivotY = 0.5
  /**
   * The tint color
   */
  public readonly color: IVec4 = vec4(1)
  /**
   * Mirrors the sprite horizontally around its center
   */
  public flipX = false
  /**
   * Mirrors the sprite vertically around its center
   */
  public flipY = false
  /**
   * How often the image (or the center of a 9-slice) repeats horizontally
   */
  public tilesX = 1
  /**
   * How often the image (or the center of a 9-slice) repeats vertically
   */
  public tilesY = 1
  /**
   * 9-slice border at the top in pixels
   */
  public sliceTop = 0
  /**
   * 9-slice border at the right in pixels
   */
  public sliceRight = 0
  /**
   * 9-slice border at the bottom in pixels
   */
  public sliceBottom = 0
  /**
   * 9-slice border at the left in pixels
   */
  public sliceLeft = 0
  /**
   * Number of pixels per local unit. Defines the size of the 9-slice borders and is used by {@link setSizeFromSource}
   */
  public pixelsPerUnit = 100

  public constructor(options?: SpriteComponentOptions) {
    if (options) {
      const { color, ...rest } = options
      Object.assign(this, rest)
      if (color) {
        this.setColor(color)
      }
    }
  }

  /**
   * Sets the texture and optionally the source rectangle in pixels
   */
  public setTexture(texture: Texture | null, x?: number, y?: number, width?: number, height?: number): this {
    this.texture = texture
    if (x != null) {
      this.setSource(x, y ?? 0, width ?? 0, height ?? 0)
    }
    return this
  }

  /**
   * Sets the source rectangle in pixels. A width or height of `0` extends to the edge of the texture
   */
  public setSource(x: number, y: number, width = 0, height = 0): this {
    this.sourceX = x
    this.sourceY = y
    this.sourceWidth = width
    this.sourceHeight = height
    return this
  }

  /**
   * Sets the size in local units
   */
  public setSize(width: number, height = width): this {
    this.width = width
    this.height = height
    return this
  }

  /**
   * Sets the size from the source rectangle, so that one unit shows `pixelsPerUnit` pixels
   */
  public setSizeFromSource(pixelsPerUnit = this.pixelsPerUnit): this {
    this.pixelsPerUnit = pixelsPerUnit
    const w = this.sourceWidth || (this.texture ? this.texture.width - this.sourceX : 0)
    const h = this.sourceHeight || (this.texture ? this.texture.height - this.sourceY : 0)
    if (w > 0 && h > 0) {
      this.width = w / pixelsPerUnit
      this.height = h / pixelsPerUnit
    }
    return this
  }

  /**
   * Sets the pivot, `(0, 0)` is the top left and `(1, 1)` the bottom right corner
   */
  public setPivot(x: number, y: number): this {
    this.pivotX = x
    this.pivotY = y
    return this
  }

  /**
   * Sets the tint color
   */
  public setColor(r: number | IVec4, g?: number, b?: number, a = 1): this {
    if (typeof r === 'number') {
      this.color.x = r
      this.color.y = g ?? r
      this.color.z = b ?? r
      this.color.w = a
    } else {
      this.color.x = r.x
      this.color.y = r.y
      this.color.z = r.z
      this.color.w = r.w
    }
    return this
  }

  /**
   * Sets whether the sprite is mirrored
   */
  public setFlip(x: boolean, y: boolean): this {
    this.flipX = x
    this.flipY = y
    return this
  }

  /**
   * Sets how often the image (or the center of a 9-slice) repeats
   */
  public setTiles(x: number, y: number): this {
    this.tilesX = x
    this.tilesY = y
    return this
  }

  /**
   * Sets the 9-slice borders in pixels. Use all `0` to disable slicing
   */
  public setSlice(top: number, right = top, bottom = top, left = right): this {
    this.sliceTop = top
    this.sliceRight = right
    this.sliceBottom = bottom
    this.sliceLeft = left
    return this
  }
}
