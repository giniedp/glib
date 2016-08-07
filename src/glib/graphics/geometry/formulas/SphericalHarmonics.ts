module Glib.Graphics.Geometry.Formulas {

  import Vec2 = Glib.Vec2;
  import Vec3 = Glib.Vec3;
  import Vec4 = Glib.Vec4;
  import Mat4 = Glib.Mat4;

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  /**
   * implementation is based on http://paulbourke.net/geometry/sphericalh/
   * @param builder
   * @param options
   * @constructor
   */
  export function SphericalHarmonics(builder:Builder, options:{
    diameter?:number
    radius?:number
    steps?:number
    parameters?:number[]
  } = {}) {
    var radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5);
    var steps = withDefault(options.steps, 16);
    var params = withDefault(options.parameters, []);

    var baseVertex = builder.vertexCount;
    var stepsV = steps;
    var stepsU = steps * 2;

    for (var v = 0; v <= stepsV; v += 1) {
      var dv = v / stepsV;
      var phi = dv * Math.PI;// - Math.PI / 2;

      for (var u = 0; u <= stepsU; u += 1) {
        var du = u / stepsU;
        var theta = du * Math.PI * 2;// - Math.PI;

        var scale = 0;
        scale += Math.pow(Math.sin((params[0]|0) * phi), params[1]|0);
        scale += Math.pow(Math.cos((params[2]|0) * phi), params[3]|0);
        scale += Math.pow(Math.sin((params[4]|0) * theta), params[5]|0);
        scale += Math.pow(Math.cos((params[6]|0) * theta), params[7]|0);
        scale *= 0.25;

        var x = scale * Math.sin(phi) * Math.cos(theta);
        var y = scale * Math.sin(phi) * Math.sin(theta);
        var z = scale * Math.cos(phi);

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
