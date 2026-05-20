import {
  surfaceFormatIsCompressed,
  surfaceFormatToWebGL,
  surfaceFormatToWebGLDataType,
  surfaceFormatToWebGLFormat,
  textureTypeToWebGL,
  type TypedArray,
} from '../../enums'
import {
  createTextureSource,
  isCompressedFaceData,
  RefCounterKey,
  type ReferenceCounter,
  Texture,
  type TextureOptions,
  TextureSource,
  TextureUsage,
} from '../../resources'
import { SamplerState } from '../../states'
import type { WebglResource } from '../types'
import type { WebglDevice } from '../WebglDevice'
import type { WebglTextureUnit } from './WebglTextureUnit'

/**
 * Describes a texture object.
 *
 * @public
 */
export class WebglTexture extends Texture implements WebglResource<WebGLTexture | WebGLRenderbuffer> {
  /**
   * The graphics device
   */
  public readonly device: WebglDevice

  public readonly glType: GLenum
  public readonly glInternalFormat: GLenum
  public readonly glDataFormat: GLenum
  public readonly glDataType: GLenum
  public readonly glHandle: WebGLTexture | WebGLRenderbuffer
  public readonly isSampled: boolean
  public readonly isRenderTarget: boolean
  public readonly isMultisampled: boolean
  public readonly isRenderBuffer: boolean
  public readonly ref: ReferenceCounter

  /**
   * Constructs an instance of a Texture.
   */
  constructor(device: WebglDevice, options: TextureOptions) {
    super()
    this.device = device

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

    self.type = options.type ?? this.type
    self.format = options.format ?? this.format
    self.generateMipmap = !isRenderBuffer && (options.generateMipmap ?? false)
    self.crossOrigin = options.crossOrigin ?? this.crossOrigin

    self.isSampled = isSampled
    self.isRenderTarget = isRenderTarget
    self.isRenderBuffer = isRenderBuffer
    self.isMultisampled = options.sampleCount > 1
    self.isCompressed = surfaceFormatIsCompressed(this.format)
    self.mipLevelCount = options.mipLevelCount ?? getMipmapCount(this.width, this.height, this.depth)
    self.sampleCount = options.sampleCount ?? 1

    if (this.isRenderBuffer) {
      self.glType = this.device.context.RENDERBUFFER
    } else {
      self.glType = textureTypeToWebGL(this.type)
    }
    self.glInternalFormat = surfaceFormatToWebGL(this.format)
    self.glDataFormat = surfaceFormatToWebGLFormat(this.format)
    self.glDataType = surfaceFormatToWebGLDataType(this.format)
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

  public async readPixels(
    x: number = 0,
    y: number = 0,
    width: number = this.width,
    height: number = this.height,
  ): Promise<TypedArray> {
    return this.device.readPixels(this, x, y, width, height)
  }

  private finalize(): void {
    const gl = this.device.context
    if (!this.isRenderBuffer && gl.isTexture(this.glHandle)) {
      gl.deleteTexture(this.glHandle)
    }
    if (this.isRenderBuffer && gl.isRenderbuffer(this.glHandle)) {
      gl.deleteRenderbuffer(this.glHandle)
    }
    ;(this as Mutable<this>).glHandle = null
  }

  private createResource(): void {
    this.finalize()
    const gl = this.device.context
    const self = this as Mutable<this>
    self.sizeInBytes = this.estimateSize()
    if (this.isRenderBuffer) {
      self.glHandle = gl.createRenderbuffer()
      gl.bindRenderbuffer(this.glType, this.glHandle)
      if (this.sampleCount > 1) {
        gl.renderbufferStorageMultisample(this.glType, 4, this.glInternalFormat, this.width, this.height)
      } else {
        gl.renderbufferStorage(this.glType, this.glInternalFormat, this.width, this.height)
      }
      gl.bindRenderbuffer(this.glType, null)
    } else {
      self.glHandle = gl.createTexture()
      this.device.textureUnits[0].activate(this, SamplerState.Default)
      // if (this.format === 'DEPTH32_FLOAT' || this.format === 'DEPTH32_FLOAT_STENCIL8') {
      //   this.device.textureUnits[0].activate(this, SamplerState.PointClamp)
      // } else {
      // }
      const mipmapCount = this.mipLevelCount
      if (this.type === 'Texture2D') {
        gl.texStorage2D(this.glType, mipmapCount, this.glInternalFormat, this.width, this.height)
        if (this.format === 'DEPTH32_FLOAT' || this.format === 'DEPTH32_FLOAT_STENCIL8') {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE)
        }
      } else if (this.type === 'TextureCube') {
        gl.texStorage2D(this.glType, mipmapCount, this.glInternalFormat, this.width, this.height)
      } else if (this.type === 'Texture2DArray') {
        gl.texStorage3D(this.glType, mipmapCount, this.glInternalFormat, this.width, this.height, this.depth)
      } else if (this.type === 'Texture3D') {
        gl.texStorage3D(this.glType, mipmapCount, this.glInternalFormat, this.width, this.height, this.depth)
      }
    }
  }

