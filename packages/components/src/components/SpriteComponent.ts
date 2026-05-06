import { GameEntity, InitializableComponent, type GameComponent } from '@gglib/ecs'
import { Sprite, Texture } from '@gglib/graphics'
import { IVec4, type IRect } from '@gglib/math'
import { PooledList } from '@gglib/utils'
import { TransformComponent } from './TransformComponent'

/**
 * Slice offsets describing a 9-patch sprite
 *
 * @public
 */
export interface SpriteSlice {
  /**
   * Slice offset in pixel from top edge
   */
  top: number
  /**
   * Slice offset in pixel from right edge
   */
  right: number
  /**
   * Slice offset in pixel from bottom edge
   */
  bottom: number
  /**
   * Slice offset in pixel from left edge
   */
  left: number
}

/**
 *
 */
export class SpriteComponent implements GameComponent, InitializableComponent {
  /**
   * The transform component of the entity
   */
  public transform: TransformComponent

  protected version: number = 0
  protected current: number = 0
  protected texture: Texture
  protected source: IRect
  protected color: IVec4 = { x: 1, y: 1, z: 1, w: 1 }
  protected slice: SpriteSlice
  protected flipX: boolean
  protected flipY: boolean
  protected width: number = 1
  protected height: number = 1
  protected pivotX: number = 0
  protected pivotY: number = 0
  protected offsetX: number = 0.5
  protected offsetY: number = 0.5
  protected enableSlicing = false
  protected enableTiling = false
  protected tilesX: number = 1
  protected tilesY: number = 1
  protected angle: number = 0

  private sprites: Sprite[] = []
  private pool = new PooledList<Sprite>(() => {
    return {
      texture: null,
      source: { x: 0, y: 0, width: 0, height: 0 },
      destination: { x: 0, y: 0, width: 0, height: 0 },
      transform: this.transform?.world,
    }
  })

  public get data(): ReadonlyArray<Sprite> {
    if (this.version !== this.current) {
      this.updateSprites()
      this.current = this.version
    }
    return this.sprites
  }

  public setTexture(texture: Texture) {
    if (this.texture !== texture) {
      this.texture = texture
      this.version++
    }
  }

  public setColor(color: IVec4) {
    if (this.color.x !== color.x || this.color.y !== color.y || this.color.z !== color.z || this.color.w !== color.w) {
      this.color.x = color.x
      this.color.y = color.y
      this.color.z = color.z
      this.color.w = color.w
      this.version++
    }
  }

  public setSource(x: number, y: number, width: number, height: number) {
    if (!this.source) {
      this.source = { x, y, width, height }
      this.version++
    } else if (
      this.source.x !== x ||
      this.source.y !== y ||
      this.source.width !== width ||
      this.source.height !== height
    ) {
      this.source.x = x
      this.source.y = y
      this.source.width = width
      this.source.height = height
      this.version++
    }
  }

  public setTiling(enabled: boolean) {
    if (this.enableTiling !== enabled) {
      this.enableTiling = enabled
      this.version++
    }
  }

  public setTiles(tilesX: number, tilesY: number) {
    if (this.tilesX !== tilesX || this.tilesY !== tilesY) {
      this.tilesX = tilesX
      this.tilesY = tilesY
      this.version++
    }
  }

  public setSlicing(enabled: boolean) {
    if (this.enableSlicing !== enabled) {
      this.enableSlicing = enabled
      this.version++
    }
  }

  public setSlice(top: number, right: number, bottom: number, left: number) {
    this.setSlicing(true)
    if (!this.slice) {
      this.slice = { top, right, bottom, left }
      this.version++
    } else if (
      this.slice.top !== top ||
      this.slice.right !== right ||
      this.slice.bottom !== bottom ||
      this.slice.left !== left
    ) {
      this.slice.top = top
      this.slice.right = right
      this.slice.bottom = bottom
      this.slice.left = left
      this.version++
    }
  }

  public setFlip(flipX: boolean, flipY: boolean) {
    if (this.flipX !== flipX || this.flipY !== flipY) {
      this.flipX = flipX
      this.flipY = flipY
      this.version++
    }
  }

  public setPivot(pivotX: number, pivotY: number) {
    if (this.pivotX !== pivotX || this.pivotY !== pivotY) {
      this.pivotX = pivotX
      this.pivotY = pivotY
      this.version++
    }
  }

  public setSize(width: number, height: number) {
    if (this.width !== width || this.height !== height) {
      this.width = width
      this.height = height
      this.version++
    }
  }

  public setAngle(angle: number) {
    if (this.angle !== angle) {
      this.angle = angle
      this.version++
    }
  }

  public readonly entity: GameEntity

  public initialize(): void {
    this.transform = this.entity.component(TransformComponent)
  }

