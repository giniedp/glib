import {
  IRect,
  type IVec4,
  Mat4,
  mat4$initIdentity,
  mat4$initScaleXYZ,
  mat4$premultiply,
  mat4$rotateX,
  mat4$rotateY,
  mat4$setTranslationXYZ,
  mat4$translateXYZ,
  mat4Identity,
  vec4,
  vec4$init,
  vec4$initFrom,
} from '@gglib/math'
import { type Texture, type TextureView } from './resources'

export interface Sprite {
  texture: Texture | TextureView
  color?: IVec4

  source: IRect
  flipX?: boolean
  flipY?: boolean

  destination: IRect
  depth?: number
  angle?: number
  pivotX?: number
  pivotY?: number

  transform?: Mat4
}

/**
 * @public
 */
export class SpriteBuilder {
  public texture: Texture | TextureView
  public readonly color: IVec4 = vec4(1)
  public readonly transform = mat4Identity()
  public readonly uv: IVec4 = vec4(0, 0, 1, 1)

  // size of the destination in pixels, the pivot of rotate is relative to it
  private width = 1
  private height = 1

  public reset(texture: Texture | TextureView): this {
    this.texture = texture
    this.width = 1
    this.height = 1
    vec4$init(this.color, 1, 1, 1, 1)
    vec4$init(this.uv, 0, 0, 1, 1)
    mat4$initIdentity(this.transform)
    return this
  }

  public set(data: Sprite): this {
    this.texture = data.texture
    if (data.color) {
      vec4$initFrom(this.color, data.color)
    } else {
      vec4$init(this.color, 1, 1, 1, 1)
    }
    this.source(data.source.x, data.source.y, data.source.width, data.source.height, data.flipX, data.flipY)
    this.destination(
      data.destination.x,
      data.destination.y,
      data.destination.width,
      data.destination.height,
      data.depth,
    )
    this.rotate(data.angle, data.pivotX, data.pivotY)
    return this
  }

  /**
   * Set the sprite tint color
   *
   * @remarks
   * This will override any previously set alpha value
   */
  public tint(color: IVec4): this {
    vec4$initFrom(this.color, color)
    return this
  }

  /**
   * Sets the alpha value
   *
   * @remarks
   * If the sprite should receive a tint color, the `color()` must be called first.
   */
  public alpha(alpha: number): this {
    this.color.w = alpha
    return this
  }

  /**
   * Defines the source area in texture that is shown by this sprite
   *
   * @param x - starting x coordinate in texture
   * @param y - starting y cooridnate in texture
   * @param width - number of pixels hrizontally
   * @param height - number of pixels vertically
   * @param flipX - whether to flip texture on x axis
   * @param flipY - whether to flip texture on y axis
   */
  public source(
    x: number,
    y: number,
    width: number = this.texture.width,
    height: number = this.texture.height,
    flipX?: boolean,
    flipY?: boolean,
    originBottomLeft?: boolean,
  ): this {
    const tex = this.texture
    const texelX = 1 / tex.width
    const texelY = 1 / tex.height
    if (flipX) {
      this.uv.z = x * texelX
      this.uv.x = (x + width) * texelX
    } else {
      this.uv.x = x * texelX
      this.uv.z = (x + width) * texelX
    }
    if (flipY) {
      this.uv.w = y * texelY
      this.uv.y = (y + height) * texelY
    } else {
      this.uv.y = y * texelY
      this.uv.w = (y + height) * texelY
    }
    return this
  }

  /**
   * Flips x texture coordinates
   */
  public flipX(flip: boolean = true) {
    if (flip) {
      ;[this.uv.x, this.uv.z] = [this.uv.z, this.uv.x]
    }
    return this
  }

  /**
   * Flips y texture coordinates
   */
  public flipY(flip: boolean = true) {
    if (flip) {
      ;[this.uv.y, this.uv.w] = [this.uv.w, this.uv.y]
    }
    return this
  }

  /**
   * Defines the destination area in vieport where the sprite should be rendered
   *
   * @param x - the x position in pixels in viewport
   * @param y - the y position in pixels in viewport
   * @param width - the width in pixels in viewport
   * @param height - the height in pixels in viewport
   *
   * @remarks
   * This will only work if no custom projection matrix is used on the sprite batch.
   * When useing custom projection matrix consider the `transform*` methods instead.
   */
  public destination(
    x: number,
    y: number,
    width?: number,
    height?: number,
    depth?: number,
    angle?: number,
    pivotX?: number,
    pivotY?: number,
  ) {
    if (width == null) {
      width = (this.uv.z - this.uv.x) * this.texture.width
    }
    if (height == null) {
      height = (this.uv.w - this.uv.y) * this.texture.height
    }
    if (depth == null) {
      depth = 0
    }

    this.width = width
    this.height = height
    mat4$initScaleXYZ(this.transform, width, height, 1)
    mat4$setTranslationXYZ(this.transform, x + width * 0.5, y + height * 0.5, -depth)

    if (angle) {
      this.rotate(angle, pivotX, pivotY)
    }
    return this
  }

  /**
   * Rotates the sprite around a pivot
   *
   * @param angle - the angle in radians
   * @param pivotX - horizontal pivot as fraction of the sprite width, `0` is the left edge. Defaults to `0.5`
   * @param pivotY - vertical pivot as fraction of the sprite height, `0` is the top edge. Defaults to `0.5`
   *
   * @remarks
   * The rotation happens in destination pixels, so non square sprites keep their shape.
   * Call after {@link SpriteBuilder.destination}.
   */
  public rotate(angle: number, pivotX?: number, pivotY?: number): this {
    if (!angle) {
      return this
    }
    const m = this.transform
    // pivot relative to the center, in destination pixels
    const ox = ((pivotX ?? 0.5) - 0.5) * this.width
    const oy = ((pivotY ?? 0.5) - 0.5) * this.height
    // the current axes, may already be rotated
    const ax = m[0]
    const ay = m[1]
    const bx = m[4]
    const by = m[5]
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    m[0] = cos * ax - sin * ay
    m[1] = sin * ax + cos * ay
    m[4] = cos * bx - sin * by
    m[5] = sin * bx + cos * by
    // keep the pivot in place: center' = pivot - R * (pivot - center)
    m[12] += ox - (cos * ox - sin * oy)
    m[13] += oy - (sin * ox + cos * oy)
    return this
  }

  public transformMat4(m: Mat4): this {
    mat4$premultiply(this.transform, m)
    return this
  }

  public rotateX(angle: number, pivotX?: number, pivotY?: number): this {
    pivotX = (pivotX ?? 0.5) - 0.5
    pivotY = (pivotY ?? 0.5) - 0.5
    mat4$translateXYZ(this.transform, pivotX || 0, pivotY || 0, 0)
    mat4$rotateX(this.transform, angle)
    mat4$translateXYZ(this.transform, -pivotX || 0, -pivotY || 0, 0)
    return this
  }

  public rotateY(angle: number, pivotX?: number, pivotY?: number): this {
    pivotX = (pivotX ?? 0.5) - 0.5
    pivotY = (pivotY ?? 0.5) - 0.5
    mat4$translateXYZ(this.transform, pivotX || 0, pivotY || 0, 0)
    mat4$rotateY(this.transform, angle)
    mat4$translateXYZ(this.transform, -pivotX || 0, -pivotY || 0, 0)
    return this
  }
}
