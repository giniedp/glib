import { ShaderEffect, Device, createShaderEffectSync, Texture, ShaderEffectParameters, ShaderUniformValue } from '@gglib/graphics'
import { getOption } from '@gglib/utils'
import { POST_PIXELATE } from './pixelate.program'
import { IVec2, Vec2 } from '@gglib/math'

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
    return !!this.effect
  }

  public pixelWidth: number = 10
  public pixelHeight: number = 10
  public inputTexture: Texture
  public outputTexture: Texture

  private effect: ShaderEffect<{
    texel: IVec2,
    texture: Texture
  }>

  constructor(private device: Device, options?: PostPixelateOptions) {
    if (options) {
      this.pixelWidth = getOption(options, 'pixelWidth', this.pixelWidth)
      this.pixelHeight = getOption(options, 'pixelHeight', this.pixelHeight)
    }
    this.effect = createShaderEffectSync(device, POST_PIXELATE) as any // TODO
  }

  public draw() {
    let rt = this.inputTexture
    let rt2 = this.outputTexture
    let texel = this.effect.parameters.texel || Vec2.init({}, 1, 1)
    if (rt2) {
      texel.x = this.pixelWidth / rt2.width
      texel.y = this.pixelHeight / rt2.height
    } else {
      texel.x = this.pixelWidth / this.device.drawingBufferWidth
      texel.y = this.pixelHeight / this.device.drawingBufferHeight
    }
    this.device.setRenderTarget(rt2)
    this.effect.parameters.texture = rt
    this.effect.parameters.texel = texel
    this.effect.drawQuad()
    this.device.setRenderTarget(null)
  }
}
