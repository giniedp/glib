const forwardRefFn = Symbol('forwardRef')

/**
 * Allows to refer to references which are not yet defined.
 *
 * @public
 * @remarks
 * This works exactly as in the Angular framework {@link https://angular.io/api/core/forwardRef}
 *
 * @param fn - A function that returns the referenced symbol
 * @example
 * ```ts
 * class A {
 *   // references B before it is defined
 *   Inject(forwardRef(() => B))
 *   bInstance
 * }
 * // this class is defined after it has been referenced
 * class B {}
 * ```
 */
export function forwardRef<T>(fn: () => T) {
  fn[forwardRefFn] = forwardRef
  return fn
}

/**
 * Resolves a type that has been wrapped with {@link forwardRef}
 *
 * @param type - The type to resolve
 */
export function resolveForwardRef<T>(type: T): T {
  if (typeof type === 'function' && type[forwardRefFn] === forwardRef) {
    return type()
  }
  return type
}
