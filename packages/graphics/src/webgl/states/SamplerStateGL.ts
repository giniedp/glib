import { TextureType } from '../../enums'
import { SamplerState, SamplerStateParams } from '../../states'
import { DeviceGL } from '../DeviceGL'
import { SharedResource } from '../utils'

/**
 * An object with a reference to a webgl texture
 * @public
 */
export interface TextureLike {
  handle: WebGLTexture
  type: TextureType
}

/**
 * @public
 */
export class SamplerStateGL extends SamplerState implements SharedResource<string, WebGLSampler> {
  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  public resource: WebGLSampler
  public resourceKey: string
  public referenceCount: number

  constructor(device: DeviceGL, options: SamplerStateParams) {
    super()
    this.device = device
    this.create(options)
  }

  /**
   * Recreates the underlying sampler object if necessary and applies the parameters.
   */
  public create(options: SamplerStateParams) {
    if (options) {
      this.minFilter = options.minFilter ?? this.minFilter
      this.magFilter = options.magFilter ?? this.magFilter
      this.wrapU = options.wrapU ?? this.wrapU
      this.wrapV = options.wrapV ?? this.wrapV
      this.wrapW = options.wrapW ?? this.wrapW
      this.minLod = options.minLod ?? this.minLod
      this.maxLod = options.maxLod ?? this.maxLod
      this.compareMode = options.compareMode ?? this.compareMode
      this.compareFunc = options.compareFunc ?? this.compareFunc
    }
    if (!this.device.context.isSampler(this.resource)) {
      this.resource = this.device.context.createSampler()
    }
    const gl = this.device.context
    gl.samplerParameteri(this.resource, gl.TEXTURE_MIN_FILTER, this.minFilter)
    gl.samplerParameteri(this.resource, gl.TEXTURE_MAG_FILTER, this.magFilter)
    gl.samplerParameteri(this.resource, gl.TEXTURE_WRAP_S, this.wrapU)
    gl.samplerParameteri(this.resource, gl.TEXTURE_WRAP_T, this.wrapV)
    gl.samplerParameteri(this.resource, gl.TEXTURE_WRAP_R, this.wrapW)
    gl.samplerParameteri(this.resource, gl.TEXTURE_MIN_LOD, this.minLod)
    gl.samplerParameteri(this.resource, gl.TEXTURE_MAX_LOD, this.maxLod)
    gl.samplerParameteri(this.resource, gl.TEXTURE_COMPARE_MODE, this.compareMode)
    gl.samplerParameteri(this.resource, gl.TEXTURE_COMPARE_FUNC, this.compareFunc)
    return this
  }

  public dispose(): this {
    this.referenceCount--
    if (this.referenceCount > 0) {
      return this
    }
    this.referenceCount = 0
    this.device.onSamplerStateDisposed(this)
    if (this.device.context.isSampler(this.resource)) {
      this.device.context.deleteSampler(this.resource)
      this.resource = null
    }
    return this
  }
}
