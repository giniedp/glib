/**
 * A type that has a constructor
 *
 * @public
 */
export interface Type<T> extends Function { new (...args: any[]): T; }

/**
 * A type that has a constructor without arguments
 */
export interface TypeWithEmptyConstructor<T> extends Function { new (): T; }

/**
 * An abstract class type
 */
export interface AbstractType<T> extends Function { prototype: T; }
