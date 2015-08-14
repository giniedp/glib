module Glib.MeshTools.Formulas {

  import Vec2 = Vlib.Vec2;
  import Vec3 = Vlib.Vec3;
  import Vec4 = Vlib.Vec4;

  function circleVector(t, out) {
    out = out || new Vec3();
    var angle = t * Math.PI * 2;
    var dx = Math.cos(angle);
    var dz = Math.sin(angle);
    return out.init(dx, 0, dz);
  }

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Cap(builder:Builder, options:{
    diameter?:number,
    steps?:number
  } = {}) {
    var diameter = withDefault(options.diameter, 2);
    var steps = withDefault(options.steps, 8);
    var radius = diameter * 0.5;
    var baseVertex = builder.vertexCount;
    var position = Vec3.zero(), texture = Vec2.zero();

    for (var step = 0; step <= steps; step += 1) {
      circleVector(step / steps, position);
      texture.init(position.x, position.z);
      position.selfMultiplyScalar(radius);

      builder.addVertex({
        position: position,
        texture: texture
      });
    }

    for (step = 0; step < steps - 1; step += 1) {
      builder.addIndex(baseVertex);
      builder.addIndex(baseVertex + step + 2);
      builder.addIndex(baseVertex + step + 1);
    }
  }
}
