module Glib {
  export class BoundingSphere {
    center: IVec3
    radius: number
    
    constructor(center?:IVec3, radius?:number){
      this.center = new Glib.Vec3();
      if (center) Vec3.copy(center, this.center);
      this.radius = radius === void 0 ? 0 : radius;
    }

    clone():BoundingSphere {
      return new BoundingSphere(this.center, this.radius);
    }
    copy(other:BoundingSphere):BoundingSphere {
      Vec3.copy(this.center, other.center);
      other.radius = this.radius;
      return other;
    }
    merge(other:BoundingSphere):BoundingSphere {
      var distance = Vec3.distance(this.center, other.center);
      if (this.radius >= distance + other.radius) return this;
      this.radius = distance + other.radius;
      return this;
    }
    mergePoint(point:IVec3):BoundingSphere {
      var distance = Vec3.distance(this.center, point);
      if (this.radius >= distance) return this;
      this.radius = distance;
      return this;
    }

    intersectsRay(ray:Ray):boolean {
      return Collision.intersectsRaySphere(ray, this);
    }
    intersectsBox(box:BoundingBox):boolean {
      return Collision.intersectsSphereBox(this, box);
    }
    intersectsSphere(sphere:BoundingSphere):boolean {
      return Collision.intersectsSphereSphere(sphere, this);
    }
    intersectsPlane(plane:IVec4):boolean {
      return Collision.intersectsSpherePlane(this, plane);
    }
    
    containsSphere(sphere:BoundingSphere):number {
      return Collision.sphereContainsSphere(this, sphere);
    }
    containsBox(box:BoundingBox):number {
      return Collision.sphereContainsBox(this, box);
    }
    containsPoint(point:IVec3):number {
      return Collision.sphereContainsPoint(this, point);
    }
    containsFrustum(frustum:BoundingFrustum):number {
      return Collision.sphereContainsFrustum(this, frustum);
    }
    
    static createFromPoints(points:ArrayLike<number>, offset:number=0, stride:number=3):BoundingSphere{
      var zero = true;
      var min = { x:0, y:0, z:0 };
      var max = { x:0, y:0, z:0 };
      min.x = min.y = min.z = Number.MAX_VALUE;
      max.x = max.y = max.z = Number.MIN_VALUE;
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
      var radius = Vec3.distance(min, max) * 0.5;
      var center = Vec3.lerp(min, max, 0.5)
      return new BoundingSphere(min, radius);
    }
    
    static createFromBox(box:BoundingBox):BoundingSphere {
      var radius = Vec3.distance(box.min, box.max) * 0.5;
      var center =Vec3.lerp(box.min, box.max, 0.5)
      return new BoundingSphere(center, radius);
    }

    static convert(item:any):BoundingSphere {
      if (item instanceof BoundingSphere) {
        return item
      } else if (Array.isArray(item)) {
        return new BoundingSphere({ x:item[0], y:item[1], z:item[2] }, item[3])
      } else {
        return new BoundingSphere()
      }
    }
  }
}
