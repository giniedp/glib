import type { Component } from 'solid-js'

export interface UiAnnotation<T> {
  icon?: (it: T) => string
  label?: (it: T) => string
  expandable?: (it: T) => boolean
  children?: (it: T) => Iterable<any>
  actionComponent?: Component<{ data: T }>
  propsComponent?: Component<{ data: T }>
}
