import { Type } from '@gglib/core'
import { PipelineContext } from './PipelineContext'

/**
 * A function that transforms an input of type `I` to output of type `O` using context with data type `D`
 */
export type Loader<I = any, O = any, D = any> = (input: I, context: PipelineContext<D>) => Promise<O>

/**
 * A specification of a loader function declaring its input and output types
 */
export interface LoaderSpec<I = any, O = any, D = any> {
  /**
   * The input type or input types that the loader can load from
   *
   * @remarks
   * Use strings for file extensions or mime types
   *
   * ```ts
   * input: ['.jpg', 'image/jpeg']
   * ```
   * Use symbols for interface types that have no class type at runtime
   * ```ts
   * input: Texture.Options
   * ```
   * Use class types for everything that has an own runtime type
   * ```ts
   * input: HTMLImageElement
   * ```
   */
  readonly input: string | symbol | Array<string | symbol> | Type<I>
  /**
   * The output type that the loader can load to
   *
   * @remarks
   * Use symbols for interface types that have no class type at runtime
   * ```ts
   * output: Texture.Options
   * ```
   * Use class types for everything that has an own runtime type
   * ```ts
   * output: HTMLImageElement
   * ```
   */
  readonly output: symbol | Type<O>
  /**
   * The loader function
   */
  readonly handle: Loader<I, O, D>
}

export class LoaderEntry<I = any, O = any, D = any> {
  public constructor(
    public input: symbol | string | Type<I>,
    public output: symbol | Type<O>,
    public handle: Loader<I, O, D>,
  ) {

  }

  public toString() {
    return `${this.input.toString()} => ${this.output.toString()}`
  }
}
