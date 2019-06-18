import { Device } from './../Device'
import { CompareFunction, CompareFunctionOption, nameOfCompareFunction, valueOfCompareFunction } from './../enums/Enums'

const propertyKeys: Array<keyof DepthStateParams> = [
  'depthEnable',
  'depthFunction',
  'depthWriteEnable',
]

/**
 * @public
 */
export interface DepthStateParams {
  depthEnable?: boolean
  depthFunction?: number
  depthWriteEnable?: boolean
}

/**
 * @public
 */
export interface DepthStateOptions {
  depthEnable?: boolean
  depthFunction?: CompareFunctionOption
  depthWriteEnable?: boolean
}

/**
 * @public
 */
export class DepthState implements DepthStateParams {

  public static Default = Object.freeze<DepthStateParams>({
    depthEnable: true,
    depthFunction: CompareFunction.LessEqual,
    depthWriteEnable: true,
  })

  public static None = Object.freeze<DepthStateParams>({
    depthEnable: false,
    depthFunction: CompareFunction.Always,
    depthWriteEnable: false,
  })

  public static DepthRead = Object.freeze<DepthStateParams>({
    depthEnable: true,
    depthFunction: CompareFunction.LessEqual,
    depthWriteEnable: false,
  })

  public static convert(state: string | DepthStateOptions): DepthStateParams {
    if (typeof state === 'string') {
      return DepthState[state] ? {...DepthState[state]} : null
    }
    if (!state) {
      return null
    }
    if (state.depthFunction) {
      state.depthFunction =  valueOfCompareFunction(state.depthFunction)
    }
    return state as DepthStateParams
  }

  public static resolve(gl: any, out: any = {}): DepthStateParams {
    out.depthEnable = gl.getParameter(gl.DEPTH_TEST)
    out.depthFunction = gl.getParameter(gl.DEPTH_FUNC)
    out.depthWriteEnable = gl.getParameter(gl.DEPTH_WRITEMASK)
    return out
  }

  public device: Device
  public gl: WebGLRenderingContext
  private depthEnableField: boolean = true
  private depthFunctionField: number = CompareFunction.LessEqual
  private depthWriteEnableField: boolean = true
  private hasChanged: boolean
  private changes: DepthStateParams = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, options?: DepthStateParams) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (options) {
      this.assign(options)
    }
  }

  get depthEnable(): boolean {
    return this.depthEnableField
  }

  set depthEnable(value: boolean) {
    if (this.depthEnableField !== value) {
      this.depthEnableField = value
      this.changes.depthEnable = value
      this.hasChanged = true
    }
  }

  get depthWriteEnable(): boolean {
    return this.depthWriteEnableField
  }

  set depthWriteEnable(value: boolean) {
    if (this.depthWriteEnableField !== value) {
      this.depthWriteEnableField = value
      this.changes.depthWriteEnable = value
      this.hasChanged = true
    }
  }

  get depthFunction(): number {
    return this.depthFunctionField
  }

  set depthFunction(value: number) {
    if (this.depthFunctionField !== value) {
      this.depthFunctionField = value
      this.changes.depthFunction = value
      this.hasChanged = true
    }
  }

  get depthFunctionName(): string {
    return nameOfCompareFunction(this.depthFunction)
  }

  public assign(state: DepthStateParams): DepthState {
    for (const key of propertyKeys) {
      if (state.hasOwnProperty(key)) {
        this[key as any] = state[key]
      }
    }
    return this
  }

  public commit(state?: DepthStateParams): DepthState {
    if (state) {
      this.assign(state)
    }
    if (!this.hasChanged) {
      return this
    }
    const gl = this.gl
    const changes = this.changes
    if (changes.depthFunction != null) {
      gl.depthFunc(changes.depthFunction)
    }
    if (changes.depthWriteEnable != null) {
      gl.depthMask(changes.depthWriteEnable)
    }
    if (changes.depthEnable === true) {
      gl.enable(gl.DEPTH_TEST)
    }
    if (changes.depthEnable === false) {
      gl.disable(gl.DEPTH_TEST)
    }
    this.clearChanges()
    return this
  }

  public copy(out: any = {}): DepthStateParams {
    for (const key of propertyKeys) {
      out[key] = this[key]
    }
    return out
  }

  public resolve(): DepthState {
    DepthState.resolve(this.gl, this)
    this.clearChanges()
    return this
  }

  private clearChanges() {
    this.hasChanged = false
    for (const key of propertyKeys) {
      this.changes[key as any] = undefined
    }
  }
}
