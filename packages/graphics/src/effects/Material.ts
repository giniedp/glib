import { uuid } from '@gglib/utils'
import type { Device } from '../Device'
import {
  isAquirableTextureOptions,
  isTextureSourceOption,
  ProgramInputs,
  Texture,
  type AcquireTextureOptions,
  type TextureOptions,
} from '../resources'
import { isDisposable, type Mutable } from '../types'
import { Effect, type EffectOptions } from './Effect'
import { MaterialProperties, RenderVariant } from './types'

/**
 *
 */
export interface MaterialOptions {
  /**
   * The material name
   */
  name?: string

  /**
   * Meta data and annotations
   */
  meta?: Record<string, any>

  /**
   * Public material properties that should be applied when creating the material
   */
  properties: MaterialProperties

  /**
   * A factory function to instantiate the material, usually provided by the content pipeline
   */
  factory?: (device: Device, asset: MaterialOptions) => Material
}

/**
 * Constructor options for {@link Material}
 *
 * @public
 */
export interface MaterialEffectOptions<Inputs extends ProgramInputs = ProgramInputs> {
  /**
   * The descriptive name of this effect
   */
  name?: string

  /**
   * User defined meta data and annotations
   */
  meta?: Record<string, any>

  /**
   * The effect to be used
   */
  effect: EffectOptions

  /**
   * The input values for the effect
   */
  inputs: Inputs
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
export class Material<Inputs extends ProgramInputs = ProgramInputs> {
  /**
   * A unique id
   */
  public readonly uid: string = uuid()

  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The Material name
   */
  public name: string

  /**
   * Meta data and annotations
   */
  public meta: Record<string, any>

  /**
   * The default effect to be used when rendering with this material
   *
   * @remarks
   * This is a shortcut for `getEffect(RenderVariant.Forward)`.
   * Render pass specific effects can be retrieved with `getEffect(variant)`
   */
  public get effect(): Effect {
    return this.getEffect(RenderVariant.Forward)
  }

  /**
   * Effect input values
   */
  public readonly inputs: Inputs

  protected effects: Record<RenderVariant, Effect> = Object.create(null)

  public constructor(device: Device, options: MaterialEffectOptions<Inputs>) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    this.createInputs(options.inputs)
    this.createEffect(options)
  }

  /**
   * Gets an effect parameter value by name
   */
  public get<K extends keyof Inputs, V = Inputs[K]>(name: K): V | null {
    return (this.inputs[name] as V) ?? null
  }

  /**
   * Sets an effect parameter value by name
   */
  public set<K extends keyof Inputs>(name: K, value: Inputs[K] | AcquireTextureOptions | TextureOptions) {
    const old = this.inputs[name]
    if (value === old) {
      return
    }
    if (isAquirableTextureOptions(value)) {
      value = this.device.acquireTexture(value)
    } else if (isTextureSourceOption(value)) {
      value = this.device.createTexture(value)
    } else if (value instanceof Texture) {
      value.ref.retain()
    } else if (value == null) {
      console.warn(
        `Setting material parameter ${name as any} to null or undefined is not recommended and may cause unintended consequences.`,
      )
    }
    if (old instanceof Texture) {
      old.ref.release()
    }
    this.inputs[name] = value as any
  }

  /**
   * Gets the effect for a specific render variant
   */
  public getEffect(variant: RenderVariant): Effect | null {
    return this.effects[variant] || null
  }

  protected createEffect(options: MaterialEffectOptions<Inputs>) {
    if (options.effect) {
      this.effects[RenderVariant.Forward] = new Effect(this.device, options.effect)
    } else {
      console.warn('No effect specified for material', this)
    }
  }

  protected createInputs(values: Inputs) {
    const params = {
      ...(values || ({} as Inputs)),
    }

    for (const key in params) {
      const value: any = params[key]
      if (isAquirableTextureOptions(value)) {
        params[key] = this.device.acquireTexture(value) as any
      } else if (isTextureSourceOption(value)) {
        params[key] = this.device.createTexture(value) as any
      } else if (value instanceof Texture) {
        value.ref.retain()
      }
    }
    const self = this as Mutable<this>
    self.inputs = params
  }

  /**
   * Disposes the underlying effect
   */
  public dispose() {
    for (const key in this.inputs) {
      const value = this.inputs[key]
      if (isDisposable(value)) {
        value.dispose()
      }
    }
    for (const variant in this.effects) {
      this.effects[variant].dispose()
    }
  }
}
