// tslint:disable: ban-types

import { Type } from '@gglib/utils'

export interface ServiceMetadata {
  type: Object
  as: any
  on: 'root' | 'parent' | 'self'
}

const serviceMetadata = Symbol('serviceMetadata')

export function getServiceMetadata<T>(target: T): ServiceMetadata | null {
  return target.constructor[serviceMetadata]
}

export function Service<T, R>(options?: {
  as?: R,
  on?: 'root' | 'parent' | 'self',
}) {
  return (target: Type<T>) => {
    target[serviceMetadata] = {
      type: target,
      as: options && options.as ? options.as : target,
      on: options && options.on ? options.on : 'self',
    }
  }
}
