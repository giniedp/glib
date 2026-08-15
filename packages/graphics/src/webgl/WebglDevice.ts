import { NdcMinZ } from '@gglib/math'
import { brand, eventSource, EventType } from '@gglib/utils'
import { Color } from '../Color'
import { Device, DeviceStats } from '../Device'
import {
  createResourceTracker,
  getRefCounter,
  RefCounterKey,
  referenceCounter,
  ShaderModule,
  Texture,
  TextureUsage,
  type AcquireTextureOptions,
  type BufferOptions,
  type DepthBufferOptions,
  type DeviceOutput,
  type ShaderModuleOptions,
  type TextureOptions,
  type VertexBufferOptions,
} from '../resources'
import { Scheduler } from '../Scheduler'
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
  public readonly scheduler = new Scheduler()
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

  protected textures = createResourceTracker<WebglTexture>()
  protected shaders = createResourceTracker<WebglShaderModule>()
  protected samplers = new Map<SamplerState, WebglSampler>()
  protected resizeObserver: ResizeObserver

  public constructor(options: WebglDeviceOptions) {
    super()
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
      format: 'RGBA8_UNORM',
    })
    this.defaultTextureCube = this.createTexture({
      type: 'TextureCube',
      width: 2,
      height: 2,
      // depth: 6,
      format: 'RGBA8_UNORM',
    })
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
    this.resizeObserver?.disconnect()
    // TODO: dispose resources
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
    return new WebglBuffer(this, {
      ...options,
      type: 'IndexBuffer',
    })
  }

  public createUniformBuffer(options: BufferOptions): WebglBuffer {
    return new WebglBuffer(this, {
      ...options,
      type: 'UniformBuffer',
    })
  }

  public createVertexBuffer(options: VertexBufferOptions): WebglVertexBuffer {
    return new WebglVertexBuffer(this, options)
  }

  public createBuffer(options: BufferOptions): WebglBuffer {
    return new WebglBuffer(this, options)
  }

  public getSampler(state: SamplerState): WebglSampler {
    if (!this.samplers.has(state)) {
      this.samplers.set(state, new WebglSampler(this, state))
    }
    return this.samplers.get(state)
  }

  public createTexture(options: TextureOptions): WebglTexture {
    const result = new WebglTexture(this, {
      ...options,
      ...{ [RefCounterKey]: getRefCounter(options) || createRefCounter() },
    })
    this.textures.track(result)
    return result
  }

  public createRenderTarget(options: TextureOptions): WebglTexture {
    options.generateMipmap ??= false
    options.mipLevelCount ??= 1
    options.sampleCount ??= 1
    options.usage ??= 0
    options.usage |= TextureUsage.RenderTarget
    return this.createTexture(options)
  }

  public createDepthTarget(options: DepthBufferOptions): WebglTexture {
    options.generateMipmap ??= false
    options.mipLevelCount ??= 1
    options.sampleCount ??= 1
    options.usage |= TextureUsage.RenderTarget
    return this.createTexture(options)
  }

  public createGlslModule(options: WebglShaderModuleOptions): WebglShaderModule {
    return new WebglShaderModule(this, {
      ...options,
      ...{ [RefCounterKey]: getRefCounter(options) || createRefCounter() },
    })
  }

  public createShaderModule(options: ShaderModuleOptions): WebglShaderModule {
    if (!('glsl' in options)) {
      throw new Error('Only GLSL shader source is supported in WebGL')
    }

    const result = this.createGlslModule({
      vertex: options.glsl.vertex,
      fragment: options.glsl.fragment,
      ...{ [RefCounterKey]: getRefCounter(options) || createRefCounter() },
    })
    this.shaders.track(result)
    return result
  }

  public acquireShaderModule(options: ShaderModuleOptions): ShaderModule {
    if (!('glsl' in options)) {
      throw new Error('Only GLSL shader source is supported in WebGL')
    }

    const key = options.glsl.vertex + options.glsl.fragment
    return this.shaders.retainOrCreate(key, (ref) => {
      return this.createShaderModule({
        ...options,
        ...{ [RefCounterKey]: ref },
      })
    })
  }

  public acquireTexture(options: AcquireTextureOptions): Texture {
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

function createRefCounter() {
  const ref = referenceCounter()
  ref.onZero(() => ref.finalize())
  return ref
}
