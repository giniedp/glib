import { TextureFilter, TextureWrapMode } from './../enums/Enums'

import { Device } from './../Device'
import { Texture } from './../Texture'

// lookup table for texture unit constants
// GL.TEXTURE0
// GL.TEXTURE...
// GL.TEXTURE31
let TextureUnitMap = [
  0x84C0, 0x84C1, 0x84C2, 0x84C3,
  0x84C4, 0x84C5, 0x84C6, 0x84C7,
  0x84C8, 0x84C9, 0x84CA, 0x84CB,
  0x84CC, 0x84CD, 0x84CE, 0x84CF,
  0x84D0, 0x84D1, 0x84D2, 0x84D3,
  0x84D4, 0x84D5, 0x84D6, 0x84D7,
  0x84D8, 0x84D9, 0x84DA, 0x84DB,
  0x84DC, 0x84DD, 0x84DE, 0x84DF,
]

let propertyKeys = [
  'texture',
  'minFilter',
  'magFilter',
  'wrapU',
  'wrapV',
  'register',
]

/**
 * The sampler state properties
 */
export interface SamplerStateProperties {
  texture?: Texture
  minFilter?: number
  magFilter?: number
  wrapU?: number
  wrapV?: number
  register?: number
}

/**
 *
 */
export class SamplerState implements SamplerStateProperties {
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
  private changes: SamplerStateProperties = {}

  constructor(device: Device, register: number) {
    this.device = device
    this.gl = device.context
    this.registerField = register
  }

  get register(): number {
    return this.registerField
  }
  set register(value: number) { throw new Error("'register' property is read only") }

  get unit(): number {
    return TextureUnitMap[this.registerField]
  }
  set unit(value: number) { throw new Error("'unit' property is read only") }

  get texture(): Texture {
    return this.textureField
  }

  set texture(value: Texture) {
    let texture = this.textureField
    if (texture !== value || (value && (texture.handle !== value.handle || texture.type !== value.type))) {
      this.textureField = value
      this.changes.texture = value
      this.hasChanged = true
      if (!value.ready) {
        // TODO:
      }
    }
  }

  get minFilter(): number {
    return this.minFilterField
  }

  get minFilterName(): string {
    return TextureFilter.nameOf(this.minFilterField)
  }

  set minFilter(value: number) {
    if (this.minFilterField !== value) {
      this.minFilterField = value
      this.changes.minFilter = value
      this.hasChanged = true
    }
  }

  get magFilter(): number {
    return this.magFilterField
  }

  get magFilterName(): string {
    return TextureFilter.nameOf(this.magFilterField)
  }

  set magFilter(value: number) {
    if (this.magFilterField !== value) {
      this.magFilterField = value
      this.changes.magFilter = value
      this.hasChanged = true
    }
  }

  get wrapU(): number {
    return this.wrapUField
  }

  get wrapUName(): string {
    return TextureWrapMode.nameOf(this.wrapUField)
  }

  set wrapU(value: number) {
    if (this.wrapUField !== value) {
      this.wrapUField = value
      this.changes.wrapU = value
      this.hasChanged = true
    }
  }

  get wrapV(): number {
    return this.wrapVField
  }

  get wrapVName(): string {
    return TextureWrapMode.nameOf(this.wrapVField)
  }

  set wrapV(value: number) {
    if (this.wrapVField !== value) {
      this.wrapVField = value
      this.changes.wrapV = value
      this.hasChanged = true
    }
  }

  public assign(state: SamplerStateProperties): SamplerState {
    for (let key of propertyKeys) {
      if (state.hasOwnProperty(key) && key !== 'register') {
        this[key] = state[key]
      }
    }
    return this
  }

  public commit(state?: SamplerStateProperties): SamplerState {

    if (state) { this.assign(state) }
    let texture = this.texture
    if (texture && !texture.isPOT && this.autofixNonPOT) {
      SamplerState.fixNonPowerOfTwo(this)
    }

    // if (!this.hasChanged) return this

    let gl = this.gl
    let changes = this.changes
    let type = texture ? texture.type : gl.TEXTURE_2D
    let handle = texture ? texture.handle : null

    gl.activeTexture(this.unit)
    gl.bindTexture(type, handle)
    if (changes.minFilter !== null) { gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, this.minFilter) }
    if (changes.magFilter !== null) { gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, this.magFilter) }
    if (changes.wrapU !== null) { gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.wrapU) }
    if (changes.wrapV !== null) { gl.texParameteri(type, gl.TEXTURE_WRAP_T, this.wrapV) }

    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of propertyKeys) { this.changes[key] = undefined }
  }

  public static convert(state: any): SamplerStateProperties {
    if (state.minFilter) {
      state.minFilter = TextureFilter[state.minFilter]
    }
    if (state.magFilter) {
      state.magFilter = TextureFilter[state.magFilter]
    }
    if (state.wrapU) {
      state.wrapU = TextureWrapMode[state.wrapU]
    }
    if (state.wrapV) {
      state.wrapV = TextureWrapMode[state.wrapV]
    }
    return state
  }

  public static fixNonPowerOfTwo(state: SamplerStateProperties): SamplerStateProperties {
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

  public static Default = Object.freeze({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
  })

  public static LinearClamp = Object.freeze({
    minFilter: TextureFilter.LinearMipLinear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
  })

  public static LinearWrap = Object.freeze({
    minFilter: TextureFilter.LinearMipLinear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
  })

  public static PointClamp = Object.freeze({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
  })

  public static PointWrap = Object.freeze({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
  })
}
