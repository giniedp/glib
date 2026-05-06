import { compareFunctionToWebGL, textureWrapModeToWebGL, type MipmapFilter, type TextureFilter } from '../../enums'
import type { SamplerState } from '../../states'
import type { Mutable, WebglResource } from '../types'
import type { WebglDevice } from '../WebglDevice'

export class WebglSampler implements WebglResource<WebGLSampler> {
  public readonly device: WebglDevice
  public readonly glHandle: WebGLSampler
  private state: SamplerState

  public constructor(device: WebglDevice, state: SamplerState) {
    this.device = device
    this.state = state
    this.restore()
    this.device.onContextLost.add(this.restore)
  }

  private restore = () => {
    const self = this as Mutable<this>
    self.glHandle = this.device.context.createSampler()
    this.commitState()
  }

  private commitState() {
    const state = this.state
    const gl = this.device.context
    const resource = this.glHandle
    gl.samplerParameteri(resource, gl.TEXTURE_MIN_FILTER, getMinFilter(gl, state.minFilter, state.mipFilter))
    gl.samplerParameteri(resource, gl.TEXTURE_MAG_FILTER, getMagFilter(gl, state.magFilter))
    gl.samplerParameteri(resource, gl.TEXTURE_WRAP_S, textureWrapModeToWebGL(state.wrapU))
    gl.samplerParameteri(resource, gl.TEXTURE_WRAP_T, textureWrapModeToWebGL(state.wrapV))
    gl.samplerParameteri(resource, gl.TEXTURE_WRAP_R, textureWrapModeToWebGL(state.wrapW))
    gl.samplerParameteri(resource, gl.TEXTURE_MIN_LOD, state.minLod)
    gl.samplerParameteri(resource, gl.TEXTURE_MAX_LOD, state.maxLod)
    gl.samplerParameteri(resource, gl.TEXTURE_COMPARE_MODE, state.compare ? gl.COMPARE_REF_TO_TEXTURE : gl.NONE)
    gl.samplerParameteri(resource, gl.TEXTURE_COMPARE_FUNC, compareFunctionToWebGL(state.compareFunc))
  }

  public dispose(): void {
    const self = this as Mutable<this>
    const handle = self.glHandle
    self.glHandle = null

    const gl = this.device.context
    if (gl.isSampler(handle)) {
      gl.deleteSampler(handle)
    }

    this.device.onContextLost.remove(this.restore)
  }
}

function getMinFilter(gl: WebGL2RenderingContext, minFilter: TextureFilter, mipFilter: MipmapFilter): number {
  if (mipFilter === 'None') {
    return minFilter === 'Nearest' ? gl.NEAREST : gl.LINEAR
  }
  if (mipFilter === 'Nearest') {
    return minFilter === 'Nearest' ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_NEAREST
  }
  return minFilter === 'Nearest' ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR_MIPMAP_LINEAR
}

function getMagFilter(gl: WebGL2RenderingContext, magFilter: TextureFilter): number {
  return magFilter === 'Nearest' ? gl.NEAREST : gl.LINEAR
}
