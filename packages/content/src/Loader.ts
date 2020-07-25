import { Type, AbstractType, TypeToken } from '@gglib/utils'
import { PipelineContext } from './PipelineContext'

export type LoaderInput<T = unknown> = string | symbol | Type<T> | AbstractType<T> | TypeToken<T>
export type LoaderOutput<T = unknown> = symbol | Type<T> | AbstractType<T> | TypeToken<T>
export type LoaderInputs<T = unknown> = LoaderInput<T> | Array<LoaderInput<T>>

export type LoaderInputType<I extends LoaderInputs> =
  I extends Type<infer T> ? T :
  I extends AbstractType<infer T> ? T :
  I extends TypeToken<infer T> ? T : unknown
export type LoaderOutputType<O extends LoaderOutput> = O extends LoaderOutput<infer T> ? T : unknown

/**
 * A function that transforms an input of type `I` to output of type `O` using context with data type `D`
 *
 * @public
 */
export type LoaderHandle<I extends LoaderInputs, O extends LoaderOutput> = (input: LoaderInputType<I>, context: PipelineContext<unknown>) => Promise<LoaderOutputType<O>>

/**
 * A specification of a loader function declaring its input and output types
 *
 * @public
 */
export interface LoaderSpec<Input extends LoaderInputs = any, Output extends LoaderOutput = any> {
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
  readonly handle: LoaderHandle<Input, Output>
}

/**
 * @public
 */
export class LoaderEntry<Input extends LoaderInput = any, Output extends LoaderOutput = any> {
  public constructor(
    public input: Input,
    public output: Output,
    public handle: LoaderHandle<Input, Output>,
  ) {

  }

  public toString() {
    return `${this.input.toString()} => ${this.output.toString()}`
  }
}
