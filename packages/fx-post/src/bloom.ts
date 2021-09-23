import {
  BlendState,
  Color,
  createShaderEffect,
  CullState,
  DepthState,
  Device,
  StencilState,
  Texture,
  ShaderEffect,
  createShaderEffectSync,
} from '@gglib/graphics'
import { POST_BLOOM } from './bloom.program'
import { getOption } from '@gglib/utils'


function gauss(n: number, theta: number) {
  return ((1.0 / Math.sqrt(2 * Math.PI * theta)) * Math.exp(-(n * n) / (2.0 * theta * theta)))
}

/**
 * Constructor options for {@link PostBloom}
 *
 * @public
 */
export interface PostBloomOptions {
  glowCut?: number
  multiplier?: number
  gaussSigma?: number
  iterations?: number
}

/**
 * Implements simple bloom post processing
 *
 * @public
 */
export class PostBloomEffect {
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
   * Luminance treshold
   */
  public glowCut: number = 0.8
  /**
   *
   */
  public multiplier: number = 0.5
  /**
   *
   */
  public gaussSigma: number = 0.5
  /**
   * Number of blur iterations
   */
  public iterations: number = 1
  /**
   * The input texture
   */
  public input: Texture
  /**
   * The intermediate blur target
   */
  public intermediate1: Texture
  /**
   * The intermediate blur target
   */
  public intermediate2: Texture
  /**
   * The output render target
   */
  public output: Texture

  public readonly effect: ShaderEffect

  private offsetWeights: number[][]

  constructor(device: Device, options?: PostBloomOptions) {
    this.device = device
    this.effect = createShaderEffectSync(this.device, POST_BLOOM)
    if (options) {
      this.glowCut = getOption(options, 'glowCut', this.glowCut)
      this.multiplier = getOption(options, 'multiplier', this.multiplier)
      this.gaussSigma = getOption(options, 'gaussSigma', this.gaussSigma)
      this.iterations = getOption(options, 'iterations', this.iterations)
    }
  }

  private updateGauss(texelX: number, texelY: number) {
    let samples = 9
    let samplesOff = Math.floor(samples / 2)
    let offWeights = this.offsetWeights || []
    offWeights.length = samples
    offWeights.length = samples
    this.offsetWeights = offWeights
    for (let i = 0; i < samples; i++) {
        let data = offWeights[i]
        if (!data) {
          data = [0, 0, 0, 0]
          offWeights[i] = data
        }
        let off = (i - samplesOff)
        // Compute the offsets. We take 9 samples - 4 either side and one in the middle:
        //     i =  0,  1,  2,  3, 4,  5,  6,  7,  8
        // Offset = -4, -3, -2, -1, 0, +1, +2, +3, +4
        data[0] = off * texelX
        data[1] = off * texelY
        if (off !== 0) {
          // half pixel offset to get a sample between the pixels
          data[0] += (off > 0 ? 0.5 : -0.5) * texelX
          data[1] += (off > 0 ? 0.5 : -0.5) * texelY
        }
        // map to [-1:+1]
        let norm = off / samplesOff
        data[2] = this.multiplier * gauss(norm, this.gaussSigma)
        data[3] = this.multiplier * gauss(norm, this.gaussSigma)
    }
  }

  public draw() {
    const input = this.input
    const rt1 = this.intermediate1
    const rt2 = this.intermediate2
    const output = this.output

    if (!input) {
      throw new Error(`input must not be null`)
    }
    if (!rt1 || !rt1.isRenderTarget) {
      throw new Error(`intermediate1 must be a render target`)
    }
    if (!rt2 || !rt2.isRenderTarget) {
      throw new Error(`intermediate2 must be a render target`)
    }
    if (output && !output.isRenderTarget) {
      throw new Error(`output must be a render target (or null)`)
    }

    this.updateGauss(1.0 / input.width, 1.0 / input.height)

    const device = this.device
    device.depthState = DepthState.Default
    device.stencilState = StencilState.Default
    device.blendState = BlendState.Default
    device.cullState = CullState.CullNone

    // ------------------------------------------------
    // [1] GLOW CUT -> rt1
    //
    device.program = this.effect.getTechnique('glowCut').pass(0).program
    device.program.setUniform('texture', input)
    device.program.setUniform('threshold', this.glowCut)
    device.setRenderTarget(rt1)
    device.clear(0xFF000000, 1, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    for (let n = 0; n < this.iterations; n++) {

      // ------------------------------------------------
      // [2] HORIZONTAL BLUR -> rt2
      //
      // calculate filter offsets and weights
      device.program = this.effect.getTechnique('hBlur').pass(0).program
      device.program.setUniform('texture', rt1)
      for (let i = 0; i < this.offsetWeights.length; i++) {
        device.program.setUniform(`offsetWeights[${i}]`, this.offsetWeights[i])
      }
      device.setRenderTarget(rt2)
      device.clear(Color.TransparentBlack, 1)
      device.drawQuad()
      device.setRenderTarget(null)

      // ------------------------------------------------
      // [2] VERTICAL BLUR -> rt1
      //
      // calculate filter offsets and weights
      device.program = this.effect.getTechnique('vBlur').pass(0).program
      device.program.setUniform('texture', rt2)
      for (let i = 0; i < this.offsetWeights.length; i++) {
        device.program.setUniform(`offsetWeights[${i}]`, this.offsetWeights[i])
      }
      device.setRenderTarget(rt1)
      device.clear(Color.TransparentBlack, 1)
      device.drawQuad()
      device.setRenderTarget(null)
    }

    // ------------------------------------------------
    // [4] COMBINE BOOM -> output
    //
    device.program = this.effect.getTechnique('combine').pass(0).program
    device.program.setUniform('texture', input)
    device.program.setUniform('bloomTexture', rt1)

    device.setRenderTarget(output)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad()
    device.setRenderTarget(null)
  }
}
