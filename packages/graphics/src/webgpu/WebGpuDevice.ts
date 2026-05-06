import { NdcMinZ } from '@gglib/math'
import { eventSource, type EventChannel } from '@gglib/utils'
import { Color } from '../Color'
import { Device, DeviceStats } from '../Device'
import { Scheduler } from '../Scheduler'
import { surfaceFormatFromWebGPU, type SurfaceFormat } from '../enums'
import {
  createResourceTracker,
  getRefCounter,
  RefCounterKey,
  referenceCounter,
  ShaderModule,
  TextureUsage,
  type AcquireTextureOptions,
  type BufferOptions,
  type DepthBufferOptions,
  type ShaderModuleOptions,
  type TextureOptions,
  type VertexBufferOptions,
} from '../resources'
import { SamplerState } from '../states'
import { WebGpuCapabilities } from './WebGpuCapabilities'
import { WebGpuRenderEncoder } from './WebGpuRenderEncoder'
import { colorTargetCache, colorTargetListCache } from './cache/ColorTargetCache'
import { pipelineCache } from './cache/PipelineCache'
import { MIPMAPS_2D, MIPMAPS_2D_ARRAY, MIPMAPS_CUBE, MIPMAPS_CUBE_ARRAY } from './programs/mipmap.wgsl'
import {
  WebGpuBuffer,
  WebGpuDeviceOutput,
  WebGpuSampler,
  WebGpuShaderModule,
  WebGpuTexture,
  WebGpuVertexBuffer,
  type WebGpuShaderOptions,
} from './resources'
import type { Mutable } from './types'

/**
 * Configuration options for initializing a {@link WebGpuDevice} device.
 *
 * @public
 */
export interface WebGpuDeviceOptions {
  /**
   * Target canvas element, selector, or offscreen canvas.
   * Created if omitted, or inferred from `context` if provided.
   * @public
   */
  canvas?: string | HTMLCanvasElement | OffscreenCanvas

  /**
   * Existing WebGPU canvas context to use instead of creating one
   * @public
   */
  context?: GPUCanvasContext

  /**
   * Enables automatic output resizing via ResizeObserver to match canvas size in device pixels.
   * @public
   */
  autosize?: boolean

  /**
   * Preferred swap chain texture format. Defaults to the adapter's preferred format if unspecified.
   * @public
   */
  surfaceFormat?: SurfaceFormat

  /**
   * Options used when requesting the GPU adapter
   * @public
   */
  adapterOptions?: GPURequestAdapterOptions

  /**
   * Options used when requesting the GPU device
   * @public
   */
  deviceOptions?: GPUDeviceDescriptor
}

export class WebGpuDevice extends Device<GPUCanvasContext> {
  public readonly ndcMinZ: NdcMinZ = NdcMinZ.Zero
  public readonly canvas: HTMLCanvasElement | OffscreenCanvas
  public readonly context: GPUCanvasContext
  public readonly scheduler = new Scheduler()
  public readonly isWebGL2: boolean = false
  public readonly isWebGPU: boolean = true
  public readonly isReady: boolean = false
  public readonly ready: Promise<this>

  public readonly onContextLost: EventChannel<void> = eventSource<void>('contextLost')
  public readonly onContextRestored: EventChannel<void> = eventSource<void>('contextLost')

  public readonly capabilities: WebGpuCapabilities
  public readonly defaultTexture: WebGpuTexture
  public readonly renderPass: WebGpuRenderEncoder
  public readonly output: WebGpuDeviceOutput

  public readonly gpu: GPUDevice
  public readonly adapter: GPUAdapter
  public readonly pipelineCache = pipelineCache(this)
  public readonly colorTargetCache = colorTargetCache()
  public readonly colorTargetListCache = colorTargetListCache()

  protected shaders = createResourceTracker<WebGpuShaderModule>()
  protected textures = createResourceTracker<WebGpuTexture>()
  protected samplers = new Map<SamplerState, WebGpuSampler>()
  protected resizeObserver: ResizeObserver

  public get queue() {
    return this.gpu.queue
  }

  private adapterOptions: GPURequestAdapterOptions = null
  private deviceOptions: GPUDeviceDescriptor = null
  private mipmapPass: WebGpuRenderEncoder
  public constructor(options: WebGpuDeviceOptions) {
    super()
    this.adapterOptions = options.adapterOptions
    this.deviceOptions = options.deviceOptions
    this.canvas = getOrCreateCanvas(options)
    this.context = getOrCreateContext(this.canvas, options)
    this.output = new WebGpuDeviceOutput(this, {
      surfaceFormat: options.surfaceFormat,
    })
    this.renderPass = new WebGpuRenderEncoder(this)
    this.mipmapPass = new WebGpuRenderEncoder(this)
    this.ready = this.initialize()
    if (this.canvas instanceof HTMLCanvasElement && options.autosize) {
      this.resizeObserver = new ResizeObserver(this.resizeFromObserver)
      this.resizeObserver.observe(this.canvas)
    }
  }

