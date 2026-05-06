import type { CompareFunction, StencilOperation } from './../enums'
import type { StateNames } from './utils'

export type StencilStateName = StateNames<typeof StencilState, StencilState>

export interface StencilStateOptions {
  enable: boolean
  readMask: number
  writeMask: number

  frontFunction: CompareFunction
  frontFail: StencilOperation
  frontDepthFail: StencilOperation
  frontDepthPass: StencilOperation

  backFunction: CompareFunction
  backFail: StencilOperation
  backDepthFail: StencilOperation
  backDepthPass: StencilOperation
}

const STATE = Symbol('Stencil State')
const STATE_CACHE: Record<string, StencilState> = {}
let idCounter = 1

export class StencilState implements StencilStateOptions {
  private [STATE]: StencilStateOptions

  public readonly id = idCounter++

  public get enable(): boolean {
    return this[STATE].enable
  }
  public get readMask(): number {
    return this[STATE].readMask
  }
  public get writeMask(): number {
    return this[STATE].writeMask
  }

  public get frontFunction(): CompareFunction {
    return this[STATE].frontFunction
  }
  public get frontFail(): StencilOperation {
    return this[STATE].frontFail
  }
  public get frontDepthFail(): StencilOperation {
    return this[STATE].frontDepthFail
  }
  public get frontDepthPass(): StencilOperation {
    return this[STATE].frontDepthPass
  }

  public get backFunction(): CompareFunction {
    return this[STATE].backFunction
  }
  public get backFail(): StencilOperation {
    return this[STATE].backFail
  }
  public get backDepthFail(): StencilOperation {
    return this[STATE].backDepthFail
  }
  public get backDepthPass(): StencilOperation {
    return this[STATE].backDepthPass
  }

  private constructor(options: StencilStateOptions) {
    this[STATE] = options
  }

  public static get(state: StencilStateName | Partial<StencilStateOptions>): StencilState {
    if (typeof state === 'string') {
      return StencilState[state] ?? null
    }

    return StencilState.cached(createOptions(state))
  }

  private static cached(options: StencilStateOptions): StencilState {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new StencilState(options)
      STATE_CACHE[key] = state
    }
    return state
  }

  /**
   * Default clear value for stencil buffer (0 by default)
   */
  public static DefaultClear = 0

  /**
   * Default stencil state with stencil test disabled and read/write masks set to 0xffffffff
   */
  public static Default = StencilState.cached({
    enable: false,
    readMask: 0xffffffff,
    writeMask: 0xffffffff,

    // front face stencil
    frontFunction: 'Always',
    frontFail: 'Keep',
    frontDepthFail: 'Keep',
    frontDepthPass: 'Keep',

    // back face stencil
    backFunction: 'Always',
    backFail: 'Keep',
    backDepthFail: 'Keep',
    backDepthPass: 'Keep',
  })
}

function createOptions(options?: Partial<StencilStateOptions>): StencilStateOptions {
  return {
    enable: options?.enable ?? false,
    readMask: options?.readMask ?? 0xffffffff,
    writeMask: options?.writeMask ?? 0xffffffff,

    frontFunction: options?.frontFunction ?? 'Always',
    frontFail: options?.frontFail ?? 'Keep',
    frontDepthFail: options?.frontDepthFail ?? 'Keep',
    frontDepthPass: options?.frontDepthPass ?? 'Keep',

    backFunction: options?.backFunction ?? 'Always',
    backFail: options?.backFail ?? 'Keep',
    backDepthFail: options?.backDepthFail ?? 'Keep',
    backDepthPass: options?.backDepthPass ?? 'Keep',
  }
}

function createKey(options: StencilStateOptions): string {
  return [
    options.enable,
    options.readMask,
    options.writeMask,
    options.frontFunction,
    options.frontFail,
    options.frontDepthFail,
    options.frontDepthPass,
    options.backFunction,
    options.backFail,
    options.backDepthFail,
    options.backDepthPass,
  ].join(',')
}
