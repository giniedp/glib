import {
  dataTypeToArrayType,
  surfaceFormatFromWebGPU,
  surfaceFormatInfo,
  surfaceFormatToWebGPU,
  type SurfaceFormat,
  type TypedArray,
} from '../../enums'
import { DeviceOutput } from '../../resources'
import type { WebGpuDevice } from '../WebGpuDevice'

export class WebGpuDeviceOutput extends DeviceOutput {
  public readonly device: WebGpuDevice
  private configured: boolean = false
  private surfaceFormat: SurfaceFormat
  private currentTexture: GPUTexture

  /**
   * Width of the swap chain in pixels.
   */
  public get width(): number {
    return this.device.context.canvas.width
  }

  /**
   * Height of the swap chain in pixels.
   */
  public get height(): number {
    return this.device.context.canvas.height
  }

  /**
   * The format of the swap chain texture.
   */
  public get format(): SurfaceFormat {
    return this.surfaceFormat
  }

  /**
   * Lazily retrieves and caches the current render target texture from `context.getCurrentTexture()`.
   *
   * @remarks
   * The texture is fetched on first access and reused for the remainder of the render frame.
   * Since the underlying WebGPU texture becomes invalid after the next `getCurrentTexture()` call,
   * the cache is cleared in the next microtask or when the output is resized.
   */
  public get gpuObject(): GPUTexture {
    if (this.currentTexture) {
      return this.currentTexture
    }
    // The texture returned by getCurrentTexture is only valid until the next getCurrentTexture call,
    // so we need to unset it after each use
    queueMicrotask(this.unsetTexture)
    this.currentTexture = this.device.context.getCurrentTexture()
    return this.currentTexture
  }

  /**
   * The GPU texture format of the output texture
   */
  public get gpuFormat(): GPUTextureFormat {
    return this.gpuObject.format
  }

  /**
   * The dimension of the output texture, which is always '2d' for WebGPU swap chain textures.
   */
  public get gpuDimension(): GPUTextureDimension {
    return this.gpuObject.dimension
  }

  public constructor(device: WebGpuDevice, options?: { surfaceFormat: SurfaceFormat }) {
    super()
    this.device = device
    this.surfaceFormat = options?.surfaceFormat ?? surfaceFormatFromWebGPU(navigator.gpu.getPreferredCanvasFormat())
  }

  private unsetTexture = () => {
    this.currentTexture = null
  }

  /**
   * Resizes the output texture to the given size.
   * Skipped if the size is unchanged and the output has been configured before.
   *
   * @returns `true` if the output was resized, `false` if the resize was skipped.
   */
  public resize(width: number, height: number): boolean {
    if (this.width === width && this.height === height && this.configured) {
      return false
    }
    this.device.context.canvas.width = width
    this.device.context.canvas.height = height
    this.configure()
    return true
  }

  private configure() {
    if (!this.device.gpu) {
      return
    }
    this.configured = true
    this.currentTexture = null
    this.device.context.configure({
      device: this.device.gpu,
      format: surfaceFormatToWebGPU(this.surfaceFormat),
      alphaMode: 'premultiplied',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    })
  }

  public async readPixels(
    x: number = 0,
    y: number = 0,
    width: number = this.width,
    height: number = this.height,
  ): Promise<TypedArray> {
    const gpuObject = this.gpuObject
    const gpuFormat = gpuObject.format
    const format = surfaceFormatFromWebGPU(gpuFormat)
    const info = surfaceFormatInfo(format)
    if (!info || info.compression || !info.type) {
      throw new Error(`Unsupported texture format for reading: ${format}`)
    }

    const bytesPerPixel = info.bytesPerPixel
    const bytesPerRow = width * bytesPerPixel
    const bytesPerRowPadded = Math.ceil(bytesPerRow / 256) * 256

    const gpu = this.device.gpu
    const buffer = gpu.createBuffer({
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      size: bytesPerRowPadded * height,
    })

    const encoder = gpu.createCommandEncoder()
    encoder.copyTextureToBuffer(
      {
        texture: gpuObject,
        mipLevel: 0,
        origin: { x, y, z: 0 },
      },
      {
        buffer,
        bytesPerRow: bytesPerRowPadded,
        rowsPerImage: height,
      },
      {
        width,
        height,
        depthOrArrayLayers: 1,
      },
    )
    gpu.queue.submit([encoder.finish()])
    await buffer.mapAsync(GPUMapMode.READ)

    const mapped = new Uint8Array(buffer.getMappedRange())
    const compact = new Uint8Array(height * bytesPerRow)
    for (let row = 0; row < height; row++) {
      const srcOffset = row * bytesPerRowPadded
      const dstOffset = row * bytesPerRow
      compact.set(mapped.subarray(srcOffset, srcOffset + bytesPerRow), dstOffset)
    }
    buffer.unmap()

    const typedArray = dataTypeToArrayType(info.type)
    return new typedArray(compact.buffer)
  }
}
