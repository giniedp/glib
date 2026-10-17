import { NdcMinZ } from '@gglib/math'
import { brand, eventSource, EventType } from '@gglib/utils'
import { Color } from '../Color'
import { Device, DeviceStats } from '../Device'
import { BufferUsage } from '../enums'
import { FrameScheduler } from '../FrameScheduler'
import { GpuTimer, type GpuTimerOptions } from '../GpuTimer'
import {
  createResourceTracker,
  getKeyName,
  ShaderModule,
  TextureUsage,
  type AcquireTextureOptions,
  type ResourceTracker,
  type BufferOptions,
  type DepthBufferOptions,
  type DeviceOutput,
  type ShaderModuleOptions,
  type TextureOptions,
  type VertexBufferOptions,
} from '../resources'
import { SamplerState } from '../states'
import {
  WebglBuffer,
  WebglDeviceOutput,
  WebglFrameBuffer,
  WebglFramebufferState,
  WebglSampler,
  WebglShaderModule,
  WebglTexture,
  WebglTextureUnit,
  WebglUniformBlockUnit,
  WebglVertexBuffer,
  WeblVertexArrayCache,
  type WebglShaderModuleOptions,
} from './resources'
import type { WebGLHandle } from './types'
import { WebglCapabilities } from './WebglCapabilities'
import { WebglRenderEncoder } from './WebglRenderEncoder'

/**
 * Configuration options for initializing a {@link WebglDevice} device.
 *
 * @public
 */
export interface WebglDeviceOptions {
  /**
   * Target canvas element, selector, or offscreen canvas.
   * Created if omitted, or inferred from `context` if provided.
   * @public
   */
  canvas?: string | HTMLCanvasElement | OffscreenCanvas

  /**
   * Existing WebGL canvas context to use instead of creating one
   * @public
   */
  context?: WebGL2RenderingContext

  /**
   * Enables automatic output resizing via ResizeObserver to match canvas size in device pixels.
   * @public
   */
  autosize?: boolean

  /**
   * Context attributes used when requesting WebGL context
   * @public
   */
  contextAttributes?: WebGLContextAttributes & { xrCompatible?: boolean }

  /**
   * Number of frames an acquired resource without owners is kept alive before it is destroyed. Defaults to 60.
   */
  keepAliveFrames?: number
}

/**
 * @public
 */
export const DefaultContextAttributes = Object.freeze<WebGLContextAttributes & { xrCompatible?: boolean }>({
  alpha: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true,
  // the following are false, to match parity with WebGPU
  antialias: false,
  depth: false,
  stencil: false,
})

export class WebglDevice extends Device<WebGL2RenderingContext> {
  public static onContextLost = brand<EventType<void>>('WebglDevice contextlost')
  public static onContextRestored = brand<EventType<void>>('WebglDevice contextrestored')

  public readonly ndcMinZ: NdcMinZ = NdcMinZ.MinusOne
  public readonly canvas: HTMLCanvasElement | OffscreenCanvas
  public readonly context: WebGL2RenderingContext
  public readonly scheduler = new FrameScheduler()
  public readonly isWebGL2: boolean = true
  public readonly isWebGPU: boolean = false
  public readonly isReady: boolean = false
  public readonly ready: Promise<this>

  public readonly onContextLost = eventSource<void>(WebglDevice.onContextLost)
  public readonly onContextRestored = eventSource<void>(WebglDevice.onContextRestored)

  public readonly capabilities: WebglCapabilities
  public readonly defaultTexture: WebglTexture
  public readonly defaultTextureCube: WebglTexture
  public readonly renderPass: WebglRenderEncoder
  public readonly output: DeviceOutput

  public readonly textureUnits: ReadonlyArray<WebglTextureUnit> = []
  public readonly uniformBlockUnits: ReadonlyArray<WebglUniformBlockUnit> = []
  public readonly framebuffer = new WebglFramebufferState(this)
  public readonly vaoCache = new WeblVertexArrayCache(this)

  private activeProgram: WebGLProgram = undefined
  private readBackBuffer: WebglFrameBuffer

  protected textures: ResourceTracker<WebglTexture>
  protected shaders: ResourceTracker<WebglShaderModule>
  protected buffers = createResourceTracker<WebglBuffer | WebglVertexBuffer>()
  protected samplers = new Map<SamplerState, WebglSampler>()
  protected resizeObserver: ResizeObserver

