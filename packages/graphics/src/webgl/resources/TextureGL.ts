import {
  ArrayType,
  pixelFormatElementCount,
  TextureType,
} from '../../enums'

import { Device } from '../../Device'

import { Texture, TextureDataOption, TextureOptions, TextureSourceOption } from '../../resources/Texture'

function isPowerOfTwo(value: number): boolean {
  return ((value > 0) && !(value & (value - 1))) // tslint:disable-line
}

const cubeFaceTypes = [
  0x8515, // TEXTURE_CUBE_MAP_POSITIVE_X
  0x8516, // TEXTURE_CUBE_MAP_NEGATIVE_X
  0x8517, // TEXTURE_CUBE_MAP_POSITIVE_Y
  0x8518, // TEXTURE_CUBE_MAP_NEGATIVE_Y
  0x8519, // TEXTURE_CUBE_MAP_POSITIVE_Z
  0x851a, // TEXTURE_CUBE_MAP_NEGATIVE_Z
]

/**
 * Describes a texture object.
 *
 * @public
 */
export class TextureGL extends Texture {

  public readonly handle: WebGLTexture

  /**
   * Determines whether this is a cubemap face
   */
  public readonly isFace: boolean

  /**
   * Constructs an instance of a Texture.
   *
   * @remarks
   * The options are passed down to {@link Texture.setup}
   */
  constructor(public readonly device: Device<WebGLRenderingContext>, options: TextureOptions = {}) {
    super()
    this.setup(options)
  }

  public create(): this {
    if (!this.device.context.isTexture(this.handle)) {
      this.set('isFace', cubeFaceTypes.indexOf(this.type) >= 0)
      this.set('handle', this.device.context.createTexture())
      this.device.context.bindTexture(this.type, this.handle)
      this.device.context.texImage2D(this.type, 0, this.pixelFormat, this.width, this.height, 0, this.pixelFormat, this.pixelType, null)
      this.device.context.bindTexture(this.type, null)
    }
    return this
  }

  /**
   * Releases all resources and notifies the device that the texture is being destroyed.
   */
  public destroy(): this {
    this.set('source', null)
    if (this.handle != null && this.device.context.isTexture(this.handle)) {
      this.device.context.deleteTexture(this.handle)
    }
    this.set('handle', null)
    return this
  }

  /**
   * Binds the texture to the gl context.
   *
   * @returns the previously bound texture handle
   */
  public bind(): this {
    this.device.context.bindTexture(this.type, this.handle)
    return this
  }

  /**
   * Sets the texture source from data array or buffer
   *
   * @param data - The texture data to be set
   * @param width - The new texture width
   * @param height - The new texture height
   */
  public setData(data: TextureDataOption, width?: number, height?: number): this {
    this.set('source', null)

    let buffer: ArrayBufferView
    if (data instanceof Array || data instanceof ArrayBuffer) {
      buffer = new ArrayType[this.pixelType](data)
    } else if (data && (data as ArrayBufferView).buffer instanceof ArrayBuffer) {
      if (data instanceof Uint8ClampedArray) {
        buffer = new Uint8Array(data.buffer)
      } else {
        buffer = (data as ArrayBufferView)
      }
    }
    if (!buffer) {
      throw new Error(`invalid argument 'data'. must be one of [number[] | ArrayBuffer | ArrayBufferView]`)
    }

    let pixelCount = buffer.byteLength / pixelFormatElementCount(this.pixelFormat)
    if (!width || !height) {
      width = height = Math.floor(Math.sqrt(pixelCount))
    }
    if (width * height !== pixelCount) {
      throw new Error('width and height does not match the data length')
    }

    this.bind()
    this.device.context.texImage2D(this.type, 0, this.pixelFormat, width, height, 0, this.pixelFormat, this.pixelType, buffer)
    if (this.generateMipmap) {
      this.device.context.generateMipmap(this.type)
    }

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
    const types = [
      0x8515, // TEXTURE_CUBE_MAP_POSITIVE_X
      0x8516, // TEXTURE_CUBE_MAP_NEGATIVE_X
      0x8517, // TEXTURE_CUBE_MAP_POSITIVE_Y
      0x8518, // TEXTURE_CUBE_MAP_NEGATIVE_Y
      0x8519, // TEXTURE_CUBE_MAP_POSITIVE_Z
      0x851a, // TEXTURE_CUBE_MAP_NEGATIVE_Z
    ]

    this.bind()
    this.set('faces', faces.map((face, i) => {
      return new TextureGL(this.device, {
        type: types[i],
        data: face,
        width: this.width,
        height: this.height,
        generateMipmap: false,
      })
    }))
    this.update()


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
   * the texture data. When data has arrived the {@link Texture.ready}
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
      return false
    }
    let updated = false
    let ready = true
    for (const face of this.faces) {
      updated = updated || face.update()
      ready = ready && face.ready
    }
    if (updated && ready) {
      this.bind()
      for (const face of this.faces) {
        this.device.context.texImage2D(face.type, 0, face.pixelFormat, face.pixelFormat, face.pixelType, face.source.data)
      }
    }
    if (ready) {
      this.set('ready', ready)
      this.set('width', this.faces[0].width)
      this.set('height', this.faces[0].height)
      this.set('isPOT', this.faces[0].isPOT)
    }
    return updated
  }

  private updateSource(): boolean {
    if (!this.source || !this.source.update()) {
      return false
    }

    const gl = this.device.context
    gl.bindTexture(this.type, this.handle)
    gl.texImage2D(this.type, 0, this.pixelFormat, this.pixelFormat, this.pixelType, this.source.data)
    if (this.generateMipmap) {
      gl.generateMipmap(this.type)
    }
    gl.bindTexture(this.type, null)

    this.set('ready', this.source.isReady)
    this.set('width', this.source.width)
    this.set('height', this.source.height)
    this.set('isPOT', this.source.isPowerOfTwo)
    return true
  }

}
