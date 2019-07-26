import {
  nameOfTextureFilter,
  nameOfTextureWrapMode,
  TextureFilter,
  TextureWrapMode,
  valueOfTextureFilter,
  valueOfTextureWrapMode,
} from './../enums/Enums'

import { Device } from './../Device'
import { Texture } from './../Texture'

// lookup table for texture unit constants
// GL.TEXTURE0
// GL.TEXTURE...
// GL.TEXTURE31
const TextureUnitMap = [
  0x84C0, 0x84C1, 0x84C2, 0x84C3,
  0x84C4, 0x84C5, 0x84C6, 0x84C7,
  0x84C8, 0x84C9, 0x84CA, 0x84CB,
  0x84CC, 0x84CD, 0x84CE, 0x84CF,
  0x84D0, 0x84D1, 0x84D2, 0x84D3,
  0x84D4, 0x84D5, 0x84D6, 0x84D7,
  0x84D8, 0x84D9, 0x84DA, 0x84DB,
  0x84DC, 0x84DD, 0x84DE, 0x84DF,
]

const params = [
  'texture',
  'minFilter',
  'magFilter',
  'wrapU',
  'wrapV',
  'register',
]

/**
 * Properties that describe a sampler state
 *
 * @public
 */
export interface SamplerStateParams {
  texture?: Texture
  minFilter?: number
  magFilter?: number
  wrapU?: number
  wrapV?: number
  register?: number
}

/**
 * @public
 */
export class SamplerState implements SamplerStateParams {
  /**
   * The graphics device
   */
  public device: Device
  /**
   * The rendering context
   */
  public gl: WebGLRenderingContext

  private registerField: number
  /**
   * If true this will fix invalid state for a non power of two texture
   */
  public autofixNonPOT: boolean = true
  private textureField: any
  private minFilterField: number = TextureFilter.PointMipLinear
  private magFilterField: number = TextureFilter.Point
  private wrapUField: number = TextureWrapMode.Clamp
  private wrapVField: number = TextureWrapMode.Clamp
  private hasChanged: boolean
  private changes: SamplerStateParams = {}
  private samplerHandle: WebGLSampler

  constructor(device: Device, register: number) {
    this.device = device
    this.gl = device.context
    this.registerField = register

    if (this.device.isWebGL2) {
      this.samplerHandle = (this.device.context as WebGL2RenderingContext).createSampler()
    }
  }

  public get register(): number {
    return this.registerField
  }

  public get unit(): number {
    return TextureUnitMap[this.registerField]
  }

  public get texture(): Texture {
    return this.textureField
  }

  public set texture(value: Texture) {
    const texture = this.textureField
    if (texture !== value || (value && (texture.handle !== value.handle || texture.type !== value.type))) {
      this.textureField = value
      this.changes.texture = value
      this.hasChanged = true
      // ShaderUniform.ts will take care for non-ready textures
      // ShaderUniform.ts will commit sampler state params which are attached to textures
    }
  }

  /**
   * @internal
   */
  public get minFilterName(): string {
    return nameOfTextureFilter(this.minFilterField)
  }

  /**
   *
   */
  public get minFilter(): number {
    return this.minFilterField
  }

  /**
   *
   */
  public set minFilter(value: number) {
    if (this.minFilterField !== value) {
      this.minFilterField = value
      this.changes.minFilter = value
      this.hasChanged = true
    }
  }

  get magFilterName(): string {
    return nameOfTextureFilter(this.magFilterField)
  }

  get magFilter(): number {
    return this.magFilterField
  }

  set magFilter(value: number) {
    if (this.magFilterField !== value) {
      this.magFilterField = value
      this.changes.magFilter = value
      this.hasChanged = true
    }
  }

  get wrapUName(): string {
    return nameOfTextureWrapMode(this.wrapUField)
  }

  get wrapU(): number {
    return this.wrapUField
  }

  set wrapU(value: number) {
    if (this.wrapUField !== value) {
      this.wrapUField = value
      this.changes.wrapU = value
      this.hasChanged = true
    }
  }

  get wrapVName(): string {
    return nameOfTextureWrapMode(this.wrapVField)
  }

  get wrapV(): number {
    return this.wrapVField
  }

