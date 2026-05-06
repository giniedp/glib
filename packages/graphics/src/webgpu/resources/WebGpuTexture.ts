import type { Device } from '../../Device'
import {
  dataTypeToArrayType,
  surfaceFormatFromWebGPU,
  surfaceFormatInfo,
  surfaceFormatIsCompressed,
  surfaceFormatToWebGPU,
  textureTypeToWebGPU,
  textureTypeToWebGPUDimension,
  type TypedArray,
} from '../../enums'
import {
  CompressedFaceData,
  createTextureSource,
  isCompressedFaceData,
  RefCounterKey,
  Texture,
  TextureSource,
  TextureUsage,
  type ReferenceCounted,
  type ReferenceCounter,
  type TextureOptions,
} from '../../resources'
import type { GpuResource } from '../types'
import type { WebGpuDevice } from '../WebGpuDevice'

/**
 * Describes a texture object.
 *
 * @public
 */
export class WebGpuTexture extends Texture implements GpuResource<GPUTexture>, ReferenceCounted {
  /**
   * The graphics device
   */
  public readonly device: WebGpuDevice
  public readonly isSampled: boolean
  public readonly isRenderTarget: boolean
  public readonly isMultisampled: boolean

  public readonly ref: ReferenceCounter = null
  public readonly gpuObject: GPUTexture
  public readonly gpuFormat: GPUTextureFormat
  public readonly gpuDimension: GPUTextureDimension
  public readonly gpuViewDimension: GPUTextureViewDimension

  /**
   * Constructs an instance of a Texture.
   */
  public constructor(device: Device, options: TextureOptions) {
    super()
    this.device = device as WebGpuDevice

    this.ref = options[RefCounterKey] || null
    if (this.ref) {
      this.ref.retain()
      this.ref.onFinalize(() => {
        this.unbindSource()
        this.finalize()
      })
    }

    options.sampleCount ??= 1
    options.generateMipmap ??= !!options.source
    options.usage ??= TextureUsage.Sampled
    if (options.sampleCount > 1) {
      options.usage |= TextureUsage.RenderTarget
    }

    const usage = options.usage
    const isSampled = !!(usage & TextureUsage.Sampled)
    const isRenderTarget = !!(usage & TextureUsage.RenderTarget)
    const isRenderBuffer = isRenderTarget && !isSampled
    if (isRenderBuffer && options.generateMipmap) {
      console.warn('WebglTexture: generateMipmap is not supported for renderbuffers and will be ignored')
      options.generateMipmap = false
    }
    if (options.sampleCount > 1 && !isRenderTarget) {
      console.warn('WebglTexture: multisampling is only supported for render targets. sampleCount will be ignored')
      options.sampleCount = 1
    }

    const self = this as Mutable<this>
    self.name = options.name ?? this.name
    self.width = options.width ?? this.width
    self.height = options.height ?? this.height
    self.depth = options.depth ?? this.depth

    self.type = options?.type ?? this.type
    self.format = options?.format ?? this.format
    self.generateMipmap = options?.generateMipmap ?? this.generateMipmap
    self.crossOrigin = options?.crossOrigin ?? this.crossOrigin
    self.isSampled = isSampled
    self.isRenderTarget = isRenderTarget
    self.isMultisampled = options.sampleCount > 1
    self.isCompressed = surfaceFormatIsCompressed(this.format)
    self.mipLevelCount = options.mipLevelCount ?? getMipmapCount(this.width, this.height, this.depth)
    self.sampleCount = options.sampleCount ?? 1
    self.gpuDimension = textureTypeToWebGPUDimension(this.type)
    self.gpuViewDimension = textureTypeToWebGPU(this.type)
    self.gpuFormat = surfaceFormatToWebGPU(this.format)

    if (this.isCompressed && this.generateMipmap) {
      console.warn('WebGpuTexture: generateMipmap is not supported for compressed textures and will be ignored')
      self.generateMipmap = false
    }

    if (!this.gpuFormat) {
      throw new Error(`Unsupported texture format: ${this.format}`)
    }
    if (!this.gpuDimension) {
      throw new Error(`Unsupported texture type: ${this.type}`)
    }
    if (!this.gpuViewDimension) {
      throw new Error(`Unsupported texture type for view dimension: ${this.type}`)
    }

    this.createResource()

    const source = createTextureSource(options.source, {
      crossOrigin: this.crossOrigin,
      videoTypes: Texture.videoTypes,
      width: this.width,
      height: this.height,
      format: this.format,
    })
    if (source) {
      this.bindSource(source)
    }
  }

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public dispose(): void {
    if (this.ref) {
      this.ref.release()
    } else {
      this.finalize()
    }
  }

  private finalize(): void {
    const self = this as Mutable<this>
    self.gpuObject?.destroy()
    self.gpuObject = null
  }

  private createResource(): void {
    const self = this as Mutable<this>
    self.gpuObject?.destroy()
    self.gpuObject = this.device.gpu.createTexture({
      label: this.name || `Texture_${this.uid}`,
      format: this.gpuFormat,
      sampleCount: this.sampleCount,
      size: {
        width: this.width,
        height: this.height,
        depthOrArrayLayers: this.depth,
      },
      usage:
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.COPY_SRC |
        (this.isSampled ? GPUTextureUsage.TEXTURE_BINDING : 0) |
        (this.isRenderTarget ? GPUTextureUsage.RENDER_ATTACHMENT : 0) |
        (this.generateMipmap ? GPUTextureUsage.RENDER_ATTACHMENT : 0),
      dimension: this.gpuDimension,
      mipLevelCount: this.mipLevelCount,
      textureBindingViewDimension: textureTypeToWebGPU(this.type),
    })
    self.sizeInBytes = this.estimateSize()
  }

