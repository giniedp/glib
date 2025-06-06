import { Device } from '../../Device'
import { ArrayType, TextureType } from '../../enums'
import { TextureDataOption, TextureImage, TextureImageOptions, TextureSourceOption } from '../../resources/TextureImage'
import { createTextureSource, TextureSource } from '../../resources/TextureSource'
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

    this.resource = this.device.context.createTexture()
    const gl = this.device.context
    gl.bindTexture(this.type, this.resource)
    const faceCount = this.isCube ? 6 : 1
    const faceType = this.isCube ? gl.TEXTURE_CUBE_MAP_POSITIVE_X : this.type
    for (let i = 0; i < faceCount; i++) {
      this.device.context.texImage2D(
        faceType + i,
        0,
        this.pixelFormat,
        this.width,
        this.height,
        0,
        this.pixelFormat,
        this.pixelType,
        null,
      )
    }
    this.device.context.bindTexture(this.type, null)
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
    this.device.context.bindTexture(this.type, this.resource)
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
      buffer = new ArrayType[this.pixelType](data)
    } else {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
    }

    this.device.context.bindTexture(this.type, this.resource)
    this.device.context.texImage2D(
      this.type,
      0,
      this.pixelFormat,
      width,
      height,
      0,
      this.pixelFormat,
      this.pixelType,
      buffer,
    )
    if (this.generateMipmap) {
      this.device.context.generateMipmap(this.type)
    }
    this.device.context.bindTexture(this.type, null)

    this.set('width', width)
    this.set('height', height)
    this.set('ready', true)
    this.set('isPOT', isPowerOfTwo(width) && isPowerOfTwo(height))
    return this
  }

  public setFaces(faces: TextureSourceOption[]) {
    if (this.type !== TextureType.TextureCube) {
      throw new Error('setFaces is only allowed on cube textures')
    }
    if (faces.length !== 6) {
      throw new Error('faces must be an array of length 6')
    }

    this.set(
      'faces',
      faces.map((face, i) => createTextureSource(face)),
    )
    this.update()
    return this
  }

  public updateMipmaps() {
    if (this.generateMipmap) {
      this.device.context.bindTexture(this.type, this.resource)
      this.device.context.generateMipmap(this.type)
      this.device.context.bindTexture(this.type, null)
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
  public update(): boolean {
    if (this.isCube) {
      return this.updateCubemap()
    }
    return this.updateSource()
  }

  private updateCubemap(): boolean {
    if (!this.faces) {
      this.set('ready', true)
      return false
    }
    let updated = false
    let ready = true
    for (const face of this.faces) {
      updated = updated || face.update()
      ready = ready && face.isReady
    }
    const gl = this.device.context
    if (updated && ready) {
      this.bind()
      for (let i = 0; i < this.faces.length; i++) {
        const face = this.faces[i]
        if (ArrayBuffer.isView(face.data)) {
          gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            this.pixelFormat,
            face.width,
            face.height,
            0,
            this.pixelFormat,
            this.pixelType,
            face.data,
          )
        } else {
          this.device.context.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            this.surfaceFormat,
            this.pixelFormat,
            this.pixelType,
            face.data,
          )
        }
      }
    }
    if (ready) {
      this.set('ready', ready)
      this.set('width', this.faces[0].width)
      this.set('height', this.faces[0].height)
      this.set('isPOT', isPowerOfTwo(this.width) && isPowerOfTwo(this.height))
    }
    return updated
  }

  private updateSource() {
    let changed = false
    if (!this.source) {
      this.set('ready', true)
      return changed
    }

    if (this.source.update()) {
      changed = true
      const data = this.source.data
      const gl = this.device.context
      gl.bindTexture(this.type, this.resource)
      if (ArrayBuffer.isView(data)) {
        this.device.context.texImage2D(
          this.type,
          0,
          this.pixelFormat,
          this.source.width,
          this.source.height,
          0,
          this.pixelFormat,
          this.pixelType,
          data,
        )
      } else {
        gl.texImage2D(this.type, 0, this.surfaceFormat, this.pixelFormat, this.pixelType, data)
      }

      if (this.generateMipmap) {
        gl.generateMipmap(this.type)
      }
      gl.bindTexture(this.type, null)
    }

    if (!this.ready && this.source.isReady) {
      changed = true
      this.set('ready', this.source.isReady)
      this.set('width', this.source.width)
      this.set('height', this.source.height)
      this.set('isPOT', isPowerOfTwo(this.source.width) && isPowerOfTwo(this.source.height))
    }

    return changed
  }
}

function isPowerOfTwo(value: number): boolean {
  return value > 0 && !(value & (value - 1)) // tslint:disable-line
}
