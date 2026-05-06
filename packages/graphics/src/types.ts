import type { RenderEncoder } from './RenderEncoder'

/**
 * A type that makes all properties of T mutable (removing readonly).
 *
 * @remarks
 * Internal utility for fields that should be writable internally but read-only to external users of the API.
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * An object that can be disposed of, releasing any resources it holds.
 */
export interface Disposable {
  dispose(): void
}

/**
 * Type guard to check if an object is {@link Disposable}.
 */
export function isDisposable(object: any): object is Disposable {
  return object && typeof object.dispose === 'function'
}

/**
 * An object that can be rendered by a RenderEncoder.
 */
export interface Renderable {
  render(pass: RenderEncoder): void
}

// export interface Computable {
//   compute(pass: ComputeEncoder): void
// }
