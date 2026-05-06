import type { StateNames } from './utils'

export type DepthBiasStateName = StateNames<typeof DepthBiasState, DepthBiasState>

export interface DepthBiasStateOptions {
  enable: boolean
  bias: number
  slopeScale: number
  clamp: number
}

const STATE = Symbol('Depth Bias State')
const STATE_CACHE: Record<string, DepthBiasState> = {}
let idCounter = 1

/**
 * @public
 */
export class DepthBiasState implements DepthBiasStateOptions {
  public static Default = DepthBiasState.cached({
    enable: false,
    bias: 0,
    slopeScale: 0,
    clamp: 0,
  })

  public static ShadowMap = DepthBiasState.cached({
    enable: true,
    bias: 1,
    slopeScale: 1.5,
    clamp: 0,
  })

  public static Decal = DepthBiasState.cached({
    enable: true,
    bias: 0.5,
    slopeScale: 0,
    clamp: 0,
  })

  private [STATE]: DepthBiasStateOptions

  public readonly id = idCounter++

  public get enable(): boolean {
    return this[STATE].enable
  }

  public get bias(): number {
    return this[STATE].bias
  }

  public get slopeScale(): number {
    return this[STATE].slopeScale
  }

  public get clamp(): number {
    return this[STATE].clamp
  }

  private constructor(options: DepthBiasStateOptions) {
    this[STATE] = options
  }

  public static get(state: DepthBiasStateName | Partial<DepthBiasStateOptions>): DepthBiasState {
    if (typeof state === 'string') {
      return DepthBiasState[state] ?? null
    }

    return DepthBiasState.cached(createOptions(state))
  }

  private static cached(options: DepthBiasStateOptions): DepthBiasState {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new DepthBiasState(options)
      STATE_CACHE[key] = state
    }
    return state
  }
}

function createOptions(options: Partial<DepthBiasStateOptions>): DepthBiasStateOptions {
  const enable = options?.enable ?? false
  if (!enable) {
    return {
      enable: false,
      bias: 0,
      slopeScale: 0,
      clamp: 0,
    }
  }
  return {
    enable,
    bias: options?.bias ?? 0,
    slopeScale: options?.slopeScale ?? 0,
    clamp: options?.clamp ?? 0,
  }
}

function createKey(options: DepthBiasStateOptions): string {
  return [options.enable, options.bias, options.slopeScale, options.clamp].join(',')
}
