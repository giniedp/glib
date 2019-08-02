import { Type } from '@gglib/utils'
import { errorOnServiceAsUndefinedType } from '../errors'
import { resolveForwardRef } from './forwardRef'

/**
 * @public
 */
export interface ServiceMetadata {
  type: object
  as: any
  on: 'root' | 'parent' | string
}

const serviceMetadata = Symbol('serviceMetadata')

/**
 * @public
 */
export function getServiceMetadata<T>(target: T): ServiceMetadata | null {
  return target.constructor[serviceMetadata]
}

/**
 * Options that can be passed to the {@link Service} decorator
 *
 * @public
 */
export interface ServiceOptions<T> {
  /**
   * The symbol to use use as the registry key.
   */
  as?: T,
  /**
   * The identifier or query string on which entity the service should be registered.
   */
  on?: 'root' | 'parent' | string,
}

/**
 * A decorator that marks a component as a service so it is registered automatically
 *
 * @public
 */
export function Service<T, R>(options?: ServiceOptions<R>) {
  return (target: Type<T>) => {
    if (options && 'as' in options && options.as == null) {
      errorOnServiceAsUndefinedType(target)
    }
    const meta: ServiceMetadata & { _as: any } = {
      _as: options && options.as ? options.as : target,
      type: target,
      get as() { return resolveForwardRef(this._as) },
      on: options && options.on ? options.on : '',
    }
    target[serviceMetadata] = meta
  }
}
