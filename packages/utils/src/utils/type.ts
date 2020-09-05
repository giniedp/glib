/**
 * A type that has a constructor
 *
 * @public
 */
export interface Type<T> extends Function { new (...args: any[]): T; }

/**
 * A type that has a constructor without arguments
 *
 * @public
 */
export interface TypeWithEmptyConstructor<T> extends Function { new (): T; }

/**
 * An abstract class type
 *
 * @public
 */
export interface AbstractType<T> extends Function { prototype: T; }

/**
 * A token identifying a type
 *
 * @public
 */
export class TypeToken<T = unknown> {

  public factory?: () => T

  constructor(protected name: string, options?: {
    factory: () => T
  }) {
    this.factory = options?.factory || (() => { return {} as any })
  }

  public toString() {
    return `TypeToken ${this.name}`
  }
}
