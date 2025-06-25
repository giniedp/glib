import { Device } from '../../Device'
import {
  dataTypeFromWebGL,
  dataTypeToArrayType,
  surfaceFormatToWebGL,
  surfaceFormatToWebGLDataType,
  surfaceFormatToWebGLFormat,
  textureFilterToWebGL,
  textureTypeToWebGL,
  textureWrapModeToWebGL,
} from '../../enums'
import { TextureDataOption, TextureImage, TextureImageOptions } from '../../resources/TextureImage'
import { TextureSource } from '../../resources/TextureSource'
import type { DeviceGL } from '../DeviceGL'
import { SharedResource } from '../utils'

/**
 * Describes a texture object.
 *
 * @public
 */
export class TextureGL extends TextureImage implements SharedResource<TextureSource, WebGLTexture> {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  /**
   * The native WebGLTexture resource.
   */
  public resource: WebGLTexture

  /**
   * The key being used for referenc counting
   */
  public resourceKey: any

  /**
   * The current reference counter
   */
  public referenceCount: number

  public glType: GLenum
  public glInternalFormat: GLenum
  public glDataFormat: GLenum
  public glDataType: GLenum

  /**
   * Constructs an instance of a Texture.
   *
   * @remarks
   * The options are passed down to {@link TextureImage.setup}
   */
  constructor(device: Device<WebGLRenderingContext>, options: TextureImageOptions) {
    super()
    this.device = device as DeviceGL
    this.setup(options)
  }

  protected createResource() {
    if (this.resource && this.device.context.isTexture(this.resource)) {
      console.warn(`TextureGL.create: was called, but the texture is already created.`)
      this.disposeResource()
    }

    const gl = this.device.context

    this.glType = textureTypeToWebGL(this.type)
    this.glInternalFormat = surfaceFormatToWebGL(this.format)
    this.glDataFormat = surfaceFormatToWebGLFormat(this.format)
    this.glDataType = surfaceFormatToWebGLDataType(this.format)
    this.resource = this.device.context.createTexture()

    gl.bindTexture(this.glType, this.resource)
    const faceCount = this.isCube ? 6 : 1
    const faceType = this.isCube ? gl.TEXTURE_CUBE_MAP_POSITIVE_X : this.glType
    if (!this.isCompressed) {
      for (let i = 0; i < faceCount; i++) {
        this.device.context.texImage2D(
          faceType + i,
          0,
          this.glInternalFormat,
          this.width,
          this.height,
          0,
          this.glDataFormat,
          this.glDataType,
          null,
        )
      }
    }
    this.device.context.bindTexture(this.glType, null)
    this.update()
  }

  protected disposeResource() {
    if (this.device.context.isTexture(this.resource)) {
      this.device.context.deleteTexture(this.resource)
      this.resource = null
    }
  }

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public dispose(): this {
    this.referenceCount--
    if (this.referenceCount > 0) {
      return this
    }
    this.referenceCount = 0
    this.device.onTextureDisposed(this)
    this.disposeResource()
    return this
  }

  /**
   * Binds the texture to the gl context.
   *
   * @returns the previously bound texture handle
   */
  public bind(): this {
    this.device.context.bindTexture(this.glType, this.resource)
    return this
  }

