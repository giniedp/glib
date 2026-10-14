import { Device, getMipmapCount, Texture, TextureOptions, TextureUsage } from '@gglib/graphics'
import { PanoramaToCubemapEffect } from './cubemap'
import { IblBRDFLutEffect } from './ibl-brdf-lut'
import { IblDistributionFunction, IblFilterEffect } from './ibl-filter'

export interface IblSamplerOptions {
  lutSize?: number
  envSize?: number
  samplesLut?: number
  samplesGGX?: number
  samplesCharlie?: number
  samplesLambert?: number
  intensity?: number
  /**
   * Whether to generate the lambertian (irradiance) map {@link IblSampler.envMapLambert}. Defaults to true
   */
  lambert?: boolean
  /**
   * Whether to generate the sheen map {@link IblSampler.envMapCharlie} and its BRDF LUT. Defaults to true
   */
  charlie?: boolean
}

export class IblSampler {
  private device: Device
  private fxLut: IblBRDFLutEffect
  private fxFilter: IblFilterEffect
  private fxCube: PanoramaToCubemapEffect

  public compiled: Promise<this>
  public get isReady() {
    return this.fxLut.isCompiled && this.fxFilter.isCompiled && this.fxCube.isCompiled
  }

  public readonly lutMapGGX: Texture
  /**
   * Sheen BRDF LUT, null if disabled by {@link IblSamplerOptions.charlie}
   */
  public readonly lutMapCharlie: Texture | null = null
  /**
   * Lambertian (irradiance) map, null if disabled by {@link IblSamplerOptions.lambert}
   */
  public readonly envMapLambert: Texture | null = null
  public readonly envMapGGX: Texture
  /**
   * Sheen map, null if disabled by {@link IblSamplerOptions.charlie}
   */
  public readonly envMapCharlie: Texture | null = null

  public samplesSheen = 64
  public samplesGGX = 1024
  public samplesLambert = 2048
  public intensity = 1

  public readonly cubemap: Texture
  private samplesLut = 512

  public constructor(device: Device, options: IblSamplerOptions) {
    this.device = device
    this.fxLut = new IblBRDFLutEffect(device)
    this.fxFilter = new IblFilterEffect(device)
    this.fxCube = new PanoramaToCubemapEffect(device)
    this.compiled = Promise.all([this.fxLut.compiled, this.fxFilter.compiled, this.fxCube.compiled]).then(() => this)
    this.samplesLut = options.samplesLut ?? this.samplesLut
    this.samplesGGX = options.samplesGGX ?? this.samplesGGX
    this.samplesSheen = options.samplesCharlie ?? this.samplesSheen
    this.samplesLambert = options.samplesLambert ?? this.samplesLambert
    this.intensity = options.intensity ?? this.intensity

    const lutOptions: TextureOptions = {
      type: '2d',
      width: options?.lutSize ?? 1024,
      height: options?.lutSize ?? 1024,
      usage: TextureUsage.TextureBinding,
      format: 'rg16float',
    }

    this.lutMapGGX = device.createRenderTarget({
      name: 'GGX BRDF LUT',
      ...lutOptions,
    })

    if (options.charlie ?? true) {
      this.lutMapCharlie = device.createRenderTarget({
        name: 'Sheen BRDF LUT',
        ...lutOptions,
      })
    }

    const envSize = options?.envSize ?? 256
    const envOptions: TextureOptions = {
      type: 'cube',
      width: envSize,
      height: envSize,
      depth: 6,
      mipLevelCount: Math.min(5, getMipmapCount(envSize, envSize, envSize)),
      usage: TextureUsage.TextureBinding,
      format: 'rgba16float',
    }

    if (options.lambert ?? true) {
      this.envMapLambert = device.createRenderTarget({
        name: 'Lambert environment map ',
        ...envOptions,
      })
    }

    this.envMapGGX = device.createRenderTarget({
      name: 'GGX environment map',
      ...envOptions,
    })

    if (options.charlie ?? true) {
      this.envMapCharlie = device.createRenderTarget({
        name: 'Charlie environment map',
        ...envOptions,
      })
    }

    this.cubemap = device.createRenderTarget({
      name: 'IBL Cubemap Source',
      ...envOptions,
      mipLevelCount: getMipmapCount(envSize, envSize, envSize),
    })

    this.compiled.then(() => {
      const pass = this.device.renderPass
      this.fxLut.textureOut = this.lutMapGGX
      this.fxLut.samples = this.samplesLut
      this.fxLut.distribution = IblDistributionFunction.GGX
      this.fxLut.render(pass)
      this.lutMapGGX.updateMipmaps()
      if (this.lutMapCharlie) {
        this.fxLut.textureOut = this.lutMapCharlie
        this.fxLut.samples = this.samplesLut
        this.fxLut.distribution = IblDistributionFunction.CHARLIE
        this.fxLut.render(pass)
        this.lutMapCharlie.updateMipmaps()
      }
      pass.flush()
    })
  }

  public update(input: Texture) {
    console.assert(!!input, 'input texture must not be null')
    if (!this.isReady) {
      return
    }

    const pass = this.device.renderPass
    let cubemap = this.cubemap
    if (input.type === '2d') {
      this.fxCube.textureIn = input
      this.fxCube.textureOut = cubemap
      this.fxCube.render(pass)
      cubemap.updateMipmaps()
    } else if (input.type === 'cube') {
      cubemap = input
    } else {
      throw new Error(`input texture type must be either 2d (panorama) or cube but was '${input.type}'`)
    }

    this.fxFilter.cubemapIn = cubemap
    this.fxFilter.intensity = this.intensity

    // LAMBERT
    if (this.envMapLambert) {
      this.fxFilter.cubemapOut = this.envMapLambert
      this.fxFilter.samples = this.samplesLambert
      this.fxFilter.distribution = IblDistributionFunction.LAMBERT
      this.fxFilter.render(pass)
    }

    // GGX
    this.fxFilter.cubemapOut = this.envMapGGX
    this.fxFilter.samples = this.samplesGGX
    this.fxFilter.distribution = IblDistributionFunction.GGX
    this.fxFilter.render(pass)

    // CHARLIE
    if (this.envMapCharlie) {
      this.fxFilter.cubemapOut = this.envMapCharlie
      this.fxFilter.samples = this.samplesSheen
      this.fxFilter.distribution = IblDistributionFunction.CHARLIE
      this.fxFilter.render(pass)
    }

    pass.flush()
  }

  public dispose() {
    this.fxCube.dispose()
    this.fxFilter.dispose()
    this.fxLut.dispose()

    this.lutMapGGX.dispose()
    this.lutMapCharlie?.dispose()
    this.envMapLambert?.dispose()
    this.envMapGGX.dispose()
    this.envMapCharlie?.dispose()
    this.cubemap.dispose()
  }
}
