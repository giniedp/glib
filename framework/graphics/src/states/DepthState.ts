import { CompareFunction } from './../enums/Enums'
import { Device } from './../Device'

const propertyKeys: Array<keyof DepthStateOptions> = [
  'depthEnable',
  'depthFunction',
  'depthWriteEnable',
]

export interface DepthStateOptions {
  depthEnable?: boolean
  depthFunction?: number
  depthWriteEnable?: boolean
}

export class DepthState implements DepthStateOptions {

  public static Default = Object.freeze({
    depthEnable: true,
    depthFunction: CompareFunction.LessEqual,
    depthWriteEnable: true,
  })

  public static None = Object.freeze({
    depthEnable: false,
    depthFunction: CompareFunction.Always,
    depthWriteEnable: false,
  })

  public static DepthRead = Object.freeze({
    depthEnable: true,
    depthFunction: CompareFunction.LessEqual,
    depthWriteEnable: false,
  })

  public static convert(state: any): DepthStateOptions {
    if (typeof state === 'string') {
      state = DepthState[state]
    }
    if (!state) {
      return state
    }
    if (state.depthFunction) {
      state.depthFunction = CompareFunction[state.depthFunction]
    }
    return state
  }

  public static resolve(gl: any, out: any = {}): DepthStateOptions {
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
  private changes: DepthStateOptions = {}

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, options?: DepthStateOptions) {
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

  get depthFunctionName(): string {
    return CompareFunction.nameOf(this.depthFunction)
  }

  set depthFunction(value: number) {
    if (this.depthFunctionField !== value) {
      this.depthFunctionField = value
      this.changes.depthFunction = value
      this.hasChanged = true
    }
  }

  public assign(state: DepthStateOptions): DepthState {
    for (const key of propertyKeys) {
      if (state.hasOwnProperty(key)) {
        this[key] = state[key]
      }
    }
    return this
  }

  public commit(state?: DepthStateOptions): DepthState {
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

  public copy(out: any = {}): DepthStateOptions {
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
      this.changes[key] = undefined
    }
  }
}
