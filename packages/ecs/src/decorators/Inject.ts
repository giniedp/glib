import { errorOnInjectUndefinedType } from '../errors'
import { resolveForwardRef, ForwardRefResolvable } from './forwardRef'
import { Type, AbstractType } from '@gglib/utils'

/**
 * A metadata object that is created when using {@link Inject} decorator on a property
 *
 * @public
 */
export interface InjectMetadata<T = unknown> {
  /**
   * The property name on which a type should be injected
   */
  property: string | symbol
  /**
   * The service lookup key
   */
  type: Type<T> | AbstractType<T> | Symbol
  /**
   * Identifier or query string where the injected type should be resolved from
   */
  from: 'root' | 'parent' | string
  /**
   * Whether this injection is optional and should not raise an error if missing
   */
  optional?: boolean
}

/**
 * An object mapping property names to its inject metadata
 *
 * @public
 */
export type InjectMetadataMap = Map<string | symbol, InjectMetadata>

/**
 * Options that can be passed to the {@link Inject} decorator
 *
 * @public
 */
export interface InjectOptions {
  /**
   * Identifier or query string where the injected type should be resolved from
   */
  from?: 'root' | 'parent' | string
  /**
   * Whether this injection is optional and should not raise an error if missing
   */
  optional?: boolean
}

const injectMetadata = Symbol('injectMetadata')

/**
 * @public
 */
export function getInjectMetadata<T>(target: T): InjectMetadataMap | null {
  return target.constructor[injectMetadata]
}

/**
 * A decorator that adds metadata for dependency injection on a class property
 *
 * @public
 */
export function Inject<T>(type: ForwardRefResolvable<Type<T> | AbstractType<T> | Symbol>, options?: InjectOptions): PropertyDecorator {
  return (target: object, property?: string | symbol, parameterIndex?: number) => {
    if (!type) {
      throw errorOnInjectUndefinedType(target, property)
    }
    const map: InjectMetadataMap = getInjectMetadata(target) || new Map()
    const data: InjectMetadata & { _type: ForwardRefResolvable<any> } = {
      _type: type,
      property: property,
      from: options?.from || '',
      optional: !!options?.optional,
      get type() {
        return resolveForwardRef(this._type)
      },
    }
    map.set(property, data)
    target.constructor[injectMetadata] = map
  }
}
