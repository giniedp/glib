/**
 * @public
 */
export interface Visitor<T> {
  visit(entity: T): void
}
