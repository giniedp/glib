import type { CompareFunction, MipmapFilter, TextureFilter, TextureWrapMode } from '../enums'
import type { StateNames } from './utils'

export type SamplerStateName = StateNames<typeof SamplerState, SamplerState>

/**
 * An object with all sampler state properties
 *
 * @public
 */
export interface SamplerStateOptions {
  minFilter: TextureFilter
  magFilter: TextureFilter
  mipFilter: MipmapFilter
  wrapU: TextureWrapMode
  wrapV: TextureWrapMode
  wrapW: TextureWrapMode
  minLod: number
  maxLod: number
  /**
   * Maximum anisotropy for anisotropic filtering. A value of 1 disables it.
   *
   * @remarks
   * Only applies when min, mag and mip filter are all 'linear'.
   * Clamped to the maximum supported by the device.
   */
  maxAnisotropy: number
  compare: boolean
  compareFunc: CompareFunction
}

const STATE = Symbol('Sampler State')
const STATE_CACHE: Record<string, SamplerState> = {}
const MIN_LOD = 0
const MAX_LOD = 32
const DEFAULT_ANISOTROPY = 8
let idCounter = 1

/**
 * @public
 */
export class SamplerState implements SamplerStateOptions {
  /**
   * The default sampler state which is essentially the same as {@link SamplerState.PointClamp}
   */
  public static Default = SamplerState.cached({
    minFilter: 'linear',
    magFilter: 'linear',
    mipFilter: 'linear',
    wrapU: 'clamp-to-edge',
    wrapV: 'clamp-to-edge',
    wrapW: 'clamp-to-edge',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: DEFAULT_ANISOTROPY,
    compare: false,
    compareFunc: 'less-equal',
  })

  /**
   * A sampler state with linear filtering but clamp mode
   */
  public static LinearClamp = SamplerState.cached({
    minFilter: 'linear',
    magFilter: 'linear',
    mipFilter: 'linear',
    wrapU: 'clamp-to-edge',
    wrapV: 'clamp-to-edge',
    wrapW: 'clamp-to-edge',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: DEFAULT_ANISOTROPY,
    compare: false,
    compareFunc: 'less-equal',
  })

  /**
   * A sampler state with linear filtering and wrap mode
   */
  public static LinearWrap = SamplerState.cached({
    minFilter: 'linear',
    magFilter: 'linear',
    mipFilter: 'linear',
    wrapU: 'repeat',
    wrapV: 'repeat',
    wrapW: 'repeat',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: DEFAULT_ANISOTROPY,
    compare: false,
    compareFunc: 'less-equal',
  })

  /**
   * A sampler state with point filtering and clamp mode
   */
  public static PointClamp = SamplerState.cached({
    minFilter: 'nearest',
    magFilter: 'nearest',
    mipFilter: 'nearest',
    wrapU: 'clamp-to-edge',
    wrapV: 'clamp-to-edge',
    wrapW: 'clamp-to-edge',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: 1,
    compare: false,
    compareFunc: 'less-equal',
  })

  /**
   * A sampler state with point filtering and wrap mode
   */
  public static PointWrap = SamplerState.cached({
    minFilter: 'nearest',
    magFilter: 'nearest',
    mipFilter: 'nearest',
    wrapU: 'repeat',
    wrapV: 'repeat',
    wrapW: 'repeat',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: 1,
    compare: false,
    compareFunc: 'less-equal',
  })

  /**
   *
   */
  public static LinearClampNoMipMap = SamplerState.cached({
    minFilter: 'linear',
    magFilter: 'linear',
    mipFilter: null,
    wrapU: 'clamp-to-edge',
    wrapV: 'clamp-to-edge',
    wrapW: 'clamp-to-edge',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: 1,
    compare: false,
    compareFunc: 'less-equal',
  })

  /**
   *
   */
  public static LinearWrapNoMipMap = SamplerState.cached({
    minFilter: 'linear',
    magFilter: 'linear',
    mipFilter: null,
    wrapU: 'repeat',
    wrapV: 'repeat',
    wrapW: 'repeat',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    maxAnisotropy: 1,
    compare: false,
    compareFunc: 'less-equal',
  })

  public static get(state: SamplerStateName | Partial<SamplerStateOptions>): SamplerState {
    if (typeof state === 'string') {
      if (!SamplerState[state]) {
        throw new Error(`SamplerState: Unknown sampler state name '${state}'.`)
      }
      return SamplerState[state] ?? null
    }

    return SamplerState.cached(createOptions(state))
  }

  private static cached(options: SamplerStateOptions): SamplerState {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new SamplerState(options)
      STATE_CACHE[key] = state
    }
    return state
  }

  private [STATE]: SamplerStateOptions

  private constructor(options: SamplerStateOptions) {
    this[STATE] = options
  }

  public readonly id = idCounter++

  public get minFilter(): TextureFilter {
    return this[STATE].minFilter
  }
  public get magFilter(): TextureFilter {
    return this[STATE].magFilter
  }
  public get mipFilter(): MipmapFilter {
    return this[STATE].mipFilter
  }
  public get wrapU(): TextureWrapMode {
    return this[STATE].wrapU
  }
  public get wrapV(): TextureWrapMode {
    return this[STATE].wrapV
  }
  public get wrapW(): TextureWrapMode {
    return this[STATE].wrapW
  }
  public get minLod(): number {
    return this[STATE].minLod
  }
  public get maxLod(): number {
    return this[STATE].maxLod
  }
  public get maxAnisotropy(): number {
    return this[STATE].maxAnisotropy
  }
  public get compare(): boolean {
    return this[STATE].compare
  }
  public get compareFunc(): CompareFunction {
    return this[STATE].compareFunc
  }
}

function createOptions(options: Partial<SamplerStateOptions>): SamplerStateOptions {
  const minFilter = options?.minFilter ?? 'linear'
  const magFilter = options?.magFilter ?? 'linear'
  const mipFilter = options?.mipFilter ?? 'linear'
  // anisotropy is ignored unless all filters are linear, normalize it so equal states share the cache key
  const isLinear = minFilter === 'linear' && magFilter === 'linear' && mipFilter === 'linear'
  return {
    minFilter,
    magFilter,
    mipFilter,
    wrapU: options?.wrapU ?? 'clamp-to-edge',
    wrapV: options?.wrapV ?? 'clamp-to-edge',
    wrapW: options?.wrapW ?? 'clamp-to-edge',
    minLod: options?.minLod ?? MIN_LOD,
    maxLod: options?.maxLod ?? MAX_LOD,
    maxAnisotropy: isLinear ? Math.max(1, options?.maxAnisotropy ?? DEFAULT_ANISOTROPY) : 1,
    compare: !!options?.compare,
    compareFunc: options?.compare ? (options?.compareFunc ?? 'less-equal') : 'always',
  }
}

function createKey(options: SamplerStateOptions): string {
  return [
    options.minFilter,
    options.magFilter,
    options.mipFilter,
    options.wrapU,
    options.wrapV,
    options.wrapW,
    options.minLod,
    options.maxLod,
    options.maxAnisotropy,
    options.compare,
    options.compareFunc,
  ].join(',')
}
