(function(){

  var Collision = Glib.Collision;
  var Ray = Glib.Ray;
  var Sphere = Glib.BoundingSphere;
  
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
  });
  
}());