  /**
   * Sets the texture source from plain data array or buffer, and ingores the current source.
   *
   * @remarks
   * Can be used to manually update the texture data.
   *
   * If passed data is a plain javascript array or an ArrayBuffer, a TypedArray is instantiated
   * based on current {@link pixelType} respecting WebGL rules for array buffers types.
   *
   * If width and height are given they are used as new texture width and height values.
   *
   * Given data must match the width and heigth otherwise WebGL will complain.
   *
   * If the texture was created with a `source` option, this will affect all textures that share
   * the same source, since they all share the same native WebglTexture.
   * However, this will not affect the `source` itself.
   *
   * @param data - The texture data to be set
   * @param width - The new texture width
   * @param height - The new texture height
   */
  public setData(data: TextureDataOption, width: number = this.width, height: number = this.height): this {
    // TODO: allow set mipmap level

    let buffer: ArrayBufferView
    if (ArrayBuffer.isView(data)) {
      buffer = data
    } else if (Array.isArray(data) || data instanceof ArrayBuffer) {
      const ArrayType = dataTypeToArrayType(dataTypeFromWebGL(this.glDataType))
      buffer = new ArrayType(data)
    } else {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
    }

    this.device.context.bindTexture(this.glType, this.resource)
    this.device.context.texImage2D(
      this.glType,
      0,
      this.glInternalFormat,
      width,
      height,
      0,
      this.glDataFormat,
      this.glDataType,
      buffer,
    )

    this.updateMipmaps()
    this.device.context.bindTexture(this.glType, null)

    this.set('width', width)
    this.set('height', height)
    this.set('ready', true)
    return this
  }

  /**
   * Generates mipmaps for the texture only if the texture was created with `generateMipmap` option set to `true`.
   */
  public updateMipmaps(force = false) {
    if (this.generateMipmap || force) {
      const gl = this.device.context

      this.device.canFilterFloat
      this.device.canFilterHalf
      this.device.canRenderFloat
      this.device.canRenderHalf
      gl.bindTexture(this.glType, this.resource)
      if (this.sampler) {
        gl.texParameteri(this.glType, gl.TEXTURE_MIN_FILTER, textureFilterToWebGL(this.sampler.minFilter) ?? gl.LINEAR)
        gl.texParameteri(this.glType, gl.TEXTURE_MAG_FILTER, textureFilterToWebGL(this.sampler.magFilter) ?? gl.LINEAR)
        gl.texParameteri(this.glType, gl.TEXTURE_WRAP_S, textureWrapModeToWebGL(this.sampler.wrapU) ?? gl.CLAMP_TO_EDGE)
        gl.texParameteri(this.glType, gl.TEXTURE_WRAP_T, textureWrapModeToWebGL(this.sampler.wrapW) ?? gl.CLAMP_TO_EDGE)
      }
      gl.generateMipmap(this.glType)
      gl.bindTexture(this.glType, null)
    }
    return this
  }

