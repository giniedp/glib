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

  export interface NumbersArray {
    length:number,
    [index:number]: number,
    push(value:number)
  }
}
