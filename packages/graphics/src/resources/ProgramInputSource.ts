import { InputKey, inputSlot, InputSlot, InputTypeMap, InputTypeName, InputValueType } from './ProgramInput'

/**
 * A named, versioned bucket of raw shader input values belonging to a single block.
 *
 * @remarks
 * A plain value container without knowledge of GPU buffers, programs, or upload mechanics.
 * It is the *source* side of the input system;
 * the program side is responsible for deciding when and how to consume it.
 *
 * Ownership and update frequency are determined by whoever holds and writes to the source:
 * - A renderer owns and writes `frame` and `view` sources every frame
 * - A `RenderItem` owns and writes the `object` source per draw call
 * - A `Material` owns and writes its own block sources when parameters change
 *
 * Version tracking allows consumers to skip redundant uploads. The version is bumped
 * on every `set()` call regardless of whether the value actually changed. Consumers
 * track the last version and source reference they uploaded - if either differs, an
 * upload is needed.
 *
 * @example
 * ```ts
 * const source = new ProgramInputBlock('material')
 * source.set('material.baseColor', Vec3.create(1, 0, 0))
 * source.set('material.roughness', 0.5)
 * ```
 */
export class ProgramInputBlock {
  /**
   * The block name this source belongs to, e.g. `'view'`, `'material'`, `'object'`.
   * Matches the `block` field of the corresponding {@link InputSlot} declarations,
   * and the `@block` annotation in the shader.
   */
  public readonly name: string

  /**
   * Monotonically increasing counter, bumped on every {@link set} call.
   * Consumers compare this against their last-seen version to determine
   * whether an upload is necessary.
   */
  public version: number = 0

  /**
   * The raw values stored in this source, keyed by input name.
   * Input names match the `input` field of the corresponding {@link InputSlot},
   * e.g. `'baseColor'`, `'roughness'` — not the full path `'material.baseColor'`.
   */
  readonly values: Record<InputKey, InputValueType> = {}

  public constructor(block: string) {
    this.name = block
  }

  /**
   * Returns the current value for the given input name, or `undefined` if not set.
   */
  public get(key: InputKey): InputValueType {
    return this.values[key]
  }

  /**
   * Sets the value for the given input name and bumps the version counter.
   */
  public set(key: InputKey, value: InputValueType): void {
    this.values[key] = value
    this.version++
  }
}

export interface ProgramInputBlockMapOptions {
  initialBlocks?: string[]
  createIfMissing?: boolean
}

export class ProgramInputBlockCollection {
  public readonly blocks: Record<string, ProgramInputBlock> = {}

  private createIfMissing: boolean
  private cachedSlots: Record<string, Record<string, Record<string, InputSlot>>> = {}

  public constructor(options: ProgramInputBlockMapOptions = {}) {
    this.createIfMissing = options.createIfMissing ?? true
    if (options.initialBlocks) {
      for (const block of options.initialBlocks) {
        this.blocks[block] = new ProgramInputBlock(block)
      }
    }
  }

  public get<T extends InputTypeName>(slot: InputSlot<T>): InputTypeMap[T] | null {
    return (this.blocks[slot.block]?.get(slot.key) as InputTypeMap[T]) || null
  }

  public set<T extends InputTypeName>(slot: InputSlot<T>, value: InputTypeMap[T]): void {
    if (!this.blocks[slot.block]) {
      if (this.createIfMissing) {
        this.blocks[slot.block] = new ProgramInputBlock(slot.block)
      } else {
        throw new Error(`Block '${slot.block}' does not exist in ProgramInputSourceCollection.`)
      }
    }
    this.blocks[slot.block].set(slot.key, value as InputValueType)
  }

  public getByBlockAndName(block: string, input: string): InputValueType | null {
    return this.get(this.lookupSlot(block, input, 'unknown' as any))
  }

  public setByBlockAndName(block: string, input: string, value: InputValueType) {
    this.set(this.lookupSlot(block, input, 'unknown' as any), value as any)
  }

  public lookupSlot(block: string, input: string, type: InputTypeName): InputSlot {
    const map1 = (this.cachedSlots[block] ||= {})
    const map2 = (map1[input] ||= {})
    return (map2[type] ||= inputSlot(block, input, type))
  }
}
