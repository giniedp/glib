/**
 * A type that has a constructor
 *
 * @public
 */
export type Type<T> = new (...args: any[]) => T