  public resize(width: number, height: number, depth: number = 1) {
    const mutable = this as Mutable<this>
    let needsResize = false
    switch (this.type) {
      case 'TextureCube': {
        needsResize = this.width !== width || this.height !== height
        mutable.width = width
        mutable.height = height
        mutable.depth = 6
        break
      }
      case 'Texture2D': {
        needsResize = this.width !== width || this.height !== height
        mutable.width = width
        mutable.height = height
        mutable.depth = 1
        break
      }
      case 'Texture2DArray': {
        needsResize = this.width !== width || this.height !== height || this.depth !== depth
        mutable.width = width
        mutable.height = height
        mutable.depth = depth
        break
      }
      case 'Texture3D': {
        needsResize = this.width !== width || this.height !== height || this.depth !== depth
        mutable.width = width
        mutable.height = height
        mutable.depth = depth
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
    if (this.isRenderBuffer) {
      console.warn('WebglTexture: setData is not supported for renderbuffers', new Error().stack)
      return
    }
    this.resize(source.width, source.height, this.type === 'TextureCube' ? 6 : source.levels[0].length)

    switch (this.type) {
      case 'TextureCube': {
        setDataCubemap(this.device.textureUnits[0], source, this)
        break
      }
      case 'Texture2D': {
        setData2D(this.device.textureUnits[0], source, this)
        break
      }
      case 'Texture2DArray': {
        setData2DArray(this.device.textureUnits[0], source, this)
        break
      }
      case 'Texture3D': {
        setData3D(this.device.textureUnits[0], source, this)
        break
      }
    }

    if (this.generateMipmap && !this.isCompressed) {
      this.updateMipmaps()
    }
  }

  /**
   * Generates mipmaps for the texture
   */
  public updateMipmaps(): void {
    if (this.isRenderBuffer) {
      console.warn('WebglTexture: updateMipmaps is not supported for renderbuffers', new Error().stack)
      return
    }
    this.device.textureUnits[0].activate(this, SamplerState.LinearClampNoMipMap)
    this.device.context.generateMipmap(this.glType)
  }
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

function setDataCubemap(unit: WebglTextureUnit, source: TextureSource, image: WebglTexture) {
  const gl = image.device.context
  const mipLevels = source.levels
  const mipCount = getMipmapCount(source.width, source.height, 1)
  unit.activate(image, SamplerState.Default)
  for (let lvl = 0; lvl < Math.min(mipCount, mipLevels.length); lvl++) {
    const faces = mipLevels[lvl]
    const divisor = Math.pow(2, lvl)
    const width = source.width / divisor
    const height = source.height / divisor
    if (faces.length !== 6) {
      console.warn(`TextureGL.update: cubemap level ${lvl} has ${faces.length} faces, expected 6`)
      continue
    }
    for (let i = 0; i < faces.length; i++) {
      const data = faces[i]
      if (ArrayBuffer.isView(data)) {
        if (image.isCompressed) {
          gl.compressedTexSubImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            lvl,
            0, // x offset
            0, // y offset
            width,
            height,
            image.glInternalFormat,
            data,
          )
        } else {
          gl.texSubImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            lvl,
            0, // x offset
            0, // y offset
            width,
            height,
            image.glDataFormat,
            image.glDataType,
            data,
          )
        }
      } else if (isCompressedFaceData(data)) {
        gl.compressedTexSubImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          lvl,
          0, // x offset
          0, // y offset
          width,
          height,
          image.glInternalFormat,
          data.data,
        )
      } else {
        // TODO: add option to flipY
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texSubImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          lvl,
          0, // x offset
          0, // y offset
          width,
          height,
          image.glDataFormat,
          image.glDataType,
          data,
        )
      }
    }
  }
}

