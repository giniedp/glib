import { uuid, TypeToken, Log } from '@gglib/utils'
import { Device } from './Device'
import { ShaderProgram, ShaderUniformValue } from './resources'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'

/**
 * @public
 */
export type MaterialParameters = { [key: string]: ShaderUniformValue }

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialOptions<E extends ShaderEffectOptions | ShaderEffect = ShaderEffectOptions | ShaderEffect> {
  /**
   * The descriptive name of this effect
   */
  name?: string
  /**
   * The effect instance or constructor options for {@link ShaderEffect}
   */
  effect?: E
  /**
   * The uri of the effect file.
   *
   * @remarks
   * Can not be resolved inside the {@link Material} constructor.
   * Intended to be used by preprocessing tools e.g. content pipeline.
   */
  effectUri?: string
  /**
   * The technique name of the effect
   *
   * @remarks
   * Is not used inside the {@link Material} constructor.
   * Intended to be used by preprocessing tools e.g. content pipeline.
   */
  technique?: string
  /**
   * Effect parameters to be applied before rendering
   */
  parameters: MaterialParameters
}

/**
 * Defines a parameter set for a specific {@link ShaderEffect}
 *
 * @public
 * @remarks
 * A material holds a reference to a {@link ShaderEffect} and a
 * set of parameters that should be used together when rendering.
 * This allows a {@link ShaderEffect} instance to be reused across
 * multiple materials each with a different set of parameters.
 */
export class Material {
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
      return { } as MaterialOptions
    },
  })

  /**
   * A symbol identifying the {@link MaterialOptions} type with effectUri set.
   */
  public static readonly OptionsUri = new TypeToken<MaterialOptions>('OptionsUri', {
    factory: () => {
      return { effectUri: '' } as MaterialOptions
    },
  })

  /**
   * A symbol identifying the {@link MaterialOptions} type with effectUri set.
   */
  public static readonly OptionsTechnique = new TypeToken<MaterialOptions>('OptionsTechnique', {
    factory: () => {
      return { technique: 'default' } as MaterialOptions
    },
  })

  /**
   * A symbol identifying the Array {@link MaterialOptions} type.
   */
  public static readonly OptionsArray = new TypeToken<MaterialOptions[]>('MaterialOptions[]', {
    factory: () => {
      return []
    }
  })

  /**
   * A unique id
   */
  public uid: string = uuid()

  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * A user defined name of the material
   */
  public name: string
  /**
   * The effect to be used
   */
  public get effect(): ShaderEffect {
    return this.$effect
  }
  /**
   * Effect parameters to be applied before rendering
   */
  public readonly parameters: { [key: string]: any }

  protected $effect: ShaderEffect
  public constructor(device: Device, options: MaterialOptions) {
    this.device = device
    this.name = options.name
    this.parameters = options.parameters || {}
    if (options.effect instanceof ShaderEffect) {
      this.$effect = options.effect
    } else if (options.effect) {
      this.$effect = device.createEffect(options.effect)
    } else {
      this.onConstructWithoutEffect()
    }
  }

  /**
   * Draws an object with the current effect
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }) {
    this.effect.draw(drawable, this.parameters)
  }

  protected onConstructWithoutEffect() {
    throw new Error(`[Material] constructor option is missing: 'options.effect'.`)
  }
}
