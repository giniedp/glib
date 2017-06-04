import { ItemData } from '@glib/render'

export interface RenderableCollector {
  add(item: ItemData): void
}

export interface Renderable {
  collect(collector: RenderableCollector): void
}
