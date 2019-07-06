import { Type } from '@gglib/utils'
import { Component } from '../Component'

export interface InjectMetadata {
  target: Type<any>
  property: string,
  from: 'root' | 'parent' | 'self',
  service: Type<Component>,
}

export type InjectMetadataMap = Map<string, InjectMetadata>

export const injectMetadata = Symbol('injectMetadata')

export function getInjectMetadata<T>(target: T): InjectMetadataMap | null {
  return target.constructor[injectMetadata]
}

export function Inject<T>(type: Type<T>, options?: { from: 'root' | 'parent' | 'self' }) {
  return (target: any, propertyName: string) => {
    const map: InjectMetadataMap = getInjectMetadata(target) || new Map<string, InjectMetadata>()
    map.set(propertyName, {
      target: target,
      property: propertyName,
      from: options && options.from ? options.from : 'self',
      service: type,
    })
    target.constructor[injectMetadata] = map
  }
}
