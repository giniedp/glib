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
}

export class IblSampler {
  private device: Device
  private fxLut: IblBRDFLutEffect
  private fxFilter: IblFilterEffect
  private fxCube: PanoramaToCubemapEffect

  public ready: Promise<this>
  public get isReady() {
    return this.fxLut.isCompiled && this.fxFilter.isCompiled && this.fxCube.isCompiled
  }

  public readonly lutMapGGX: Texture
  public readonly lutMapCharlie: Texture
  public readonly envMapLambert: Texture
  public readonly envMapGGX: Texture
  public readonly envMapCharlie: Texture

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
    this.ready = Promise.all([this.fxLut.compiled, this.fxFilter.compiled, this.fxCube.compiled]).then(() => this)
    this.samplesLut = options.samplesLut ?? this.samplesLut
    this.samplesGGX = options.samplesGGX ?? this.samplesGGX
    this.samplesSheen = options.samplesCharlie ?? this.samplesSheen
    this.samplesLambert = options.samplesLambert ?? this.samplesLambert
    this.intensity = options.intensity ?? this.intensity

    const lutOptions: TextureOptions = {
      type: 'Texture2D',
      width: options?.lutSize ?? 1024,
      height: options?.lutSize ?? 1024,
      usage: TextureUsage.TextureBinding,
      format: 'RG16_FLOAT',
    }

    this.lutMapGGX = device.createRenderTarget({
      name: 'GGX BRDF LUT',
      ...lutOptions,
    })

    this.lutMapCharlie = device.createRenderTarget({
      name: 'Sheen BRDF LUT',
      ...lutOptions,
    })

    const envSize = options?.envSize ?? 256
    const envOptions: TextureOptions = {
      type: 'TextureCube',
      width: envSize,
      height: envSize,
      depth: 6,
      mipLevelCount: Math.min(5, getMipmapCount(envSize, envSize, envSize)),
      usage: TextureUsage.TextureBinding,
      format: 'RGBA16_FLOAT',
    }

    this.envMapLambert = device.createRenderTarget({
      name: 'Lambert environment map ',
      ...envOptions,
    })

    this.envMapGGX = device.createRenderTarget({
      name: 'GGX environment map',
      ...envOptions,
    })

    this.envMapCharlie = device.createRenderTarget({
      name: 'Charlie environment map',
      ...envOptions,
    })

    this.cubemap = device.createRenderTarget({
      name: 'IBL Cubemap Source',
      ...envOptions,
      mipLevelCount: getMipmapCount(envSize, envSize, envSize),
    })

    this.ready.then(() => {
      const pass = this.device.renderPass
      this.fxLut.textureOut = this.lutMapGGX
      this.fxLut.samples = this.samplesLut
      this.fxLut.distribution = IblDistributionFunction.GGX
      this.fxLut.render(pass)
      this.fxLut.textureOut = this.lutMapCharlie
      this.fxLut.samples = this.samplesLut
      this.fxLut.distribution = IblDistributionFunction.CHARLIE
      this.fxLut.render(pass)
      this.lutMapGGX.updateMipmaps()
      this.lutMapCharlie.updateMipmaps()
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
    if (input.type === 'Texture2D') {
      this.fxCube.textureIn = input
      this.fxCube.textureOut = cubemap
      this.fxCube.render(pass)
      cubemap.updateMipmaps()
    } else if (input.type === 'TextureCube') {
      cubemap = input
    } else {
      throw new Error(`input texture type must be either Texture2D (panorama) or TextureCube but was '${input.type}'`)
    }

    this.fxFilter.cubemapIn = cubemap
    this.fxFilter.intensity = this.intensity

    // LAMBERT
    this.fxFilter.cubemapOut = this.envMapLambert
    this.fxFilter.samples = this.samplesLambert
    this.fxFilter.distribution = IblDistributionFunction.LAMBERT
    this.fxFilter.render(pass)

    // GGX
    this.fxFilter.cubemapOut = this.envMapGGX
    this.fxFilter.samples = this.samplesGGX
    this.fxFilter.distribution = IblDistributionFunction.GGX
    this.fxFilter.render(pass)

    // CHARLIE
    this.fxFilter.cubemapOut = this.envMapCharlie
    this.fxFilter.samples = this.samplesSheen
    this.fxFilter.distribution = IblDistributionFunction.CHARLIE
    this.fxFilter.render(pass)

    pass.flush()
  }
}
