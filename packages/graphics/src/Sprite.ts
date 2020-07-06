import { IVec2, IVec3, Mat3, Mat4, Quat, Vec2, Vec3 } from '@gglib/math'
import { Color } from './Color'
import { Texture } from './resources/Texture'

/**
 * @public
 */
export class Sprite {
  public texture: Texture
  public color: number = 0
  public readonly uv1: IVec2 = Vec2.init({}, 0, 0)
  public readonly uv2: IVec2 = Vec2.init({}, 0, 1)
  public readonly vertex1: IVec3 = Vec3.init({}, 0, 1, 0)
  public readonly vertex2: IVec3 = Vec3.init({}, 1, 1, 0)
  public readonly vertex3: IVec3 = Vec3.init({}, 0, 0, 0)
  public readonly vertex4: IVec3 = Vec3.init({}, 1, 0, 0)

  public reset(texture: Texture): this {
    this.texture = texture
    this.color = 0xffffffff
    Vec2.init(this.uv1, 0, 0)
    Vec2.init(this.uv2, 1, 1)
    Vec3.init(this.vertex1, -0.5, 0.5, 0)
    Vec3.init(this.vertex2, 0.5, 0.5, 0)
    Vec3.init(this.vertex3, -0.5, -0.5, 0)
    Vec3.init(this.vertex4, 0.5, -0.5, 0)
    return this
  }

  /**
   * Set the sprite tint color
   *
   * @remarks
   * This will override any previously set alpha value
   */
  public tint(color: number | Color): this {
    if (color instanceof Color) {
      this.color = color.abgr
    } else {
      this.color = color
    }
    return this
  }

  /**
   * Sets the alpha value
   *
   * @remarks
   * If the sprite should receive a tint color, the `color()` must be called first.
   */
  public alpha(alpha: number): this {
    this.color = ((this.color || 0) & 0x00FFFFFF) | (((alpha * 255) & 0xFF) << 24) // tslint:disable-line
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
    const texelX = tex.texelX
    const texelY = tex.texelY
    if (flipX) {
      this.uv2.x = x * texelX
      this.uv1.x = (x + width) * texelX
    } else {
      this.uv1.x = x * texelX
      this.uv2.x = (x + width) * texelX
    }
    if (flipY) {
      this.uv2.y = y * texelY
      this.uv1.y = (y + height) * texelY
    } else {
      this.uv1.y = y * texelY
      this.uv2.y = (y + height) * texelY
    }
    return this
  }

  /**
   * Flips x texture coordinates
   */
  public flipX() {
    [this.uv1.x, this.uv2.x] = [this.uv2.x, this.uv1.x]
    return this
  }

  /**
   * Flips y texture coordinates
   */
  public flipY() {
    [this.uv1.y, this.uv2.y] = [this.uv2.y, this.uv1.y]
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
      width = (this.uv2.x - this.uv1.x) / this.texture.texelX
    }
    if (height == null) {
      height = (this.uv2.y - this.uv1.y) / this.texture.texelY
    }
    if (depth == null) {
      depth = 0
    }
    if (angle) {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const dx = pivotX || 0
      const dy = pivotY || 0

      let cX = x + dx
      let cY = y + dy
      let p1X = x - cX
      let p1Y = y - cY
      let p2X = (x + width) - cX
      let p2Y = (y + height) - cY

      Vec3.init(
        this.vertex1,
        cX + p1X * cos - p1Y * sin,
        cY + p1X * sin + p1Y * cos,
        depth,
      )

      Vec3.init(
        this.vertex2,
        cX + p2X * cos - p1Y * sin,
        cY + p2X * sin + p1Y * cos,
        depth,
      )

      Vec3.init(
        this.vertex3,
        cX + p1X * cos - p2Y * sin,
        cY + p1X * sin + p2Y * cos,
        depth,
      )

      Vec3.init(
        this.vertex4,
        cX + p2X * cos - p2Y * sin,
        cY + p2X * sin + p2Y * cos,
        depth,
      )
    } else {
      Vec3.init(this.vertex1, x, y, depth)
      Vec3.init(this.vertex2, x + width, y, depth)
      Vec3.init(this.vertex3, x, y + height, depth)
      Vec3.init(this.vertex4, x + width, y + height, depth)
    }
    return this
  }

  public transformMat4(m: Mat4): this {
    m.transformV3(this.vertex1)
    m.transformV3(this.vertex2)
    m.transformV3(this.vertex3)
    m.transformV3(this.vertex4)
    return this
  }

  public transformMat3(m: Mat3): this {
    m.transform(this.vertex1)
    m.transform(this.vertex2)
    m.transform(this.vertex3)
    m.transform(this.vertex4)
    return this
  }

  public transformQuat(q: Quat): this {
    q.transform(this.vertex1)
    q.transform(this.vertex2)
    q.transform(this.vertex3)
    q.transform(this.vertex4)
    return this
  }
}
