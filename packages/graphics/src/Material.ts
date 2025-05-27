import { TypeToken, uuid } from '@gglib/utils'
import { Device } from './Device'
import { Effect, EffectOptions } from './Effect'
import { PROGRAM_BASIC } from './programs'
import { ShaderProgram, ShaderProgramOptions, ShaderUniformValue } from './resources'

/**
 * @public
 */
export type MaterialParameters = Record<string, ShaderUniformValue>

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export type MaterialOptions = MaterialEffectOptions | MaterialEffectNameOptions | MaterialProgramOptions

export interface MaterialOptionsBase<Parameters extends MaterialParameters = MaterialParameters> {
  /**
   * The descriptive name of this effect
   */
  name?: string

  /**
   * Effect parameters to be applied before rendering
   */
  parameters: Parameters
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialEffectOptions extends MaterialOptionsBase {
  /**
   * The effect instance or constructor options for {@link Effect}
   */
  effect: EffectOptions
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialEffectNameOptions extends MaterialOptionsBase {
  /**
   * The effect name from which to the effect should be created.
   */
  effectName: string
  technique?: string
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialProgramOptions extends MaterialOptionsBase {
  /**
   * The shader program options to be used to create the effect
   */
  program: ShaderProgramOptions
}

/**
 * Defines a parameter set for a specific {@link Effect}
 *
 * @public
 * @remarks
 * A material holds a reference to a {@link Effect} and a
 * set of parameters that should be used together when rendering.
 * This allows a {@link Effect} instance to be reused across
 * multiple materials each with a different set of parameters.
 */
export class Material<Params extends MaterialParameters = MaterialParameters> {
  /**
   * A symbol identifying the Array {@link Material} type.
   */
  public static readonly Array = new TypeToken<Material[]>('Material[]', {
    factory: () => {
      return []
    },
  })

  /**
   * A symbol identifying the {@link MaterialOptions} type.
   */
  public static readonly Options = new TypeToken<MaterialOptions>('MaterialOptions', {
    factory: () => {
      return {} as MaterialOptions
    },
  })

  /**
   * A symbol identifying the {@link MaterialOptions} type with effectUri set.
   */
  public static readonly OptionsUri = new TypeToken<MaterialOptions>('OptionsUri', {
    factory: () => {
      return { effectName: '' } as MaterialOptions
    },
  })

  /**
   * A symbol identifying the {@link MaterialOptions} type with effectUri set.
   */
  public static readonly OptionsTechnique = new TypeToken<MaterialOptions>('OptionsTechnique', {
    factory: () => {
      return { effectName: 'default' } as MaterialOptions
    },
  })

  /**
   * A symbol identifying the Array {@link MaterialOptions} type.
   */
  public static readonly OptionsArray = new TypeToken<MaterialOptions[]>('MaterialOptions[]', {
    factory: () => {
      return []
    },
  })

  /**
   * A unique id
   */
  public uid: string = uuid()

  /**
   * The graphics device
   */
  public device: Device

  /**
   * A user defined name of the material
   */
  public name: string

  /**
   * The effect to be used
   */
  public get effect(): Effect {
    return this._effect
  }

  /**
   * Effect parameters to be applied before rendering
   */
  public parameters: Params

  protected _effect: Effect
  public constructor(device: Device, options: MaterialOptions) {
    this.device = device
    this.name = options.name
    this.parameters = (options.parameters || {}) as Params
    let effect: Effect | EffectOptions
    if ('program' in options) {
      effect = {
        program: options.program,
      } satisfies EffectOptions
    }
    if ('effect' in options) {
      effect = options.effect
    }
    if (effect instanceof Effect) {
      this._effect = effect
    } else if (effect) {
      this._effect = device.createEffect(effect)
    } else {
      this.onConstructWithoutEffect(options)
    }
  }

  /**
   * Draws an object with the current effect
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }) {
    this.effect.draw(drawable, this.parameters)
  }

  /**
   * Draws a full screen quad with the current effect and parameters.
   */
  public drawQuad(flipY = false) {
    this.effect.drawQuad(this.parameters, flipY)
  }

  /**
   * Simply get the parameter by name.
   *
   * @remarks
   * This is a convenience method ot access parameters with Type casting.
   */
  public parameter<T>(name: string): T {
    return this.parameters[name] as T
  }

  protected onConstructWithoutEffect(options: MaterialOptions) {
    console.warn(`[Material] created without explicit effect or program. Using default effect.`)
    this._effect = this.device.createEffect({
      program: PROGRAM_BASIC,
    })
  }

  /**
   * Checks if the underlying effect and it's techniques and programs are all ready
   */
  public isReady() {
    return this.effect.isReady()
  }

  /**
   * Disposes the underlying effect
   */
  public dispose() {
    this.effect?.dispose()
    this._effect = null
    this.device = null
  }
}
