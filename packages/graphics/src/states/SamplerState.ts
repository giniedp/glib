import {
  CompareFunction,
  TextureFilter,
  TextureWrapMode,
} from './../enums'

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
  minFilter: TextureFilter
  magFilter: TextureFilter
  wrapU: TextureWrapMode
  wrapV: TextureWrapMode
  wrapW: TextureWrapMode
  minLod: number
  maxLod: number
  compareMode: number
  compareFunc: CompareFunction
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
    minFilter: 'NearestMipmapLinear',
    magFilter: 'Nearest',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with linear filtering but clamp mode
   */
  public static LinearClamp = Object.freeze<ISamplerState>({
    minFilter: 'LinearMipmapLinear',
    magFilter: 'Linear',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with linear filtering and wrap mode
   */
  public static LinearWrap = Object.freeze<ISamplerState>({
    minFilter: 'LinearMipmapLinear',
    magFilter: 'Linear',
    wrapU: 'Repeat',
    wrapV: 'Repeat',
    wrapW: 'Repeat',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with point filtering and clamp mode
   */
  public static PointClamp = Object.freeze<ISamplerState>({
    minFilter: 'NearestMipmapLinear',
    magFilter: 'Nearest',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with point filtering and wrap mode
   */
  public static PointWrap = Object.freeze<ISamplerState>({
    minFilter: 'NearestMipmapLinear',
    magFilter: 'Nearest',
    wrapU: 'Repeat',
    wrapV: 'Repeat',
    wrapW: 'Repeat',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
  })

  /**
   *
   */
  public static LinearClampNoMipMap = Object.freeze<ISamplerState>({
    minFilter: 'Linear',
    magFilter: 'Linear',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
  })

  /**
   *
   */
  public static LinearWrapNoMipMap = Object.freeze<ISamplerState>({
    minFilter: 'Linear',
    magFilter: 'Linear',
    wrapU: 'Repeat',
    wrapV: 'Repeat',
    wrapW: 'Repeat',
    minLod: -1000,
    maxLod: 1000,
    compareMode: 0,
    compareFunc: 'LessEqual',
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
          result[key] = state[key]
          break
        case 'wrapU':
        case 'wrapV':
        case 'wrapW':
          result[key] = state[key]
          break
        default:
          result[key] = state[key] as never
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
    state.wrapU = 'Clamp'
    state.wrapV = 'Clamp'
    //state.magFilter = 'Linear'

    if (state.minFilter === 'LinearMipmapLinear' || state.minFilter === 'LinearMipmapNearest') {
      state.minFilter = 'Linear'
    } else if (state.minFilter === 'NearestMipmapLinear' || state.minFilter === 'NearestMipmapNearest') {
      state.minFilter = 'Nearest'
    }

    if (state.magFilter === 'LinearMipmapLinear' || state.magFilter === 'LinearMipmapNearest') {
      state.magFilter = 'Linear'
    } else if (state.magFilter === 'NearestMipmapLinear' || state.magFilter === 'NearestMipmapNearest') {
      state.magFilter = 'Nearest'
    }
    return state
  }

  /**
   * The graphics device
   */
  public abstract readonly device: Device

  public minFilter: TextureFilter = SamplerState.Default.minFilter
  public magFilter: TextureFilter = SamplerState.Default.magFilter
  public wrapU: TextureWrapMode = SamplerState.Default.wrapU
  public wrapV: TextureWrapMode = SamplerState.Default.wrapV
  public wrapW: TextureWrapMode = SamplerState.Default.wrapW
  public minLod: number = SamplerState.Default.minLod
  public maxLod: number = SamplerState.Default.maxLod
  public compareMode: number = SamplerState.Default.compareMode
  public compareFunc: CompareFunction = SamplerState.Default.compareFunc

  /**
   * Releases resources of this sampler state.
   */
  public abstract dispose(): this
}
