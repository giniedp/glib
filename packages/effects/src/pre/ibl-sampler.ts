import {
  createShaderEffectSync,
  DataTypeName,
  Device,
  Effect,
  SamplerState,
  Texture,
  TextureOptions,
} from '@gglib/graphics'
import { removeFromArray } from '@gglib/utils'
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
  format?: Extract<DataTypeName, 'byte' | 'float' | 'half'>
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
  public needsUpdate: boolean = false
  public format: IBLSamplerOptions['format']

  private distribution: number
  private roughness: number
  private targetMipLevel: number
  private sampleCount: number
  private lodBias: number = 0

  public panoramaInput: Texture
  public cubemapInput: Texture

  public lambertianCubemap: Texture
  public ggxCubemap: Texture
  public sheenCubemap: Texture
  public ggxLutMap: Texture
  public sheenLutMap: Texture

  protected resources: Texture[] = []

  constructor(device: Device, options?: IBLSamplerOptions) {
    this.device = device
    this.textureSize = options?.textureSize ?? this.textureSize
    this.ggxSampleCount = options?.ggxSampleCount ?? this.ggxSampleCount
    this.lambertianSampleCount = options?.lambertianSampleCount ?? this.lambertianSampleCount
    this.sheenSampleCount = options?.sheenSampleCount ?? this.sheenSampleCount
    this.lowestMipLevel = options?.lowestMipLevel ?? this.lowestMipLevel
    this.scaleValue = options?.scaleValue ?? this.scaleValue
    this.format = options?.format ?? 'half'
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

  private sampleLut(input: Texture, output: Texture) {
    const device = this.device
    device.setRenderTarget(output.image)
    device.clear(0xff000000, 1, 1)

    const program = this.effect.getTechnique('iblSample').program0
    program.setUniform('cubemap', input)
    program.setUniform('sampleCount', 512)
    program.setUniform('width', 0)
    program.setUniform('lodBias', 0)
    program.setUniform('distribution', this.distribution)
    program.setUniform('currentFace', 0)
    program.setUniform('isGeneratingLUT', 1)

    device.drawQuad()
    device.setRenderTarget(null)
    output.image.updateMipmaps()
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

  public sampleGGXLut(inputCubemap: Texture, outputLUT: Texture) {
    this.distribution = 1
    this.sampleLut(inputCubemap, outputLUT)
  }

  public sampleSheenLut(inputCubemap: Texture, outputLUT: Texture) {
    this.distribution = 2
    this.sampleLut(inputCubemap, outputLUT)
  }

  public draw(inputCubemap: Texture) {
    this.lambertianCubemap = this.createCubemap(this.lambertianCubemap, 'lambertianCubemap')
    this.ggxCubemap = this.createCubemap(this.ggxCubemap, 'ggxCubemap')
    this.sheenCubemap = this.createCubemap(this.sheenCubemap, 'sheenCubemap')
    this.ggxLutMap = this.createLutMap(this.ggxLutMap, 'ggxLutMap')
    this.sheenLutMap = this.createLutMap(this.sheenLutMap, 'sheenLutMap')
    this.sampleLambertian(inputCubemap, this.lambertianCubemap)
    this.sampleGGX(inputCubemap, this.ggxCubemap)
    this.sampleSheen(inputCubemap, this.sheenCubemap)
    this.sampleGGXLut(this.ggxCubemap, this.ggxLutMap)
    this.sampleSheenLut(this.sheenCubemap, this.sheenLutMap)
  }

  public update() {
    if (!this.needsUpdate || !this.isReady) {
      return
    }

    if (this.panoramaInput) {
      // wait for panorama texture to be ready
      this.panoramaInput.update()
      if (!this.panoramaInput.ready) {
        this.needsUpdate = true
        return
      }
    }

    if (this.cubemapInput) {
      // wait for cubemap texture to be ready
      this.cubemapInput.update()
      if (!this.cubemapInput.ready) {
        this.needsUpdate = true
        return
      }
    }

    // at this point, either panoramaInput or cubemapInput or both must be set

    if (this.panoramaInput) {
      this.cubemapInput = this.createCubemap(this.cubemapInput, 'panoramaCubemap')
      this.panoramaToCubemap(this.panoramaInput, this.cubemapInput)
    }

    if (this.cubemapInput) {
      this.draw(this.cubemapInput)
    } else {
      console.warn('Panorama cubemap is not set')
    }

    this.needsUpdate = false
  }

  private createCubemap(current: Texture, name?: string) {
    if (current && current.width === this.textureSize) {
      return current
    }
    if (current) {
      current.dispose()
      removeFromArray(this.resources, current)
    }

    const options: TextureOptions = {
      name: name,
      type: 'TextureCube',
      width: this.textureSize,
      height: this.textureSize,
      generateMipmap: true,
      sampler: SamplerState.LinearClamp,
      surfaceFormat: 'RGBA',
    }
    if (this.format === 'half' && this.device.canRenderHalf) {
      options.surfaceFormat = 'RGBA16F'
      options.pixelFormat = 'RGBA'
      options.pixelType = 'half'
    }
    if (this.format === 'float' && this.device.canRenderFloat) {
      options.surfaceFormat = 'RGBA32F'
      options.pixelFormat = 'RGBA'
      options.pixelType = 'float'
    }

    current = this.device.createTexture(options)
    this.resources.push(current)
    current.image.updateMipmaps()
    return current
  }

  private createLutMap(current: Texture, name?: string) {
    if (current && current.width === this.textureSize) {
      return current
    }
    if (current) {
      current.dispose()
      removeFromArray(this.resources, current)
    }
    const options: TextureOptions = {
      name: name,
      type: 'Texture2D',
      width: this.textureSize,
      height: this.textureSize,
      generateMipmap: true,
      sampler: SamplerState.LinearClamp,
    }
    if (this.format === 'half' && this.device.canRenderHalf) {
      options.surfaceFormat = 'RGBA16F'
      options.pixelFormat = 'RGBA'
      options.pixelType = 'half'
    }
    if (this.format === 'float' && this.device.canRenderFloat) {
      options.surfaceFormat = 'RGBA32F'
      options.pixelFormat = 'RGBA'
      options.pixelType = 'float'
    }
    current = this.device.createTexture(options)
    this.resources.push(current)
    current.image.updateMipmaps()
    return current
  }

  public dispose() {
    this.effect.dispose()
    for (const resource of this.resources) {
      resource.dispose()
    }
    this.resources.length = 0
  }
}
