import {
  CompareFunction,
  CompareFunctionOption,
  CullMode,
  nameOfCompareFunction,
  StencilOperation,
  StencilOperationOption,
  valueOfCompareFunction,
  valueOfStencilOperation,
} from './../enums/Enums'

import { Device } from './../Device'

const propertyKeys: Array<keyof StencilStateParams> = [
  'enable',
  'stencilFunction',
  'stencilReference',
  'stencilMask',
  'stencilFail',
  'stencilDepthFail',
  'stencilDepthPass',
  'stencilBackFunction',
  'stencilBackReference',
  'stencilBackMask',
  'stencilBackFail',
  'stencilBackDepthFail',
  'stencilBackDepthPass',
]

/**
 * @public
 */
export interface StencilStateParams {
  enable?: boolean
  stencilFunction?: CompareFunction
  stencilReference?: number
  stencilMask?: number
  stencilFail?: StencilOperation
  stencilDepthFail?: StencilOperation
  stencilDepthPass?: StencilOperation
  stencilBackFunction?: CompareFunction
  stencilBackReference?: number
  stencilBackMask?: number
  stencilBackFail?: StencilOperation
  stencilBackDepthFail?: StencilOperation
  stencilBackDepthPass?: StencilOperation
}

/**
 * @public
 */
export interface StencilStateOptions {
  enable?: boolean
  stencilFunction?: CompareFunctionOption
  stencilReference?: number
  stencilMask?: number
  stencilFail?: StencilOperationOption
  stencilDepthFail?: StencilOperationOption
  stencilDepthPass?: StencilOperationOption
  stencilBackFunction?: CompareFunctionOption
  stencilBackReference?: number
  stencilBackMask?: number
  stencilBackFail?: StencilOperationOption
  stencilBackDepthFail?: StencilOperationOption
  stencilBackDepthPass?: StencilOperationOption
}

/**
 * @public
 */
export class StencilState implements StencilStateParams {
  public device: Device
  public gl: WebGLRenderingContext
  private enableField: boolean = false
  private stencilFunctionField: number = CompareFunction.Always
  private stencilReferenceField: number = 0
  private stencilMaskField: number = 0xffffffff
  private stencilFailField: number = StencilOperation.Keep
  private stencilDepthFailField: number = StencilOperation.Keep
  private stencilDepthPassField: number = StencilOperation.Keep
  private stencilBackFunctionField: number = CompareFunction.Always
  private stencilBackReferenceField: number = 0
  private stencilBackMaskField: number = 0xffffffff
  private stencilBackFailField: number = StencilOperation.Keep
  private stencilBackDepthFailField: number = StencilOperation.Keep
  private stencilBackDepthPassField: number = StencilOperation.Keep
  private changes: StencilStateParams = {}
  private hasChanged: boolean = false

  public get isDirty() {
    return this.hasChanged
  }

  constructor(device: Device, state?: StencilStateParams) {
    this.device = device
    this.gl = device.context
    this.resolve()
    if (state) { this.assign(state) }
  }

  get stencilFunctionName(): string {
    return nameOfCompareFunction(this.stencilFunctionField)
  }

  get stencilFunction(): number {
    return this.stencilFunctionField
  }

  set stencilFunction(value: number) {
    if (this.stencilFunctionField !== value) {
      this.stencilFunctionField = value
      this.changes.stencilFunction = value
      this.hasChanged = true
    }
  }

  get stencilBackFunctionName(): string {
    return nameOfCompareFunction(this.stencilBackFunctionField)
  }

  get stencilBackFunction(): number {
    return this.stencilBackFunctionField
  }

  set stencilBackFunction(value: number) {
    if (this.stencilBackFunctionField !== value) {
      this.stencilBackFunctionField = value
      this.changes.stencilBackFunction = value
      this.hasChanged = true
    }
  }

  get stencilFailName(): string {
    return nameOfCompareFunction(this.stencilFailField)
  }

  get stencilFail(): number {
    return this.stencilFailField
  }

  set stencilFail(value: number) {
    if (this.stencilFailField !== value) {
      this.stencilFailField = value
      this.changes.stencilFail = value
      this.hasChanged = true
    }
  }

