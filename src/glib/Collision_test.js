(function(){

  var Collision = Glib.Collision;
  var Ray = Glib.Ray;
  var Sphere = Glib.BoundingSphere;
  var Box = Glib.BoundingBox;
  
  describe("Glib.Collision", function() {
    it("intersectsRayPlane", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var ray = new Ray({ x: 0, y: 0, z: 0}, { x: 0, y: 0, z: 0});
        var plane = { x:0, y:0, z:0, w:0 };

        ray.direction[prop] = 1;
        plane[prop] = 1;
        plane.w = 2;
        expect(Collision.intersectsRayPlane(ray, plane)).toBe(true);

        ray.direction[prop] = -1;
        expect(Collision.intersectsRayPlane(ray, plane)).toBe(false);
      });
    });

    it("intersectsRayPlane", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var ray = new Ray({ x: 0, y: 0, z: 0}, { x: 0, y: 0, z: 0});
        var plane = { x:0, y:0, z:0, w:0 };

        ray.direction[prop] = 1;
        plane[prop] = 1;
        plane.w = 2;
        expect(Collision.intersectionRayPlane(ray, plane)).toBe(2);

        ray.direction[prop] = -1;
        expect(Collision.intersectionRayPlane(ray, plane)).toBe(-2);
      });
    });

    it("intersectsRaySphere", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var ray = new Ray({ x: 0, y: 0, z: 0}, { x: 0, y: 0, z: 0});
        var sphere = new Sphere({ x:0, y:0, z:0 }, 0.5);

        ray.direction[prop] = 1;
        sphere.center[prop] = 1;
        expect(Collision.intersectsRaySphere(ray, sphere)).toBe(true);

        ray.direction[prop] = -1;
        expect(Collision.intersectsRaySphere(ray, sphere)).toBe(false);
      });
    });

    it("intersectionRaySphere", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var ray = new Ray({ x: 0, y: 0, z: 0}, { x: 0, y: 0, z: 0});
        var sphere = new Sphere({ x:0, y:0, z:0 }, 0.5);

        ray.direction[prop] = 1;
        sphere.center[prop] = 1;
        expect(Collision.intersectionRaySphere(ray, sphere)).toBe(0.5);

        ray.direction[prop] = -1;
        expect(Collision.intersectionRaySphere(ray, sphere)).not.toBe(0.5);
      });
    });

    it("intersectsRayBox", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var ray = new Ray({ x: 0, y: 0, z: 0}, { x: 0, y: 0, z: 0});
        var box = new Box({ x:-0.5, y:-0.5, z:-0.5 }, { x:0.5, y:0.5, z:0.5 });

        ray.direction[prop] = 1;
        box.min[prop] += 1;
        box.max[prop] += 1;
        expect(Collision.intersectsRayBox(ray, box)).toBe(true);
        console.log(box, ray);
        ray.direction[prop] = -1;
        expect(Collision.intersectsRayBox(ray, box)).toBe(false);
      });
    });

    it("intersectionRayBox", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var ray = new Ray({ x: 0, y: 0, z: 0}, { x: 0, y: 0, z: 0});
        var box = new Box({ x:-0.5, y:-0.5, z:-0.5 }, { x:0.5, y:0.5, z:0.5 });

        ray.direction[prop] = 1;
        box.min[prop] += 1;
        box.max[prop] += 1;
        expect(Collision.intersectionRayBox(ray, box)).toBe(0.5);
        ray.direction[prop] = -1;
        expect(Collision.intersectionRayBox(ray, box)).not.toBe(0.5);
      });
    });

    it("intersectsSpherePlane", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var sphere = new Sphere({ x: 0, y: 0, z: 0}, 0.5);
        var plane = { x: 0, y: 0, z: 0, w: 0};
        plane[prop] = 1;
        plane.w = -1;
        expect(Collision.intersectsSpherePlane(sphere, plane)).toBe(false);
        plane.w = -0.5;
        expect(Collision.intersectsSpherePlane(sphere, plane)).toBe(true);
        plane.w = 0;
        expect(Collision.intersectsSpherePlane(sphere, plane)).toBe(true);
        plane.w = 0.5;
        expect(Collision.intersectsSpherePlane(sphere, plane)).toBe(true);
        plane.w = 1;
        expect(Collision.intersectsSpherePlane(sphere, plane)).toBe(false);
      });
    });

    it("intersectionSpherePlane", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var sphere = new Sphere({ x: 0, y: 0, z: 0}, 0.5);
        var plane = { x: 0, y: 0, z: 0, w: 0};
        plane[prop] = 1;
        plane.w = -1;
        expect(Collision.intersectionSpherePlane(sphere, plane)).toBe(1);
        plane.w = -0.5;
        expect(Collision.intersectionSpherePlane(sphere, plane)).toBe(0);
        plane.w = 0;
        expect(Collision.intersectionSpherePlane(sphere, plane)).toBe(0);
        plane.w = 0.5;
        expect(Collision.intersectionSpherePlane(sphere, plane)).toBe(0);
        plane.w = 1;
        expect(Collision.intersectionSpherePlane(sphere, plane)).toBe(-1);
      });
    });

    it("intersectsSphereSphere", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var sphere1 = new Sphere({ x: 0, y: 0, z: 0}, 0.5);
        var sphere2 = new Sphere({ x: 0, y: 0, z: 0}, 0.5);

        sphere2.center[prop] = -1.5;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(false);
        sphere2.center[prop] = -1.0;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(true);
        sphere2.center[prop] = -0.5;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(true);
        sphere2.center[prop] = 0.0;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(true);
        sphere2.center[prop] = 0.5;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(true);
        sphere2.center[prop] = 1.0;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(true);
        sphere2.center[prop] = 1.5;
        expect(Collision.intersectsSphereSphere(sphere1, sphere2)).toBe(false);
      });
    });

    it("intersectsSphereBox", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var sphere = new Sphere({ x: 0, y: 0, z: 0}, 0.5);
        var box = new Box({ x: -0.5, y: -0.5, z: -0.5}, { x: 0.5, y: 0.5, z: 0.5});

        sphere.center[prop] = -1.5;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(false);
        sphere.center[prop] = -1.0;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(true);
        sphere.center[prop] = -0.5;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(true);
        sphere.center[prop] = 0.0;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(true);
        sphere.center[prop] = 0.5;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(true);
        sphere.center[prop] = 1.0;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(true);
        sphere.center[prop] = 1.5;
        expect(Collision.intersectsSphereBox(sphere, box)).toBe(false);
      });
    });

    it("intersectsBoxPlane", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var box = new Box({ x: -0.5, y: -0.5, z: -0.5}, { x: 0.5, y: 0.5, z: 0.5});
        var plane = { x: 0, y: 0, z: 0, w: 0};
        plane[prop] = 1;
        plane.w = -1;
        expect(Collision.intersectsBoxPlane(box, plane)).toBe(false);
        plane.w = -0.5;
        expect(Collision.intersectsBoxPlane(box, plane)).toBe(true);
        plane.w = 0;
        expect(Collision.intersectsBoxPlane(box, plane)).toBe(true);
        plane.w = 0.5;
        expect(Collision.intersectsBoxPlane(box, plane)).toBe(true);
        plane.w = 1;
        expect(Collision.intersectsBoxPlane(box, plane)).toBe(false);
      });
    });

    it("intersectsBoxBox", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var box1 = new Box({ x: -0.5, y: -0.5, z: -0.5}, { x: 0.5, y: 0.5, z: 0.5});
        var box2 = new Box({ x: -0.5, y: -0.5, z: -0.5}, { x: 0.5, y: 0.5, z: 0.5});

        box2.min[prop] -= 1.5;
        box2.max[prop] -= 1.5;
        expect(Collision.intersectsBoxBox(box1, box2)).toBe(false);
        box2.min[prop] += 0.5;
        box2.max[prop] += 0.5;
        expect(Collision.intersectsBoxBox(box1, box2)).toBe(true);
        box2.min[prop] += 0.5;
        box2.max[prop] += 0.5;
        expect(Collision.intersectsBoxBox(box1, box2)).toBe(true);
        box2.min[prop] += 1.0;
        box2.max[prop] += 1.0;
        expect(Collision.intersectsBoxBox(box1, box2)).toBe(true);
        box2.min[prop] += 0.5;
        box2.max[prop] += 0.5;
        expect(Collision.intersectsBoxBox(box1, box2)).toBe(true);
        box2.min[prop] += 0.5;
        box2.max[prop] += 0.5;
        expect(Collision.intersectsBoxBox(box1, box2)).toBe(false);
      });
    });

    it("boxContainsBox", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var box1 = new Box({ x: -0.5, y: -0.5, z: -0.5}, { x: 0.5, y: 0.5, z: 0.5});
        var box2 = new Box({ x: -0.25, y: -0.25, z: -0.25}, { x: 0.25, y: 0.25, z: 0.25});

        box2.min[prop] -= 1.0;
        box2.max[prop] -= 1.0;
        expect(Collision.boxContainsBox(box1, box2)).toBe(0);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(1);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(1);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(2);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(2);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(2);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(1);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(1);
        box2.min[prop] += 0.25;
        box2.max[prop] += 0.25;
        expect(Collision.boxContainsBox(box1, box2)).toBe(0);
      });
    });
    it("boxContainsSphere", function(){
      ['x', 'y', 'z'].forEach(function(prop){
        var sphere = new Sphere({ x: 0, y: 0, z: 0}, 0.25);
        var box = new Box({ x: -0.5, y: -0.5, z: -0.5}, { x: 0.5, y: 0.5, z: 0.5});

        sphere.center[prop] = -1.0;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(0);
        sphere.center[prop] = -0.75;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(1);
        sphere.center[prop] = -0.5;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(1);
        sphere.center[prop] = 0.0;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(2);
        sphere.center[prop] = 0.5;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(1);
        sphere.center[prop] = 0.75;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(1);
        sphere.center[prop] = 1.0;
        expect(Collision.boxContainsSphere(box, sphere)).toBe(0)
      });
    });
  });
  
}());