  public constructor(options: WebglDeviceOptions) {
    super()
    const trackerOptions = { keepAliveFrames: options.keepAliveFrames, scheduler: this.scheduler }
    this.textures = createResourceTracker(trackerOptions)
    this.shaders = createResourceTracker(trackerOptions)
    this.canvas = getOrCreateCanvas(options)
    this.context = getOrCreateContext(this.canvas, options)
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost)
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored)

    this.capabilities = new WebglCapabilities(this)
    this.textureUnits = Array.from({ length: this.capabilities.maxTextureCount }).map((_, i) => {
      return new WebglTextureUnit(this, i)
    })
    this.uniformBlockUnits = Array.from({ length: this.capabilities.maxUniformBlockCount }).map((_, i) => {
      return new WebglUniformBlockUnit(this, i)
    })
    this.output = new WebglDeviceOutput(this)
    this.defaultTexture = this.createTexture({
      source: Color.toByteArray(Color.Black, Color.DimGray, Color.DimGray, Color.Black),
      width: 2,
      height: 2,
      format: 'rgba8unorm',
    })
    this.defaultTextureCube = this.createTexture({
      type: 'cube',
      width: 2,
      height: 2,
      // depth: 6,
      format: 'rgba8unorm',
    })
    // explicitly owned, so other scopes may share but never take them over
    this.scope.adopt(this.defaultTexture)
    this.scope.adopt(this.defaultTextureCube)
    this.renderPass = new WebglRenderEncoder(this)

    this.resize()
    this.ready = Promise.resolve(this)
    this.isReady = true
    if (this.canvas instanceof HTMLCanvasElement && options.autosize) {
      this.resizeObserver = new ResizeObserver(this.resizeFromObserver)
      this.resizeObserver.observe(this.canvas)
    }
  }

  public dispose() {
    this.scheduler.dispose()
    this.scope.dispose()
    this.textures.finalizeAll()
    this.shaders.finalizeAll()
    this.buffers.finalizeAll()
    this.resizeObserver?.disconnect()
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost, false)
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored, false)
    this.capabilities.extension('WEBGL_lose_context')?.loseContext()
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault()
    this.onContextLost.emit()
  }

  private handleContextRestored = () => {
    // TODO:
    this.onContextRestored.emit()
  }

  public simulateContextLoss() {
    this.capabilities.extension('WEBGL_lose_context')?.loseContext()
  }

  public restoreContext() {
    this.capabilities.extension('WEBGL_lose_context')?.restoreContext()
  }

  public render(renderFn: (pass: WebglRenderEncoder) => void): void {
    const pass = this.renderPass
    renderFn(pass)
    pass.flush()
  }

  public compute(_: (pass: unknown) => void): void {
    throw new Error('compute is not supported in WebGL')
  }

  public createIndexBuffer(options: BufferOptions): WebglBuffer {
    options.indexType ??= 'uint16'
    return this.createBuffer({
      ...options,
      usage: (options.usage ?? 0) | BufferUsage.INDEX,
    })
  }

  public createUniformBuffer(options: BufferOptions): WebglBuffer {
    return this.createBuffer({
      ...options,
      usage: (options.usage ?? 0) | BufferUsage.UNIFORM,
    })
  }

  public createVertexBuffer(options: VertexBufferOptions): WebglVertexBuffer {
    return this.claim(this.buffers.track(new WebglVertexBuffer(this, options)))
  }

  public createBuffer(options: BufferOptions): WebglBuffer {
    return this.claim(this.buffers.track(new WebglBuffer(this, options)), options.scope)
  }

  public getSampler(state: SamplerState): WebglSampler {
    if (!this.samplers.has(state)) {
      this.samplers.set(state, new WebglSampler(this, state))
    }
    return this.samplers.get(state)
  }

  public createTexture(options: TextureOptions): WebglTexture {
    const result = this.textures.track(new WebglTexture(this, { ...options }))
    return this.claim(result, options.scope)
  }

  public createRenderTarget(options: TextureOptions): WebglTexture {
    options.width ??= this.output.width
    options.height ??= this.output.height
    options.format ??= this.output.format
    options.generateMipmap ??= false
    options.mipLevelCount ??= 1
    options.sampleCount ??= 1
    options.usage ??= 0
    options.usage |= TextureUsage.RenderTarget
    return this.createTexture(options)
  }

  public createDepthTarget(options: DepthBufferOptions): WebglTexture {
    options.width ??= this.output.width
    options.height ??= this.output.height
    options.format ??= 'depth24plus-stencil8'
    options.generateMipmap ??= false
    options.mipLevelCount ??= 1
    options.sampleCount ??= 1
    options.usage ??= 0
    options.usage |= TextureUsage.RenderTarget
    return this.createTexture(options)
  }

  /**
   * Creates an untracked shader module that is owned by the caller
   */
  public createGlslModule(options: WebglShaderModuleOptions): WebglShaderModule {
    return new WebglShaderModule(this, options)
  }

  public createShaderModule(options: ShaderModuleOptions): WebglShaderModule {
    const result = this.shaders.track(this.allocShaderModule(options))
    return this.claim(result, options.scope)
  }

  public acquireShaderModule(options: ShaderModuleOptions): ShaderModule {
    if (!('glsl' in options)) {
      throw new Error('Only GLSL shader source is supported in WebGL')
    }

    const key = options.glsl.vertex + options.glsl.fragment
    const result = this.shaders.get(key) || this.shaders.share(key, this.allocShaderModule(options))
    return (options.scope ?? this.scope).adopt(result)
  }

  private allocShaderModule(options: ShaderModuleOptions): WebglShaderModule {
    if (!('glsl' in options)) {
      throw new Error('Only GLSL shader source is supported in WebGL')
    }
    return this.createGlslModule({
      vertex: options.glsl.vertex,
      fragment: options.glsl.fragment,
    })
  }

  public acquireTexture(options: AcquireTextureOptions): WebglTexture {
    const key = options.key
    if (!key) {
      throw new Error('key is required for acquiring texture from pool')
    }

    let result = this.textures.get(key)
    if (!result) {
      if (options.throwIfMissing) {
        throw new Error(`Texture not found for key: ${getKeyName(key)}`)
      }
      result = this.textures.share(key, new WebglTexture(this, { ...options }))
    }
    return this.claim(result, options.scope)
  }

  public createGpuTimer(options?: GpuTimerOptions): GpuTimer {
    // TODO: EXT_disjoint_timer_query_webgl2, until then timers are inert
    return new GpuTimer(-1, options)
  }

  public resolveGpuTimers(): void {
    // TODO: EXT_disjoint_timer_query_webgl2
  }

  public stats<T>(out?: T): T & DeviceStats {
    const result = (out || {}) as T & DeviceStats
    result.textureCount = this.textures.count
    result.textureStaleCount = this.textures.staleCount
    result.shaderCount = this.shaders.count
    result.shaderStaleCount = this.shaders.staleCount
    result.bufferCount = this.buffers.count
    result.textureByteCount = 0
    for (const texture of this.textures) {
      result.textureByteCount += texture.sizeInBytes
    }
    return result
  }

  public activateProgram(resource: WebGLHandle<WebGLProgram> | null) {
    if (this.activeProgram === resource) {
      return this.activeProgram
    }
    const old = this.activeProgram || null
    this.activeProgram = resource
    this.context.useProgram(resource)
    return old
  }

  public checkFramebufferStatus(frameBuffer: WebglFrameBuffer) {
    checkFramebufferStatus(this.context, frameBuffer)
  }

  public readPixels(
    texture: WebglTexture,
    x: number = 0,
    y: number = 0,
    width: number = texture.width,
    height: number = texture.height,
  ): Uint8ClampedArray<ArrayBuffer> {
    if (texture.sampleCount > 1) {
      throw new Error('Reading pixels from multisampled textures is not supported in WebGL')
    }
    const gl = this.context

    const restoreRead = this.framebuffer.read
    const restoreDraw = this.framebuffer.draw

    if (!this.readBackBuffer) {
      this.readBackBuffer = new WebglFrameBuffer(this)
    }
    this.readBackBuffer.setRenderTarget(0, texture, 0, 0)
    this.readBackBuffer.activate()

    const data = new Uint8ClampedArray(width * height * 4)
    gl.readPixels(x, y, width, height, this.context.RGBA, this.context.UNSIGNED_BYTE, data)

    this.framebuffer.restore(restoreRead, restoreDraw)
    return data
  }
}

