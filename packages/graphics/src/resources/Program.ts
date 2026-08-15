import { IVec2, IVec3, IVec4 } from '@gglib/math'
import { SamplerState } from '../states'
import type { InputValueType, ProgramInput } from './ProgramInput'
import { ProgramInputBlock } from './ProgramInputSource'
import type { ShaderModule } from './ShaderModule'
import { Texture } from './Texture'

export interface ProgramOptions {
  /**
   * Names for resources (or input blocks) that should be shared with the default program.
   *
   * @remarks
   * Resources are shared with the default program of the shader module.
   * If not specified, the program will create its own resources for all uniform blocks.
   *
   * For WebGL, this only applies to uniform blocks (UBOs) since WebGL does not support sharing individual uniforms.
   *
   * For WebGPU, any uniform can be shared.
   */
  sharedBlocks: ReadonlyArray<string>

  /**
   * The block name for per-instance transform data
   */
  perInstanceTransformBlock?: string

  /**
   * The block name for per-instance custom data
   */
  perInstanceDataBlock?: string
}

let idCounter = 1

export abstract class Program {
  /**
   * The unique runtime identifier for this program instance.
   */
  public readonly id = idCounter++

  /**
   * The shader module that this program is based on.
   */
  public abstract readonly module: ShaderModule

  /**
   * The input block names that are shared with the default program of the shader module.
   */
  public abstract readonly sharedBlocks: ReadonlyArray<string>

  /**
   * The block name for per-instance transform data
   */
  public abstract readonly perInstanceTransformBlock?: string

  /**
   * The block name for per-instance custom data
   */
  public abstract readonly perInstanceDataBlock?: string

  /**
   * Promise that resolves when the underlying shader compilation is complete
   */
  public get compiled() {
    return this.module.compiled
  }

  /**
   * Indicates whether the underlying shader compilation is complete
   */
  public get isCompiled(): boolean {
    return this.module.isCompiled
  }

  /**
   * Indicates whether the underlying shader compilation is complete and shader is valid
   */
  public get isValid(): boolean {
    return this.module.isValid
  }

  /**
   *
   * @param source
   * @param force
   */
  public applyBlocks(blocks: Record<string, ProgramInputBlock>, force?: boolean): boolean {
    let changed = false
    for (const blockName in blocks) {
      const source = blocks[blockName]
      if ((source && this.applyBlock(source), force)) {
        changed = true
      }
    }
    return changed
  }

  /**
   *
   * @param source
   * @param force
   */
  public abstract applyBlock(source: ProgramInputBlock, force?: boolean): boolean

  /**
   * Applies a set of input values to this program.
   *
   * @remarks
   * This should update the CPU resource buffers but not necessarily commit them to the GPU.
   * The {@link Program.commit} method should be called to ensure that all changes are applied before rendering.
   *
   * Does not check for the existence of the parameters, implementations do ignore any parameters that do not exist.
   */
  public abstract applyInputs(values: Record<string, InputValueType>): void

  /**
   * Retrieves the input at the specified path.
   *
   * @returns The input object or `null` if the input does not exist or has been optimized out by the shader compiler.
   */
  public abstract get(key: string): ProgramInput | null

  /**
   * Sets the value of the input at the specified path.
   *
   * @remarks
   * Implementations should return true if the input was successfully set,
   * or false if the input does not exist or the value is of an incorrect type.
   */
  public abstract set(key: string, value: InputValueType): boolean

  /**
   *
   * @param path
   * @param value
   */
  public mustSet(path: string, value: InputValueType) {
    if (!this.set(path, value)) {
      throw new Error(`Input ${path as string} not found in program`)
    }
  }

  public mustGet(path: string): ProgramInput {
    const input = this.get(path)
    if (!input) {
      throw new Error(`Input ${path as string} not found in program`)
    }
    return input
  }

  /**
   * Commits any pending changes to the underlying GPU resources.
   * This should be called before rendering after inputs were set.
   */
  public abstract commit(): void

  /**
   * Releases any GPU resources.
   */
  public abstract dispose(): void

  /**
   * Creates a new program instance that may share resources with the default program.
   */
  public abstract clone(options?: ProgramOptions): Program

  public setScalar(path: string, value: number) {
    this.get(path).setScalar(value)
  }

  public setArray(path: string, value: ArrayLike<number>, offset?: number) {
    this.get(path).setArray(value, offset)
  }

  public setVec2(path: string, value: IVec2 | ArrayLike<number>) {
    this.get(path).setVec2(value)
  }

  public setVec3(path: string, value: IVec3 | ArrayLike<number>) {
    this.get(path).setVec3(value)
  }

  public setVec4(path: string, value: IVec4 | ArrayLike<number>) {
    this.get(path).setVec4(value)
  }

  public setMat2x2(path: string, value: ArrayLike<number>): void {
    this.get(path).setMat2x2(value)
  }

  public setMat3x3(path: string, value: ArrayLike<number>): void {
    this.get(path).setMat3x3(value)
  }

  public setMat4x4(path: string, value: ArrayLike<number>): void {
    this.get(path).setMat4x4(value)
  }

  public setTexture(path: string, value: Texture): void {
    this.get(path).setTexture(value as any)
  }

  public setSampler(path: string, value: SamplerState): void {
    this.get(path).setSampler(value)
  }
}
