import type { Blend, BlendFunction } from '../enums'
import type { StateNames } from './utils'

export type BlendStateName = StateNames<typeof BlendState, BlendState>

export interface BlendStateOptions {
  enable: boolean
  colorBlendFunction: BlendFunction
  colorSrcBlend: Blend
  colorDstBlend: Blend
  alphaBlendFunction: BlendFunction
  alphaSrcBlend: Blend
  alphaDstBlend: Blend
}

export type BlendConstant = [number, number, number, number]

const STATE = Symbol('Blend State')
const STATE_CACHE: Record<string, BlendState> = {}
let idCounter = 1
/**
 * @public
 */
export class BlendState implements BlendStateOptions {
  /**
   * Blending disabled. Source fully overwrites destination.
   */
  public static readonly Disabled = BlendState.cached({
    enable: false,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'One',
    alphaSrcBlend: 'One',
    colorDstBlend: 'Zero',
    alphaDstBlend: 'Zero',
  })

  /**
   * Opaque rendering with blending enabled.
   * Functionally identical to Disabled, but keeps the blend stage active.
   */
  public static readonly Opaque = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'One',
    alphaSrcBlend: 'One',
    colorDstBlend: 'Zero',
    alphaDstBlend: 'Zero',
  })

  /**
   * Standard alpha compositing for straight (non-premultiplied) alpha inputs.
   * Shader outputs RGB independent of alpha.
   */
  public static readonly Alpha = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'SrcAlpha',
    alphaSrcBlend: 'SrcAlpha',

    colorDstBlend: 'OneMinusSrcAlpha',
    alphaDstBlend: 'OneMinusSrcAlpha',
  })

  /**
   * Standard alpha compositing for premultiplied alpha inputs.
   * Expects RGB pre-multiplied by A (RGB = color * alpha).
   */
  public static readonly AlphaPremultiplied = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'One',
    alphaSrcBlend: 'One',

    colorDstBlend: 'OneMinusSrcAlpha',
    alphaDstBlend: 'OneMinusSrcAlpha',
  })

  /**
   * Pure additive blending.
   * Source color is added directly to the destination without alpha modulation.
   * Alpha channel is accumulated additively.
   */
  public static readonly AdditivePure = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'One',
    alphaSrcBlend: 'One',
    colorDstBlend: 'One',
    alphaDstBlend: 'One',
  })

  /**
   * Additive blending with alpha modulation.
   * Contribution is scaled by source alpha (common for particles, glow).
   */
  public static readonly Additive = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'SrcAlpha',
    alphaSrcBlend: 'SrcAlpha',
    colorDstBlend: 'One',
    alphaDstBlend: 'One',
  })

  /**
   * Additive blending with separate alpha accumulation.
   * Color is alpha-weighted, alpha accumulates independently.
   */
  public static readonly AdditiveAlpha = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'SrcAlpha',
    alphaSrcBlend: 'One',

    colorDstBlend: 'One',
    alphaDstBlend: 'One',
  })

  /**
   * Subtractive blending.
   * Removes light/energy from the destination (stylized effects, darkening).
   */
  public static readonly Subtractive = BlendState.cached({
    enable: true,

    colorBlendFunction: 'ReverseSubtract',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'SrcAlpha',
    alphaSrcBlend: 'One',

    colorDstBlend: 'One',
    alphaDstBlend: 'One',
  })

  /**
   * Multiplicative blending.
   * Multiplies destination by source color (lightmaps, shadows, decals).
   */
  public static readonly Multiply = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'DstColor',
    alphaSrcBlend: 'Zero',

    colorDstBlend: 'Zero',
    alphaDstBlend: 'One',
  })

  /**
   * Inverse multiplicative blending.
   * Lightens the image by multiplying inverse colors (similar to "screen").
   */
  public static readonly MultiplyInverse = BlendState.cached({
    enable: true,

    colorBlendFunction: 'Add',
    alphaBlendFunction: 'Add',

    colorSrcBlend: 'OneMinusDstColor',
    alphaSrcBlend: 'One',

    colorDstBlend: 'One',
    alphaDstBlend: 'One',
  })

  /**
   * Converts a state name or options into {@link BlendStateParams}
   *
   * @param state - The state name or state options to convert
   */
  public static get(state: BlendStateName | Partial<BlendStateOptions>): BlendState {
    if (!state) {
      return null
    }

    if (typeof state === 'string') {
      return BlendState[state] ?? null
    }

    return BlendState.cached(createOptions(state))
  }

  private static cached(options: BlendStateOptions): BlendState {
    const key = createKey(options)
    let state = STATE_CACHE[key]
    if (!state) {
      state = new BlendState(options)
      STATE_CACHE[key] = state
    }
    return state
  }

  private [STATE]: BlendStateOptions

  public readonly id = idCounter++
  public get enable(): boolean {
    return this[STATE].enable
  }

  public get colorBlendFunction(): BlendFunction {
    return this[STATE].colorBlendFunction
  }

  public get colorSrcBlend(): Blend {
    return this[STATE].colorSrcBlend
  }

  public get colorDstBlend(): Blend {
    return this[STATE].colorDstBlend
  }

  public get alphaBlendFunction(): BlendFunction {
    return this[STATE].alphaBlendFunction
  }

  public get alphaSrcBlend(): Blend {
    return this[STATE].alphaSrcBlend
  }

  public get alphaDstBlend(): Blend {
    return this[STATE].alphaDstBlend
  }

  private constructor(options: BlendStateOptions) {
    this[STATE] = options
  }
}

function createOptions(options: Partial<BlendStateOptions>): BlendStateOptions {
  return {
    enable: options.enable ?? false,

    colorBlendFunction: options.colorBlendFunction ?? 'Add',
    alphaBlendFunction: options.alphaBlendFunction ?? 'Add',

    colorSrcBlend: options.colorSrcBlend ?? 'One',
    alphaSrcBlend: options.alphaSrcBlend ?? 'One',
    colorDstBlend: options.colorDstBlend ?? 'Zero',
    alphaDstBlend: options.alphaDstBlend ?? 'Zero',
  }
}

function createKey(options: BlendStateOptions): string {
  return [
    options.enable,
    options.colorBlendFunction,
    options.colorSrcBlend,
    options.colorDstBlend,
    options.alphaBlendFunction,
    options.alphaSrcBlend,
    options.alphaDstBlend,
  ].join(',')
}
