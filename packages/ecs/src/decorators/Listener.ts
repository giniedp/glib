import { errorOnInjectUndefinedType } from '../errors'

/**
 * A metadata object that is created when using {@link Inject} decorator on a property
 *
 * @public
 */
export interface ListenerMetadata {
  /**
   * The event name to listen to
   */
  event: string,
  /**
   * Identifier or query string at which entity to listen
   */
  on: 'root' | 'parent' | string,
  /**
   * The calling context of the event handler
   */
  context: any
  /**
   * The event handler function
   */
  handler: () => any
}

/**
 * An object mapping event names to its listener metadata
 *
 * @public
 */
export type ListenerMetadataMap = Map<string | symbol, ListenerMetadata>

/**
 * Options that can be passed to the {@link Listener} decorator
 *
 * @public
 */
export interface ListenerOptions {
  /**
   * Identifier or query string at which entity to listen
   */
  on?: 'root' | 'parent' | string,
}

const listenerMetadata = Symbol('listenerMetadata')

/**
 * @public
 */
export function getListenerMetadata<T>(target: T): ListenerMetadataMap | null {
  return target.constructor[listenerMetadata]
}

/**
 * A decorator that adds metadata for dependency injection on a class property
 *
 * @public
 */
export function Listener(event: string, options?: ListenerOptions) {
  return (target: object, method?: string|symbol) => {
    if (!event) {
      errorOnInjectUndefinedType(target, method)
    }
    const map: ListenerMetadataMap = getListenerMetadata(target) || new Map()
    const data: ListenerMetadata = {
      event: event,
      on: options && options.on ? options.on : '',
      context: target,
      handler: target[method],
    }
    map.set(method, data)
    target.constructor[listenerMetadata] = map
  }
}
