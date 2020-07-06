import {
  CompareFunction,
  CompareFunctionOption,
  CullMode,
  nameOfCompareFunction,
  StencilOperation,
  StencilOperationOption,
  valueOfCompareFunction,
  valueOfStencilOperation,
} from './../enums'

import { Device } from './../Device'

const params: Array<keyof StencilStateParams> = [
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
 * Options to be converted into {@link IStencilState} via {@link StencilState.convert}
 *
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
 * An object with all depth state parameters
 *
 * @public
 */
export interface IStencilState {
  enable: boolean
  stencilFunction: CompareFunction
  stencilReference: number
  stencilMask: number
  stencilFail: StencilOperation
  stencilDepthFail: StencilOperation
  stencilDepthPass: StencilOperation
  stencilBackFunction: CompareFunction
  stencilBackReference: number
  stencilBackMask: number
  stencilBackFail: StencilOperation
  stencilBackDepthFail: StencilOperation
  stencilBackDepthPass: StencilOperation
}

/**
 * Represents a sub set of {@link IStencilState}
 *
 * @public
 */
export type StencilStateParams = Partial<IStencilState>

/**
 * @public
 */
export class StencilState implements IStencilState {

  protected enableField: boolean = false
  protected stencilFunctionField: number = CompareFunction.Always
  protected stencilReferenceField: number = 0
  protected stencilMaskField: number = 0xffffffff
  protected stencilFailField: number = StencilOperation.Keep
  protected stencilDepthFailField: number = StencilOperation.Keep
  protected stencilDepthPassField: number = StencilOperation.Keep
  protected stencilBackFunctionField: number = CompareFunction.Always
  protected stencilBackReferenceField: number = 0
  protected stencilBackMaskField: number = 0xffffffff
  protected stencilBackFailField: number = StencilOperation.Keep
  protected stencilBackDepthFailField: number = StencilOperation.Keep
  protected stencilBackDepthPassField: number = StencilOperation.Keep
  protected changes: StencilStateParams = {}
  protected hasChanged: boolean = false

  public get isDirty() {
    return this.hasChanged
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

  public assign(state: StencilStateParams= {}): this {
    for (let key of params) {
      if (state.hasOwnProperty(key)) { this[key as any] = state[key] }
    }
    return this
  }

  public commit(state?: StencilStateParams): this {
    if (state) { this.assign(state) }
    if (!this.hasChanged) { return this }
    this.commitChanges(this.changes)
    this.clearChanges()
    return this
  }

  public copy(out: any= {}): StencilStateParams {
    for (let key of params) { out[key] = this[key] }
    return out
  }

  protected commitChanges(changes: Partial<IStencilState>) {
    //
  }

  protected clearChanges() {
    this.hasChanged = false
    for (let key of params) { this.changes[key as any] = undefined }
  }

  public static convert(state: string | StencilStateOptions): StencilStateParams {
    if (typeof state === 'string') {
      return StencilState[state] ? {...StencilState[state]} : null
    }

    if (!state) {
      return null
    }

    const result: StencilStateParams = {}
    for (const key of params) {
      if (!(key in state)) {
        continue
      }
      switch (key) {
        case 'stencilFunction':
        case 'stencilBackFunction':
          result[key] = valueOfCompareFunction(state[key])
          break
        case 'stencilFail':
        case 'stencilDepthFail':
        case 'stencilDepthPass':
        case 'stencilBackFail':
        case 'stencilBackDepthFail':
        case 'stencilBackDepthPass':
          result[key] = valueOfStencilOperation(state[key])
          break
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

  public static Default = Object.freeze<IStencilState>({
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
