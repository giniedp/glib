import { createEffectOptionsSync, Device, Material, Texture } from '@gglib/graphics'
import { IVec2, Vec2 } from '@gglib/math'
import { POST_PIXELATE } from './pixelate.program'

/**
 * Constructor options for {@link PostPixelateEffect}
 *
 * @public
 */
export interface PostPixelateOptions {
  pixelWidth?: number
  pixelHeight?: number
  offset?: number
}

/**
 * @public
 */
export class PostPixelateEffect {
  /**
   * Determines whether the post effect is ready to render
   */
  public get isReady() {
    return !!this.material
  }

  public pixelWidth: number = 10
  public pixelHeight: number = 10
  public inputTexture: Texture
  public outputTexture: Texture

  private material: Material<{
    texel: IVec2
    texture: Texture
  }>

  constructor(private device: Device, options?: PostPixelateOptions) {
    if (options) {
      this.pixelWidth = options.pixelWidth ?? this.pixelWidth
      this.pixelHeight = options.pixelHeight ?? this.pixelHeight
    }
    this.material = new Material(device, {
      effect: createEffectOptionsSync(POST_PIXELATE),
      parameters: {
        texel: Vec2.create(1 / this.pixelWidth, 1 / this.pixelHeight),
        texture: null,
      },
    })
  }

  public draw() {
    let rt = this.inputTexture
    let rt2 = this.outputTexture
    let texel = this.material.parameters.texel || Vec2.init({}, 1, 1)
    if (rt2) {
      texel.x = this.pixelWidth / rt2.width
      texel.y = this.pixelHeight / rt2.height
    } else {
      texel.x = this.pixelWidth / this.device.drawingBufferWidth
      texel.y = this.pixelHeight / this.device.drawingBufferHeight
    }
    this.device.setRenderTarget(rt2)
    this.material.parameters.texture = rt
    this.material.parameters.texel = texel
    this.material.drawQuad()
    this.device.setRenderTarget(null)
  }
}