function setData2D(unit: WebglTextureUnit, source: TextureSource, image: WebglTexture) {
  const gl = image.device.context
  const mipLevels = source.levels
  const mipCount = getMipmapCount(source.width, source.height, 1)
  unit.activate(image, SamplerState.Default)

  for (let lvl = 0; lvl < Math.min(mipCount, mipLevels.length); lvl++) {
    const data = mipLevels[lvl][0]
    const divisor = Math.pow(2, lvl)
    const width = source.width / divisor
    const height = source.height / divisor
    if (ArrayBuffer.isView(data)) {
      if (image.isCompressed) {
        gl.compressedTexSubImage2D(
          image.glType,
          lvl,
          0, // x offset
          0, // y offset
          width,
          height,
          image.glInternalFormat,
          data,
        )
      } else {
        gl.texSubImage2D(
          image.glType,
          lvl,
          0, // x offset
          0, // y offset
          width,
          height,
          image.glDataFormat,
          image.glDataType,
          data,
        )
      }
    } else if (isCompressedFaceData(data)) {
      gl.compressedTexSubImage2D(
        image.glType,
        lvl,
        0, // x offset
        0, // y offset
        width,
        height,
        image.glInternalFormat,
        data.data,
      )
    } else {
      // TODO: add option to flipY
      // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texSubImage2D(
        image.glType,
        lvl,
        0, // x offset
        0, // y offset
        width,
        height,
        image.glDataFormat,
        image.glDataType,
        data,
      )
    }
  }
}

function setData2DArray(unit: WebglTextureUnit, source: TextureSource, image: WebglTexture) {
  const gl = image.device.context
  unit.activate(image, SamplerState.Default)
  for (let lvl = 0; lvl < source.levels.length; lvl++) {
    const level = source.levels[lvl]
    const divisor = Math.pow(2, lvl)
    const width = source.width / divisor
    const height = source.height / divisor
    for (let i = 0; i < level.length; i++) {
      const face = level[i]
      if (ArrayBuffer.isView(face)) {
        if (image.isCompressed) {
          gl.compressedTexSubImage3D(
            image.glType,
            lvl,
            0, // x offset
            0, // y offset
            i, // z offset
            width,
            height,
            1, // depth
            image.glInternalFormat,
            face,
          )
        } else {
          gl.texSubImage3D(
            image.glType,
            lvl,
            0, // x offset
            0, // y offset
            i, // z offset
            width,
            height,
            1, // depth
            image.glDataFormat,
            image.glDataType,
            face,
          )
        }
      } else if (isCompressedFaceData(face)) {
        gl.compressedTexSubImage3D(
          image.glType,
          lvl,
          0, // x offset
          0, // y offset
          i, // z offset
          width,
          height,
          1, // depth
          image.glInternalFormat,
          face.data,
        )
      } else {
        // TODO: add option to flipY
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texSubImage3D(
          image.glType,
          lvl,
          0, // x offset
          0, // y offset
          i, // z offset
          width,
          height,
          1, // depth
          image.glDataFormat,
          image.glDataType,
          face,
        )
      }
    }
  }
}

function setData3D(unit: WebglTextureUnit, source: TextureSource, image: WebglTexture) {
  const gl = image.device.context
  unit.activate(image, SamplerState.Default)
  for (let lvl = 0; lvl < source.levels.length; lvl++) {
    const level = source.levels[lvl]
    const divisor = Math.pow(2, lvl)
    const width = source.width / divisor
    const height = source.height / divisor
    for (let i = 0; i < level.length; i++) {
      const face = level[i]
      if (ArrayBuffer.isView(face)) {
        gl.texSubImage3D(
          image.glType,
          lvl,
          0, // x offset
          0, // y offset
          i, // z offset
          width,
          height,
          image.depth / divisor,
          image.glDataFormat,
          image.glDataType,
          face,
        )
      } else if (isCompressedFaceData(face)) {
        // TODO:
      } else {
        // TODO: add option to flipY
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texSubImage3D(
          image.glType,
          lvl,
          0, // x offset
          0, // y offset
          i, // z offset
          width,
          height,
          image.depth / divisor,
          image.glDataFormat,
          image.glDataType,
          face,
        )
      }
    }
  }
}

function getMipmapCount(width: number, height: number, depth: number): number {
  return 1 + Math.floor(Math.log2(Math.max(width, height, depth)))
}
