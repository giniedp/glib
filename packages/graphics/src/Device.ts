import type { NdcMinZ } from '@gglib/math'
import type { EventChannel } from '@gglib/utils'
import type { Capabilities } from './Capabilities'
import { RenderEncoder } from './RenderEncoder'
import type {
  AcquireTextureOptions,
  Buffer,
  BufferOptions,
  DepthBufferOptions,
  DeviceOutput,
  ShaderModule,
  ShaderModuleOptions,
  Texture,
  TextureOptions,
  VertexBuffer,
  VertexBufferOptions,
} from './resources'
import { Scheduler } from './Scheduler'

/**
 * Abstract graphics device providing a unified API over WebGPU/WebGL2 for resource management,
 * command encoding, and presentation.
 * @public
 */
export abstract class Device<C extends GPUCanvasContext | WebGL2RenderingContext | unknown = unknown> {
  /**
   * Minimum normalized device coordinate (NDC) Z value used by the backend
   * @public
   */
  public abstract readonly ndcMinZ: NdcMinZ

  /**
   * Rendering target canvas
   * @public
   */
  public abstract readonly canvas: HTMLCanvasElement | OffscreenCanvas

  /**
   * Underlying graphics context (WebGPU or WebGL2)
   * @public
   */
  public abstract readonly context: C

  /**
   * Task scheduler for deferred GPU work and resource lifecycle
   * @public
   */
  public abstract readonly scheduler: Scheduler

  /**
   * Indicates a WebGL2 backend
   * @public
   */
  public abstract readonly isWebGL2: boolean

  /**
   * Indicates a WebGPU backend
   * @public
   */
  public abstract readonly isWebGPU: boolean

  /**
   * True when the device is fully initialized and usable
   * @public
   */
  public abstract readonly isReady: boolean

  /**
   * Resolves when the first device initialization completes
   * @public
   */
  public abstract readonly ready: Promise<this>

  /**
   * Fired when the graphics context is lost
   * @public
   */
  public abstract readonly onContextLost: EventChannel<void>

  /**
   * Fired when the graphics context is restored
   * @public
   */
  public abstract readonly onContextRestored: EventChannel<void>

  /**
   * Reported device and feature capabilities
   * @public
   */
  public abstract readonly capabilities: Capabilities

  /**
   * Fallback texture used when no texture is bound
   * @public
   */
  public abstract readonly defaultTexture: Texture

  /**
   * Default render pass encoder targeting the current output
   * @public
   */
  public abstract readonly renderPass: RenderEncoder

  /**
   * Presentation output (swap chain / framebuffer abstraction)
   * @public
   */
  public abstract readonly output: DeviceOutput

  /**
   * Resets render state, executes the callback with a render encoder, and submits pending commands
   * @public
   */
  public abstract render(renderFn: (pass: RenderEncoder) => void): void

  /**
   * Resets compute state, executes the callback with a compute encoder, and submits pending commands
   * @public
   */
  public abstract compute(computeFn: (pass: unknown) => void): void

  /**
   * Creates an index buffer resource
   * @public
   */
  public abstract createIndexBuffer(options: BufferOptions): Buffer

  /**
   * Creates a vertex buffer resource
   * @public
   */
  public abstract createVertexBuffer(options: VertexBufferOptions): VertexBuffer

  /**
   * Creates a shader module resource
   * @public
   */
  public abstract createShaderModule(options: ShaderModuleOptions): ShaderModule

  /**
   * Creates a standalone texture resource
   * @public
   */
  public abstract createTexture(options: TextureOptions): Texture

  /**
   * Creates a render target texture
   * @public
   */
  public abstract createRenderTarget(options: TextureOptions): Texture

  /**
   * Creates a depth/stencil render target texture
   * @public
   */
  public abstract createDepthTarget(options: DepthBufferOptions): Texture

  /**
   * Acquires a pooled shader module identified by the source code and compilation options.
   * Use `createShaderModule` for exclusive ownership.
   * @public
   */
  public abstract acquireShaderModule(options: ShaderModuleOptions): ShaderModule

  /**
   * Acquires a pooled texture identified by `options.key`.
   * Use `createTexture`/`createRenderTarget` for exclusive ownership.
   * @public
   */
  public abstract acquireTexture(options: AcquireTextureOptions): Texture

  /**
   * Releases all GPU resources owned by this device
   * @public
   */
  public abstract dispose(): void

  public abstract stats<T>(out?: T): T & DeviceStats

  /**
   * Resizes the output to the given size or derives it from canvas dimensions and device pixel ratio
   * @public
   */
  public resize(width?: number, height?: number): void {
    if (width == null || height == null) {
      // autoszie
      if (!('clientWidth' in this.canvas)) {
        // offscreen canvas does not support auto resizing
        width = this.canvas.width
        height = this.canvas.height
      } else if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
        // canvas is not visible, keep current size
        width = this.canvas.width
        height = this.canvas.height
      } else {
        width = this.canvas.clientWidth * devicePixelRatio
        height = this.canvas.clientHeight * devicePixelRatio
      }
    }

    this.output.resize(width, height)
  }

  /**
   * ResizeObserver callback that updates output size using device-pixel-accurate metrics when available
   */
  protected readonly resizeFromObserver = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0]
    if (entry.devicePixelContentBoxSize) {
      const width = entry.devicePixelContentBoxSize[0].inlineSize
      const height = entry.devicePixelContentBoxSize[0].blockSize
      this.resize(width, height)
    } else if (entry.contentBoxSize) {
      // fallback for Safari that will not always be correct
      const width = Math.round(entry.contentBoxSize[0].inlineSize * devicePixelRatio)
      const height = Math.round(entry.contentBoxSize[0].blockSize * devicePixelRatio)
      this.resize(width, height)
    } else {
      this.resize()
    }
  }
}

export interface DeviceStats {
  textureCount: number
  textureStaleCount: number
  textureByteCount: number

  shaderCount: number
  shaderStaleCount: number
}
