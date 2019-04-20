import { Type } from '@gglib/core'
import { Manager } from './Manager'
import { Pipeline } from './Pipeline'

export interface PipelineContext<T = any> {
  /**
   * The current processing content manager
   */
  manager: Manager
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
  target: symbol | Type<T>
  /**
   * Any user defined options that might be used during the pipeline
   *
   * @remarks
   * Not used or insepcted byt the loader or manager
   */
  options?: any
}
