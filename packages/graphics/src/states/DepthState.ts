import { Device } from './../Device'
import {
  CompareFunction,
  CompareFunctionOption,
  nameOfCompareFunction,
  valueOfCompareFunction,
} from './../enums'

const params: Array<keyof DepthStateParams> = [
  'depthFunction',
  'depthWriteEnable',
  'enable',
]

/**
 * Options to be converted into {@link DepthStateParams} via {@link DepthState.convert}
 *
 * @public
 */
export interface DepthStateOptions {
  enable?: boolean
  depthFunction?: CompareFunctionOption
  depthWriteEnable?: boolean
}

/**
 * An object with all depth state parameters
 *
 * @public
 */
export interface IDepthState {
  enable: boolean
  depthFunction: CompareFunction
  depthWriteEnable: boolean
}

/**
 * Represents a sub set of {@link IDepthState}
 *
 * @public
 */
export type DepthStateParams = Partial<IDepthState>

/**
 * @public
 */
export class DepthState implements IDepthState {

  /**
   * A default state with depth buffer read and write enabled
   */
  public static Default = Object.freeze<DepthStateParams>({
    enable: true,
    depthFunction: CompareFunction.LessEqual,
    depthWriteEnable: true,
  })

  /**
   * A state with depth buffer read and write both disabled
   */
  public static None = Object.freeze<DepthStateParams>({
    enable: false,
    depthFunction: CompareFunction.Always,
    depthWriteEnable: false,
  })

  /**
   * A state with depth buffer enabled for read only
   */
  public static DepthRead = Object.freeze<DepthStateParams>({
    enable: true,
    depthFunction: CompareFunction.LessEqual,
    depthWriteEnable: false,
  })

  /**
   * Converts a state name or options into {@link DepthStateParams}
   *
   * @param state - The state name or state options to convert
   */
  public static convert(state: string | DepthStateOptions): DepthStateParams {
    if (typeof state === 'string') {
      return DepthState[state] ? {...DepthState[state]} : null
    }
    if (!state) {
      return null
    }

    const result: DepthStateParams = {}
    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'depthFunction':
          result[key] = valueOfCompareFunction(state[key])
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
  public static resolve(device: Device): IDepthState
  /**
   * Resolves the current state from the GPU
   */
  public static resolve<T>(device: Device, out: T): T & IDepthState
  public static resolve(device: Device, out: DepthStateParams = {}): IDepthState {
    const gl = device.context
    out.enable = gl.getParameter(gl.DEPTH_TEST)
    out.depthFunction = gl.getParameter(gl.DEPTH_FUNC)
    out.depthWriteEnable = gl.getParameter(gl.DEPTH_WRITEMASK)
    return out as IDepthState
  }

  /**
   * The graphics device
   */
  public device: Device

  private $enable: boolean = true
  private $depthFunction: number = CompareFunction.LessEqual
  private $depthWriteEnable: boolean = true
  private $hasChanged: boolean
  private $changes: DepthStateParams = {}

  /**
   * Indicates whether the state has changes which are not committed to the GPU
   */
  public get isDirty() {
    return this.$hasChanged
  }

  /**
   * Instantiates the {@link DepthState}
   */
  constructor(device: Device) {
    this.device = device
    this.resolve()
  }

  /**
   * Enables or disables the depth buffer
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
   * Enables or disables write to depth buffer
   */
  public get depthWriteEnable(): boolean {
    return this.$depthWriteEnable
  }
  public set depthWriteEnable(value: boolean) {
    if (this.$depthWriteEnable !== value) {
      this.$depthWriteEnable = value
      this.$changes.depthWriteEnable = value
      this.$hasChanged = true
    }
  }

  /**
   * Gets and sets the depth function
   */
  public get depthFunction(): number {
    return this.$depthFunction
  }
  public set depthFunction(value: number) {
    if (this.$depthFunction !== value) {
      this.$depthFunction = value
      this.$changes.depthFunction = value
      this.$hasChanged = true
    }
  }
  /**
   * Gets the readable name of the depth function
   */
  public get depthFunctionName(): string {
    return nameOfCompareFunction(this.depthFunction)
  }

  /**
   * Assigns multiple parameters to the current state
   */
  public assign(state: DepthStateParams): this {
    for (const key of params) {
      if (state.hasOwnProperty(key)) {
        this[key as any] = state[key]
      }
    }
    return this
  }

  /**
   * Uploads all changes to the GPU
   *
   * @param state - State changes to be assigned before committing
   */
  public commit(state?: DepthStateParams): this {
    if (state) {
      this.assign(state)
    }
    if (!this.$hasChanged) {
      return this
    }
    const gl = this.device.context
    const changes = this.$changes
    if (changes.depthFunction != null) {
      gl.depthFunc(changes.depthFunction)
    }
    if (changes.depthWriteEnable != null) {
      gl.depthMask(changes.depthWriteEnable)
    }
    if (changes.enable === true) {
      gl.enable(gl.DEPTH_TEST)
    }
    if (changes.enable === false) {
      gl.disable(gl.DEPTH_TEST)
    }
    this.clearChanges()
    return this
  }

  /**
   * Creates a copy of this state state
   */
  public copy(): IDepthState
  /**
   * Creates a copy of this state and writes it into the target object
   *
   * @param target - Where the state should be written to
   */
  public copy<T>(target: T): T & IDepthState
  public copy(out: any= {}): IDepthState {
    for (const key of params) {
      out[key] = this[key]
    }
    return out
  }

  /**
   * Resolves the current state from the GPU
   */
  public resolve(): this {
    DepthState.resolve(this.device, this)
    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.$hasChanged = false
    for (const key of params) {
      this.$changes[key as any] = undefined
    }
  }
}
