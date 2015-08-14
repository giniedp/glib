module Glib.MeshTools.Formulas {

  import valueOrDefault = Glib.utils.valueOrDefault;
  import Vec2 = Vlib.Vec2;
  import Vec3 = Vlib.Vec3;
  import Vec4 = Vlib.Vec4;
  import Mat4 = Vlib.Mat4;

  export function Sphere(builder:Builder, options:{
    diameter?:number,
    steps?:number
  } = {}) {
    var diameter = valueOrDefault(options.diameter, 1);
    var steps = valueOrDefault(options.steps, 8);

    var baseVertex = builder.vertexCount;
    var stepsV = steps;
    var stepsH = steps * 2;
    var radius = diameter * 0.5;
    var i, j, z, x;
    for (i = 0; i <= stepsV; i += 1) {
      var di = i / stepsV;
      var latitude = di * Math.PI - (Math.PI / 2);

      var dy = Math.sin(latitude);
      var dxz = Math.cos(latitude);

      for (j = 0; j <= stepsH; j += 1) {
        var dj = j / stepsH;
        var longitude = dj * Math.PI * 2;

        var dx = Math.cos(longitude) * dxz;
        var dz = Math.sin(longitude) * dxz;

        var normal = Vec3.create(dx, dy, dz);
        var texCoord = Vec2.create(dj, (1.0 - di));// * diameter;

        builder.addVertex({
          position: Vec3.multiplyScalar(normal, radius),
          normal: normal,
          texture: texCoord
        });
      }
    }
    for (z = 0; z < stepsV; z += 1) {
      for (x = 0; x < stepsH; x += 1) {
        var a = x + z * (stepsH + 1);
        var b = a + 1;
        var c = x + (z + 1) * (stepsH + 1);
        var d = c + 1;

        builder.addIndex(baseVertex + a);
        builder.addIndex(baseVertex + b);
        builder.addIndex(baseVertex + c);

        builder.addIndex(baseVertex + c);
        builder.addIndex(baseVertex + b);
        builder.addIndex(baseVertex + d);
      }
    }
  }
}
