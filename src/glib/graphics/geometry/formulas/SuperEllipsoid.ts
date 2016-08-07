module Glib.Graphics.Geometry.Formulas {

  import Vec2 = Glib.Vec2;
  import Vec3 = Glib.Vec3;
  import Vec4 = Glib.Vec4;
  import Mat4 = Glib.Mat4;

  function sign(a) {
    return a < 0 ? -1 : 1;
  }

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  /**
   * implementation is based on http://paulbourke.net/geometry/superellipse/
   * @param builder
   * @param options
   * @constructor
   */
  export function SuperEllipsoid(builder:Builder, options:{
    diameter?:number
    radius?:number
    steps?:number
    n1?:number
    n2?:number
  } = {}) {
    var radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5);
    var steps = withDefault(options.steps, 16);
    var power1 = withDefault(options.n1, 1);
    var power2 = withDefault(options.n2, 1);

    var baseVertex = builder.vertexCount;
    var stepsV = steps;
    var stepsU = steps * 2;

    for (var v = 0; v <= stepsV; v += 1) {
      var dv = v / stepsV;
      var phi = dv * Math.PI - Math.PI / 2;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      for (var u = 0; u <= stepsU; u += 1) {
        var du = u / stepsU;
        var theta = du * Math.PI * 2 - Math.PI;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        var tmp = sign(cosPhi) * Math.pow(Math.abs(cosPhi), power1);
        var x = tmp * sign(cosTheta) * Math.pow(Math.abs(cosTheta), power2);
        var z = tmp * sign(sinTheta) * Math.pow(Math.abs(sinTheta), power2);
        var y = sign(sinPhi) * Math.pow(Math.abs(sinPhi), power1);

        var normal = Vec3.create(x, y, z);
        var texCoord = Vec2.new(du, dv);

        builder.addVertex({
          position: Vec3.multiplyScalar(normal, radius),
          normal: normal.selfNormalize(),
          texture: texCoord
        });
      }
    }
    for (var z = 0; z < stepsV; z += 1) {
      for (var x = 0; x < stepsU; x += 1) {
        var a = x + z * (stepsU + 1);
        var b = a + 1;
        var c = x + (z + 1) * (stepsU + 1);
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
