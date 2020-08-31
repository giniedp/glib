import { Inject, OnInit, OnRemoved, OnUpdate, Component } from '@gglib/ecs'
import { SpriteBatch, Texture } from '@gglib/graphics'
import { BoundingSphere, IRect } from '@gglib/math'
import { SceneItemSprite } from '@gglib/render'
import { getOption } from '@gglib/utils'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneryCollectable, SceneryCollector } from './Scenery'
import { SceneryLinkComponent } from './SceneryLinkComponent'
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
 * Structure that defines a sprite with its sprite sheet texture
 *
 * @public
 */
export interface SpriteSourceOptions {
  /**
   * The sprite or sprite sheet texture
   */
  texture: Texture
  /**
   * The source rectangle into the {@link texture}
   */
  source?: IRect
  /**
   * The 9-patch slice offsets
   */
  slice?: SpriteSlice
}

/**
 * Constructor and setup options for the {@link SpriteComponent}
 */
export interface SpriteComponentOptions {
  /**
   * The sprite or sprite sheet texture
   */
  texture?: Texture
  /**
   * The source rectangle into the {@link texture}
   */
  source?: IRect
  /**
   * The 9-patch slice offsets
   */
  slice?: SpriteSlice
  /**
   * The tint color
   */
  color?: number
  /**
   * Whether to flip the sprite horizontally
   */
  flipX?: boolean
  /**
   * Whether to flip the sprite vertically
   */
  flipY?: boolean
  /**
   * Normalized pivot coordinate
   */
  pivotX?: number
  /**
   * Normalized pivot coordinate
   */
  pivotY?: number
  /**
   * The sprite width in units
   */
  width?: number
  /**
   * The sprite height in units
   */
  height?: number
  /**
   * Number of viewport pixels per world space unit
   */
  unitPixels?: number
}

/**
 * A component that knows how to render sprites
 *
 * @public
 * @remarks
 * __Optional Services__
 * - `TransformComponent` in order to update the position of the sprite
 * - `BoundingVolumeComponent` in order to provide a spatial bounding for this entity
 *
 * __Required Services__
 * - `SceneryLinkComponent` in order to contribute to the scene rendering
 */
@Component({
  install: [SceneryLinkComponent],
})
export class SpriteComponent implements SceneryCollectable, OnInit, OnUpdate, OnRemoved {
  /**
   * The name of the component (`Sprite`)
   */
  public readonly name = 'Sprite'

  /**
   * The sprite texture
   */
  public get texture() {
    return this.$texture
  }
  public set texture(v: Texture) {
    if (v !== this.$texture) {
      this.$texture = v
      this.$doSpriteUpdate = true
    }
  }

  /**
   * The source rectangle into the {@link texture}
   */
  public get source() {
    return this.$source
  }
  public set source(v: IRect) {
    this.$source = v
    this.$doSpriteUpdate = true
  }

  /**
   * The 9-patch slice offsets
   */
  public get slice() {
    return this.$slice
  }
  public set slice(v: SpriteSlice) {
    this.$slice = v
    this.$doSpriteUpdate = true
  }

  /**
   * The tint color
   */
  public color: number = 0xffffffff

  /**
   * Whether to flip horizontally
   */
  public get flipX(): boolean {
    return this.$flipX
  }
  public set flipX(v: boolean) {
    if (this.$flipX !== v) {
      this.$flipX = v
      this.$doSpriteUpdate = true
    }
  }

  /**
   * Whether to flip vertically
   */
  public get flipY(): boolean {
    return this.$flipY
  }
  public set flipY(v: boolean) {
    if (this.$flipY !== v) {
      this.$flipY = v
      this.$doSpriteUpdate = true
    }
  }

  /**
   * Number of viewport pixels per world space unit
   *
   * @remarks
   * This is only used when {@link enableSlicing} is `true` to calculate
   * proper size for the tiles and sides that should not be stretched.
   */
  public get unitPixels(): number {
    return this.$unitPixels
  }
  public set unitPixels(v: number) {
    if (this.$unitPixels !== v) {
      this.$unitPixels = v
      this.$doSpriteUpdate = true
    }
  }

  /**
   * Enables 9-patch rendering mode if slice data is available
   *
   * @remarks
   * To make this work a proper Value for {@link unitPixels} is mandatory
   */
  public get enableSlicing(): boolean {
    return this.$enableSlicing
  }
  public set enableSlicing(v: boolean) {
    if (this.$enableSlicing !== v) {
      this.$enableSlicing = v
      this.$doSpriteUpdate
    }
  }

  /**
   * Enables sprite tiling
   */
  public get enableTiling(): boolean {
    return this.$enableTiling
  }
  public set enableTiling(v: boolean) {
    if (this.$enableTiling !== v) {
      this.$enableTiling = v
      this.$doSpriteUpdate = true
    }
  }

