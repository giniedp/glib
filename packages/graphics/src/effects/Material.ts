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
  ResourceOwnerSet,
  Texture,
  type AcquireTextureOptions,
  type Ownable,
  type TextureOptions,
} from '../resources'
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
   * The effect to be used
   */
  effect?: EffectOptions

  /**
   * A factory function to instantiate the material, usually provided by the content pipeline
   */
  factory?: (device: Device, asset: MaterialOptions) => Material
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
 *
 * Textures that are passed in as instances are borrowed. Textures that are created or acquired
 * from options are owned by the material and are owned by a scope together with the material.
 */
export class Material implements Ownable {
  /**
   * A unique id
   */
  public readonly uid: string = uuid()

  /**
   * The owners of this material
   */
  public readonly owners: ResourceOwnerSet = new ResourceOwnerSet(this)

  /**
   * Textures created by this material from {@link TextureOptions}. Exclusive to this material.
   */
  protected createdTextures = new Set<Texture>()

  /**
   * Textures acquired by this material from {@link AcquireTextureOptions}. Shared with others.
   */
  protected acquiredTextures = new Set<Texture>()

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

  protected options: MaterialOptions

  public constructor(device: Device, options: MaterialOptions) {
    this.device = device
    options ||= { properties: {} }
    options.name ||= ''
    options.meta ||= {}
    options.properties ||= {}

    this.options = options
    this.name = options.name
    this.meta = options.meta
    this.configure(options)
  }

  protected configure(options: Partial<MaterialOptions>) {
    this.name = options.name ?? this.name
    this.meta = options.meta ?? this.meta
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

  /**
   * Creates a new instance of this material with same constructor options.
   */
  public instantiate(): Material {
    return new (this.constructor as any)(this.device, this.options)
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
        const texture = this.device.acquireTexture(value)
        this.addChild(this.acquiredTextures, texture)
        value = texture
      } else if (isTextureSourceOption(value)) {
        const texture = this.device.createTexture(value)
        this.addChild(this.createdTextures, texture)
        value = texture
      } else if (value == null) {
        console.warn(
          `Setting material parameter ${input.key} to null or undefined is not recommended and may cause unintended consequences.`,
        )
      }
      if (old instanceof Texture && old !== value && !this.isInputValue(old, input)) {
        this.removeChild(old)
      }
    }

    this.inputs.set(input, value as any)
  }

  /**
   * Whether the texture is used by any input other than the given one
   */
  private isInputValue(texture: Texture, except: InputSlot<any>): boolean {
    for (const blockName in this.inputs.blocks) {
      const values = this.inputs.blocks[blockName].values
      for (const key in values) {
        if (values[key] === texture && !(blockName === except.block && key === except.key)) {
          return true
        }
      }
    }
    return false
  }

  private addChild(set: Set<Texture>, texture: Texture) {
    if (set.has(texture)) {
      return
    }
    set.add(texture)
    for (const owner of Array.from(this.owners)) {
      owner.own(texture)
    }
  }

  private removeChild(texture: Texture) {
    const isCreated = this.createdTextures.delete(texture)
    const isAcquired = this.acquiredTextures.delete(texture)
    if (!isCreated && !isAcquired) {
      return
    }
    for (const owner of Array.from(this.owners)) {
      owner.release(texture)
    }
    if (isCreated) {
      this.releaseFromGlobalScope(texture)
    }
  }

  /**
   * Releases a created texture that is still implicitly owned by the global scope, i.e. no scope took it over
   */
  private releaseFromGlobalScope(texture: Texture) {
    const scope = this.device?.scope
    if (scope && texture.owners.defaultOwner === scope) {
      scope.release(texture)
    }
  }

  /**
   * Textures created or acquired by this material and its effects are owned together with the material
   */
  public ownedChildren(): Iterable<Ownable> {
    return [...this.createdTextures, ...this.acquiredTextures, ...Object.values(this.effects)]
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
   * Disposes the effects and releases this material from all owners.
   *
   * @remarks
   * - Borrowed textures (passed in as instances) are not touched.
   * - Created textures are destroyed unless a scope other than the global scope owns them.
   * - Acquired textures are shared. They live as long as a scope owns them,
   *   or until the device is disposed if they were acquired without a scope.
   */
  public dispose() {
    for (const owner of Array.from(this.owners)) {
      owner.release(this)
    }
    for (const texture of this.createdTextures) {
      this.releaseFromGlobalScope(texture)
    }
    this.createdTextures.clear()
    this.acquiredTextures.clear()
    for (const variant in this.effects) {
      this.effects[variant].dispose()
    }
  }
}
