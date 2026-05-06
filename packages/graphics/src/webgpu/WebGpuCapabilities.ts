import type { Capabilities } from '../Capabilities'
import { type SurfaceFormat, surfaceFormatInfo, type TextureCompression } from '../enums'
import { Mutable } from '../types'
import type { WebGpuDevice } from './WebGpuDevice'

export class WebGpuCapabilities implements Capabilities {
  public get maxTextureCount(): number {
    return this.device.gpu.limits.maxSampledTexturesPerShaderStage
  }
  public get maxTextureSize(): number {
    return this.device.gpu.limits.maxTextureDimension2D
  }
  public get maxVertexAttributes(): number {
    return this.device.gpu.limits.maxVertexAttributes
  }
  public get maxVertexTextureCount(): number {
    return this.device.gpu.limits.maxSampledTexturesPerShaderStage
  }
  public get maxRenderTargets(): number {
    return this.device.gpu.limits.maxColorAttachments
  }
  public get maxRenderTargetSize(): number {
    return this.device.gpu.limits.maxTextureDimension2D
  }

  public readonly canRenderR32F: boolean
  public readonly canRenderRG32F: boolean
  public readonly canRenderRGBA32F: boolean
  public readonly canFilterR32F: boolean
  public readonly canFilterRG32F: boolean
  public readonly canFilterRGBA32F: boolean

  public readonly canRenderR16F: boolean
  public readonly canRenderRG16F: boolean
  public readonly canRenderRGBA16F: boolean
  public readonly canFilterR16F: boolean
  public readonly canFilterRG16F: boolean
  public readonly canFilterRGBA16F: boolean

  public readonly textureCompression: TextureCompression[]
  public readonly textureCompressionAstc: boolean
  public readonly textureCompressionEtc2: boolean
  public readonly textureCompressionEtc1: boolean
  public readonly textureCompressionPvrtc: boolean
  public readonly textureCompressionBc: boolean
  public readonly textureCompressionBptc: boolean

  public readonly ready: Promise<void>
  private device: WebGpuDevice
  public constructor(device: WebGpuDevice) {
    this.device = device

    this.textureCompressionAstc = this.hasFeature('texture-compression-astc')
    this.textureCompressionEtc2 = this.hasFeature('texture-compression-etc2')
    this.textureCompressionEtc1 = false
    this.textureCompressionPvrtc = false
    this.textureCompressionBc = this.hasFeature('texture-compression-bc')
    this.textureCompressionBptc = this.hasFeature('texture-compression-bc')
    this.textureCompression = [
      this.textureCompressionAstc ? ('astc' as const) : null,
      this.textureCompressionEtc2 ? ('etc2' as const) : null,
      this.textureCompressionEtc1 ? ('etc1' as const) : null,
      this.textureCompressionPvrtc ? ('pvrtc' as const) : null,
      this.textureCompressionBptc ? ('bptc' as const) : null,
      this.textureCompressionBc ? ('bc' as const) : null,
    ].filter((it) => !!it)

    this.canRenderR32F = false
    this.canRenderRG32F = false
    this.canRenderRGBA32F = false
    this.canFilterR32F = this.hasFeature('float32-filterable')
    this.canFilterRG32F = this.hasFeature('float32-filterable')
    this.canFilterRGBA32F = this.hasFeature('float32-filterable')

    this.canRenderR16F = true
    this.canRenderRG16F = true
    this.canRenderRGBA16F = true
    this.canFilterR16F = true
    this.canFilterRG16F = true
    this.canFilterRGBA16F = true

    this.ready = this.initialize()
  }

  public isFormatSupported(format: SurfaceFormat): boolean {
    const info = surfaceFormatInfo(format)
    if (!info.compression) {
      return true
    }

    switch (info.compression) {
      case 'astc':
        return this.textureCompressionAstc
      case 'etc2':
        return this.textureCompressionEtc2
      case 'etc1':
        return this.textureCompressionEtc1
      case 'pvrtc':
        return this.textureCompressionPvrtc
      case 'bc':
        return this.textureCompressionBc
      case 'bptc':
        return this.textureCompressionBptc
    }
    return false
  }

  private hasFeature(feature: GPUFeatureName): boolean {
    return this.device.adapter.features.has(feature)
  }

  protected async initialize() {
    const self = this as Mutable<this>
    self.canRenderR32F = await checkFormatRenderSupport(this.device.gpu, 'r32float')
    self.canRenderRG32F = await checkFormatRenderSupport(this.device.gpu, 'rg32float')
    self.canRenderRGBA32F = await checkFormatRenderSupport(this.device.gpu, 'rgba32float')
  }
}

async function checkFormatRenderSupport(device: GPUDevice, format: GPUTextureFormat): Promise<boolean> {
  device.pushErrorScope('validation')
  device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: `@vertex fn main() -> @builtin(position) vec4f { return vec4f(0); }`,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: `@fragment fn main() -> @location(0) vec4f { return vec4f(0); }`,
      }),
      entryPoint: 'main',
      targets: [
        {
          format,
          writeMask: 0,
        },
      ],
    },
    primitive: { topology: 'triangle-list' },
  })

  const error = await device.popErrorScope()
  return !error
}
