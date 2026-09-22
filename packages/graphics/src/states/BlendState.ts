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
   * @example
   *  colorBlendFunction: 'add',
   *  alphaBlendFunction: 'add',
   *
   *  colorSrcBlend: 'one',
   *  alphaSrcBlend: 'one',
   *
   *  colorDstBlend: 'zero',
   *  alphaDstBlend: 'zero',
   */
  public static readonly Disabled = BlendState.cached({
    enable: false,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'one',
    alphaSrcBlend: 'one',

    colorDstBlend: 'zero',
    alphaDstBlend: 'zero',
  })

  /**
   * Opaque rendering with blending enabled.
   * Functionally identical to Disabled, but keeps the blend stage active.
   * @example
   *  colorBlendFunction: 'add',
   *  alphaBlendFunction: 'add',
   *
   *  colorSrcBlend: 'one',
   *  alphaSrcBlend: 'one',
   *
   *  colorDstBlend: 'zero',
   *  alphaDstBlend: 'zero',
   */
  public static readonly Opaque = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'one',
    alphaSrcBlend: 'one',

    colorDstBlend: 'zero',
    alphaDstBlend: 'zero',
  })

  /**
   * Standard alpha compositing for straight (non-premultiplied) alpha inputs.
   * Shader outputs RGB independent of alpha.
   * @example
   *  colorBlendFunction: 'add',
   *  alphaBlendFunction: 'add',
   *
   *  colorSrcBlend: 'src-alpha',
   *  alphaSrcBlend: 'src-alpha',
   *
   *  colorDstBlend: 'one-minus-src-alpha',
   *  alphaDstBlend: 'one-minus-src-alpha',
   */
  public static readonly Alpha = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'src-alpha',
    alphaSrcBlend: 'src-alpha',

    colorDstBlend: 'one-minus-src-alpha',
    alphaDstBlend: 'one-minus-src-alpha',
  })

  /**
   * Standard alpha compositing for premultiplied alpha inputs.
   * Expects RGB pre-multiplied by A (RGB = color * alpha).
   * @example
   *  colorBlendFunction: 'add',
   *  alphaBlendFunction: 'add',
   *
   *  colorSrcBlend: 'one',
   *  alphaSrcBlend: 'one',
   *
   *  colorDstBlend: 'one-minus-src-alpha',
   *  alphaDstBlend: 'one-minus-src-alpha',
   */
  public static readonly AlphaPremultiplied = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'one',
    alphaSrcBlend: 'one',

    colorDstBlend: 'one-minus-src-alpha',
    alphaDstBlend: 'one-minus-src-alpha',
  })

  /**
   * Pure additive blending.
   * Source color is added directly to the destination without alpha modulation.
   * Alpha channel is accumulated additively.
   * @example
   *  colorBlendFunction: 'add',
   *  alphaBlendFunction: 'add',
   *
   *  colorSrcBlend: 'one',
   *  alphaSrcBlend: 'one',
   *
   *  colorDstBlend: 'one',
   *  alphaDstBlend: 'one',
   */
  public static readonly AdditivePure = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'one',
    alphaSrcBlend: 'one',
    colorDstBlend: 'one',
    alphaDstBlend: 'one',
  })

  /**
   * Additive blending with alpha modulation.
   * Contribution is scaled by source alpha (common for particles, glow).
   * @example
   * colorBlendFunction: 'add',
   * alphaBlendFunction: 'add',
   *
   * colorSrcBlend: 'src-alpha',
   * alphaSrcBlend: 'src-alpha',
   *
   * colorDstBlend: 'one',
   * alphaDstBlend: 'one',
   */
  public static readonly Additive = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'src-alpha',
    alphaSrcBlend: 'src-alpha',
    colorDstBlend: 'one',
    alphaDstBlend: 'one',
  })

  /**
   * Additive blending with separate alpha accumulation.
   * Color is alpha-weighted, alpha accumulates independently.
   * @example
   * colorBlendFunction: 'add',
   * alphaBlendFunction: 'add',
   *
   * colorSrcBlend: 'src-alpha',
   * alphaSrcBlend: 'one',
   *
   * colorDstBlend: 'one',
   * alphaDstBlend: 'one',
   */
  public static readonly AdditiveAlpha = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'src-alpha',
    alphaSrcBlend: 'one',

    colorDstBlend: 'one',
    alphaDstBlend: 'one',
  })

  /**
   * Subtractive blending.
   * Removes light/energy from the destination (stylized effects, darkening).
   * @example
   * colorBlendFunction: 'ReverseSubtract',
   * alphaBlendFunction: 'add',
   *
   * colorSrcBlend: 'src-alpha',
   * alphaSrcBlend: 'one',
   *
   * colorDstBlend: 'one',
   * alphaDstBlend: 'one',
   */
  public static readonly Subtractive = BlendState.cached({
    enable: true,

    colorBlendFunction: 'reverse-subtract',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'src-alpha',
    alphaSrcBlend: 'one',

    colorDstBlend: 'one',
    alphaDstBlend: 'one',
  })

  /**
   * Multiplicative blending.
   * Multiplies destination by source color (lightmaps, shadows, decals).
   * @example
   * colorBlendFunction: 'add',
   * alphaBlendFunction: 'add',
   *
   * colorSrcBlend: 'DstColor',
   * alphaSrcBlend: 'zero',
   *
   * colorDstBlend: 'zero',
   * alphaDstBlend: 'one',
   */
  public static readonly Multiply = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'dst',
    alphaSrcBlend: 'zero',

    colorDstBlend: 'zero',
    alphaDstBlend: 'one',
  })

  /**
   * Inverse multiplicative blending.
   * Lightens the image by multiplying inverse colors (similar to "screen").
   * @example
   * colorBlendFunction: 'add',
   * alphaBlendFunction: 'add',
   *
   * colorSrcBlend: 'OneMinusDstColor',
   * alphaSrcBlend: 'one',
   *
   * colorDstBlend: 'one',
   * alphaDstBlend: 'one',
   */
  public static readonly MultiplyInverse = BlendState.cached({
    enable: true,

    colorBlendFunction: 'add',
    alphaBlendFunction: 'add',

    colorSrcBlend: 'one-minus-dst',
    alphaSrcBlend: 'one',

    colorDstBlend: 'one',
    alphaDstBlend: 'one',
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

    colorBlendFunction: options.colorBlendFunction ?? 'add',
    alphaBlendFunction: options.alphaBlendFunction ?? 'add',

    colorSrcBlend: options.colorSrcBlend ?? 'one',
    alphaSrcBlend: options.alphaSrcBlend ?? 'one',
    colorDstBlend: options.colorDstBlend ?? 'zero',
    alphaDstBlend: options.alphaDstBlend ?? 'zero',
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
