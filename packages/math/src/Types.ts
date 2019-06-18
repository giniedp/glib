/**
 * A 2 dimensional vector.
 *
 * @public
 */
export interface IVec2 {
  x: number
  y: number
}

/**
 * A 3 dimensional vector.
 *
 * @public
 */
export interface IVec3 extends  IVec2 {
  z: number
}

/**
 * A 4 dimensional vector.
 *
 * @public
 */
export interface IVec4 extends  IVec3 {
  w: number
}

/**
 * A 2 dimensional point.
 *
 * @public
 */
export interface IPoint {
  x: number
  y: number
}

/**
 * An object havin a width and a height.
 *
 * @public
 */
export interface ISize {
  width: number
  height: number
}

/**
 * A rectangle that is composed of a IPoint and a ISize.
 *
 * @public
 */
export interface IRect extends IPoint, ISize {
}

/**
 * An object holding an array of numbers, intended to be used as a matrix
 *
 * @public
 */
export interface IMat {
  data: Float32Array
}

/**
 * Something that looks like an array
 *
 * @public
 */
export interface ArrayLike<T> {
  length: number
  [n: number]: T
}