  /**
   * Updates the texture from current image source.
   *
   * @remarks
   * This method is called automatically from inside the {@link ShaderUniform}
   *
   * When loading textures from url or html image/video elements
   * the texture data might not be available right away because the
   * resources may still be downloading.
   *
   * A call to this method instructs the texture to check the
   * download state of the resources and when available to update
   * the texture data. When data has arrived the {@link TextureImage.ready}
   * property will be set to `true`
   */
  public update(): void {
    if (!this.source) {
      this.set('ready', true)
      return
    }

    const needsUpdate = this.source.update() || !this.ready
    if (!this.source.isReady || !needsUpdate) {
      return
    }

    const gl = this.device.context

    // CUBEMAP
    if (this.isCube) {
      this.bind()

      const levels = this.source.levels
      for (let lvl = 0; lvl < levels.length; lvl++) {
        const faces = levels[lvl]
        const divisor = Math.pow(2, lvl)
        const width = this.source.width / divisor
        const height = this.source.height / divisor
        if (faces.length !== 6) {
          console.warn(`TextureGL.update: cubemap level ${lvl} has ${faces.length} faces, expected 6`)
          continue
        }
        for (let i = 0; i < faces.length; i++) {
          const data = faces[i]
          if (ArrayBuffer.isView(data)) {
            if (this.isCompressed) {
              this.device.context.compressedTexImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                lvl,
                this.glInternalFormat,
                width,
                height,
                0, // border
                data, // The compressed data
              )
            } else {
              gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                lvl,
                this.glInternalFormat,
                width,
                height,
                0,
                this.glDataFormat,
                this.glDataType,
                data,
              )
            }
          } else {
            this.device.context.texImage2D(
              gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
              lvl,
              this.glInternalFormat,
              this.glDataFormat,
              this.glDataType,
              data,
            )
          }
        }
      }
    }

    // 2D TEXTURE
    if (this.is2D && !this.isArray) {
      this.bind()
      const levels = this.source.levels
      const gl = this.device.context
      for (let lvl = 0; lvl < levels.length; lvl++) {
        const data = this.source.levels[lvl][0]
        const divisor = Math.pow(2, lvl)
        const width = this.source.width / divisor
        const height = this.source.height / divisor
        if (ArrayBuffer.isView(data)) {
          if (this.isCompressed) {
            this.device.context.compressedTexImage2D(
              this.glType,
              lvl, // The mipmap level
              this.glInternalFormat,
              width,
              height,
              0, // border
              data, // The compressed data
            )
          } else {
            this.device.context.texImage2D(
              this.glType,
              lvl, // The mipmap level
              this.glInternalFormat,
              width,
              height,
              0,
              this.glDataFormat,
              this.glDataType,
              data,
            )
          }
        } else {
          gl.texImage2D(
            this.glType,
            lvl, // The mipmap level
            this.glInternalFormat,
            this.glDataFormat,
            this.glDataType,
            data,
          )
        }
      }
    }

    // 2D TEXTURE ARRAY
    if (this.is2D && this.isArray) {
      this.bind()
      for (let lvl = 0; lvl < this.source.levels.length; lvl++) {
        const level = this.source.levels[lvl]
        const divisor = Math.pow(2, lvl)
        const width = this.source.width / divisor
        const height = this.source.height / divisor
        for (let i = 0; i < level.length; i++) {
          const data = level[i]
          if (ArrayBuffer.isView(data)) {
            if (this.isCompressed) {
              this.device.context.compressedTexSubImage3D(
                this.glType,
                lvl, // The mipmap level
                0,
                0,
                i, // x, y, z offsets
                width,
                height,
                1, // depth
                this.glInternalFormat,
                data, // The compressed data
              )
            } else {
              this.device.context.texSubImage3D(
                this.glType,
                lvl, // The mipmap level
                0,
                0,
                lvl, // x, y, z offsets
                width,
                height,
                i, // The layer index
                this.glDataFormat,
                this.glDataType,
                data,
              )
            }
          } else {
            gl.texImage3D(
              this.glType,
              lvl, // The mipmap level
              this.glInternalFormat,
              this.glDataFormat,
              this.glDataType,
              i, // The layer index
              width,
              height,
              1, // depth
              data,
            )
          }
        }
      }
    }

    // 3D TEXTURE
    if (this.is3D) {
      this.bind()
      for (let lvl = 0; lvl < this.source.levels.length; lvl++) {
        const level = this.source.levels[lvl]
        const divisor = Math.pow(2, lvl)
        const width = this.source.width / divisor
        const height = this.source.height / divisor
        for (let i = 0; i < level.length; i++) {
          const data = level[i]
          if (ArrayBuffer.isView(data)) {
            this.device.context.texSubImage3D(
              this.glType,
              lvl, // The mipmap level
              0,
              0,
              i, // x, y, z offsets
              width,
              height,
              this.depth / divisor,
              this.glDataFormat,
              this.glDataType,
              data,
            )
          } else {
            gl.texImage3D(
              this.glType,
              lvl, // The mipmap level
              this.glInternalFormat,
              this.glDataFormat,
              this.glDataType,
              i, // The layer index
              width,
              height,
              this.depth / divisor,
              data,
            )
          }
        }
      }
    }

    this.set('ready', true)
    this.set('width', this.source.width)
    this.set('height', this.source.height)
    this.updateMipmaps()
  }
}

function isPowerOfTwo(value: number): boolean {
  return value > 0 && !(value & (value - 1))
}

function checkGLError(gl: WebGL2RenderingContext, msg: string) {
  const error = gl.getError()
  if (error !== gl.NO_ERROR) {
    console.error(`${msg}: WebGL error 0x${error.toString(16)}`)
  }
}
