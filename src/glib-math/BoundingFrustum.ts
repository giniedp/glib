module Glib {
  
  var NEAR = 0;
  var FAR = 1;
  var LEFT = 2;
  var RIGHT = 3;
  var TOP = 4;
  var BOTTOM = 5;
      
  export class BoundingFrustum {
    
    planes:IVec4[]
    corners:IVec3[]
    private _matrix:Mat4;
    
    constructor(matrix?:Mat4) {
      this.planes = [];
      for (var i = 0; i < 6; i++) {
        this.planes[i] = { x:0, y:0, z:0, w:0 };
      }
      this.corners = [];
      for (var i = 0; i < 8; i++) {
        this.corners[i] = { x:0, y:0, z:0 };
      }
      this.matrix = matrix || Mat4.identity()
    }
    
    get matrix(){
      return this._matrix;
    }
    set matrix(mat:Mat4) {
      this._matrix = mat;
      this._createPlanes();
      this._createPoints();
    }
    
    get near() {
      return this.planes[NEAR];
    }
    get far() {
      return this.planes[FAR];
    }
    get left() {
      return this.planes[LEFT];
    }
    get right() {
      return this.planes[RIGHT];
    }
    get top() {
      return this.planes[TOP];
    }
    get bottom() {
      return this.planes[BOTTOM];
    }
    
    private _createPlanes(){
      // index layout
      // 0 4 8  12
      // 1 5 9  13
      // 2 6 10 14
      // 3 7 11 15
      var m = this.matrix.data;
      var plane = this.planes[LEFT];
      plane.x = m[12] + m[0];
      plane.y = m[13] + m[1];
      plane.z = m[14] + m[2];
      plane.w = m[15] + m[3];
      
      plane = this.planes[RIGHT];
      plane.x = m[12] - m[0];
      plane.y = m[13] - m[1];
      plane.z = m[14] - m[2];
      plane.w = m[15] - m[3];
      
      plane = this.planes[TOP];
      plane.x = m[12] - m[4];
      plane.y = m[13] - m[5];
      plane.z = m[14] - m[6];
      plane.w = m[15] - m[7];
      
      plane = this.planes[BOTTOM];
      plane.x = m[12] + m[4];
      plane.y = m[13] + m[5];
      plane.z = m[14] + m[6];
      plane.w = m[15] + m[7];
      
      plane = this.planes[NEAR];
      plane.x = m[8];
      plane.y = m[9];
      plane.z = m[10];
      plane.w = m[11];
      
      plane = this.planes[FAR];
      plane.x = m[12] - m[8];
      plane.y = m[13] - m[9];
      plane.z = m[14] - m[10];
      plane.w = m[15] - m[11];
      
      for (var i = 0; i < 6; i++) {
        plane = this.planes[i];
        var length = Vec3.length(plane);
        plane.x = plane.x / length;
        plane.y = plane.y / length;
        plane.z = plane.z / length;
        plane.w = plane.w / length;
      }
    }
    
    private _createPoints(){
      var ray = new Ray();
      var distance;

      Collision.intersectionPlanePlane(this.planes[NEAR], this.planes[LEFT], ray.position, ray.direction);
      distance = Collision.intersectsRayPlane(ray, this.planes[TOP]);
      this.corners[0] = ray.positionAt(distance, { x:0, y:0, z:0 });
      
      Vec3.negate(ray.direction, ray.direction);
      distance = Collision.intersectsRayPlane(ray, this.planes[BOTTOM]);
      this.corners[3] = ray.positionAt(distance, { x:0, y:0, z:0 });

      Collision.intersectionPlanePlane(this.planes[RIGHT], this.planes[NEAR], ray.position, ray.direction);
      distance = Collision.intersectsRayPlane(ray, this.planes[TOP]);
      this.corners[1] = ray.positionAt(distance, { x:0, y:0, z:0 });
      
      Vec3.negate(ray.direction, ray.direction);
      Collision.intersectsRayPlane(ray, this.planes[BOTTOM]);
      this.corners[2] = ray.positionAt(distance, { x:0, y:0, z:0 });

      Collision.intersectionPlanePlane(this.planes[LEFT], this.planes[FAR], ray.position, ray.direction);
      distance = Collision.intersectsRayPlane(ray, this.planes[TOP]);
      this.corners[4] = ray.positionAt(distance, { x:0, y:0, z:0 });
      
      Vec3.negate(ray.direction, ray.direction);
      Collision.intersectsRayPlane(ray, this.planes[BOTTOM]);
      this.corners[7] = ray.positionAt(distance, { x:0, y:0, z:0 });

      Collision.intersectionPlanePlane(this.planes[FAR], this.planes[RIGHT], ray.position, ray.direction);
      distance = Collision.intersectsRayPlane(ray, this.planes[TOP]);
      this.corners[5] = ray.positionAt(distance, { x:0, y:0, z:0 });
      
      Vec3.negate(ray.direction, ray.direction);
      Collision.intersectsRayPlane(ray, this.planes[BOTTOM]);
      this.corners[6] = ray.positionAt(distance, { x:0, y:0, z:0 });
    }
    
    intersectsBox(box:BoundingBox):boolean {
      return Collision.intersectsFrustumBox(this, box);
    }
    intersectsSphere(sphere:BoundingSphere):boolean {
      return Collision.intersectsFrustumSphere(this, sphere);
    }
    intersectsFrustum(other:BoundingFrustum):boolean {
      throw "not implemented";
    }
    intersectsPlane(plane:IVec4):boolean {
      return Collision.intersectsFrustumPlane(this, plane);
    }
    intersectsRay(ray:Ray):boolean {
      throw "not implemented";
    }
    
    containsBox(box:BoundingBox):number {
      return Collision.frustumContainsBox(this, box);
    }
    containsSphere(sphere:BoundingSphere):number {
      return Collision.frustumContainsSphere(this, sphere);
    }
    containsPoint(point:IVec3):number {
      return Collision.frustumContainsPoint(this, point);
    }
  }
}
