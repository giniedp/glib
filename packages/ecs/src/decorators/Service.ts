import { Type } from '@gglib/utils';

export interface ServiceMetadata {
  type: any
  as: any
  at: 'root' | 'parent' | 'self'
}

export const serviceMetadata = Symbol('serviceMetadata')

export function getServiceMetadata<T>(target: T): ServiceMetadata | null {
  return target.constructor[serviceMetadata]
}

export function Service<T, R>(options?: {
  as?: R,
  at?: 'root' | 'parent' | 'self',
}) {
  return (target: Type<T>) => {
    target[serviceMetadata] = {
      type: target,
      as: options && options.as ? options.as : target,
      at: options && options.at ? options.at : 'self',
    }
  }
}
