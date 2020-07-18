import { Type, AbstractType } from '@gglib/utils'
import { PipelineContext } from './PipelineContext'

export type LoaderInput<T = unknown> = string | symbol | Type<T> | AbstractType<T>
export type LoaderInputs<T = unknown> = LoaderInput<T> | Array<LoaderInput<T>>
export type LoaderOutput<T = unknown> = symbol | Type<T> | AbstractType<T>

export type LoaderInputType<T extends LoaderInputs> =
  T extends string ? unknown :
  T extends symbol ? unknown :
  T extends LoaderInput<infer O> ? O : unknown

export type LoaderOutputType<T extends LoaderOutput> =
  T extends string ? unknown :
  T extends symbol ? unknown :
  T extends LoaderOutput<infer O> ? O : unknown

/**
 * A function that transforms an input of type `I` to output of type `O` using context with data type `D`
 *
 * @public
 */
export type LoaderHandle<I extends LoaderInputs, O extends LoaderOutput, D = any> = (input: LoaderInputType<I>, context: PipelineContext<D>) => Promise<LoaderOutputType<O>>

/**
 * A specification of a loader function declaring its input and output types
 *
 * @public
 */
export interface LoaderSpec<Input extends LoaderInputs = any, Output extends LoaderOutput = any, D = any> {
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
  readonly input: Input
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
  readonly output: Output
  /**
   * The loader function
   */
  readonly handle: LoaderHandle<Input, Output, D>
}

/**
 * @public
 */
export class LoaderEntry<Input extends LoaderInput = any, Output extends LoaderOutput = any, D = any> {
  public constructor(
    public input: Input,
    public output: Output,
    public handle: LoaderHandle<Input, Output, D>,
  ) {

  }

  public toString() {
    return `${this.input.toString()} => ${this.output.toString()}`
  }
}
