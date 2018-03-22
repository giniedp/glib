/**
 * @public
 */
export interface IVec2 {
  x: number
  y: number
}

/**
 * @public
 */
export interface IVec3 extends  IVec2 {
  z: number
}

/**
 * @public
 */
export interface IVec4 extends  IVec3 {
  w: number
}

/**
 * @public
 */
export interface IPoint {
  x: number
  y: number
}

/**
 * @public
 */
export interface ISize {
  width: number
  height: number
}

/**
 * @public
 */
export interface IRect extends IPoint, ISize {
}

/**
 * @public
 */
export interface IMat {
  data: Float32Array
}

/**
 * @public
 */
export interface ArrayLike<T> {
  length: number
  [n: number]: T
}
