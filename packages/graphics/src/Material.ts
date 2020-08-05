import { uuid, TypeToken } from '@gglib/utils'
import { Device } from './Device'
import { ShaderProgram, ShaderUniformValue } from './resources'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialOptions<T = ShaderEffectOptions | ShaderEffect | string> {
  /**
   * A user defined name of the material
   */
  name?: string
  /**
   * The effect to be used or options to create an effect instance
   */
  effect: T
  /**
   * Effect parameters to be applied before rendering
   */
  parameters: { [key: string]: ShaderUniformValue }
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
      return { effect: 'default' } as MaterialOptions
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
  public readonly effect: ShaderEffect
  /**
   * Effect parameters to be applied before rendering
   */
  public readonly parameters: { [key: string]: any }

  public constructor(device: Device, options: MaterialOptions) {
    this.device = device
    this.name = options.name
    this.parameters = options.parameters || {}
    if (options.effect instanceof ShaderEffect) {
      this.effect = options.effect
    } else if (typeof options.effect === 'string') {
      // TODO: describe the error
      throw new Error(`[Material] can not use string as effect: ${options.effect}`)
    } else if (options.effect) {
      this.effect = device.createEffect(options.effect)
    } else {
      // TODO: warn
    }
  }

  /**
   * Draws an object with the current effect
   */
  public draw(drawable: { draw: (p: ShaderProgram) => void }) {
    this.effect.draw(drawable, this.parameters)
  }
}
