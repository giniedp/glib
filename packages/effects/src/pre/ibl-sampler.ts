import { createShaderEffectSync, Device, Effect, SamplerState, Texture } from '@gglib/graphics'
import { PRE_IBL_SAMPLER } from './ibl-sampler.program'

/**
 * Constructor options for {@link IBLSamplerEffect}
 *
 * @public
 */
export interface IBLSamplerOptions {
  textureSize?: number
  ggxSampleCount?: number
  lambertianSampleCount?: number
  sheenSampleCount?: number
  lodBias?: number
  lowestMipLevel?: number
  scaleValue?: number
}

/**
 * Implements simple bloom post processing
 *
 * @public
 */
export class IBLSamplerEffect {
  /**
   * Determines whether the post effect is ready to render
   */
  public get isReady() {
    return !!this.effect?.isReady()
  }
  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The effect with ibl sampler shader
   */
  public readonly effect: Effect

  public textureSize: number = 256
  public ggxSampleCount: number = 1024
  public lambertianSampleCount: number = 2048
  public sheenSampleCount: number = 64
  public lowestMipLevel: number = 4
  public scaleValue: number = 1.0

  private distribution: number
  private roughness: number
  private targetMipLevel: number
  private sampleCount: number
  private lodBias: number = 0

  public ggxCubemap: Texture
  public lambertianCubemap: Texture
  public sheenCubemap: Texture

  constructor(device: Device, options?: IBLSamplerOptions) {
    this.device = device
    this.textureSize = options?.textureSize ?? this.textureSize
    this.ggxSampleCount = options?.ggxSampleCount ?? this.ggxSampleCount
    this.lambertianSampleCount = options?.lambertianSampleCount ?? this.lambertianSampleCount
    this.sheenSampleCount = options?.sheenSampleCount ?? this.sheenSampleCount
    this.lowestMipLevel = options?.lowestMipLevel ?? this.lowestMipLevel
    this.scaleValue = options?.scaleValue ?? this.scaleValue
    this.effect = createShaderEffectSync(this.device, PRE_IBL_SAMPLER)
  }

  public panoramaToCubemap(inputPanorama: Texture, outputCubemap: Texture) {
    const device = this.device
    for (let i = 0; i < 6; i++) {
      outputCubemap.image.targetFace = i
      device.setRenderTarget(outputCubemap.image)
      device.clear(0xff000000, 1, 1)

      const program = this.effect.getTechnique('panoramaToCubemap').program0
      program.setUniform('texture', inputPanorama)
      program.setUniform('currentFace', i)
      device.program = program
      device.drawQuad(false)
      device.setRenderTarget(null)
    }
    outputCubemap.image.updateMipmaps()
  }

  private sampleCubemap(input: Texture, output: Texture) {
    const currentTextureSize = this.textureSize >> this.targetMipLevel

    const device = this.device
    for (let i = 0; i < 6; ++i) {
      output.image.targetFace = i
      output.image.targetLevel = this.targetMipLevel
      device.setRenderTarget(output.image)
      device.viewportState = {
        x: 0,
        y: 0,
        width: currentTextureSize,
        height: currentTextureSize,
      }
      device.clear(0xff000000, 1, 1)

      const program = this.effect.getTechnique('iblSample').program0
      program.setUniform('cubemap', input)
      program.setUniform('roughness', this.roughness)
      program.setUniform('sampleCount', this.sampleCount)
      program.setUniform('width', currentTextureSize)
      program.setUniform('lodBias', this.lodBias)
      program.setUniform('distribution', this.distribution)
      program.setUniform('currentFace', i)
      program.setUniform('isGeneratingLUT', 0)
      program.setUniform('floatTexture', 0)
      // if (this.supportedFormat === 'BYTE') {
      // } else {
      //   program.setUniform('floatTexture', 1)
      // }
      program.setUniform('intensityScale', this.scaleValue)

      device.drawQuad()
      device.setRenderTarget(null)
    }

  }

  public sampleLambertian(inputCubemap: Texture, outputCubemap: Texture) {
    this.distribution = 0
    this.roughness = 0
    this.targetMipLevel = 0
    this.sampleCount = this.lambertianSampleCount
    this.sampleCubemap(inputCubemap, outputCubemap)
    outputCubemap.image.updateMipmaps()
  }

  public sampleGGX(inputCubemap: Texture, outputCubemap: Texture) {
    const mipmapLevels = Math.floor(Math.log2(outputCubemap.width)) + 1 - this.lowestMipLevel
    for (let i = 0; i < mipmapLevels; i++) {
      this.distribution = 1
      this.roughness = i / (mipmapLevels - 1)
      this.targetMipLevel = i
      this.sampleCount = this.ggxSampleCount
      this.sampleCubemap(inputCubemap, outputCubemap)
    }
  }

  public sampleSheen(inputCubemap: Texture, outputCubemap: Texture) {
    const mipmapLevels = Math.floor(Math.log2(outputCubemap.width)) + 1 - this.lowestMipLevel
    for (let i = 0; i < mipmapLevels; i++) {
      this.distribution = 2
      this.roughness = i / (mipmapLevels - 1)
      this.targetMipLevel = i
      this.sampleCount = this.sheenSampleCount
      this.sampleCubemap(inputCubemap, outputCubemap)
    }
  }

  public draw(inputCubemap: Texture) {
    this.lambertianCubemap = this.createCubemap(this.lambertianCubemap)
    this.ggxCubemap = this.createCubemap(this.ggxCubemap)
    this.sheenCubemap = this.createCubemap(this.sheenCubemap)
    this.sampleLambertian(inputCubemap, this.lambertianCubemap)
    this.sampleGGX(inputCubemap, this.ggxCubemap)
    this.sampleSheen(inputCubemap, this.sheenCubemap)
  }

  private createCubemap(current: Texture) {
    if (current && current.width === this.textureSize) {
      return current
    }
    if (current) {
      current.dispose()
    }
    current = this.device.createTexture({
      type: 'TextureCube',
      width: this.textureSize,
      height: this.textureSize,
      generateMipmap: true,
      sampler: SamplerState.LinearClamp,
    })
    current.image.updateMipmaps()
    return current
  }

  public dispose() {
    this.effect.dispose()
    this.ggxCubemap?.dispose()
    this.ggxCubemap = null
    this.lambertianCubemap?.dispose()
    this.lambertianCubemap = null
    this.sheenCubemap?.dispose()
    this.sheenCubemap = null
  }
}
