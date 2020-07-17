import {
  Entity,
  Inject,
  OnInit,
  OnRemoved,
  OnUpdate,
  Component,
} from '@gglib/ecs'
import { SpriteBatch, Texture } from '@gglib/graphics'
import { BoundingSphere, IRect } from '@gglib/math'
import { SceneItemSprite } from '@gglib/render'
import { getOption } from '@gglib/utils'
import { BoundingVolumeComponent } from './BoundingVolumeComponent'
import { SceneryCollectable, SceneryCollector } from './Scenery'
import { SceneryLinkComponent } from './SceneryLinkComponent'
import { TransformComponent } from './TransformComponent'

/**
 * Defines a sprite
 *
 * @public
 */
export interface SpriteData {
  /**
   * The sprite texture
   */
  texture: Texture
  /**
   * The are of the sprite in the texture
   */
  source?: IRect
  /**
   * The slice distances to form a 9-sliced sprite
   */
  slice?: {
    top: number
    right: number
    bottom: number
    left: number,
  }
}

/**
 * Enumeration of sprite rendering modes
 */
export enum SpriteMode {
  /**
   * The default mode. Sprite is stretched vertically and horizontally.
   */
  Default = 0,
  /**
   * 9-patch sliced mode.
   */
  Sliced = 1,
  /**
   * 9-patch tiled mode.
   */
  Tiled = 2,
}

