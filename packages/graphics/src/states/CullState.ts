import type { CullMode, FrontFace } from '../enums'
import type { StateNames } from './utils'

export type CullStateName = StateNames<typeof CullState, CullState>

export interface CullStateOptions {
  frontFace: FrontFace
  cullMode: CullMode
  enable: boolean
}

const STATE = Symbol('Cull State')
const STATE_CACHE: Record<string, CullState> = {}
let idCounter = 1

/**
 * @public
 */
export class CullState implements CullStateOptions {
  /**
   * Face culling disabled. Both front and back faces are rendered.
   */
  public static Disabled = CullState.cached({
    enable: false,
    cullMode: 'back',
    frontFace: 'ccw',
  })

  /**
   * Face culling disabled. Both front and back faces are rendered.
   */
  public static None = CullState.cached({
    enable: false,
    cullMode: 'back',
    frontFace: 'ccw',
  })

  /**
   * Back-face culling enabled.
   * Triangles with clockwise winding are culled (front faces are CCW).
   */
  public static CullBack = CullState.cached({
    enable: true,
    cullMode: 'back',
    frontFace: 'ccw',
  })

  /**
   * Front-face culling enabled.
   * Triangles with counter-clockwise winding are culled (front faces are CCW).
   */
  public static CullFront = CullState.cached({
    enable: true,
    cullMode: 'front',
    frontFace: 'ccw',
  })

  /**
   * Back-face culling with clockwise winding as front faces.
   */
  public static readonly CullBackCW = CullState.cached({
    enable: true,
    cullMode: 'back',
    frontFace: 'cw',
  })

  /**
   * Front-face culling with clockwise winding as front faces.
   */
  public static readonly CullFrontCW = CullState.cached({
    enable: true,
    cullMode: 'front',
    frontFace: 'cw',
  })

  private [STATE]: CullStateOptions

  public get enable(): boolean {
    return this[STATE].enable
  }

  public readonly id = idCounter++

  public get frontFace(): FrontFace {
    return this[STATE].frontFace
  }

  public get cullMode(): CullMode {
    return this[STATE].cullMode
  }

  private constructor(options: CullStateOptions) {
    this[STATE] = options
  }

  public static get(state: CullStateName | Partial<CullStateOptions>): CullState {
    if (typeof state === 'string') {
      return CullState[state] ?? null
    }

    return CullState.cached(createOptions(state))
  }

  private static cached(options: CullStateOptions): CullState {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new CullState(options)
      STATE_CACHE[key] = state
    }
    return state
  }
}

function createOptions(options: Partial<CullStateOptions>): CullStateOptions {
  return {
    enable: options?.enable ?? false,
    cullMode: options?.cullMode ?? 'back',
    frontFace: options?.frontFace ?? 'ccw',
  }
}

function createKey(options: CullStateOptions): string {
  return [options.enable, options.cullMode, options.frontFace].join(',')
}
