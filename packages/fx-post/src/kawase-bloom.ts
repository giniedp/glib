import { ShaderEffect, Device, Texture, BlendState, ShaderProgram, createShaderEffectSync } from '@gglib/graphics'
import { POST_KAWASE_BLOOM } from './kawase-bloom.program'

/**
 * Constructor options for {@link PostBloomKawase}
 *
 * @public
 */
export interface PostKawaseBloomOptions {
  glowCut?: number
  iterations?: number
}

function getOption<T, K>(options: K, option: keyof K, fallback: T): T {
  if (option in options) {
    return options[option] as any
  }
  return fallback
}

/**
 * @public
 */
export class PostKawaseBloomEffect {
  /**
   * Determines whether the post effect is ready to render
   */
  public get isReady() {
    return !!this.effect
  }
  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * Number of blur iterations
   */
  public iterations: number = 5
  /**
   * Blur color threshold
   */
  public glowCut: number = 0.5
  /**
   * The input texture
   */
  public inputTexture: Texture
  /**
   * Intermediate blur target
   *
   * @remarks
   * Must be a render target
   */
  public blurTexture1: Texture
  /**
   * Intermediate blur target
   *
   * @remarks
   * Must be a render target
   */
  public blurTexture2: Texture
  /**
   * The output render target
   *
   * @remarks
   * Must be a render target
   */
  public outputTexture: Texture

  public readonly effect: ShaderEffect

  constructor(device: Device, options: PostKawaseBloomOptions) {
    this.device = device
    this.effect = createShaderEffectSync(this.device, POST_KAWASE_BLOOM)
    if (options) {
      this.glowCut = getOption(options, 'glowCut', this.glowCut)
      this.iterations = getOption(options, 'iterations', this.iterations)
    }
  }

  public draw() {
    const baseTarget = this.inputTexture
    const resultTarget = this.outputTexture
    let renderTarget1 = this.blurTexture1
    let renderTarget2 = this.blurTexture2
    const texel = renderTarget1.texel

    const device = this.device
    let program: ShaderProgram

    // ------------------------------------------------
    // GLOW CUT
    //

    program = this.effect.getTechnique('glowCut').pass(0).program
    program.setUniform('threshold', this.glowCut)
    program.setUniform('texture1', baseTarget)
    device.program = program
    device.blendState = BlendState.Default
    device.setRenderTarget(renderTarget1)
    device.drawQuad()
    device.setRenderTarget(null)

    // ------------------------------------------------
    // KAWASE ITERATIONS
    //
    program = this.effect.getTechnique('kawaseIteration').pass(0).program
    device.blendState = BlendState.Default
    for (let i = 0; i < this.iterations; i++) {
      program.setUniform('iteration', i + 1)
      program.setUniform('texture1', renderTarget1)
      program.setUniform('texel', texel)
      device.program = program
      device.blendState = BlendState.Default
      device.setRenderTarget(renderTarget2)
      device.drawQuad()
      device.setRenderTarget(null)
      let temp = renderTarget1
      renderTarget1 = renderTarget2
      renderTarget2 = temp
    }

    // ------------------------------------------------
    // COMBINE
    //
    program = this.effect.getTechnique('combine').pass(0).program
    program.setUniform('texture1', baseTarget)
    program.setUniform('texture2', renderTarget1)
    device.program = program
    device.blendState = BlendState.Default
    device.setRenderTarget(resultTarget)
    device.drawQuad()
    device.setRenderTarget(null)
  }
}
