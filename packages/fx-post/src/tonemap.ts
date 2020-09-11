import {
  BlendState,
  CullState,
  DepthState,
  Device,
  ShaderEffect,
  StencilState,
  Texture,
  TextureFilter,
  TextureWrapMode,
  DepthFormat,
  createShaderEffectSync,
} from '@gglib/graphics'
import { getOption } from '@gglib/utils'

import { POST_TONEMAP } from './tonemap.program'

/**
 * Constructor options for {@link PostTonemap}
 *
 * @public
 */
export interface PostTonemapOptions {
  adaptSpeed?: number
  exposure?: number
  blackPoint?: number
  whitePoint?: number
}

/**
 * @public
 */
export class PostTonemapEffect {
  /**
   * Determines whether the post effect is ready to render
   */
  public get isReady() {
    return !!this.effect
  }
  /**
   *
   */
  public adaptSpeed: number = 0.2
  /**
   *
   */
  public exposure: number = 0.3
  /**
   *
   */
  public blackPoint: number = 0.0
  /**
   *
   */
  public whitePoint: number = 0.8
  /**
   * Input texture
   */
  public inputTexture: Texture
  /**
   * Output texture
   *
   * @remarks
   * Must be a render target
   */
  public outputTexture: Texture
  /**
   * Downsample textures
   *
   * @remarks
   * All entries must be render targets sorted by the total
   * pixel size (width x height), where first entry having
   * the largest size and last entry having a size of 2x2 pixels
   */
  public readonly downsampleTextures: Texture[] = []
  public lum1: Texture
  public lum2: Texture
  public readonly effect: ShaderEffect
  private clear: boolean = true
  private device: Device

  constructor(device: Device, options?: PostTonemapOptions) {
    this.device = device
    this.effect = createShaderEffectSync(this.device, POST_TONEMAP)
    if (options) {
      this.adaptSpeed = getOption(options, 'adaptSpeed', this.adaptSpeed)
      this.exposure = getOption(options, 'exposure', this.exposure)
      this.blackPoint = getOption(options, 'blackPoint', this.blackPoint)
      this.whitePoint = getOption(options, 'whitePoint', this.whitePoint)
    }
  }

  /**
   * Creates luminance render targets
   */
  public createLuminanceTargets(sizes = [512, 128, 32, 8, 2]) {
    sizes.forEach((size, i) => {
      if (!this.downsampleTextures[i]) {
        this.downsampleTextures[i] = this.device.createRenderTarget({
          width: size,
          height: size,
          depthFormat: DepthFormat.None,
        })
      }
    })
    if (!this.lum1) {
      this.lum1 = this.device.createRenderTarget({ width: 2, height: 2, depthFormat: DepthFormat.None })
    }
    if (!this.lum2) {
      this.lum2 = this.device.createRenderTarget({ width: 2, height: 2, depthFormat: DepthFormat.None })
    }
  }

  /**
   * Releases all luminance render targets
   */
  public releaseLuminanceTargets() {
    this.lum1?.destroy()
    this.lum1 = null
    this.lum2?.destroy()
    this.lum2 = null
    this.downsampleTextures.forEach((it) => it.destroy())
    this.downsampleTextures.length = 0
  }

  /**
   * Clears all luminance targets
   */
  public clearLuminanceTargets() {
    for (const target of this.downsampleTextures) {
      this.device.setRenderTarget(target)
      this.device.clear(0)
    }
    this.device.setRenderTarget(this.lum1)
    this.device.clear(0)
    this.device.setRenderTarget(this.lum2)
    this.device.clear(0)
  }

  public draw() {
    if (!this.isReady) {
      throw new Error(`effect is not ready to be used`)
    }
    const device = this.device
    const sourceTexture = this.inputTexture
    const targetBuffer = this.outputTexture
    const targets = this.downsampleTextures
    if (!sourceTexture) {
      throw new Error(`inputTexture must not be null`)
    }
    if (!targetBuffer || !targetBuffer.isRenderTarget) {
      throw new Error(`outputTexture must be a render target`)
    }
    if (!targets.length) {
      this.createLuminanceTargets()
      this.clear = true
    }

    const programLuminance = this.effect.getTechnique('Luminance').pass(0).program
    const programDownsample = this.effect.getTechnique('Downsample').pass(0).program
    const programCombine = this.effect.getTechnique('Combine').pass(0).program
    const programTonemap = this.effect.getTechnique('Tonemap').pass(0).program

    device.blendState = BlendState.Default
    device.depthState = DepthState.Default
    device.stencilState = StencilState.Default
    device.cullState = CullState.CullNone
    device.textureUnits[0].commit({
      minFilter: TextureFilter.Point,
      magFilter: TextureFilter.Point,
      wrapU: TextureWrapMode.Clamp,
      wrapV: TextureWrapMode.Clamp,
    })

    //
    // clear intermediate and history buffers
    //
    if (this.clear) {
      this.clear = false
      this.clearLuminanceTargets()
    }

    // -------------------------------------------------
    // [1] DETERMINE LUMINANCE
    //
    // perform luminance downscale in 5 steps until 2x2 size is reached
    for (let i = 0; i < targets.length; i++) {
      const program = !i ? programLuminance : programDownsample
      const source = !i ? sourceTexture : targets[i - 1]
      program.setUniform('texture1', source)
      program.setUniform('texture1Texel', source.texel)
      device.program = program
      device.setRenderTarget(targets[i])
      device.drawQuad(false)
      device.setRenderTarget(null)
    }

    // combine luminance
    let thisFrameLuminance = targets[targets.length - 1]
    let lastFrameLuminance = this.lum1
    programCombine.setUniform('texture1', thisFrameLuminance)
    programCombine.setUniform('texture1Texel', thisFrameLuminance.texel)
    programCombine.setUniform('texture2', lastFrameLuminance)
    programCombine.setUniform('adaptSpeed', this.adaptSpeed)
    device.program = programCombine
    device.setRenderTarget(this.lum2)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // -------------------------------------------------
    // [2] APPLY TONEMAPPING
    //
    // maps the HDR color values to range in [0:1]

    // setup tone map effect
    programTonemap.setUniform('exposure', this.exposure)
    programTonemap.setUniform('whitePoint', this.whitePoint)
    programTonemap.setUniform('blackPoint', this.blackPoint)
    programTonemap.setUniform('texture1', sourceTexture)
    programTonemap.setUniform('texture1Texel', sourceTexture.texel)
    programTonemap.setUniform('texture2', this.lum2)
    device.program = programTonemap
    device.setRenderTarget(targetBuffer)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // swap history frames
    let temp = this.lum2
    this.lum2 = this.lum1
    this.lum1 = temp
  }
}
