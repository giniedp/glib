// tslint:disable: ban-types

export interface InjectMetadata {
  target: Object,
  properyKey: string | symbol,
  from: 'root' | 'parent' | 'self',
  serviceKey: any,
}

export type InjectMetadataMap = Map<string | symbol, InjectMetadata>

const injectMetadata = Symbol('injectMetadata')

export function getInjectMetadata<T>(target: T): InjectMetadataMap | null {
  return target.constructor[injectMetadata]
}

export function Inject(type: Function, options?: { from: 'root' | 'parent' | 'self' }) {
  return (target: Object, propertyKey?: string|symbol, parameterIndex?: number) => {
    const map: InjectMetadataMap = getInjectMetadata(target) || new Map<string | symbol, InjectMetadata>()
    map.set(propertyKey, {
      target: target,
      properyKey: propertyKey,
      from: options && options.from ? options.from : 'self',
      serviceKey: type,
    })
    target.constructor[injectMetadata] = map
  }
}
