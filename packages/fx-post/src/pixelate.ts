import { ShaderEffect, Device, createShaderEffectSync, Texture } from '@gglib/graphics'
import { getOption } from '@gglib/utils'
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
    return !!this.effect
  }

  public pixelWidth: number = 10
  public pixelHeight: number = 10
  public offset: number = 0
  public inputTexture: Texture
  public outputTexture: Texture

  private effect: ShaderEffect

  constructor(private device: Device, options: PostPixelateOptions) {
    if (options) {
      this.pixelWidth = getOption(options, 'pixelWidth', this.pixelWidth)
      this.pixelHeight = getOption(options, 'pixelHeight', this.pixelHeight)
      this.offset = getOption(options, 'offset', this.offset)
    }
    this.effect = createShaderEffectSync(device, POST_PIXELATE)
  }

  public draw() {
    let rt = this.inputTexture
    let rt2 = this.outputTexture

    let program = this.effect.getTechnique(0).pass(0).program
    program.setUniform('texture', rt)
    program.setUniform('vOffset', this.offset)
    program.setUniform('pixelWidth', this.pixelWidth)
    program.setUniform('pixelHeight', this.pixelHeight)
    program.setUniform('targetWidth', rt.width)
    program.setUniform('targetHeight', rt.height)

    this.device.setRenderTarget(rt2)
    this.device.program = program
    this.device.drawQuad(false)
    this.device.setRenderTarget(null)
  }
}
