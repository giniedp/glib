import { DrawableData } from '@gglib/render'

/**
 * @public
 */
export interface DrawablesCollector {
  addDrawable(item: DrawableData): void
}

/**
 * @public
 */
export abstract class DrawablesProvider {
  public abstract collectDrawables(collector: DrawablesCollector): void
}
