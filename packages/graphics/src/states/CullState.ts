import {
  CullMode,
  FrontFace,
} from './../enums'
import { hasOwnProperty } from '@gglib/utils'

const params: Array<keyof CullStateParams> = [
  'cullMode',
  'enable',
  'frontFace',
]

/**
 * Options to be converted into {@link ICullState} via {@link CullState.convert}
 *
 * @public
 */
export interface CullStateOptions {
  frontFace?: FrontFace
  cullMode?: CullMode
  enable?: boolean
}

/**
 * An object with all cull state parameters
 *
 * @public
 */
export interface ICullState {
  frontFace: FrontFace
  cullMode: CullMode
  enable: boolean
}

/**
 * An object with all cull state parameters
 *
 * @public
 */
export type CullStateParams = Partial<ICullState>

/**
 * @public
 */
export class CullState implements CullStateParams {

  protected $frontFace: FrontFace = 'CCW'
  protected $cullMode: CullMode = 'Back'
  protected $enable: boolean = false
  protected $hasChanged: boolean = false
  protected $changes: CullStateParams = {}

  public get isDirty() {
    return this.$hasChanged
  }

  /**
   * Enables or disables the culling
   */
  public get enable(): boolean {
    return this.$enable
  }
  public set enable(value: boolean) {
    if (this.$enable !== value) {
      this.$enable = value
      this.$changes.enable = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the front face
   */
  public get frontFace(): FrontFace {
    return this.$frontFace
  }
  public set frontFace(value: FrontFace) {
    if (this.$frontFace !== value) {
      this.$frontFace = value
      this.$changes.frontFace = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the cull mode
   */
  public get cullMode(): CullMode {
    return this.$cullMode
  }
  public set cullMode(value: CullMode) {
    if (this.$cullMode !== value) {
      this.$cullMode = value
      this.$changes.cullMode = value
      this.$hasChanged = true
    }
  }

  /**
   * Assigns multiple parameters to the current state
   */
  public assign(state: CullStateParams): this {
    for (let key of params) {
      if (hasOwnProperty(state, key)) { this[key as any] = state[key] }
    }
    return this
  }

  /**
   * Uploads all changes to the GPU
   *
   * @param state - State changes to be assigned before committing
   */
  public commit(state?: CullStateParams): this {
    if (state) { this.assign(state) }
    if (!this.$hasChanged) { return this }
    this.commitChanges(this.$changes)
    this.clearChanges()
    return this
  }

  /**
   * Creates a copy of this state state
   */
  public copy(): ICullState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & ICullState
  public copy(out: any= {}): ICullState {
    for (let key of params) { out[key] = this[key] }
    return out
  }

  protected commitChanges(changes: Partial<ICullState>) {
    //
  }

  protected clearChanges() {
    this.$hasChanged = false
    for (let key of params) { this.$changes[key as any] = undefined }
  }

  /**
   * Converts a state name or options into {@link ICullState}
   *
   * @param state - The state name or state options to convert
   */
  public static convert(state: string | CullStateOptions): CullStateParams {
    if (typeof state === 'string') {
      return CullState[state] ? {...CullState[state]} : null
    }
    if (!state) {
      return null
    }

    const result: CullStateParams = {}
    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'cullMode':
          result[key] = state[key]
          break
        case 'frontFace':
          result[key] = state[key]
          break
        default:
          result[key] = state[key]
          break
      }
    }
    return result
  }

  /**
   * A default state with culling disabled
   */
  public static Default = Object.freeze<ICullState>({
    enable: false,
    cullMode: 'Back',
    frontFace: 'CW',
  })

  /**
   * A state with culling disabled
   */
  public static CullNone = Object.freeze<ICullState>({
    enable: false,
    cullMode: 'Back',
    frontFace: 'CW',
  })

  /**
   * A state with culling clock wise faces enabled
   */
  public static CullClockWise = Object.freeze<ICullState>({
    enable: true,
    cullMode: 'Back',
    frontFace: 'CCW',
  })

  /**
   * A state with culling counter clock wise faces enabled
   */
  public static CullCounterClockWise = Object.freeze<ICullState>({
    enable: true,
    cullMode: 'Back',
    frontFace: 'CW',
  })
}
