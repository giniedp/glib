import { uuid } from '@gglib/utils'
import type { Device } from '../Device'
import {
  InputSlot,
  InputTypeMap,
  InputTypeName,
  InputValueType,
  isAquirableTextureOptions,
  isTextureSourceOption,
  ProgramInputBlock,
  ProgramInputBlockCollection,
  Texture,
  type AcquireTextureOptions,
  type TextureOptions,
} from '../resources'
import { isDisposable } from '../types'
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
export interface MaterialEffectOptions {
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
export class Material {
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
   * Hint to high level systems that this material should be skipped for rendering
   */
  public noRender: boolean

  /**
   * Hint to high level systems that this material should be rendered in a transparency pass
   */
  public isTransparent: boolean

  /**
   * User defined rendering layer mask for this material
   *
   * @remarks
   * The interpretation of this value is up to the user or rendering system.
   * Usually this would be used in combination with the entity layer for filtering and sorting of render items.
   */
  public layer: number

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
   * Collection of managed input blocks
   */
  protected readonly inputs = new ProgramInputBlockCollection()

  /**
   * Exposes the input blocks of this material for external management.
   */
  public get inputBlocks(): Readonly<Record<string, ProgramInputBlock>> {
    return this.inputs.blocks
  }

  protected effects: Record<RenderVariant, Effect> = Object.create(null)

  public constructor(device: Device, options: MaterialEffectOptions) {
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    if (options.effect) {
      this.effects[RenderVariant.Forward] = new Effect(this.device, options.effect)
    } else if (options.effect === null) {
      // no effect specified, this is a valid case, no error
      // creation of the effect is deferred to the subclass
    } else {
      // option is missing, this is a programming error
      console.warn('No effect specified for material', this)
    }
  }

  public getInput<T extends InputTypeName>(input: InputSlot<T>): InputTypeMap[T] | null {
    return this.inputs.get(input)
  }

  public setInput<T extends InputTypeName>(
    input: InputSlot<T>,
    value: InputTypeMap[T] | AcquireTextureOptions | TextureOptions,
  ) {
    const old = this.inputs.get(input)
    if (value !== old) {
      if (isAquirableTextureOptions(value)) {
        value = this.device.acquireTexture(value)
      } else if (isTextureSourceOption(value)) {
        value = this.device.createTexture(value)
      } else if (value instanceof Texture) {
        value.ref.retain()
      } else if (value == null) {
        console.warn(
          `Setting material parameter ${input.key} to null or undefined is not recommended and may cause unintended consequences.`,
        )
      }
      if (old instanceof Texture) {
        old.ref.release()
      }
    }

    this.inputs.set(input, value as any)
  }

  /**
   * Gets an effect parameter value by name
   */
  public get(block: string, input: string): InputValueType | null {
    return this.getInput(this.inputs.lookupSlot(block, input, 'unknown' as any))
  }

  /**
   * Sets an effect parameter value by name
   */
  public set(block: string, input: string, value: InputValueType | AcquireTextureOptions | TextureOptions) {
    this.setInput(this.inputs.lookupSlot(block, input, 'unknown' as any), value)
  }

  /**
   * Gets the effect for a specific render variant
   */
  public getEffect(variant: RenderVariant): Effect | null {
    return this.effects[variant] || null
  }

  /**
   * Implementations can override this method to update material parameters on each frame, for example to implement animated materials.
   *
   * @param time
   * @param delta
   * @param frame
   */
  public update?(time: number, delta: number, frame: number): void

  /**
   * Disposes the underlying effect
   */
  public dispose() {
    for (const blockName in this.inputs) {
      const block = this.inputs[blockName]
      for (const key in block) {
        const value = block[key]
        if (isDisposable(value)) {
          value.dispose()
        }
      }
    }
    for (const variant in this.effects) {
      this.effects[variant].dispose()
    }
  }
}
