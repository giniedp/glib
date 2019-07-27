/**
 * @public
 */
export interface InjectMetadata {
  target: Object,
  property: string | symbol,
  from: 'root' | 'parent' | string,
  service: any,
}

/**
 * @public
 */
export type InjectMetadataMap = Map<string | symbol, InjectMetadata>

const injectMetadata = Symbol('injectMetadata')

/**
 * @public
 */
export function getInjectMetadata<T>(target: T): InjectMetadataMap | null {
  return target.constructor[injectMetadata]
}

/**
 * @public
 */
export function Inject(type: Function, options?: { from: 'root' | 'parent' | string }) {
  return (target: Object, propertyKey?: string|symbol, parameterIndex?: number) => {
    const map: InjectMetadataMap = getInjectMetadata(target) || new Map<string | symbol, InjectMetadata>()
    map.set(propertyKey, {
      target: target,
      property: propertyKey,
      from: options && options.from ? options.from : '',
      service: type,
    })
    target.constructor[injectMetadata] = map
  }
}
