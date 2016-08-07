module Glib.Collision {

  var EPSILON = 2.2204460492503130808472633361816e-16;
  
  var vecPool:IVec4[] = [];
  var vecBin:IVec4[] = [];
  for (var i = 0; i < 20; i++) {
    vecPool.push({ x:0, y:0, z:0, w:0 })
  }
  function nextVec():IVec4 {
    var result = vecPool.pop() || { x:0, y:0, z:0, w:0 }
    vecBin.push(result);
    return result;
  }
  var recycleDepth = 0;
  function recycleBegin(){
    recycleDepth += 1;
  }
  function recycleEnd<T>(proxy?:T):T{
    recycleDepth -= 1;
    if (recycleDepth === 0) {
      while(vecBin.length) vecPool.push(vecBin.pop())  
    } else if (recycleDepth < 0) {
      throw "";
    }
    return proxy;
  }
  
  // Real Time Collision Detection Chapter 5.1.1 page 127
  export function closestPointToPlane(point:IVec3, plane:IVec4, result:IVec3):void {
    var t = Vec3.dot(plane, point) - plane.w;
    result.x = point.x - plane.x * t;
    result.y = point.y - plane.y * t;
    result.z = point.z - plane.z * t;
  }

  // Real Time Collision Detection Chapter 5.1.1 page 127
  export function distancePointToPlane(point:IVec3, plane:IVec4):number {
    return Vec3.dot(plane, point) - plane.w;
  }

  // Real Time Collision Detection Chapter 5.1.2 page 128
  export function closestPointSegment(point:IVec3, a:IVec3, b:IVec3, out:IVec3):void {
    recycleBegin();
    
    var ab = Vec3.subtract(b, a, nextVec());
    // project c onto ab, computing parametrized poition d(t) = a + t * (b - a)
    var ac = Vec3.subtract(point, a, nextVec());
    var t = Vec3.dot(ac, ab) / Vec3.lengthSquared(ab);
    // if outside segment, clamp t (and therefore d) to closest endpoint
    t = t < 0.0 ? 0.0 : (t > 1.0 ? 1.0 : t);
    // compute projected position from the clamped t
    out.x = a.x + t * ab.x;
    out.y = a.y + t * ab.y;
    out.z = a.z + t * ab.z;
    
    recycleEnd();
  }

  // Real Time Collision Detection Chapter 5.1.3 page 130
  export function squaredDistancePointSegment(a:IVec3, b:IVec3, c:IVec3):number {
    recycleBegin();
    
    var ab = Vec3.subtract(b, a, nextVec());
    var ac = Vec3.subtract(c, a, nextVec());
    var bc = Vec3.subtract(c, b, nextVec());
    var result; 
    
    var e = Vec3.dot(ac, ab);
    // handle cases where c projects outside ab
    if (e < 0.0) {
      result = Vec3.lengthSquared(ac);
      return recycleEnd(result);
    }
    
    var f = Vec3.lengthSquared(ab);
    if (e >= f) {
      result = Vec3.lengthSquared(bc);
      return recycleEnd(result);
    }
    
    // handle cases where c projects onto ab
    result = Vec3.lengthSquared(ac) - e * e / f;
    return recycleEnd(result);
  }

  export function closestPointTriangle(point:IVec3, a:IVec3, b:IVec3, c:IVec3, result:IVec3):IVec3 {
    recycleBegin();
    
    var ab = Vec3.subtract(b, a, nextVec());
    var ac = Vec3.subtract(c, a, nextVec());
    var ap = Vec3.subtract(point, a, nextVec());
    var d1 = Vec3.dot(ab, ap);
    var d2 = Vec3.dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) {
      // barycentric coordinates (1, 0, 0)
      result.x = a.x;
      result.y = a.y;
      result.z = a.z;
      return recycleEnd(result);
    }

    var bp = Vec3.subtract(point, b, nextVec());
    var d3 = Vec3.dot(ab, bp);
    var d4 = Vec3.dot(ac, bp);
    if (d3 <= 0 && d4 <= 0) {
      // barycentric coordinates (0, 1, 0)
      result.x = b.x;
      result.y = b.y;
      result.z = b.z;
      return recycleEnd(result);
    }

    var vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      var w = d1 / (d1 - d3);
      result.x = a.x + w * ab.x;
      result.y = a.y + w * ab.y;
      result.z = a.z + w * ab.z;
      return recycleEnd(result);
    }

    var cp = Vec3.subtract(point, c, nextVec());
    var d5 = Vec3.dot(ab, cp);
    var d6 = Vec3.dot(ac, cp);
    if (d5 <= 0 && d6 <= 0) {
      // barycentric coordinates (0, 0, 1)
      result.x = c.x;
      result.y = c.y;
      result.z = c.z;
      return recycleEnd(result);
    }

    var vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      var w = d2 / (d2 - d6);
      result.x = a.x + w * ac.x;
      result.y = a.y + w * ac.y;
      result.z = a.z + w * ac.z;
      return recycleEnd(result);
    }

    var va = d3 * d6 - d5 * d4;
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
      var w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
      result.x = b.x + w * (c.x - b.x);
      result.y = b.y + w * (c.y - b.y);
      result.z = b.z + w * (c.z - b.z);
      return recycleEnd(result);
    }

    var denom = 1 / (va + vb + vc);
    result.x = a.x + ab.x * vb * denom + ac.x * vc * denom;
    result.y = a.y + ab.y * vb * denom + ac.y * vc * denom;
    result.z = a.z + ab.z * vb * denom + ac.z * vc * denom;
    return recycleEnd(result);
  }

  export function intersectsRayPlane(ray:Ray, plane:IVec4):boolean {
    return ((plane.w - Vec3.dot(plane, ray.position)) / Vec3.dot(plane, ray.direction)) >= 0;
  }
  
  export function intersectionRayPlane(ray:Ray, plane:IVec4):number {
    return (plane.w - Vec3.dot(plane, ray.position)) / Vec3.dot(plane, ray.direction);
  }
  
  export function intersectsRaySphere(ray:Ray, sphere:BoundingSphere):boolean {
    recycleBegin();
    
    var m = Vec3.subtract(ray.position, sphere.center, nextVec());
    var c = Vec3.dot(m, m) - sphere.radius * sphere.radius;
    // if there is definitely at least one real root, there must be an intersection
    if (c <= 0) return recycleEnd(true);
    
    var b = Vec3.dot(m, ray.direction);
    // exit if rays origin outside sphere and ray pointing away from sphere
    if (b > 0) return recycleEnd(false);
    
    // a negative discriminant corresponds to ray missing sphere
    return recycleEnd((b * b - c) >= 0); 
  }
  
  export function intersectionRaySphere(ray:Ray, sphere:BoundingSphere):number {
    recycleBegin();
    
    var m = Vec3.subtract(ray.position, sphere.center, nextVec());
    var b = Vec3.dot (m, ray.direction);
    var c = Vec3.dot(m, m) - sphere.radius * sphere.radius; 
    // exit if rays origin outside sphere (c < 0) and ray pointing away from sphere (b > 0)
    if (c > 0 && b > 0) {
      return recycleEnd(Number.POSITIVE_INFINITY);
    }
    
    var discr = b * b - c;
    // negative discriminant corresponds to ray missing sphere
    if (discr < 0) {
      return recycleEnd(Number.POSITIVE_INFINITY);
    }
    // Ray now found to intersect sphere, compute smallest t value of intersection
    var result = -b - Math.sqrt(discr);
    // If t is negative, ray started inside sphere , so clamp to zero
    return recycleEnd(result < 0 ? 0 : result);
  }
  
    
  export function intersectsRayBox(ray:Ray, box:BoundingBox):boolean{
    return intersectionRayBox(ray, box) >= 0;
  }
  
  export function intersectionRayBox(ray:Ray, box:BoundingBox):number {
    // source
    // http://www.siggraph.org/education/materials/HyperGraph/raytrace/rtinter3.htm

    var tMin = Number.MIN_VALUE;
    var tMax = Number.MAX_VALUE;

    if (Math.abs(ray.direction.x) < EPSILON) {
      // ray is parallel to X planes
      if (ray.position.x < box.min.x || ray.position.x > box.max.x) {
        // ray origin is not between the slabs
        return Number.NaN;
      }
    } else {
      var oneOverDirX = 1 / ray.direction.x;
      var t1 = (box.min.x - ray.position.x) * oneOverDirX;
      var t2 = (box.max.x - ray.position.x) * oneOverDirX;
      if (t1 > t2) {
        // swap since T1 intersection with near plane
        var temp = t1;
        t1 = t2;
        t2 = temp;
      }
      tMin = Math.max(t1, tMin);
      tMax = Math.min(t2, tMax);
      if (tMin > tMax) {
        return Number.NaN;
      }
    }

    if (Math.abs(ray.direction.y) < EPSILON)
    {
      // ray is parallel to Y planes
      if (ray.position.y < box.min.y || ray.position.y > box.max.y) {
        // ray origin is not between the slabs
        return Number.NaN;
      }
    } else {
      var oneOverDirY = 1 / ray.direction.y;
      var t1 = (box.min.y - ray.position.y) * oneOverDirY;
      var t2 = (box.max.y - ray.position.y) * oneOverDirY;
      if (t1 > t2) {
        var temp = t1;
        t1 = t2;
        t2 = temp;
      }
      tMin = Math.max(t1, tMin);
      tMax = Math.min(t2, tMax);
      if (tMin > tMax) {
          return Number.NaN;
      }
    }

    if (Math.abs(ray.direction.z) < EPSILON)
    {
      // ray is parallel to Z planes
      if (ray.position.z < box.min.z || ray.position.z > box.max.z) {
        // ray origin is not between the slabs
        return Number.NaN;
      }
    } else {
      var oneOverDirZ = 1 / ray.direction.z;
      var t1 = (box.min.z - ray.position.z) * oneOverDirZ;
      var t2 = (box.max.z - ray.position.z) * oneOverDirZ;
      if (t1 > t2)
      {
        var temp = t1;
        t1 = t2;
        t2 = temp;
      }
      tMin = Math.max(t1, tMin);
      tMax = Math.min(t2, tMax);
      if (tMin > tMax) {
        return Number.NaN;
      }
    }
    return tMin;
  }


  export function intersectsRayTriangle(ray:Ray, a:IVec3, b:IVec3, c:IVec3):boolean {
    recycleBegin();

    var ab = Vec3.subtract(b, a, nextVec());
    var ac = Vec3.subtract(c, a, nextVec());
    var qp = ray.direction;

    // Compute triangle normal.
    var n = Vec3.cross(ab, ac, nextVec());

    // Compute denominator d. If d <= 0, segment is parallel to or points away from triangle
    var d = Vec3.dot(qp, n);
    if (d <= 0) {
      return recycleEnd(false);
    }

    // Compute intersection t value of pq with plane of triangle. A ray intersects if t >= 0
    var ap = Vec3.subtract(ray.position, a, nextVec());
    var result = Vec3.dot(ap, n);
    if (result < 0) {
      return recycleEnd(false);
    }

    // Compute barycentric coordinate components and tes if within bounds
    var e = Vec3.cross(qp, ap, nextVec());
    var v = Vec3.dot(ac, e);
    if (v < 0 || v > d) {
      return recycleEnd(false);
    }
    var w = -Vec3.dot(ab, e);
    if (w < 0 || v + w > d){
      return recycleEnd(false);
    }
    return recycleEnd(true);
  }
  export function intersectionRayTriangle(ray:Ray, a:IVec3, b:IVec3, c:IVec3):number {
    recycleBegin();
    
    var ab = Vec3.subtract(b, a, nextVec());
    var ac = Vec3.subtract(c, a, nextVec());
    var qp = ray.direction;
    
    // Compute triangle normal.
    var n = Vec3.cross(ab, ac, nextVec());
    
    // Compute denominator d. If d <= 0, segment is parallel to or points away from triangle
    var d = Vec3.dot(qp, n);
    if (d <= 0) {
      return recycleEnd(Number.POSITIVE_INFINITY);
    }
    
    // Compute intersection t value of pq with plane of triangle. A ray intersects if t >= 0
    var ap = Vec3.subtract(ray.position, a, nextVec());
    var result = Vec3.dot(ap, n);
    if (result < 0) {
      return recycleEnd(Number.NaN);
    }
    
    // Compute barycentric coordinate components and tes if within bounds
    var e = Vec3.cross(qp, ap, nextVec());
    var v = Vec3.dot(ac, e);
    if (v < 0 || v > d) {
      return recycleEnd(Number.NaN);
    }
    var w = -Vec3.dot(ab, e);
    if (w < 0 || v + w > d) {
      return recycleEnd(Number.NaN);
    }
    
    // 
    var ood = 1 / d;
    result *= ood;
    // compute barycentric
    //v *= ood;
    //w *= ood;
    //float u = 1f - v - w;
    return recycleEnd(result);
  }

  
  export function intersectsSpherePlane(sphere:BoundingSphere, plane:IVec4):boolean {
    var dist = Vec3.dot(sphere.center, plane) - plane.w;
    return Math.abs(dist) <= sphere.radius;
  }
  export function intersectionSpherePlane(sphere:BoundingSphere, plane:IVec4):number {
    var dist = Vec3.dot(sphere.center, plane) - plane.w;
    if (dist > sphere.radius) {
      // front
      return 1;
    }
    if (dist < -sphere.radius) {
      // back
      return -1;
    }
    // intersects
    return 0;
  }
  
  export function intersectsSphereSphere(a:BoundingSphere, b:BoundingSphere):boolean {
    // Calculate squared distance between centers
    var d2 = Vec3.distanceSquared(a.center, b.center);
    // Spheres intersect if squared distance is less than squared sum of radii
    var r = a.radius + b.radius;
    return d2 <= (r * r);
  }
  
  export function intersectsSphereBox(sphere:BoundingSphere, box:BoundingBox):boolean {
    recycleBegin();
    var center = Vec3.clamp(sphere.center, box.min, box.max, nextVec());
    var d = Vec3.distanceSquared(sphere.center, center);
    return recycleEnd(d <= (sphere.radius * sphere.radius));
  }
  
  export function intersectsSphereTriangle(sphere:BoundingSphere, a:IVec3, b:IVec3, c:IVec3):boolean {
    recycleBegin();
    var p = closestPointTriangle(sphere.center, a, b, c, nextVec());
    Vec3.subtract(p, sphere.center, p);
    return recycleEnd(Vec3.lengthSquared(p) <= sphere.radius * sphere.radius);
  }
  
  
  export function intersectsBoxPlane(box:BoundingBox, plane:IVec4):boolean {

    var pX = plane.x >= 0 ? box.min.x : box.max.x;
    var pY = plane.y >= 0 ? box.min.y : box.max.y;
    var pZ = plane.z >= 0 ? box.min.z : box.max.z;

    var dot = plane.x * pX + plane.y * pY + plane.z * pZ;

    if (dot + plane.w > 0) {
        return false;
    }

    pX = plane.x >= 0 ? box.max.x : box.min.x;
    pY = plane.y >= 0 ? box.max.y : box.min.y;
    pZ = plane.z >= 0 ? box.max.z : box.min.z;

    dot = plane.x * pX + plane.y * pY + plane.z * pZ;

    return (dot + plane.w) >= 0;
  }
  
  export function intersectsBoxBox(box1:BoundingBox, box2:BoundingBox) {
      return box1.max.x >= box2.min.x && box1.min.x <= box2.max.x &&
              box1.max.y >= box2.min.y && box1.min.y <= box2.max.y &&
              box1.max.z >= box2.min.z && box1.min.z <= box2.max.z;
  }
  
  export function intersectionPlanePlane(plane1:IVec4, plane2:IVec4, position:IVec3, direction:IVec3) {
    recycleBegin();
    Vec3.cross(plane1, plane2, direction);
    var denom = Vec3.lengthSquared(direction);
    if (denom < EPSILON) {
      position.x = 0;
      position.y = 0;
      position.z = 0;
      return recycleEnd(false);
    }
      
    var p1 = Vec3.multiplyScalar(plane2, plane1.w, nextVec());
    var p2 = Vec3.multiplyScalar(plane1, -plane2.w, nextVec());
    Vec3.add(p1, p2, position);
    Vec3.cross(position, direction, position);
    Vec3.divideScalar(position, denom, position);
    
    return recycleEnd(true);
  }
  
  export function intersectionPlanePlanePlane(p1:IVec4, p2:IVec4, p3:IVec4, point:IVec3):boolean {
    recycleBegin();
  
    var m1 = nextVec();
    m1.x = p1.x;
    m1.y = p2.x;
    m1.z = p3.x;
    
    var m2 = nextVec();
    m2.x = p1.y;
    m2.y = p2.y;
    m2.z = p3.y;
    
    var m3 = nextVec();
    m3.x = p1.z;
    m3.y = p2.z;
    m3.z = p3.z;
    
    var u = Vec3.cross(m2, m3, nextVec());
    var denom = Vec3.dot(m1, u);
    
    if (Math.abs(denom) < EPSILON) {
      point.x = 0;
      point.y = 0;
      point.z = 0;
      return recycleEnd(false);  
    }
    
    var d = nextVec();
    d.x = p1.w;
    d.y = p2.w;
    d.z = p3.w;
    var v = Vec3.cross(m1, d, nextVec());
    var ood = 1 / denom;
    
    point.x = Vec3.dot(d, u) * ood;
    point.y = Vec3.dot(m3, v) * ood;
    point.z = -Vec3.dot(m2, v) * ood;
    
    return recycleEnd(true);
  }
  
  export function boxContainsBox(box1:BoundingBox, box2:BoundingBox):number {
    if ((box1.max.x < box2.min.x) || (box1.min.x > box2.max.x) || (box1.max.y < box2.min.y) || (box1.min.y > box2.max.y) || (box1.max.z < box2.min.z) || (box1.min.z > box2.max.z)) {
      return 0;
    }
    if ((box1.min.x <= box2.min.x) && (box1.max.x >= box2.max.x) && (box1.min.y <= box2.min.y) && (box1.max.y >= box2.max.y) && (box1.min.z <= box2.min.z) && (box1.max.z >= box2.max.z)) {
      return 2;
    }
    return 1;
  }
  
  export function boxContainsPoint(box:BoundingBox, vec:IVec3):number {
    if (box.min.x > vec.x || vec.x > box.max.x || box.min.z > vec.y || vec.y > box.max.y || box.min.z > vec.z || vec.z > box.max.z) {
      return 0;
    }
    return 2;
  }
  
  export function boxContainsSphere(box:BoundingBox, sphere:BoundingSphere):number {
    recycleBegin();
    var vector = Vec3.clamp(sphere.center,box.min, box.max, nextVec());
    var distance = Vec3.distanceSquared(sphere.center, vector);
    var radius = sphere.radius;
    if (distance > radius * radius) {
      return recycleEnd(0);
    }
    if (((box.min.x + radius) > sphere.center.x) || (sphere.center.x > (box.max.x - radius)) || ((box.max.x - box.min.x) <= radius) ||
        ((box.min.y + radius) > sphere.center.y) || (sphere.center.y > (box.max.y - radius)) || ((box.max.y - box.min.y) <= radius) ||
        ((box.min.z + radius) > sphere.center.z) || (sphere.center.z > (box.max.z - radius)) || ((box.max.z - box.min.z) <= radius))
    {
      return recycleEnd(1);
    }
    return recycleEnd(2);
  }
  
  export function boxContainsFrustum(box:BoundingBox, frustum:BoundingFrustum):number {
    throw "not implemented";
  }

  export function sphereContainsBox(sphere:BoundingSphere, box:BoundingBox):number {
    if (!intersectsSphereBox(sphere, box)) {
      return 0;
    }
    var r2 = sphere.radius * sphere.radius;
    var vecX = sphere.center.x - box.min.x;
    var vecY = sphere.center.y - box.max.y;
    var vecZ = sphere.center.z - box.max.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.max.x;
    vecY = sphere.center.y - box.max.y;
    vecZ = sphere.center.z - box.max.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.max.x;
    vecY = sphere.center.y - box.min.y;
    vecZ = sphere.center.z - box.max.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.min.x;
    vecY = sphere.center.y - box.min.y;
    vecZ = sphere.center.z - box.max.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.min.x;
    vecY = sphere.center.y - box.max.y;
    vecZ = sphere.center.z - box.min.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.max.x;
    vecY = sphere.center.y - box.max.y;
    vecZ = sphere.center.z - box.min.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.max.x;
    vecY = sphere.center.y - box.min.y;
    vecZ = sphere.center.z - box.min.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    vecX = sphere.center.x - box.min.x;
    vecY = sphere.center.y - box.min.y;
    vecZ = sphere.center.z - box.min.z;
    if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2)
    {
      return 1;
    }
    return 2;
  }
  
  export function sphereContainsPoint(sphere:BoundingSphere, point:IVec3):number {
    var d2 = Vec3.distanceSquared(point, sphere.center);
    return d2 <= (sphere.radius * sphere.radius) ? 2 : 0;
  }
  
  export function sphereContainsSphere(sphere1:BoundingSphere, sphere2:BoundingSphere):number {
    var distance = Vec3.distance(sphere1.center, sphere2.center);
    if (sphere1.radius + sphere2.radius < distance) {
      return 0;
    }
    if (sphere1.radius - sphere2.radius < distance) {
      return 1;
    }
    return 2;
  }
  
  export function sphereContainsFrustum(sphere:BoundingSphere, frustum:BoundingFrustum):number {
    throw "not implemented";
  }
  
  export function frustumContainsPoint(frustum:BoundingFrustum, point:IVec3):number {
    for (var i = 0; i < 6; i++) {
      var plane = frustum.planes[i];
      var distance = Vec3.dot(plane, point) + plane.w;
      if (distance < 0) {
        return 0;
      }
    }
    return 2;
  }
  
  export function frustumContainsSphere(frustum:BoundingFrustum, sphere:BoundingSphere):number {
    // assume sphere is inside
    var result = 2;
    
    for (var i = 0; i < 6; i++) {
      var plane = frustum.planes[i];
      var d = Vec3.dot(plane, sphere.center) + plane.w;
      if (d > sphere.radius) {
        // outside
        return 0;
      }
      if (d < -sphere.radius) {
        // intersects
        result = 1;
      }
    }
    return result;
  }
  
  export function frustumContainsBox(frustum:BoundingFrustum, box:BoundingBox):number {
    // http://zach.in.tu-clausthal.de/teaching/cg_literatur/lighthouse3d_view_frustum_culling/index.html
    // section: Geometric Approach - Testing Boxes II 

    var result = 2;
    var pX, pY, pZ;
    var plane;
    var distance;

    // for each plane do ...
    for (var i = 0; i < 6; i++)
    {
        plane = frustum.planes[i];

        // build positive vertex as described in link above
        pX = box.min.x;
        pY = box.min.y;
        pZ = box.min.z;        
        if (plane.x >= 0) {
          pX = box.max.x;
        }
        if (plane.y >= 0) {
          pY = box.max.y;
        }
        if (plane.z >= 0) {
          pZ = box.max.z;
        }

        // is the positive vertex outside?
        distance = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w;
        if (distance < 0) {
          return 0;
        }

        // build negative vertex as described in link above
        pX = box.max.x;
        pY = box.max.y;
        pZ = box.max.z;
        if (plane.x >= 0) {
          pX = box.min.x;
        }
        if (plane.y >= 0) {
          pY = box.min.y;
        }
        if (plane.z >= 0) {
          pY = box.min.z;
        }

        // is the negative vertex outside?
        distance = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w;
        if (distance < 0) {
          result = 1;
        }
    }
    return result;
  }

  
  export function intersectsFrustumSphere(frustum:BoundingFrustum, sphere:BoundingSphere):boolean {
    for (var i = 0; i < 6; i++) {
      var plane = frustum.planes[i];
      var distance = Vec3.dot(plane, sphere.center) + plane.w;
      if (distance < -sphere.radius) {
        // outside
        return false;
      }
    }
    return true;
  }
  
  export function intersectsFrustumBox(frustum:BoundingFrustum, box:BoundingBox):boolean {
    // http://zach.in.tu-clausthal.de/teaching/cg_literatur/lighthouse3d_view_frustum_culling/index.html
    // section: Geometric Approach - Testing Boxes II 

    var pX, pY, pZ;
    var plane;
    var distance;

    // for each plane do ...
    for (var i = 0; i < 6; i++) {
      plane = frustum.planes[i];

      // build positive vertex as described in link above
      pX = box.min.x;
      pY = box.min.y;
      pZ = box.min.z;        
      if (plane.x >= 0) {
        pX = box.max.x;
      }
      if (plane.y >= 0) {
        pY = box.max.y;
      }
      if (plane.z >= 0) {
        pZ = box.max.z;
      }

      // is the positive vertex outside?
      distance = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w;
      if (distance < 0) {
        return false;
      }
    }
    return true;
  }
  
  export function intersectsFrustumPlane(frustum:BoundingFrustum, plane:IVec4):boolean {
    var back, front;
    
    for (var i = 0; i < 8; i+=1) {
      var d = Vec3.dot(frustum.corners[i], plane) + plane.w;
      if (d > 0) {
        back = true;
      } else {
        front = true;
      }
      if (back && front) {
        return true;
      }
    }
    return false;
  }
}
