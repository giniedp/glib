import {
  CompareFunction,
  nameOfTextureFilter,
  nameOfTextureWrapMode,
  TextureFilter,
  TextureType,
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

  public static convert(state: SamplerStateParams): ISamplerState {
    if (typeof state === 'string') {
      return SamplerState[state] ? { ...SamplerState[state] as ISamplerState } : null
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
   * Applies sampler state params that are safe for non power of two textures
   */
  public static fixNonPowerOfTwo(state: SamplerStateParams): SamplerStateParams {
    state.wrapU = TextureWrapMode.Clamp
    state.wrapV = TextureWrapMode.Clamp

    state.magFilter = TextureFilter.Linear

    if (state.minFilter === TextureFilter.LinearMipLinear ||
      state.minFilter === TextureFilter.LinearMipPoint) {
      state.minFilter = TextureFilter.Linear
    } else if (state.minFilter === TextureFilter.PointMipLinear ||
      state.minFilter === TextureFilter.PointMipPoint) {
      state.minFilter = TextureFilter.Point
    }

    if (state.magFilter === TextureFilter.LinearMipLinear ||
      state.magFilter === TextureFilter.LinearMipPoint) {
      state.magFilter = TextureFilter.Linear
    } else if (state.magFilter === TextureFilter.PointMipLinear ||
      state.magFilter === TextureFilter.PointMipPoint) {
      state.magFilter = TextureFilter.Point
    }
    return state
  }

  /**
   * The graphics device
   */
  public abstract readonly device: Device

  protected $minFilter: number = TextureFilter.PointMipLinear
  protected $magFilter: number = TextureFilter.Point
  protected $wrapU: number = TextureWrapMode.Clamp
  protected $wrapV: number = TextureWrapMode.Clamp
  protected $wrapW: number = TextureWrapMode.Clamp
  protected $minLod: number = -1000
  protected $maxLod: number = 1000
  protected $compareMode: number = 0
  protected $compareFunc: number = CompareFunction.LessEqual

  private hasChanged: boolean
  private changes: SamplerStateParams = {}

  /**
   * @internal
   */
  public get minFilterName(): string {
    return nameOfTextureFilter(this.$minFilter)
  }
  /**
   *
   */
  public get minFilter(): number {
    return this.$minFilter
  }
  public set minFilter(value: number) {
    if (this.$minFilter !== value) {
      this.$minFilter = value
      this.changes.minFilter = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get magFilterName(): string {
    return nameOfTextureFilter(this.$magFilter)
  }
  /**
   *
   */
  public get magFilter(): number {
    return this.$magFilter
  }
  public set magFilter(value: number) {
    if (this.$magFilter !== value) {
      this.$magFilter = value
      this.changes.magFilter = value
      this.hasChanged = true
    }
  }

  /**
   * @internal
   */
  public get wrapUName(): string {
    return nameOfTextureWrapMode(this.$wrapU)
  }
  /**
   *
   */
  public get wrapU(): number {
    return this.$wrapU
  }
  public set wrapU(value: number) {
    if (this.$wrapU !== value) {
      this.$wrapU = value
      this.changes.wrapU = value
      this.hasChanged = true
    }
  }
  /**
   * @internal
   */
  public get wrapVName(): string {
    return nameOfTextureWrapMode(this.$wrapV)
  }
  /**
   *
   */
  public get wrapV(): number {
    return this.$wrapV
  }
  public set wrapV(value: number) {
    if (this.$wrapV !== value) {
      this.$wrapV = value
      this.changes.wrapV = value
      this.hasChanged = true
    }
  }
  /**
   * @internal
   */
  public get wrapWName(): string {
    return nameOfTextureWrapMode(this.$wrapW)
  }
  /**
   *
   */
  public get wrapW(): number {
    return this.$wrapW
  }
  public set wrapW(value: number) {
    if (this.$wrapW !== value) {
      this.$wrapW = value
      this.changes.wrapW = value
      this.hasChanged = true
    }
  }
  /**
   *
   */
  public get minLod(): number {
    return this.$minLod
  }
  public set minLod(value: number) {
    if (this.$minLod !== value) {
      this.$minLod = value
      this.changes.minLod = value
      this.hasChanged = true
    }
  }
  /**
   *
   */
  public get maxLod(): number {
    return this.$maxLod
  }
  public set maxLod(value: number) {
    if (this.$maxLod !== value) {
      this.$maxLod = value
      this.changes.maxLod = value
      this.hasChanged = true
    }
  }
  /**
   *
   */
  public get compareMode(): number {
    return this.$compareMode
  }
  public set compareMode(value: number) {
    if (this.$compareMode !== value) {
      this.$compareMode = value
      this.changes.compareMode = value
      this.hasChanged = true
    }
  }
  /**
   *
   */
  public get compareFunc(): number {
    return this.$compareFunc
  }
  public set compareFunc(value: number) {
    if (this.$compareFunc !== value) {
      this.$compareFunc = value
      this.changes.compareFunc = value
      this.hasChanged = true
    }
  }

  /**
   * Recreates the underlying sampler object if necessary
   */
  public abstract setup(): this

  public abstract destroy(): this

  public assign(state: SamplerStateParams): this {
    for (const key of params) {
      this[key] = state[key]
    }
    return this
  }

  /**
   * Creates a copy of this state
   */
  public copy(): ISamplerState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & ISamplerState
  public copy(out: any = {}): ISamplerState {
    for (const key of params) {
      out[key] = this[key]
    }
    return out
  }

  public commit(state?: SamplerStateParams): this {
    if (state) {
      this.assign(state)
    }
    if (!this.hasChanged) {
      return
    }

    const gl = this.device.context as WebGL2RenderingContext
    this.commitChanges(this.changes)
    this.clearChanges()
    return this
  }

  public abstract commitChanges(changes: SamplerStateParams): this

  protected clearChanges() {
    this.hasChanged = false
    for (let key of params) {
      this.changes[key as any] = undefined
    }
  }
}
