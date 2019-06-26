import { Device } from './../Device'

const params: Array<keyof OffsetStateParams> = [
  'enable',
  'offsetFactor',
  'offsetUnits',
]

/**
 * An object with all offset state parameters
 *
 * @public
 */
export interface IOffsetState {
  enable: boolean
  offsetFactor: number
  offsetUnits: number
}

/**
 * Represents a sub set of {@link IOffsetState}
 *
 * @public
 */
export type OffsetStateParams = Partial<IOffsetState>

/**
 * @public
 */
export class OffsetState implements IOffsetState {
  /**
   * The graphics device
   */
  public device: Device

  private $enable: boolean = false
  private $offsetFactor: number = 0
  private $offsetUnits: number = 0
  private $hasChanged: boolean = false
  private $changes: OffsetStateParams = {}

  /**
   * Indicates whether the state has changes which are not committed to the GPU
   */
  public get isDirty() {
    return this.$hasChanged
  }

  /**
   * Instantiates the {@link OffsetState}
   */
  constructor(device: Device) {
    this.device = device
    this.resolve()
  }

  /**
   * Enables or disables the offset
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
   * Gets and sets the offset factor
   */
  public get offsetFactor(): number {
    return this.$offsetFactor
  }
  public set offsetFactor(value: number) {
    if (this.$offsetFactor !== value) {
      this.$offsetFactor = value
      this.$changes.offsetFactor = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the offset units
   */
  public get offsetUnits(): number {
    return this.$offsetUnits
  }
  public set offsetUnits(value: number) {
    if (this.$offsetUnits !== value) {
      this.$offsetUnits = value
      this.$changes.offsetUnits = value
      this.$hasChanged = true
    }
  }

  /**
   * Assigns multiple parameters to the current state
   */
  public assign(state: OffsetStateParams): this {
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
  public commit(state?: OffsetStateParams): this {
    if (state) { this.assign(state) }
    if (!this.$hasChanged) { return this }
    const changes = this.$changes
    const gl = this.device.context
    if (changes.enable === true) {
      gl.enable(gl.POLYGON_OFFSET_FILL)
    }
    if (changes.enable === false) {
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }
    if (changes.offsetFactor !== null || changes.offsetUnits !== null) {
      gl.polygonOffset(this.offsetFactor, this.offsetUnits)
    }
    this.clearChanges()
    return this
  }

  /**
   * Creates a copy of this state state
   */
  public copy(): IOffsetState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & IOffsetState
  public copy(out: any= {}): IOffsetState {
    for (let key of params) { out[key] = this[key] }
    return out
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    OffsetState.resolve(this.device, this)
    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.$hasChanged = false
    for (let key of params) { this.$changes[key as any] = undefined }
  }

  /**
   * Converts a state name or options into {@link DepthStateParams}
   *
   * @param state - The state name or state options to convert
   */
  public static convert(state: string | OffsetStateParams): OffsetStateParams {
    if (typeof state === 'string') {
      return OffsetState[state] ? {...OffsetState[state]} : null
    }
    if (!state) {
      return null
    }

    const result: OffsetStateParams = {}
    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'enable':
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
   * Resolves the current state from the GPU
   */
  public static resolve(device: Device): IOffsetState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(device: Device, out: T): T & IOffsetState
  public static resolve(device: Device, out: OffsetStateParams = {}): IOffsetState {
    const gl = device.context
    out.enable = gl.getParameter(gl.POLYGON_OFFSET_FILL)
    out.offsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR)
    out.offsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS)
    return out as IOffsetState
  }

  /**
   * A default state with offset disabled
   */
  public static Default = Object.freeze<OffsetStateParams>({
    enable: false,
    offsetFactor: 0,
    offsetUnits: 0,
  })
}
