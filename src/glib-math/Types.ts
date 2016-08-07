module Glib {
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

  export interface IPoint {
    x: number
    y: number
  }

  export interface ISize {
    width: number
    height: number
  }

  export interface IRect extends IPoint, ISize {
  }

  export interface IMat {
    data: Float32Array
  }

  export interface NumbersArray {
    length:number,
    [index:number]: number,
    push?(value:number)
  }
}
