import { Type } from '@gglib/utils'
import { ContentManager } from './ContentManager'
import { Pipeline } from './Pipeline'
import { LoaderOutput } from './Loader'

/**
 * @public
 */
export interface PipelineContext<T = any> {
  /**
   * The current processing content manager
   */
  manager: ContentManager
  /**
   * The instance of the pipeline that is currently handling the loading process
   */
  pipeline: Pipeline
  /**
   * The initially requested source type.
   *
   * @remarks
   * This is usually a path or url to an external resource
   */
  source: string
  /**
   * The target type
   */
  target: LoaderOutput<T>
  /**
   * Any user defined options that might be used during the pipeline
   *
   * @remarks
   * Not used or inspected by the pipeline or manager
   */
  options?: { [key: string]: unknown }
}
