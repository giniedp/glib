module Glib.Graphics.Geometry.Formulas {

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Sphere(builder:Builder, options:{
    diameter?: number
    radius?: number
    steps?: number
  } = {}) {
    let radius = withDefault(options.radius, withDefault(options.diameter, 1) * 0.5);
    let steps = withDefault(options.steps, 16);

    let baseVertex = builder.vertexCount;
    let stepsV = steps;
    let stepsH = steps * 2;

    for (let v = 0; v <= stepsV; v += 1) {
      let dv = v / stepsV;
      let phi = dv * Math.PI - Math.PI / 2;

      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);

      for (let u = 0; u <= stepsH; u += 1) {
        let du = u / stepsH;
        let theta = du * Math.PI * 2;

        let x = Math.cos(theta) * cosPhi;
        let z = Math.sin(theta) * cosPhi;
        let y = sinPhi;

        let normal = Vec3.create(x, y, z);
        let texCoord = Vec2.new(du, dv);

        builder.addVertex({
          position: Vec3.multiplyScalar(normal, radius),
          normal: normal,
          texture: texCoord
        });
      }
    }
    for (let z = 0; z < stepsV; z += 1) {
      for (let x = 0; x < stepsH; x += 1) {
        let a = x + z * (stepsH + 1);
        let b = a + 1;
        let c = x + (z + 1) * (stepsH + 1);
        let d = c + 1;

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
