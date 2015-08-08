module Vlib {
  export interface IVec2 {
    x: number
    y: number
  }

  export interface IVec3 extends  IVec2 {
    z: number
  }

  export interface IVec4 extends  IVec3 {
    w: number
  }

  export interface IMat {
    data: Float32Array
  }

  export type NumbersArray = number[]|Float32Array|Float64Array;
}