  /**
   *
   */
  public get pivotX() {
    return this.$pivotX
  }
  public set pivotX(value: number) {
    if (this.$pivotX !== value) {
      this.$pivotX = value
      this.$doBoundsUpdate = true
      this.$doSpriteUpdate = true
    }
  }

  public get pivotY() {
    return this.$pivotY
  }
  public set pivotY(value: number) {
    if (this.$pivotY !== value) {
      this.$pivotY = value
      this.$doBoundsUpdate = true
      this.$doSpriteUpdate = true
    }
  }

  /**
   * The rendering width of the sprite
   */
  public get width() {
    return this.$width
  }
  public set width(value: number) {
    if (this.$width !== value) {
      this.$width = value
      this.$doBoundsUpdate = true
      this.$doSpriteUpdate = true
    }
  }

  /**
   * The rendering height of the sprite
   */
  public get height() {
    return this.$height
  }
  public set height(value: number) {
    if (this.$height !== value) {
      this.$height = value
      this.$doBoundsUpdate = true
    }
  }

  /**
   * The transform component of the entity
   */
  @Inject(TransformComponent, { optional: true })
  public readonly transform: TransformComponent

  /**
   * The bounding volume component of the entity
   */
  @Inject(BoundingVolumeComponent, { optional: true })
  public readonly volume: BoundingVolumeComponent

  /**
   * The scenery link component
   */
  @Inject(SceneryLinkComponent)
  public readonly link: SceneryLinkComponent

  protected $texture: Texture
  protected $source: IRect
  protected $slice: SpriteSlice
  protected $flipX: boolean
  protected $flipY: boolean
  protected $unitPixels: number = 1
  protected $width: number = 1
  protected $height: number = 1
  protected $pivotX: number = 0
  protected $pivotY: number = 0
  protected $enableSlicing = false
  protected $enableTiling = false
  protected $doSpriteUpdate = true
  protected $doBoundsUpdate = true
  protected $sphere = new BoundingSphere()

  protected readonly $drawable: SceneItemSprite = {
    type: 'sprite',
    sortkey: 0,
    material: null,
    transform: null,
    sprite: this,
  }

  private sprites = new SpriteSpecPool()

  public constructor(options?: SpriteComponentOptions) {
    if (options) {
      this.texture = getOption(options, 'texture', this.texture)
      this.source = getOption(options, 'source', this.source)
      this.slice = getOption(options, 'slice', this.slice)
      this.color = getOption(options, 'color', this.color)
      this.width = getOption(options, 'width', this.width)
      this.height = getOption(options, 'height', this.height)
      this.pivotX = getOption(options, 'pivotX', this.pivotX)
      this.pivotY = getOption(options, 'pivotY', this.pivotY)
      this.flipX = getOption(options, 'flipX', this.flipX)
      this.flipY = getOption(options, 'flipY', this.flipY)
    }
  }

  /**
   * Sets the sprite source data
   *
   * @param options - sprite source options
   */
  public setSource(options: SpriteSourceOptions | null) {
    this.texture = getOption(options, 'texture', null)
    this.source = getOption(options, 'source', null)
    this.slice = getOption(options, 'slice', null)
  }

  /**
   * Component life cycle method
   */
  public onInit() {
    this.link.register(this)
  }

  /**
   * Component life cycle method
   */
  public onRemoved() {
    this.link.unregister(this)
  }

  /**
   * Component life cycle method
   */
  public onUpdate() {
    if (this.$doBoundsUpdate) {
      this.updateBounds()
      this.$doBoundsUpdate = false
    }
    if (this.$doSpriteUpdate) {
      this.updateSprites()
      this.$doBoundsUpdate = false
    }
  }

  /**
   * Constributes to the currently rendering scene
   *
   * @param collector - the collector with a scene where to contribute
   */
  public collectScenery(collector: SceneryCollector): void {
    if (this.texture) {
      this.$drawable.sprite = this
      this.$drawable.transform = this.transform?.world
      collector.addItem(this.$drawable)
    }
  }

