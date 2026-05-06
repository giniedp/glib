import { IRect, type IVec4, Mat4, Quat, Vec4 } from '@gglib/math'
import { type Texture } from './resources'

export interface Sprite {
  texture: Texture
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
  public texture: Texture
  public readonly color: IVec4 = Vec4.init({}, 1, 1, 1, 1)
  public readonly transform = Mat4.createIdentity()
  public readonly uv: IVec4 = Vec4.init({}, 0, 0, 1, 1)

  public reset(texture: Texture): this {
    this.texture = texture
    Vec4.init(this.color, 1, 1, 1, 1)
    Vec4.init(this.uv, 0, 0, 1, 1)
    this.transform.initIdentity()
    return this
  }

  public set(data: Sprite): this {
    this.texture = data.texture
    if (data.color) {
      Vec4.initFrom(this.color, data.color)
    } else {
      Vec4.init(this.color, 1, 1, 1, 1)
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
    Vec4.initFrom(this.color, color)
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

    this.transform.initScaleXYZ(width, height, 1)
    this.transform.setTranslationXYZ(x + width * 0.5, y + height * 0.5, -depth)

    if (angle) {
      this.rotate(angle, pivotX, pivotY)
    }
    return this
  }

  public rotate(angle: number, pivotX?: number, pivotY?: number): this {
    pivotX = (pivotX ?? 0.5) - 0.5
    pivotY = (pivotY ?? 0.5) - 0.5
    this.transform.translateXYZ(pivotX || 0, pivotY || 0, 0)
    this.transform.rotateZ(angle || 0)
    this.transform.translateXYZ(-pivotX || 0, -pivotY || 0, 0)
    return this
  }

  public transformMat4(m: Mat4): this {
    this.transform.premultiply(m)
    return this
  }

  public transformQuat(q: Quat): this {
    this.transform.rotateQuaternion(q.x, q.y, q.z, q.w)
    return this
  }

  public rotateX(angle: number, pivotX?: number, pivotY?: number): this {
    pivotX = (pivotX ?? 0.5) - 0.5
    pivotY = (pivotY ?? 0.5) - 0.5
    this.transform.translateXYZ(pivotX || 0, pivotY || 0, 0)
    this.transform.rotateX(angle)
    this.transform.translateXYZ(-pivotX || 0, -pivotY || 0, 0)
    return this
  }

  public rotateY(angle: number, pivotX?: number, pivotY?: number): this {
    pivotX = (pivotX ?? 0.5) - 0.5
    pivotY = (pivotY ?? 0.5) - 0.5
    this.transform.translateXYZ(pivotX || 0, pivotY || 0, 0)
    this.transform.rotateY(angle)
    this.transform.translateXYZ(-pivotX || 0, -pivotY || 0, 0)
    return this
  }
}
