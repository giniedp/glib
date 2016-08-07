module Glib.Graphics.Geometry.Formulas {

  import Vec2 = Glib.Vec2;
  import Vec3 = Glib.Vec3;
  import Vec4 = Glib.Vec4;
  import Mat4 = Glib.Mat4;

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Sphere(builder:Builder, options:{
    diameter?:number
    radius?:number
    steps?:number
  } = {}) {
    var radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5);
    var steps = withDefault(options.steps, 16);

    var baseVertex = builder.vertexCount;
    var stepsV = steps;
    var stepsH = steps * 2;

    for (var v = 0; v <= stepsV; v += 1) {
      var dv = v / stepsV;
      var phi = dv * Math.PI - Math.PI / 2;

      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      for (var u = 0; u <= stepsH; u += 1) {
        var du = u / stepsH;
        var theta = du * Math.PI * 2;

        var x = Math.cos(theta) * cosPhi;
        var z = Math.sin(theta) * cosPhi;
        var y = sinPhi;

        var normal = Vec3.create(x, y, z);
        var texCoord = Vec2.new(du, dv);

        builder.addVertex({
          position: Vec3.multiplyScalar(normal, radius),
          normal: normal,
          texture: texCoord
        });
      }
    }
    for (var z = 0; z < stepsV; z += 1) {
      for (var x = 0; x < stepsH; x += 1) {
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
