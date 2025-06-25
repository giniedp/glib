import {
  CompareFunction,
  CullMode,
  StencilOperation,
} from './../enums'

import { Device } from './../Device'
import { hasOwnProperty } from '@gglib/utils'

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
  protected stencilFunctionField: CompareFunction = 'Always'
  protected stencilReferenceField: number = 0
  protected stencilMaskField: number = 0xffffffff
  protected stencilFailField: StencilOperation = 'Keep'
  protected stencilDepthFailField: StencilOperation = 'Keep'
  protected stencilDepthPassField: StencilOperation = 'Keep'
  protected stencilBackFunctionField: CompareFunction = 'Always'
  protected stencilBackReferenceField: number = 0
  protected stencilBackMaskField: number = 0xffffffff
  protected stencilBackFailField: StencilOperation = 'Keep'
  protected stencilBackDepthFailField: StencilOperation = 'Keep'
  protected stencilBackDepthPassField: StencilOperation = 'Keep'
  protected changes: StencilStateParams = {}
  protected hasChanged: boolean = false

  public get isDirty() {
    return this.hasChanged
  }

  get stencilFunction(): CompareFunction {
    return this.stencilFunctionField
  }

  set stencilFunction(value: CompareFunction) {
    if (this.stencilFunctionField !== value) {
      this.stencilFunctionField = value
      this.changes.stencilFunction = value
      this.hasChanged = true
    }
  }

  get stencilBackFunction(): CompareFunction {
    return this.stencilBackFunctionField
  }

  set stencilBackFunction(value: CompareFunction) {
    if (this.stencilBackFunctionField !== value) {
      this.stencilBackFunctionField = value
      this.changes.stencilBackFunction = value
      this.hasChanged = true
    }
  }

  get stencilFail(): StencilOperation {
    return this.stencilFailField
  }

  set stencilFail(value: StencilOperation) {
    if (this.stencilFailField !== value) {
      this.stencilFailField = value
      this.changes.stencilFail = value
      this.hasChanged = true
    }
  }

  get stencilDepthFail(): StencilOperation {
    return this.stencilDepthFailField
  }

  set stencilDepthFail(value: StencilOperation) {
    if (this.stencilDepthFailField !== value) {
      this.stencilDepthFailField = value
      this.changes.stencilDepthFail = value
      this.hasChanged = true
    }
  }

  get stencilDepthPass(): StencilOperation {
    return this.stencilDepthPassField
  }

  set stencilDepthPass(value: StencilOperation) {
    if (this.stencilDepthPassField !== value) {
      this.stencilDepthPassField = value
      this.changes.stencilDepthPass = value
      this.hasChanged = true
    }
  }

  get stencilBackFail(): StencilOperation {
    return this.stencilBackFailField
  }

  set stencilBackFail(value: StencilOperation) {
    if (this.stencilBackFailField !== value) {
      this.stencilBackFailField = value
      this.changes.stencilBackFail = value
      this.hasChanged = true
    }
  }

  get stencilBackDepthFail(): StencilOperation {
    return this.stencilBackDepthFailField
  }

  set stencilBackDepthFail(value: StencilOperation) {
    if (this.stencilBackDepthFailField !== value) {
      this.stencilBackDepthFailField = value
      this.changes.stencilBackDepthFail = value
      this.hasChanged = true
    }
  }

  get stencilBackDepthPass(): StencilOperation {
    return this.stencilBackDepthPassField
  }

  set stencilBackDepthPass(value: StencilOperation) {
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
      if (hasOwnProperty(state, key)) { this[key as any] = state[key] }
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
          result[key] = state[key]
          break
        case 'stencilFail':
        case 'stencilDepthFail':
        case 'stencilDepthPass':
        case 'stencilBackFail':
        case 'stencilBackDepthFail':
        case 'stencilBackDepthPass':
          result[key] = state[key]
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
    stencilFunction: 'Always',
    stencilReference: 0,
    stencilMask: 0xffffffff,

    stencilFail: 'Keep',
    stencilDepthFail: 'Keep',
    stencilDepthPass: 'Keep',

    // back face stencil
    stencilBackFunction: 'Always',
    stencilBackReference: 0,
    stencilBackMask: 0xffffffff,

    stencilBackFail: 'Keep',
    stencilBackDepthFail: 'Keep',
    stencilBackDepthPass: 'Keep',
  })
}
