module Glib {
  export class Ray {
    position: IVec3;
    direction: IVec3;
    
    constructor(position?:IVec3, direction?:IVec3){
      this.position = new Glib.Vec3();
      if (position) Vec3.copy(position, this.position);
      this.direction = new Glib.Vec3();
      if (direction) Vec3.copy(direction, this.direction);
    }

    clone():Ray {
      return new Ray(this.position, this.direction);
    }
    copy(other:Ray):Ray {
      Vec3.copy(this.position, other.position);
      Vec3.copy(this.direction, other.direction);
      return other;
    }
    
    positionAt(distance:number, result:IVec3={x:0, y:0, z:0}):IVec3 {
      result.x = this.direction.x * distance + this.position.x;
      result.y = this.direction.y * distance + this.position.y;
      result.z = this.direction.z * distance + this.position.z;
      return result;
    }
    
    intersectsSphere(sphere:BoundingSphere):boolean {
      return Collision.intersectsRaySphere(this, sphere);
    }
    intersectsBox(box:BoundingBox):boolean {
      return Collision.intersectsRayBox(this, box);
    }
    intersectsPlane(plane:IVec4):boolean {
      return Collision.intersectsRayPlane(this, plane);
    }
    intersectsTriangle(a:IVec3, b:IVec3, c:IVec3):boolean {
      return Collision.intersectsRayTriangle(this, a, b, c);
    }
    
    intersectsSphereAt(sphere:BoundingSphere):number {
      return Collision.intersectionRaySphere(this, sphere);
    }
    intersectsBoxAt(box:BoundingBox):number {
      return Collision.intersectionRayBox(this, box);
    }
    intersectsPlaneAt(plane:IVec4):number {
      return Collision.intersectionRayPlane(this, plane);
    }
    intersectsTriangleAt(a:IVec3, b:IVec3, c:IVec3):number {
      return Collision.intersectionRayTriangle(this, a, b, c);
    }
  }
}