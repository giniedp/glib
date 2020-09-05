/**
 * @public
 */
export function hasOwnProperty(object: unknown, property: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, property)
}
