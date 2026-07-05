import type { FactoryComponent } from 'mithril'

export interface UiAnnotation<T> {
  icon?: (it: T) => string
  label?: (it: T) => string
  expandable?: (it: T) => boolean
  children?: (it: T) => Iterable<any>
  actionComponent?: FactoryComponent<{ data: T }>
  propsComponent?: FactoryComponent<{ data: T }>
}
