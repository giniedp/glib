/**
 * A type that has a constructor
 *
 * @public
 */
export interface Type<T> extends Function {
  new (...args: any[]): T
}

/**
 * An abstract class type
 *
 * @public
 */
export interface AbstractType<T> extends Function {
  prototype: T
}

export type Brand<T, B> = T & {
  readonly __brand: B
  readonly __type?: T
}

export type Unbrand<T> = T extends { __type?: infer U } ? U : never
export function brand<T, B>(value: T): Brand<T, B>
export function brand<T extends Brand<any, any>>(value: Unbrand<T>): T
export function brand<T>(value: T): T {
  return value
}
