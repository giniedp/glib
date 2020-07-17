import { Type, AbstractType, TypeWithEmptyConstructor } from '@gglib/utils'
import { errorOnComponentAsUndefinedType } from '../errors'
import { resolveForwardRef, ForwardRefResolvable } from './forwardRef'

const componentMetadata = Symbol('componentMetadata')

/**
 * @public
 */
export interface ComponentMetadata {
  /**
   * The class type or an object that has been decorated with this metadata
   */
  target: Type<unknown> | object

  /**
   * If true, multiple instances of same type are allowed on the entity
   */
  multi: boolean

  /**
   * The type or key under which the component will be registered
   */
  as: Type<unknown> | AbstractType<unknown> | Symbol

  /**
   * List of components that should be automatically installed
   */
  install: Array<TypeWithEmptyConstructor<unknown>>
}

/**
 * Options that can be passed to the {@link Component} decorator
 *
 * @public
 */
export interface ComponentMetadataOptions<T = unknown> {
  /**
   * If true, multiple instances of same component type are allowed on the entity
   */
  multi?: boolean
  /**
   * The symbol to use use as the registry key.
   */
  as?: ForwardRefResolvable<Type<T> | AbstractType<T> | Symbol>,
  /**
   * List of components that should be automatically installed
   */
  install?: Array<ForwardRefResolvable<Type<any>>>
}

/**
 * Resolves component metadata from given target
 *
 * @public
 */
export function getComponentMetadata<T>(target: Type<T> | object): ComponentMetadata | null {
  return target[componentMetadata] || target.constructor?.[componentMetadata]
}

export function decorateComponent<T>(target: T, options: ComponentMetadataOptions<T>): T
export function decorateComponent<T>(target: Type<T>, options: ComponentMetadataOptions<T>): T
export function decorateComponent<T>(target: AbstractType<T>, options: ComponentMetadataOptions<T>): T
export function decorateComponent<T extends object>(target: T, options: ComponentMetadataOptions): T {
  if (target[componentMetadata]) {
    throw new Error(`Can not wrap target with metadata. Metadata already exists.`)
  }
  if (options && 'as' in options && options.as == null) {
    throw errorOnComponentAsUndefinedType(target)
  }
  const meta: ComponentMetadata & { _as: any, _deps: Array<ForwardRefResolvable<Type<any>>> } = {
    _as: options?.as || target,
    _deps: options?.install || [],
    target: target,
    multi: !!options?.multi,
    get as() { return resolveForwardRef(this._as) },
    get install() { return this._deps.map(resolveForwardRef) }
  }
  target[componentMetadata] = meta
  return target
}

/**
 * A decorator that adds metadata to a component type to enable some automagic
 *
 * @public
 */
export function Component<T>(options?: ComponentMetadataOptions<T>) {
  return (target: Type<T>) => {
    decorateComponent(target, options)
  }
}
