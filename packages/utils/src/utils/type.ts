/**
 * @public
 */
export type Type<T> = new (...args: any[]) => T

export interface TypeMixer<T, C = {}> {
  mix<M>(type: Type<M> & C): TypeMixer<T & M>
  finish(): Type<T>
}