  get stencilDepthFailName(): string {
    return nameOfCompareFunction(this.stencilDepthFailField)
  }

  get stencilDepthFail(): number {
    return this.stencilDepthFailField
  }

  set stencilDepthFail(value: number) {
    if (this.stencilDepthFailField !== value) {
      this.stencilDepthFailField = value
      this.changes.stencilDepthFail = value
      this.hasChanged = true
    }
  }

  get stencilDepthPassName(): string {
    return nameOfCompareFunction(this.stencilDepthPassField)
  }

  get stencilDepthPass(): number {
    return this.stencilDepthPassField
  }

  set stencilDepthPass(value: number) {
    if (this.stencilDepthPassField !== value) {
      this.stencilDepthPassField = value
      this.changes.stencilDepthPass = value
      this.hasChanged = true
    }
  }

  get stencilBackFailName(): string {
    return nameOfCompareFunction(this.stencilBackFailField)
  }

  get stencilBackFail(): number {
    return this.stencilBackFailField
  }

  set stencilBackFail(value: number) {
    if (this.stencilBackFailField !== value) {
      this.stencilBackFailField = value
      this.changes.stencilBackFail = value
      this.hasChanged = true
    }
  }

  get stencilBackDepthFailName(): string {
    return nameOfCompareFunction(this.stencilBackDepthFailField)
  }

  get stencilBackDepthFail(): number {
    return this.stencilBackDepthFailField
  }

  set stencilBackDepthFail(value: number) {
    if (this.stencilBackDepthFailField !== value) {
      this.stencilBackDepthFailField = value
      this.changes.stencilBackDepthFail = value
      this.hasChanged = true
    }
  }

  get stencilBackDepthPassName(): string {
    return nameOfCompareFunction(this.stencilBackDepthPassField)
  }

  get stencilBackDepthPass(): number {
    return this.stencilBackDepthPassField
  }

  set stencilBackDepthPass(value: number) {
    if (this.stencilBackDepthPassField !== value) {
      this.stencilBackDepthPassField = value
      this.changes.stencilBackDepthPass = value
      this.hasChanged = true
    }
  }

  get stencilReference(): number {
    return this.stencilReferenceField
  }

  set stencilReference(value: number) {
    if (this.stencilReferenceField !== value) {
      this.stencilReferenceField = value
      this.changes.stencilReference = value
      this.hasChanged = true
    }
  }

  get stencilMask(): number {
    return this.stencilMaskField
  }

  set stencilMask(value: number) {
    if (this.stencilMaskField !== value) {
      this.stencilMaskField = value
      this.changes.stencilMask = value
      this.hasChanged = true
    }
  }

  get stencilBackReference(): number {
    return this.stencilBackReferenceField
  }

  set stencilBackReference(value: number) {
    if (this.stencilBackReferenceField !== value) {
      this.stencilBackReferenceField = value
      this.changes.stencilBackReference = value
      this.hasChanged = true
    }
  }

  get stencilBackMask(): number {
    return this.stencilBackMaskField
  }

  set stencilBackMask(value: number) {
    if (this.stencilBackMaskField !== value) {
      this.stencilBackMaskField = value
      this.changes.stencilBackMask = value
      this.hasChanged = true
    }
  }

  get enable(): boolean {
    return this.enableField
  }

  set enable(value: boolean) {
    if (this.enableField !== value) {
      this.enableField = value
      this.changes.enable = value
      this.hasChanged = true
    }
  }

  public assign(state: StencilStateParams= {}): StencilState {
    for (let key of propertyKeys) {
      if (state.hasOwnProperty(key)) { this[key] = state[key] }
    }
    return this
  }

  public commit(state?: StencilStateParams): StencilState {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }

    let gl = this.gl
    let changes = this.changes

    let enable = changes.enable
    if (enable === true) {
      gl.enable(gl.STENCIL_TEST)
    } else if (enable === false) {
      gl.disable(gl.STENCIL_TEST)
    }

    if (changes.stencilFunction !== null || changes.stencilReference !== null || changes.stencilMask !== null) {
      gl.stencilFuncSeparate(CullMode.Front, this.stencilFunction, this.stencilReference, this.stencilMask)
    }