  set wrapV(value: number) {
    if (this.wrapVField !== value) {
      this.wrapVField = value
      this.changes.wrapV = value
      this.hasChanged = true
    }
  }

  public assign(state: SamplerStateParams): SamplerState {
    for (let key of params) {
      if (state.hasOwnProperty(key) && key !== 'register') {
        this[key] = state[key]
      }
    }
    return this
  }

  public commit(state?: SamplerStateParams): SamplerState {
    if (state) {
      this.assign(state)
    }

    const texture = this.texture
    if (texture && !texture.isPOT && this.autofixNonPOT) {
      // will assign sampler state params that are safe for
      // non power of two textures
      SamplerState.fixNonPowerOfTwo(this)
    }

    if (this.device.isWebGL2 && !this.hasChanged) {
      return this
    }

    let gl = this.gl as WebGL2RenderingContext
    let changes = this.changes
    let type = texture ? texture.type : gl.TEXTURE_2D
    let handle = texture ? texture.handle : null

    if (this.device.isWebGL2) {
      if (changes.minFilter !== null) {
        gl.samplerParameteri(this.samplerHandle, gl.TEXTURE_MIN_FILTER, this.minFilter)
      }
      if (changes.magFilter !== null) {
        gl.samplerParameteri(this.samplerHandle, gl.TEXTURE_MAG_FILTER, this.magFilter)
      }
      if (changes.wrapU !== null) {
        gl.samplerParameteri(this.samplerHandle, gl.TEXTURE_WRAP_S, this.wrapU)
      }
      if (changes.wrapV !== null) {
        gl.samplerParameteri(this.samplerHandle, gl.TEXTURE_WRAP_T, this.wrapV)
      }
      gl.activeTexture(this.unit)
      gl.bindTexture(type, handle)
      gl.bindSampler(this.register, this.samplerHandle)
    } else {
      gl.activeTexture(this.unit)
      gl.bindTexture(type, handle)
      if (changes.minFilter !== null) { gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, this.minFilter) }
      if (changes.magFilter !== null) { gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, this.magFilter) }
      if (changes.wrapU !== null) { gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.wrapU) }
      if (changes.wrapV !== null) { gl.texParameteri(type, gl.TEXTURE_WRAP_T, this.wrapV) }
    }

    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of params) { this.changes[key as any] = undefined }
  }

  public static convert(state: SamplerStateParams): SamplerStateParams {
    if (state.minFilter) {
      state.minFilter = valueOfTextureFilter(state.minFilter)
    }
    if (state.magFilter) {
      state.magFilter = valueOfTextureFilter(state.magFilter)
    }
    if (state.wrapU) {
      state.wrapU = valueOfTextureWrapMode(state.wrapU)
    }
    if (state.wrapV) {
      state.wrapV = valueOfTextureWrapMode(state.wrapV)
    }
    return state
  }

  public static fixNonPowerOfTwo(state: SamplerStateParams): SamplerStateParams {
    state.wrapU = TextureWrapMode.Clamp
    state.wrapV = TextureWrapMode.Clamp

    state.magFilter = TextureFilter.Linear

    if (state.minFilter === TextureFilter.LinearMipLinear ||
      state.minFilter === TextureFilter.LinearMipPoint) {
      state.minFilter = TextureFilter.Linear
    } else if (state.minFilter === TextureFilter.PointMipLinear ||
      state.minFilter === TextureFilter.PointMipLinear) {
      state.minFilter = TextureFilter.Point
    }

    if (state.magFilter === TextureFilter.LinearMipLinear ||
      state.magFilter === TextureFilter.LinearMipPoint) {
      state.magFilter = TextureFilter.Linear
    } else if (state.magFilter === TextureFilter.PointMipLinear ||
      state.magFilter === TextureFilter.PointMipLinear) {
      state.magFilter = TextureFilter.Point
    }
    return state
  }

  public static Default = Object.freeze<SamplerStateParams>({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
  })

  public static LinearClamp = Object.freeze<SamplerStateParams>({
    minFilter: TextureFilter.LinearMipLinear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
  })

  public static LinearWrap = Object.freeze<SamplerStateParams>({
    minFilter: TextureFilter.LinearMipLinear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
  })

  public static PointClamp = Object.freeze<SamplerStateParams>({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
  })

  public static PointWrap = Object.freeze<SamplerStateParams>({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
  })
}