  public resize(width: number, height: number, depth: number = 1) {
    let needsResize = false
    const self = this as Mutable<this>
    switch (this.type) {
      case 'TextureCube': {
        needsResize = this.width !== width || this.height !== height
        self.width = width
        self.height = height
        self.depth = 6
        break
      }
      case 'Texture2D': {
        needsResize = this.width !== width || this.height !== height
        self.width = width
        self.height = height
        self.depth = 1
        break
      }
      case 'Texture2DArray': {
        needsResize = this.width !== width || this.height !== height || this.depth !== depth
        self.width = width
        self.height = height
        self.depth = depth
        break
      }
      case 'Texture3D': {
        needsResize = this.width !== width || this.height !== height || this.depth !== depth
        self.width = width
        self.height = height
        self.depth = depth
        break
      }
    }

    if (needsResize) {
      this.createResource()
    }
  }

  public setDataFromSource(source: TextureSource): void {
    if (!source) {
      return
    }
    this.resize(source.width, source.height, this.type === 'TextureCube' ? 6 : source.levels[0].length)
    switch (this.type) {
      case 'TextureCube': {
        setData(source, this, 6)
        break
      }
      case 'Texture2D': {
        setData(source, this, 1)
        break
      }
      case 'Texture2DArray': {
        setData(source, this, null)
        break
      }
      case 'Texture3D': {
        setData(source, this, null)
        break
      }
    }
    if (this.generateMipmap && !this.isCompressed) {
      this.updateMipmaps()
    }
  }

  /**
   * Generates mipmaps for the texture only if the texture was created with `generateMipmap` option set to `true`.
   */
  public updateMipmaps(force = false): void {
    if (!this.generateMipmap && !force) {
      return
    }
    this.device.generateMipmap(this)
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

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}
function setData(source: TextureSource, image: WebGpuTexture, faceCount: number | null) {
  const gpu = image.device.gpu
  const queue = gpu.queue
  const encoder = image.isCompressed ? gpu.createCommandEncoder() : null
  const buffers: GPUBuffer[] = []
  for (let mipIndex = 0; mipIndex < Math.min(6, source.levels.length); mipIndex++) {
    const level = source.levels[mipIndex]
    const divisor = Math.pow(2, mipIndex)
    const width = source.width / divisor
    const height = source.height / divisor
    for (let faceIndex = 0; faceIndex < Math.min(level.length, faceCount ?? level.length); faceIndex++) {
      const data = level[faceIndex]
      if (ArrayBuffer.isView(data)) {
        if (image.isCompressed) {
          console.warn(
            `Compressed texture expects data in the form of CompressedFaceData, but received ArrayBufferView. Attempting to upload as uncompressed texture data.`,
          )
        }

        queue.writeTexture(
          {
            texture: image.gpuObject,
            mipLevel: mipIndex,
            origin: { x: 0, y: 0, z: faceIndex },
          },
          data.buffer,
          {
            offset: data.byteOffset,
            bytesPerRow: width * (data.byteLength / (width * height)),
            rowsPerImage: height,
          },
          {
            width,
            height,
            depthOrArrayLayers: 1,
          },
        )
      } else if (isCompressedFaceData(data)) {
        if (!image.isCompressed) {
          console.warn(
            `Uncompressed texture expects data in the form of ArrayBufferView, but received CompressedFaceData. Attempting to upload as compressed texture data.`,
          )
        }
        const aligned = ensure256RowAlignment(data)
        const buffer = gpu.createBuffer({
          size: aligned.data.byteLength,
          usage: GPUBufferUsage.COPY_SRC,
          mappedAtCreation: true,
        })
        new Uint8Array(buffer.getMappedRange()).set(
          new Uint8Array(aligned.data.buffer, aligned.data.byteOffset, aligned.data.byteLength),
        )
        buffer.unmap()
        encoder.copyBufferToTexture(
          {
            buffer,
            bytesPerRow: aligned.bytesPerRow,
            rowsPerImage: aligned.rows,
          },
          {
            texture: image.gpuObject,
            mipLevel: mipIndex,
            origin: { x: 0, y: 0, z: faceIndex },
          },
          {
            width,
            height,
            depthOrArrayLayers: 1,
          },
        )

        buffers.push(buffer)
      } else {
        queue.copyExternalImageToTexture(
          {
            source: data,
            // flipY: true, TODO: add option to flipY
          },
          {
            texture: image.gpuObject,
            mipLevel: mipIndex,
            origin: { x: 0, y: 0, z: faceIndex },
          },
          {
            width: width,
            height: height,
            depthOrArrayLayers: 1,
          },
        )
      }
    }
  }
  if (encoder) {
    const commandBuffer = encoder.finish()
    gpu.queue.submit([commandBuffer])
    buffers.forEach((buffer) => buffer.destroy())
  }
}

function getMipmapCount(width: number, height: number, depth: number): number {
  return 1 + Math.floor(Math.log2(Math.max(1, width || 1, height || 1, depth || 1)))
}
function align(value: number, alignment: number): number {
  return (value + alignment - 1) & ~(alignment - 1)
}

export function ensure256RowAlignment(face: CompressedFaceData): CompressedFaceData {
  const { data, rows, bytesPerRow } = face

  if (rows <= 1 && bytesPerRow <= 256) {
    return face
  }

  const aligned = align(bytesPerRow, 256)
  if (aligned === bytesPerRow) {
    return face
  }

  const src = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  const dst = new Uint8Array(aligned * rows)

  for (let r = 0; r < rows; r++) {
    const srcOffset = r * bytesPerRow
    const dstOffset = r * aligned

    dst.set(src.subarray(srcOffset, srcOffset + bytesPerRow), dstOffset)
  }

  return {
    data: dst,
    rows,
    bytesPerRow: aligned,
  }
}