    if (changes.stencilFail !== null || changes.stencilDepthFail !== null || changes.stencilDepthPass !== null) {
      gl.stencilOpSeparate(CullMode.Front, this.stencilFail, this.stencilDepthFail, this.stencilDepthPass)
    }

    if (changes.stencilBackFunction !== null || changes.stencilBackReference !== null || changes.stencilBackMask !== null) {
      gl.stencilFuncSeparate(CullMode.Back, this.stencilBackFunction, this.stencilBackReference, this.stencilBackMask)
    }

    if (changes.stencilBackFail !== null || changes.stencilBackDepthFail !== null || changes.stencilBackDepthPass !== null) {
      gl.stencilOpSeparate(CullMode.Back, this.stencilBackFail, this.stencilBackDepthFail, this.stencilBackDepthPass)
    }

    this.clearChanges()
    return this
  }

  public resolve(): StencilState {
    StencilState.resolve(this.gl, this)
    this.clearChanges()
    return this
  }

  public copy(out: any= {}): StencilStateParams {
    for (let key of propertyKeys) { out[key] = this[key] }
    return out
  }

  private clearChanges() {
    this.hasChanged = false
    for (let key of propertyKeys) { this.changes[key] = undefined }
  }

  public static convert(state: string | StencilStateOptions): StencilStateParams {
    if (typeof state === 'string') {
      return StencilState[state] ? {...StencilState[state]} : null
    }

    if (!state) {
      return null
    }

    if (state.stencilFunction) {
      state.stencilFunction = valueOfCompareFunction(state.stencilFunction)
    }
    if (state.stencilBackFunction) {
      state.stencilBackFunction = valueOfCompareFunction(state.stencilBackFunction)
    }

    if (state.stencilFail) {
      state.stencilFail = valueOfStencilOperation(state.stencilFail)
    }
    if (state.stencilDepthFail) {
      state.stencilDepthFail = valueOfStencilOperation(state.stencilDepthFail)
    }
    if (state.stencilDepthPass) {
      state.stencilDepthPass = valueOfStencilOperation(state.stencilDepthPass)
    }

    if (state.stencilBackFail) {
      state.stencilBackFail = valueOfStencilOperation(state.stencilBackFail)
    }
    if (state.stencilBackDepthFail) {
      state.stencilBackDepthFail = valueOfStencilOperation(state.stencilBackDepthFail)
    }
    if (state.stencilBackDepthPass) {
      state.stencilBackDepthPass = valueOfStencilOperation(state.stencilBackDepthPass)
    }
    return state as StencilStateParams
  }

  public static resolve(gl: WebGLRenderingContext, out: any= {}): StencilStateParams {
    out.enable = gl.getParameter(gl.STENCIL_TEST)

    out.stencilFunction = gl.getParameter(gl.STENCIL_FUNC)
    out.stencilReference = gl.getParameter(gl.STENCIL_REF)
    out.stencilMask = gl.getParameter(gl.STENCIL_VALUE_MASK)

    out.stencilFail = gl.getParameter(gl.STENCIL_FAIL)
    out.stencilDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL)
    out.stencilDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS)

    out.stencilBackFunction = gl.getParameter(gl.STENCIL_BACK_FUNC)
    out.stencilBackReference = gl.getParameter(gl.STENCIL_BACK_REF)
    out.stencilBackMask = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK)

    out.stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL)
    out.stencilBackDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL)
    out.stencilBackDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS)
    return out
  }

  public static Default = Object.freeze<StencilStateParams>({
    enable: false,

    // front face stencil
    stencilFunction: CompareFunction.Always,
    stencilReference: 0,
    stencilMask: 0xffffffff,

    stencilFail: StencilOperation.Keep,
    stencilDepthFail: StencilOperation.Keep,
    stencilDepthPass: StencilOperation.Keep,

    // back face stencil
    stencilBackFunction: CompareFunction.Always,
    stencilBackReference: 0,
    stencilBackMask: 0xffffffff,

    stencilBackFail: StencilOperation.Keep,
    stencilBackDepthFail: StencilOperation.Keep,
    stencilBackDepthPass: StencilOperation.Keep,
  })
}
