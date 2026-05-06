import type { CompareFunction } from '../enums'
import type { StateNames } from './utils'

export type DepthStateName = StateNames<typeof DepthState, DepthState>

/**
 * Options to be converted into {@link IDepthState} via {@link DepthState.convert}
 *
 * @public
 */
export interface DepthStateOptions {
  enabled: boolean
  depthFunction: CompareFunction
  depthWriteEnabled: boolean
}

const STATE = Symbol('Depth State')
const STATE_CACHE: Record<string, DepthState> = {}
let idCounter = 1

/**
 * @public
 */
export class DepthState implements DepthStateOptions {
  /**
   * Default clear value for depth buffer (1 by default)
   */
  public static DefaultClear = 1

  public static Disabled = new DepthState({
    enabled: false,
    depthFunction: 'LessEqual',
    depthWriteEnabled: false,
  })

  public static Less = new DepthState({
    enabled: true,
    depthFunction: 'Less',
    depthWriteEnabled: true,
  })

  public static LessNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'Less',
    depthWriteEnabled: false,
  })

  public static LessEqual = new DepthState({
    enabled: true,
    depthFunction: 'LessEqual',
    depthWriteEnabled: true,
  })

  public static LessEqualNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'LessEqual',
    depthWriteEnabled: false,
  })

  public static Greater = new DepthState({
    enabled: true,
    depthFunction: 'Greater',
    depthWriteEnabled: true,
  })

  public static GreaterNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'Greater',
    depthWriteEnabled: false,
  })

  public static GreaterEqual = new DepthState({
    enabled: true,
    depthFunction: 'GreaterEqual',
    depthWriteEnabled: true,
  })

  public static GreaterEqualNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'GreaterEqual',
    depthWriteEnabled: false,
  })

  public static Equal = new DepthState({
    enabled: true,
    depthFunction: 'Equal',
    depthWriteEnabled: true,
  })

  public static EqualNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'Equal',
    depthWriteEnabled: false,
  })

  public static NotEqual = new DepthState({
    enabled: true,
    depthFunction: 'NotEqual',
    depthWriteEnabled: true,
  })

  public static NotEqualNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'NotEqual',
    depthWriteEnabled: false,
  })

  public static Never = new DepthState({
    enabled: true,
    depthFunction: 'Never',
    depthWriteEnabled: true,
  })

  public static NeverNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'Never',
    depthWriteEnabled: false,
  })

  public static Always = new DepthState({
    enabled: true,
    depthFunction: 'Always',
    depthWriteEnabled: true,
  })

  public static AlwaysNoWrite = new DepthState({
    enabled: true,
    depthFunction: 'Always',
    depthWriteEnabled: false,
  })

  public static get(state: DepthStateName | Partial<DepthStateOptions>): DepthState {
    if (typeof state === 'string') {
      return DepthState[state] ?? null
    }

    return DepthState.cached(createOptions(state))
  }

  private static cached(options: DepthStateOptions): DepthState {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new DepthState(options)
      STATE_CACHE[key] = state
    }
    return state
  }

  private readonly [STATE]: DepthStateOptions

  public readonly id = idCounter++

  public get enabled(): boolean {
    return this[STATE].enabled
  }

  public get depthWriteEnabled(): boolean {
    return this[STATE].depthWriteEnabled
  }

  public get depthFunction(): CompareFunction {
    return this[STATE].depthFunction
  }

  private constructor(options: DepthStateOptions) {
    this[STATE] = options
  }
}

function createOptions(options: Partial<DepthStateOptions>): DepthStateOptions {
  return {
    enabled: options?.enabled ?? true,
    depthFunction: options?.depthFunction ?? 'LessEqual',
    depthWriteEnabled: options?.depthWriteEnabled ?? true,
  }
}

function createKey(options: DepthStateOptions): string {
  return [options.enabled, options.depthFunction, options.depthWriteEnabled].join(',')
}
