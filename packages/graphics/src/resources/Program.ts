import type { ProgramInput, ProgramInputValue, ProgramInputs } from './ProgramInput'

import type { ShaderModule } from './ShaderModule'
import { Texture } from './Texture'

export interface ProgramOptions {
  /**
   * Names for resources that should be shared with the default program.
   *
   * @remarks
   * Resources are shared with the default program of the shader module.
   * If not specified, the program will create its own resources for all uniform blocks.
   *
   * For WebGL, this only applies to uniform blocks (UBOs) since WebGL does not support sharing individual uniforms.
   *
   * For WebGPU, any uniform can be shared.
   */
  shared: ReadonlyArray<string>
}

let idCounter = 1

export abstract class Program<Values extends ProgramInputs = ProgramInputs> {
  /**
   * The unique runtime identifier for this program instance.
   */
  public readonly id = idCounter++

  /**
   * The shared shader module
   */
  public abstract readonly module: ShaderModule

  /**
   * The names of resources that should be shared with the default program.
   */
  public abstract readonly shared: ReadonlyArray<string>

  /**
   * Indicates whether the underlying shader module is ready to be used.
   */
  public get isReady(): boolean {
    return this.module.isReady
  }

  /**
   * Applies a set of parameter values to this program.
   *
   * @remarks
   * This should update the values of the parameters but not necessarily commit them to the GPU.
   * The {@link Program.commit} method should be called to ensure that all changes are applied before rendering.
   *
   * Does not check for the existence of the parameters, implementations do ignore any parameters that do not exist.
   */
  public abstract apply(values: Record<string, ProgramInputValue>): void

  /**
   * Retrieves the parameter at the specified path.
   *
   * @returns The parameter object or `null` if the parameter does not exist or has been optimized out by the shader compiler.
   */
  public abstract get(key: string): ProgramInput | null

  /**
   * Sets the value of the parameter at the specified path.
   *
   * @remarks
   * Implementations should return true if the parameter was successfully set,
   * or false if the parameter does not exist or the value is of an incorrect type.
   */
  public abstract set<K extends keyof Values>(key: K, value: Values[K]): boolean

  /**
   * Commits any pending changes to the underlying GPU resources.
   * This should be called before rendering with this parameter set.
   */
  public abstract commit(): void

  /**
   * Releases any GPU resources associated with this parameter set.
   */
  public abstract dispose(): void

  /**
   * Creates a new program instance that may share resources with the default program.
   */
  public abstract clone(options?: ProgramOptions): Program
}
