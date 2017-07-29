import { Entity } from './Entity'

export interface Visitor<T> {
  visit(entity: T): void
}