  private async initialize() {
    const adapterOptions = this.adapterOptions || {}
    const adapter = await navigator.gpu.requestAdapter(adapterOptions).catch((err) => {
      throw new Error('Failed to request WebGPU adapter with options: ' + JSON.stringify(adapterOptions), {
        cause: err,
      })
    })
    if (!adapter) {
      throw new Error('No suitable WebGPU adapter found with options: ' + JSON.stringify(adapterOptions))
    }

    const deviceOptions = this.deviceOptions || {
      label: 'GGLib WebGPU Device',
      defaultQueue: {
        label: 'GGLib WebGPU Queue',
      },
      requiredFeatures: Array.from(adapter.features) as GPUFeatureName[],
    }
    const device = await adapter.requestDevice(deviceOptions).catch((err) => {
      throw new Error('Failed to request WebGPU device with options: ' + JSON.stringify(deviceOptions), {
        cause: err,
      })
    })
    if (!device) {
      throw new Error('Failed to create WebGPU device with options: ' + JSON.stringify(deviceOptions))
    }

    device.lost.then((info) => {
      this.handleDeviceLost(info)
    })

    const self = this as Mutable<this>
    self.adapter = adapter
    self.gpu = device
    self.capabilities = new WebGpuCapabilities(this)
    self.defaultTexture ||= this.createTexture({
      name: 'GGLib Default Texture',
      // prettier-ignore
      source: Color.toByteArray(
        Color.Black, Color.DimGray,
        Color.DimGray, Color.Black,
      ),
      width: 2,
      height: 2,
      format: 'RGBA8_UNORM',
      generateMipmap: false,
    })

    await this.capabilities.ready
    self.isReady = true
    this.resize()
    this.renderPass.reset()
    return this
  }

  private async handleDeviceLost(event: GPUDeviceLostInfo) {
    if (event.reason === 'destroyed') {
      return
    }
    this.onContextLost.emit()
    await this.initialize()
    this.onContextRestored.emit()
  }

  public render(renderFn: (pass: WebGpuRenderEncoder) => void) {
    const pass = this.renderPass
    renderFn(pass)
    pass.flush()
  }

  public compute(_computeFn: (pass: unknown) => void) {
    throw new Error('Method not implemented.')
  }

  public backbufferFormat() {
    return surfaceFormatFromWebGPU(this.context.getConfiguration().format)
  }

  public createIndexBuffer(options: BufferOptions): WebGpuBuffer {
    options.type = 'IndexBuffer'
    options.indexType ||= 'uint16'
    return new WebGpuBuffer(this, options)
  }

  public createVertexBuffer(options: VertexBufferOptions): WebGpuVertexBuffer {
    return new WebGpuVertexBuffer(this, options)
  }

  public createWgslModule(options: WebGpuShaderOptions): WebGpuShaderModule {
    return new WebGpuShaderModule(this, {
      ...options,
      ...{ [RefCounterKey]: getRefCounter(options) || createRefCounter() },
    })
  }

  public createShaderModule(options: ShaderModuleOptions): WebGpuShaderModule {
    if (!options || !('wgsl' in options)) {
      throw new Error('Only WGSL shader code is supported in WebGPU')
    }
    const result = this.createWgslModule({
      name: options.name,
      code: options.wgsl,
      ...{ [RefCounterKey]: getRefCounter(options) || createRefCounter() },
    })
    this.shaders.track(result)
    return result
  }

  public getSampler(state: SamplerState): WebGpuSampler {
    if (!this.samplers.has(state)) {
      this.samplers.set(state, new WebGpuSampler(this, state))
    }
    return this.samplers.get(state)
  }

  public createTexture(options: TextureOptions): WebGpuTexture {
    const result = new WebGpuTexture(this, {
      ...options,
      ...{ [RefCounterKey]: getRefCounter(options) || createRefCounter() },
    })
    this.textures.track(result)
    return result
  }

  public createRenderTarget(options: TextureOptions): WebGpuTexture {
    options.generateMipmap ??= false
    options.mipLevelCount ??= 1
    options.sampleCount ??= 1
    options.usage ??= 0
    options.usage |= TextureUsage.RenderTarget
    return this.createTexture(options)
  }