function getOrCreateCanvas(options: WebglDeviceOptions): HTMLCanvasElement | OffscreenCanvas {
  const canvas = options.canvas
  const context = options.context
  if (canvas instanceof HTMLCanvasElement) {
    return canvas
  }
  if (canvas instanceof OffscreenCanvas) {
    return canvas
  }
  if (context instanceof WebGL2RenderingContext) {
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
  options: WebglDeviceOptions,
): WebGL2RenderingContext {
  if (options.context instanceof WebGL2RenderingContext) {
    return options.context
  }

  const context = canvas.getContext('webgl2', {
    ...DefaultContextAttributes,
    ...(options.contextAttributes || {}),
  })

  if (!context) {
    throw Error('WebGL is not supported')
  }

  return context
}

function checkFramebufferStatus(gl: WebGL2RenderingContext, _: WebglFrameBuffer) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  switch (status) {
    case gl.FRAMEBUFFER_COMPLETE:
      return true
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      throw new Error('FRAMEBUFFER_INCOMPLETE_ATTACHMENT')
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      throw new Error('FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT')
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      throw new Error('FRAMEBUFFER_INCOMPLETE_DIMENSIONS')
    case gl.FRAMEBUFFER_UNSUPPORTED:
      throw new Error('FRAMEBUFFER_UNSUPPORTED')
    case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      throw new Error('FRAMEBUFFER_INCOMPLETE_MULTISAMPLE')
    default:
      throw new Error(`Unknown framebuffer status: ${status}`)
  }
}