  /**
   * Draws the sprite with the given batch
   *
   * @param batch - the sprite batch to draw with
   */
  public draw(batch: SpriteBatch) {
    if (!this.texture) {
      return
    }
    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites.get(i)
      const src = sprite.src
      const dst = sprite.dst
      const builder = batch
        .draw(this.texture)
        .source(src.x, src.y, src.width, src.height, this.flipX, this.flipY)
        .tint(this.color)
        .destination(dst.x, this.height - dst.y, dst.width, -dst.height)
      if (this.transform) {
        builder.transformMat4(this.transform.world)
      }
    }
  }

  private updateBounds() {
    this.$sphere.center.init(0, 0, 0)
    this.$sphere.radius = Math.max(
      Math.abs(this.width - this.pivotX * this.width),
      Math.abs(this.height - this.pivotX * this.height),
    )
    this.volume?.linkVolume(this.$sphere)
  }

  private updateSprites() {
    this.sprites.length = 0
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
        this.pivotY * this.height,
        this.width,
        this.height,
        this.enableTiling,
        this.enableTiling,
      )
    }
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

    const sw = (source ? source.width : texture.width) || 0
    const sw0 = slice.left || 0
    const sw2 = slice.right || 0
    const sw1 = sw - sw0 - sw2

    const sh = (source ? source.height : texture.height) || 0
    const sh0 = slice.top || 0
    const sh2 = slice.bottom || 0
    const sh1 = sh - sh0 - sh2

    const sx0 = (source ? source.x : 0) || 0
    const sx1 = sx0 + sw0
    const sx2 = sx1 + sw1

    const sy0 = (source ? source.y : 0) || 0
    const sy1 = sy0 + sh0
    const sy2 = sy1 + sh1

    const dw0 = sw0 / this.unitPixels
    const dw2 = sw2 / this.unitPixels
    const dw1 = this.width - dw0 - dw2

    let dx0 = -this.pivotX * this.width
    let dx1 = dx0 + dw0
    let dx2 = dx1 + dw1

    const dh0 = sh0 / this.unitPixels
    const dh2 = sh2 / this.unitPixels
    const dh1 = this.height - dh0 - dh2

    let dy0 = this.height - this.pivotY * this.height
    let dy1 = dy0 + dh0
    let dy2 = dy1 + dh1

    if (this.flipX) {
      ;[dx0, dx2] = [dx2, dx0]
    }
    if (this.flipY) {
      ;[dy0, dy2] = [dy2, dy0]
    }

    this.collectTiles(sx0, sy0, sw0, sh0, dx0, dy0, dw0, dh0, false, false)
    this.collectTiles(sx1, sy0, sw1, sh0, dx1, dy0, dw1, dh0, this.enableTiling, false)
    this.collectTiles(sx2, sy0, sw2, sh0, dx2, dy0, dw2, dh0, false, false)

    this.collectTiles(sx0, sy1, sw0, sh1, dx0, dy1, dw0, dh1, false, this.enableTiling)
    this.collectTiles(sx1, sy1, sw1, sh1, dx1, dy1, dw1, dh1, this.enableTiling, this.enableTiling)
    this.collectTiles(sx2, sy1, sw2, sh1, dx2, dy1, dw2, dh1, false, this.enableTiling)

    this.collectTiles(sx0, sy2, sw0, sh2, dx0, dy2, dw0, dh2, false, false)
    this.collectTiles(sx1, sy2, sw1, sh2, dx1, dy2, dw1, dh2, this.enableTiling, false)
    this.collectTiles(sx2, sy2, sw2, sh2, dx2, dy2, dw2, dh2, false, false)
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
    tilingX: boolean,
    tilingY: boolean,
  ) {
    if (!dw || !dh) {
      return
    }
    if (!tilingX && !tilingY) {
      const sprite = this.sprites.next()
      sprite.src.x = sx
      sprite.src.y = sy
      sprite.src.width = sw
      sprite.src.height = sh
      sprite.dst.x = dx
      sprite.dst.y = dy
      sprite.dst.width = dw
      sprite.dst.height = dh
      return
    }

    const tilesX = tilingX ? Math.ceil(dw / (sw / this.unitPixels)) : 1
    const tilesY = tilingY ? Math.ceil(dh / (sh / this.unitPixels)) : 1
    const tileSizeX = dw / tilesX
    const tileSizeY = dh / tilesY
    for (let iy = 0; iy < tilesY; iy++) {
      for (let ix = 0; ix < tilesX; ix++) {
        const sprite = this.sprites.next()
        sprite.src.x = sx
        sprite.src.y = sy
        sprite.src.width = sw
        sprite.src.height = sh
        sprite.dst.x = dx + ix * tileSizeX
        sprite.dst.y = dy + iy * tileSizeY
        sprite.dst.width = tileSizeX
        sprite.dst.height = tileSizeY
      }
    }
  }
}

interface SpriteSpec {
  src: IRect
  dst: IRect
}

class SpriteSpecPool {
  public length: number = 0
  private list: SpriteSpec[] = []

  /**
   * Gets an item at given index (generated if needed)
   */
  public get(i: number) {
    if (!this.list[i]) {
      this.list[i] = {
        src: { x: 0, y: 0, width: 0, height: 0 },
        dst: { x: 0, y: 0, width: 0, height: 0 }
      }
    }
    return this.list[i]
  }
  /**
   * Gets the next available item in pool (generated if needed)
   */
  public next() {
    const result = this.get(this.length)
    this.length++
    return result
  }
}
