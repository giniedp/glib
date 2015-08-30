module Glib {
  export class BoundingBox {

    constructor(public min:Glib.IVec3, public max:Glib.IVec3){

    }

    static createFromPoints(points:NumbersArray, offset:number=0, stride:number=3){
      var zero = true;
      var min = Glib.Vec3.create(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      var max = Glib.Vec3.create(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
      var index = offset;
      while (index + 2 < points.length) {
        zero = false;
        min.x = Math.min(min.x, points[index]);
        min.y = Math.min(min.y, points[index+1]);
        min.z = Math.min(min.z, points[index+2]);
        max.x = Math.max(max.x, points[index]);
        max.y = Math.max(max.y, points[index+1]);
        max.z = Math.max(max.z, points[index+2]);
        index += stride;
      }

      return new BoundingBox(min, max);
    }
  }
}