export interface SpriteComponentOptions {
  sprite?: SpriteData
  mode?: SpriteMode
  color?: number
  flipX?: boolean
  flipY?: boolean
  pivotX?: number
  pivotY?: number
  width?: number
  height?: number
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
  install: [
    SceneryLinkComponent
  ]
})
export class SpriteComponent
  implements SceneryCollectable, OnInit, OnUpdate, OnRemoved {
  /**
   * The name of the component (`Sprite`)
   */
  public readonly name = 'Sprite'

  /**
   * The sprite data
   */
  public sprite?: SpriteData
  /**
   * The rendering mode
   */
  public mode: SpriteMode = SpriteMode.Default
  /**
   * The tint color
   */
  public color: number = 0xffffffff
  /**
   * Whether to flip horizontally
   */
  public flipX: boolean = false
  /**
   * Whether to flip vertically
   */
  public flipY: boolean = false

  /**
   * The pixel size in destination area
   */
  public pixelScaleX = 1
  /**
   * The pixel size in destination area
   */
  public pixelScaleY = 1

  public get pivotX() {
    return this.$pivotX
  }
  public set pivotX(value: number) {
    if (this.$pivotX !== value) {
      this.$pivotX = value
      this.$dimensionsChanged = true
    }
  }

  public get pivotY() {
    return this.$pivotY
  }
  public set pivotY(value: number) {
    if (this.$pivotY !== value) {
      this.$pivotY = value
      this.$dimensionsChanged = true
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
      this.$dimensionsChanged = true
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
      this.$dimensionsChanged = true
    }
  }

  protected $width: number = 1
  protected $height: number = 1
  protected $pivotX: number = 0
  protected $pivotY: number = 0
  protected $dimensionsChanged = true
  protected $sphere = new BoundingSphere()
  protected readonly $drawable: SceneItemSprite = {
    type: 'sprite',
    sortkey: 0,
    material: null,
    transform: null,
    sprite: this,
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

  public constructor(options?: SpriteComponentOptions) {
    if (options) {
      this.sprite = getOption(options, 'sprite', this.sprite)
      this.mode = getOption(options, 'mode', this.mode)
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
    if (this.$dimensionsChanged && this.volume) {
      this.$sphere.center.init(0, 0, 0)
      this.$sphere.radius = Math.max(
        Math.abs(this.width - this.pivotX),
        Math.abs(this.height - this.pivotX),
      )
      this.volume.linkVolume(this.$sphere)
      this.$dimensionsChanged = false
    }
  }

  /**
   * Constributes to the currently rendering scene
   *
   * @param collector - the collector with a scene where to contribute
   */
  public collectScenery(collector: SceneryCollector): void {
    if (!this.sprite) {
      return
    }

    this.$drawable.transform = this.transform ? this.transform.world : null
    collector.addItem(this.$drawable)
  }

  /**
   * Draws the sprite with the given batch
   *
   * @param batch - the sprite batch to draw with
   */
  public draw(batch: SpriteBatch) {
    const sprite = this.sprite
    const source = sprite.source
    const slice = sprite.slice

    if (this.mode === SpriteMode.Default || !slice) {
      this.drawSpriteDefault(batch, this.sprite.texture, source)
    } else if (this.mode === SpriteMode.Sliced) {
      this.drawSpriteSliced(batch, sprite.texture, source, slice)
    } else {
      this.drawSpriteTiled(batch, sprite.texture, source, slice)
    }
  }

  private drawSpriteDefault(
    batch: SpriteBatch,
    texture: Texture,
    frame?: IRect,
  ) {
    const builder = batch.draw(texture)

    if (frame) {
      builder.source(
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        this.flipX,
        this.flipY,
      )
    } else {
      builder.source(
        0,
        0,
        texture.width,
        texture.height,
        this.flipX,
        this.flipY,
      )
    }

    builder.tint(this.color)
    builder.destination(
      -this.pivotX,
      this.height - this.pivotY,
      this.width,
      -this.height,
    )

    if (this.transform) {
      builder.transformMat4(this.transform.world)
    }
  }

  private drawSpriteSliced(
    batch: SpriteBatch,
    texture: Texture,
    frame: IRect,
    slice: {
      top: number
      right: number
      bottom: number
      left: number,
    },
  ) {
    let fw = frame ? frame.width : texture.width
    let fh = frame ? frame.height : texture.height
    let ux = /*(this.width / fw) */ this.pixelScaleX
    let uy = /*(this.height / fh) */ this.pixelScaleY

    let sw0 = slice ? slice.left : 0
    let sw2 = slice ? slice.right : 0
    let sw1 = fw - sw0 - sw2

    let sx0 = frame ? frame.x : 0
    let sx1 = sx0 + sw0
    let sx2 = sx1 + sw1

    let sh0 = slice ? slice.top : 0
    let sh2 = slice ? slice.bottom : 0
    let sh1 = fh - sh0 - sh2

    let sy0 = frame ? frame.y : 0
    let sy1 = sy0 + sh0
    let sy2 = sy1 + sh1

    let dw0 = sw0 * ux
    let dw2 = sw2 * ux
    let dw1 = this.width - dw0 - dw2

    let dx0 = -this.pivotX
    let dx1 = dx0 + dw0
    let dx2 = dx1 + dw1

    let dh0 = sh0 * uy
    let dh2 = sh2 * uy
    let dh1 = this.height - dh0 - dh2

    let dy0 = -this.pivotY
    let dy1 = dy0 + dh0
    let dy2 = dy1 + dh1

    this.drawTile(batch, texture, sx0, sy0, sw0, sh0, dx0, dy0, dw0, dh0)
    this.drawTile(batch, texture, sx1, sy0, sw1, sh0, dx1, dy0, dw1, dh0)
    this.drawTile(batch, texture, sx2, sy0, sw2, sh0, dx2, dy0, dw2, dh0)

    this.drawTile(batch, texture, sx0, sy1, sw0, sh1, dx0, dy1, dw0, dh1)
    this.drawTile(batch, texture, sx1, sy1, sw1, sh1, dx1, dy1, dw1, dh1)
    this.drawTile(batch, texture, sx2, sy1, sw2, sh1, dx2, dy1, dw2, dh1)

    this.drawTile(batch, texture, sx0, sy2, sw0, sh2, dx0, dy2, dw0, dh2)
    this.drawTile(batch, texture, sx1, sy2, sw1, sh2, dx1, dy2, dw1, dh2)
    this.drawTile(batch, texture, sx2, sy2, sw2, sh2, dx2, dy2, dw2, dh2)
  }

  private drawSpriteTiled(
    batch: SpriteBatch,
    texture: Texture,
    frame: IRect,
    slice: {
      top: number
      right: number
      bottom: number
      left: number,
    },
  ) {
    let ux = this.width / frame.width
    let uy = this.height / frame.height

    let sw0 = slice.left
    let sw1 = frame.width - slice.left - slice.right
    let sw2 = slice.right

    let sx0 = frame.x
    let sx1 = sx0 + sw0
    let sx2 = sx1 + sw1

    let sh0 = slice.top
    let sh1 = frame.height - slice.top - slice.bottom
    let sh2 = slice.bottom

    let sy0 = frame.y
    let sy1 = sy0 + sh0
    let sy2 = sy1 + sh1

    let dw0 = sw0 * ux
    let dw1 = sw1 * ux
    let dw2 = sw2 * ux

    let dx0 = -this.pivotX
    let dx1 = dx0 + dw0
    let dx2 = dx1 + dw1

    let dh0 = sh0 * uy
    let dh1 = sh1 * uy
    let dh2 = sh2 * uy

    let dy0 = -this.pivotY
    let dy1 = dy0 + dh0
    let dy2 = dy1 + dh1

    this.drawTile(batch, texture, sx0, sy0, sw0, sh0, dx0, dy0, dw0, dh0)
    this.drawTile(batch, texture, sx1, sy0, sw1, sh0, dx1, dy0, dw1, dh0)
    this.drawTile(batch, texture, sx2, sy0, sw2, sh0, dx2, dy0, dw2, dh0)

    this.drawTile(batch, texture, sx0, sy1, sw0, sh1, dx0, dy1, dw0, dh1)
    this.drawTile(batch, texture, sx1, sy1, sw1, sh1, dx1, dy1, dw1, dh1)
    this.drawTile(batch, texture, sx2, sy1, sw2, sh1, dx2, dy1, dw2, dh1)

    this.drawTile(batch, texture, sx0, sy2, sw0, sh2, dx0, dy2, dw0, dh2)
    this.drawTile(batch, texture, sx1, sy2, sw1, sh2, dx1, dy2, dw1, dh2)
    this.drawTile(batch, texture, sx2, sy2, sw2, sh2, dx2, dy2, dw2, dh2)
  }

  private drawTile(
    batch: SpriteBatch,
    texture: Texture,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) {
    const builder = batch
      .draw(texture)
      .source(sx, sy, sw, sh, this.flipX, this.flipY)
      .tint(this.color)
      .destination(dx, this.height - dy, dw, -dh)

    if (this.transform) {
      builder.transformMat4(this.transform.world)
    }
  }
}
