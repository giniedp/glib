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
  compare: boolean
  compareFunc: CompareFunction
}

const STATE = Symbol('Sampler State')
const STATE_CACHE: Record<string, SamplerState> = {}
const MIN_LOD = 0
const MAX_LOD = 32
let idCounter = 1

/**
 * @public
 */
export class SamplerState implements SamplerStateOptions {
  /**
   * The default sampler state which is essentially the same as {@link SamplerState.PointClamp}
   */
  public static Default = SamplerState.cached({
    minFilter: 'Linear',
    magFilter: 'Linear',
    mipFilter: 'Linear',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with linear filtering but clamp mode
   */
  public static LinearClamp = SamplerState.cached({
    minFilter: 'Linear',
    magFilter: 'Linear',
    mipFilter: 'Linear',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with linear filtering and wrap mode
   */
  public static LinearWrap = SamplerState.cached({
    minFilter: 'Linear',
    magFilter: 'Linear',
    mipFilter: 'Linear',
    wrapU: 'Repeat',
    wrapV: 'Repeat',
    wrapW: 'Repeat',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with point filtering and clamp mode
   */
  public static PointClamp = SamplerState.cached({
    minFilter: 'Nearest',
    magFilter: 'Nearest',
    mipFilter: 'Nearest',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
  })

  /**
   * A sampler state with point filtering and wrap mode
   */
  public static PointWrap = SamplerState.cached({
    minFilter: 'Nearest',
    magFilter: 'Nearest',
    mipFilter: 'Nearest',
    wrapU: 'Repeat',
    wrapV: 'Repeat',
    wrapW: 'Repeat',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
  })

  /**
   *
   */
  public static LinearClampNoMipMap = SamplerState.cached({
    minFilter: 'Linear',
    magFilter: 'Linear',
    mipFilter: 'None',
    wrapU: 'Clamp',
    wrapV: 'Clamp',
    wrapW: 'Clamp',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
  })

  /**
   *
   */
  public static LinearWrapNoMipMap = SamplerState.cached({
    minFilter: 'Linear',
    magFilter: 'Linear',
    mipFilter: 'None',
    wrapU: 'Repeat',
    wrapV: 'Repeat',
    wrapW: 'Repeat',
    minLod: MIN_LOD,
    maxLod: MAX_LOD,
    compare: false,
    compareFunc: 'LessEqual',
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
  public get compare(): boolean {
    return this[STATE].compare
  }
  public get compareFunc(): CompareFunction {
    return this[STATE].compareFunc
  }
}

function createOptions(options: Partial<SamplerStateOptions>): SamplerStateOptions {
  return {
    minFilter: options?.minFilter ?? 'Linear',
    magFilter: options?.magFilter ?? 'Linear',
    mipFilter: options?.mipFilter ?? 'Linear',
    wrapU: options?.wrapU ?? 'Clamp',
    wrapV: options?.wrapV ?? 'Clamp',
    wrapW: options?.wrapW ?? 'Clamp',
    minLod: options?.minLod ?? MIN_LOD,
    maxLod: options?.maxLod ?? MAX_LOD,
    compare: !!options?.compare,
    compareFunc: options?.compare ? (options?.compareFunc ?? 'LessEqual') : 'Always',
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
    options.compare,
    options.compareFunc,
  ].join(',')
}
