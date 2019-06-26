import {
  CullMode,
  CullModeOption,
  FrontFace,
  FrontFaceOption,
  nameOfFrontFace,
  valueOfCullMode,
  valueOfFrontFace,
} from './../enums'

import { Device } from './../Device'

const params: Array<keyof CullStateParams> = [
  'cullMode',
  'enable',
  'frontFace',
]

/**
 * Options to be converted into {@link CullStateParams} via {@link CullState.convert}
 *
 * @public
 */
export interface CullStateOptions {
  frontFace?: FrontFaceOption
  cullMode?: CullModeOption
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
  /**
   * The graphics device
   */
  public device: Device

  private $frontFace: number = FrontFace.CounterClockWise
  private $cullMode: number = CullMode.Back
  private $enable: boolean = false
  private $hasChanged: boolean = false
  private $changes: CullStateParams = {}

  /**
   * Instantiates the {@link CullState}
   */
  constructor(device: Device) {
    this.device = device
    this.resolve()
  }

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
   * Gets the readable name of the front face
   */
  public get frontFaceName(): string {
    return nameOfFrontFace(this.frontFace)
  }
  /**
   * Gets and sets the front face
   */
  public get frontFace(): number {
    return this.$frontFace
  }
  public set frontFace(value: number) {
    if (this.$frontFace !== value) {
      this.$frontFace = value
      this.$changes.frontFace = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets the readable name of the cull mode
   */
  public get cullModeName(): string {
    return nameOfFrontFace(this.cullMode)
  }
  /**
   * Gets and sets the cull mode
   */
  public get cullMode(): number {
    return this.$cullMode
  }
  public set cullMode(value: number) {
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
      if (state.hasOwnProperty(key)) { this[key as any] = state[key] }
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
    const gl = this.device.context
    const changes = this.$changes
    if (changes.enable === true) {
      gl.enable(gl.CULL_FACE)
    }
    if (changes.enable === false) {
      gl.disable(gl.CULL_FACE)
    }
    if (changes.cullMode !== null) {
      gl.cullFace(this.cullMode)
    }
    if (changes.frontFace !== null) {
      gl.frontFace(this.frontFace)
    }
    this.clearChanges()
    return this
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    CullState.resolve(this.device, this)
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

  private clearChanges() {
    this.$hasChanged = false
    for (let key of params) { this.$changes[key as any] = undefined }
  }

  /**
   * Converts a state name or options into {@link CullStateParams}
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

    const result: CullStateParams = {} as any
    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'cullMode':
          result[key] = valueOfCullMode(state[key])
          break
        case 'frontFace':
          result[key] = valueOfFrontFace(state[key])
          break
        default:
          result[key] = state[key]
          break
      }
    }
    return result
  }

  /**
   * Resolves the current state from the GPU
   */
  public static resolve(device: Device): ICullState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(device: Device, out: T): T & ICullState
  public static resolve(device: Device, out: CullStateParams= {}): ICullState {
    const gl = device.context
    out.frontFace = gl.getParameter(gl.FRONT_FACE)
    out.enable = gl.getParameter(gl.CULL_FACE)
    out.cullMode = gl.getParameter(gl.CULL_FACE_MODE)
    return out as ICullState
  }

  /**
   * A default state with culling disabled
   */
  public static Default = Object.freeze<CullStateParams>({
    enable: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })

  /**
   * A state with culling disabled
   */
  public static CullNone = Object.freeze<CullStateParams>({
    enable: false,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })

  /**
   * A state with culling clock wise faces enabled
   */
  public static CullClockWise = Object.freeze<CullStateParams>({
    enable: true,
    cullMode: CullMode.Back,
    frontFace: FrontFace.CounterClockWise,
  })

  /**
   * A state with culling counter clock wise faces enabled
   */
  public static CullCounterClockWise = Object.freeze<CullStateParams>({
    enable: true,
    cullMode: CullMode.Back,
    frontFace: FrontFace.ClockWise,
  })
}
