import {
  TextureType,
} from '../../enums'
import { SamplerState, SamplerStateParams } from '../../states'
import { DeviceGL } from '../DeviceGL'

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
export class SamplerStateGL extends SamplerState {

  /**
   * The graphics device
   */
  public readonly device: DeviceGL

  public get samplerHandle() {
    return this.handle
  }

  public get textureHandle() {
    return this.texture ? this.texture.handle : null
  }

  private handle: WebGLSampler = null
  private texture: { type: number, handle: WebGLTexture } | null

  constructor(device: DeviceGL, texture?: { type: number, handle: WebGLTexture }) {
    super()
    this.device = device
    this.texture = texture
    this.setup()
    this.resolve()
  }

  /**
   * Recreates the underlying sampler object if necessary
   */
  public setup() {
    if (!this.texture && this.device.context instanceof WebGL2RenderingContext && !this.device.context.isSampler(this.handle)) {
      this.handle = this.device.context.createSampler()
    }
    return this
  }

  public destroy() {
    if (this.handle) {
      (this.device.context as WebGL2RenderingContext).deleteSampler(this.handle)
      this.handle = null
    }
    return this
  }

  public commitChanges(changes?: SamplerStateParams): this {

    if (this.handle) {
      const gl = this.device.context as WebGL2RenderingContext
      if (changes.minFilter !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_MIN_FILTER, this.minFilter)
      }
      if (changes.magFilter !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_MAG_FILTER, this.magFilter)
      }
      if (changes.wrapU !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_S, this.wrapU)
      }
      if (changes.wrapV !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_T, this.wrapV)
      }
      if (changes.wrapW !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_R, this.wrapW)
      }
      if (changes.minLod !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_MIN_LOD, this.minLod)
      }
      if (changes.maxLod !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_MAX_LOD, this.maxLod)
      }
      if (changes.compareMode !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_COMPARE_MODE, this.compareMode)
      }
      if (changes.compareFunc !== null) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_COMPARE_FUNC, this.compareFunc)
      }
    } else if (this.texture) {
      const gl = this.device.context
      gl.bindTexture(this.texture.type, this.texture.handle)
      const type = this.texture.type
      if (changes.minFilter !== null) {
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, this.minFilter)
      }
      if (changes.magFilter !== null) {
        gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, this.magFilter)
      }
      if (changes.wrapU !== null) {
        gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.wrapU)
      }
      if (changes.wrapV !== null) {
        gl.texParameteri(type, gl.TEXTURE_WRAP_T, this.wrapV)
      }
      if (gl instanceof WebGL2RenderingContext) {
        if (changes.wrapW !== null) {
          gl.texParameteri(type, gl.TEXTURE_WRAP_R, this.wrapW)
        }
        if (changes.minLod !== null) {
          gl.texParameteri(type, gl.TEXTURE_MIN_LOD, this.minLod)
        }
        if (changes.maxLod !== null) {
          gl.texParameteri(type, gl.TEXTURE_MAX_LOD, this.maxLod)
        }
        if (changes.compareMode !== null) {
          gl.texParameteri(type, gl.TEXTURE_COMPARE_MODE, this.compareMode)
        }
        if (changes.compareFunc !== null) {
          gl.texParameteri(type, gl.TEXTURE_COMPARE_FUNC, this.compareFunc)
        }
      }
    }

    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(out: SamplerStateParams = {}): this {
    if (this.handle) {
      const handle = this.handle
      const gl = this.device.context as WebGL2RenderingContext
      out.minFilter = gl.getSamplerParameter(handle, gl.TEXTURE_MIN_FILTER)
      out.magFilter = gl.getSamplerParameter(handle, gl.TEXTURE_MAG_FILTER)
      out.wrapU = gl.getSamplerParameter(handle, gl.TEXTURE_WRAP_S)
      out.wrapV = gl.getSamplerParameter(handle, gl.TEXTURE_WRAP_T)
      out.wrapW = gl.getSamplerParameter(handle, gl.TEXTURE_WRAP_R)
      out.minLod = gl.getSamplerParameter(handle, gl.TEXTURE_MIN_LOD)
      out.maxLod = gl.getSamplerParameter(handle, gl.TEXTURE_MAX_LOD)
      out.compareMode = gl.getSamplerParameter(handle, gl.TEXTURE_COMPARE_MODE)
      out.compareFunc = gl.getSamplerParameter(handle, gl.TEXTURE_COMPARE_FUNC)
    } else if (this.texture) {
      const handle = this.texture
      const gl = this.device.context
      gl.bindTexture(handle.type, handle.handle)
      out.minFilter = gl.getTexParameter(handle.type, gl.TEXTURE_MIN_FILTER)
      out.magFilter = gl.getTexParameter(handle.type, gl.TEXTURE_MAG_FILTER)
      out.wrapU = gl.getTexParameter(handle.type, gl.TEXTURE_WRAP_S)
      out.wrapV = gl.getTexParameter(handle.type, gl.TEXTURE_WRAP_T)
      if (gl instanceof WebGL2RenderingContext) {
        out.wrapW = gl.getTexParameter(handle.type, gl.TEXTURE_WRAP_R)
        out.minLod = gl.getTexParameter(handle.type, gl.TEXTURE_MIN_LOD)
        out.maxLod = gl.getTexParameter(handle.type, gl.TEXTURE_MAX_LOD)
        out.compareMode = gl.getTexParameter(handle.type, gl.TEXTURE_COMPARE_MODE)
        out.compareFunc = gl.getTexParameter(handle.type, gl.TEXTURE_COMPARE_FUNC)
      }
    }
    this.clearChanges()
    return this
  }
}