  public createDepthTarget(options: DepthBufferOptions): WebGpuTexture {
    options.generateMipmap ??= false
    options.mipLevelCount ??= 1
    options.sampleCount ??= 1
    options.usage ??= 0
    options.usage |= TextureUsage.RenderTarget
    return this.createTexture(options)
  }

  public acquireShaderModule(options: ShaderModuleOptions): ShaderModule {
    if (!('wgsl' in options)) {
      throw new Error('Only GLSL shader source is supported in WebGL')
    }

    const key = options.wgsl
    return this.shaders.retainOrCreate(key, (ref) => {
      return this.createShaderModule({
        ...options,
        ...{ [RefCounterKey]: ref },
      })
    })
  }

  public acquireTexture(options: AcquireTextureOptions): WebGpuTexture {
    const key = options.key
    if (!key) {
      throw new Error('key is required for acquiring texture from pool')
    }

    return this.textures.retainOrCreate(key, (ref) => {
      return this.createTexture({
        ...options,
        ...{ [RefCounterKey]: ref },
      })
    })
  }

  public stats<T>(out?: T): T & DeviceStats {
    const result = (out || {}) as T & DeviceStats
    result.textureCount = this.textures.count
    result.textureStaleCount = this.textures.staleCount
    result.shaderCount = this.shaders.count
    result.shaderStaleCount = this.shaders.staleCount
    result.textureByteCount = 0
    for (const texture of this.textures) {
      result.textureByteCount += texture.sizeInBytes
    }
    return result
  }

  private mipmap2dProgram: WebGpuShaderModule
  private mipmap2dArrayProgram: WebGpuShaderModule
  private mipmapCubeProgram: WebGpuShaderModule
  private mipmapCubeArrayProgram: WebGpuShaderModule
  public async generateMipmap(texture: WebGpuTexture) {
    this.mipmap2dProgram ||= this.createWgslModule({ code: MIPMAPS_2D })
    this.mipmap2dArrayProgram ||= this.createWgslModule({ code: MIPMAPS_2D_ARRAY })
    this.mipmapCubeProgram ||= this.createWgslModule({ code: MIPMAPS_CUBE })
    this.mipmapCubeArrayProgram ||= this.createWgslModule({ code: MIPMAPS_CUBE_ARRAY })

    let program: WebGpuShaderModule
    switch (texture.gpuViewDimension) {
      case '2d':
        program = this.mipmap2dProgram
        break
      case '2d-array':
        program = this.mipmap2dArrayProgram
        break
      case 'cube':
        program = this.mipmapCubeProgram
        break
      case 'cube-array':
        program = this.mipmapCubeArrayProgram
        break
      default:
        throw new Error(`Unsupported texture dimension: ${texture.gpuViewDimension}`)
    }
    await program.ready
    const pass = this.mipmapPass
    for (let level = 1; level < texture.mipLevelCount; level++) {
      program.program.get('textureMapSampler').set(SamplerState.LinearClampNoMipMap)
      program.program.get('textureMap').set(
        texture.gpuObject.createView({
          dimension: '2d',
          baseMipLevel: level - 1,
          mipLevelCount: 1,
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        }),
      )

      for (let layer = 0; layer < texture.depth; layer++) {
        pass.setRenderTarget(0, texture, level, layer)
        pass.setViewportState(0, 0, Math.max(1, texture.width >> level), Math.max(1, texture.height >> level))
        pass.setProgram(program.program)
        pass.draw(3, 1, 0, layer)
      }
    }

    pass.flush()
  }

  public dispose() {
    this.scheduler.dispose()
    this.resizeObserver?.disconnect()
  }
}

function getOrCreateCanvas(options: WebGpuDeviceOptions): HTMLCanvasElement | OffscreenCanvas {
  const canvas = options.canvas
  const context = options.context
  if (canvas instanceof HTMLCanvasElement) {
    return canvas
  }
  if (canvas instanceof OffscreenCanvas) {
    return canvas
  }
  if (context instanceof GPUCanvasContext) {
    return context.canvas
  }

  if (typeof canvas === 'string') {
    const element = document.getElementById(canvas as string) || document.querySelector(canvas as string)
    if (element instanceof HTMLCanvasElement) {
      return element
    } else {
      throw new Error(`expected '${canvas}' to select a HTMLCanvasElement but got '${element}'`)
    }
  }

  return document.createElement('canvas')
}

function getOrCreateContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options: WebGpuDeviceOptions,
): GPUCanvasContext {
  if (options.context instanceof WebGL2RenderingContext) {
    return options.context
  }

  const context = canvas.getContext('webgpu')

  if (!context) {
    throw Error('WebGPU is not supported')
  }

  return context
}

function createRefCounter() {
  const ref = referenceCounter()
  ref.onZero(() => ref.finalize())
  return ref
}
