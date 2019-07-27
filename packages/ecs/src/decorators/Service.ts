import { Type } from '@gglib/utils'

/**
 * @public
 */
export interface ServiceMetadata {
  type: Object
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
 * @public
 */
export function Service<T, R>(options?: {
  as?: R,
  on?: 'root' | 'parent' | string,
}) {
  return (target: Type<T>) => {
    target[serviceMetadata] = {
      type: target,
      as: options && options.as ? options.as : target,
      on: options && options.on ? options.on : '',
    }
  }
}
