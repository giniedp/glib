import {
  CompareFunction,
  nameOfTextureFilter,
  nameOfTextureWrapMode,
  TextureFilter,
  TextureWrapMode,
  valueOfTextureFilter,
  valueOfTextureWrapMode,
} from './../enums/Enums'

import { Device } from './../Device'

const params: Array<keyof ISamplerState> = [
  'minFilter',
  'magFilter',
  'wrapU',
  'wrapV',
  'wrapW',
  'minLod',
  'maxLod',
  'compareFunc',
  'compareMode',
]

/**
 * An object with all sampler state properties
 *
 * @public
 */
export interface ISamplerState {
  minFilter: number
  magFilter: number
  wrapU: number
  wrapV: number
  wrapW: number
  minLod: number
  maxLod: number
  compareMode: number
  compareFunc: number
}

/**
 * An object with partial {@link ISamplerState} properties
 *
 * @public
 */
export type SamplerStateParams = Partial<ISamplerState>

/**
 * @public
 */
export abstract class SamplerState implements ISamplerState {
  /**
   * The default sampler state which is essentially the same as {@link SamplerState.PointClamp}
   */
  public static Default = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
    wrapW: TextureWrapMode.Clamp,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  /**
   * A sampler state with linear filtering but clamp mode
   */
  public static LinearClamp = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.LinearMipLinear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
    wrapW: TextureWrapMode.Clamp,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  /**
   * A sampler state with linear filtering and wrap mode
   */
  public static LinearWrap = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.LinearMipLinear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
    wrapW: TextureWrapMode.Repeat,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  /**
   * A sampler state with point filtering and clamp mode
   */
  public static PointClamp = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
    wrapW: TextureWrapMode.Clamp,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  /**
   * A sampler state with point filtering and wrap mode
   */
  public static PointWrap = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.PointMipLinear,
    magFilter: TextureFilter.Point,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
    wrapW: TextureWrapMode.Repeat,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  /**
   *
   */
  public static LinearClampNoMipMap = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.Linear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
    wrapW: TextureWrapMode.Clamp,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  /**
   *
   */
  public static LinearWrapNoMipMap = Object.freeze<ISamplerState>({
    minFilter: TextureFilter.Linear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Repeat,
    wrapV: TextureWrapMode.Repeat,
    wrapW: TextureWrapMode.Repeat,
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: CompareFunction.LessEqual,
  })

  public static convert(state: SamplerStateParams): ISamplerState {
    if (typeof state === 'string') {
      return SamplerState[state] ? { ...(SamplerState[state] as ISamplerState) } : null
    }
    if (!state) {
      return null
    }

    const result: SamplerStateParams = {}
    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'minFilter':
        case 'magFilter':
          result[key] = valueOfTextureFilter(state[key])
          break
        case 'wrapU':
        case 'wrapV':
        case 'wrapW':
          result[key] = valueOfTextureWrapMode(state[key])
          break
        default:
          result[key] = state[key]
          break
      }
    }
    return result as ISamplerState
  }

  /**
   * Fills the sampler state with default values
   */
  public static fillDefaults(state: SamplerStateParams): SamplerStateParams {
    state = state || {}
    state.minFilter ??= SamplerState.Default.minFilter
    state.magFilter ??= SamplerState.Default.magFilter
    state.wrapU ??= SamplerState.Default.wrapU
    state.wrapV ??= SamplerState.Default.wrapV
    state.wrapW ??= SamplerState.Default.wrapW
    state.minLod ??= SamplerState.Default.minLod
    state.maxLod ??= SamplerState.Default.maxLod
    state.compareMode ??= SamplerState.Default.compareMode
    state.compareFunc ??= SamplerState.Default.compareFunc
    return state
  }

  /**
   * Applies sampler state params that are safe for non power of two textures
   */
  public static fixNonPowerOfTwo(state: SamplerStateParams): SamplerStateParams {
    state.wrapU = TextureWrapMode.Clamp
    state.wrapV = TextureWrapMode.Clamp

    state.magFilter = TextureFilter.Linear

    if (state.minFilter === TextureFilter.LinearMipLinear || state.minFilter === TextureFilter.LinearMipPoint) {
      state.minFilter = TextureFilter.Linear
    } else if (state.minFilter === TextureFilter.PointMipLinear || state.minFilter === TextureFilter.PointMipPoint) {
      state.minFilter = TextureFilter.Point
    }

    if (state.magFilter === TextureFilter.LinearMipLinear || state.magFilter === TextureFilter.LinearMipPoint) {
      state.magFilter = TextureFilter.Linear
    } else if (state.magFilter === TextureFilter.PointMipLinear || state.magFilter === TextureFilter.PointMipPoint) {
      state.magFilter = TextureFilter.Point
    }
    return state
  }

  /**
   * The graphics device
   */
  public abstract readonly device: Device

  public minFilter: number = SamplerState.Default.minFilter
  public magFilter: number = SamplerState.Default.magFilter
  public wrapU: number = SamplerState.Default.wrapU
  public wrapV: number = SamplerState.Default.wrapV
  public wrapW: number = SamplerState.Default.wrapW
  public minLod: number = SamplerState.Default.minLod
  public maxLod: number = SamplerState.Default.maxLod
  public compareMode: number = SamplerState.Default.compareMode
  public compareFunc: number = SamplerState.Default.compareFunc

  /**
   * @internal
   */
  public get minFilterName(): string {
    return nameOfTextureFilter(this.minFilter)
  }

  /**
   * @internal
   */
  public get magFilterName(): string {
    return nameOfTextureFilter(this.magFilter)
  }

  /**
   * @internal
   */
  public get wrapUName(): string {
    return nameOfTextureWrapMode(this.wrapU)
  }

  /**
   * @internal
   */
  public get wrapVName(): string {
    return nameOfTextureWrapMode(this.wrapV)
  }

  /**
   * @internal
   */
  public get wrapWName(): string {
    return nameOfTextureWrapMode(this.wrapW)
  }

  /**
   * Releases resources of this sampler state.
   */
  public abstract dispose(): this
}