  private updateSprites() {
    this.sprites.length = 0
    this.pool.clear()
    if (!this.texture) {
      return
    }
    if (this.enableSlicing && this.slice) {
      this.collectSlices()
    } else {
      this.collectTiles(
        (this.source ? this.source.x : 0) || 0,
        (this.source ? this.source.y : 0) || 0,
        (this.source ? this.source.width : this.texture.width) || 0,
        (this.source ? this.source.height : this.texture.height) || 0,
        -this.pivotX * this.width,
        this.pivotY * this.height - this.height,
        this.width,
        this.height,
        this.tilesX,
        this.tilesY,
      )
    }
    this.pool.toArray(this.sprites)
  }

  private collectSlices() {
    //       sx0    sx1    sx2
    //        :      :      :
    //        :      :      :
    //  sy0... ------ ------ ------
    //        |      |      |      | sh0
    //        |      |      |      |
    //  sy1... ------+------+------
    //        |      |      |      | sh1
    //        |      |      |      |
    //  sy2... ------+------+------
    //        |      |      |      | sh2
    //        |      |      |      |
    //         ------ ------ ------
    //           sw0    sw1   sw2

    const slice = this.slice
    const source = this.source
    const texture = this.texture

    const sw = source?.width ?? texture.width
    const sw0 = slice.left || 0
    const sw2 = slice.right || 0
    const sw1 = sw - sw0 - sw2

    const sh = source?.height ?? texture.height
    const sh0 = slice.top || 0
    const sh2 = slice.bottom || 0
    const sh1 = sh - sh0 - sh2

    const sx0 = source?.x ?? 0
    const sx1 = sx0 + sw0
    const sx2 = sx1 + sw1

    const sy0 = source?.y ?? 0
    const sy1 = sy0 + sh0
    const sy2 = sy1 + sh1

    const dw0 = sw0 / sw
    const dw2 = sw2 / sw
    const dw1 = this.width - dw0 - dw2

    let dx0 = -this.pivotX * this.width
    let dx1 = dx0 + dw0
    let dx2 = dx1 + dw1

    const dh0 = sh0 / sh
    const dh2 = sh2 / sh
    const dh1 = this.height - dh0 - dh2

    let dy0 = -this.pivotY * this.height
    let dy1 = dy0 + dh0
    let dy2 = dy1 + dh1

    if (this.flipX) {
      ;[dx0, dx2] = [dx2, dx0]
    }
    if (this.flipY) {
      ;[dy0, dy2] = [dy2, dy0]
    }

    this.collectTiles(sx0, sy0, sw0, sh0, dx0, dy0, dw0, dh0, 1, 1)
    this.collectTiles(sx1, sy0, sw1, sh0, dx1, dy0, dw1, dh0, this.tilesX, 1)
    this.collectTiles(sx2, sy0, sw2, sh0, dx2, dy0, dw2, dh0, 1, 1)

    this.collectTiles(sx0, sy1, sw0, sh1, dx0, dy1, dw0, dh1, 1, this.tilesY)
    this.collectTiles(sx1, sy1, sw1, sh1, dx1, dy1, dw1, dh1, this.tilesX, this.tilesY)
    this.collectTiles(sx2, sy1, sw2, sh1, dx2, dy1, dw2, dh1, 1, this.tilesY)

    this.collectTiles(sx0, sy2, sw0, sh2, dx0, dy2, dw0, dh2, 1, 1)
    this.collectTiles(sx1, sy2, sw1, sh2, dx1, dy2, dw1, dh2, this.tilesX, 1)
    this.collectTiles(sx2, sy2, sw2, sh2, dx2, dy2, dw2, dh2, 1, 1)
  }

  private collectTiles(
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    tilesX: number,
    tilesY: number,
  ) {
    if (!dw || !dh) {
      return
    }
    if (tilesX === 1 && tilesY === 1) {
      const sprite = this.pool.next()
      sprite.texture = this.texture
      sprite.color = this.color
      sprite.source.x = sx
      sprite.source.y = sy
      sprite.source.width = sw
      sprite.source.height = sh
      sprite.destination.x = dx
      sprite.destination.y = dy
      sprite.destination.width = dw
      sprite.destination.height = dh
      sprite.pivotX = this.pivotX
      sprite.pivotY = this.pivotY
      sprite.angle = this.angle
      return
    }

    const tileSizeX = dw / tilesX
    const tileSizeY = dh / tilesY
    for (let iy = 0; iy < tilesY; iy++) {
      for (let ix = 0; ix < tilesX; ix++) {
        const sprite = this.pool.next()
        sprite.texture = this.texture
        sprite.color = this.color
        sprite.source.x = sx
        sprite.source.y = sy
        sprite.source.width = sw
        sprite.source.height = sh
        sprite.destination.x = dx + ix * tileSizeX
        sprite.destination.y = dy + iy * tileSizeY
        sprite.destination.width = tileSizeX
        sprite.destination.height = tileSizeY
        sprite.pivotX = this.pivotX
        sprite.pivotY = this.pivotY
        sprite.angle = this.angle
      }
    }
  }
}
