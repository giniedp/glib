module Glib.MeshTools.Formulas {

  import Vec2 = Vlib.Vec2;
  import Vec3 = Vlib.Vec3;
  import Vec4 = Vlib.Vec4;
  import Mat4 = Vlib.Mat4;

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Plane(builder:Builder, options:{
    size?:number,
    steps?:number
  } = {}) {
    var size = withDefault(options.size, 2);
    var vertices = withDefault(options.steps, 1) + 1;

    var baseVertex = builder.vertexCount;
    var x, z, pos = Vec3.zero(), uv = Vec2.zero();

    for (z = 0; z <= vertices; z += 1) {
      for (x = 0; x <= vertices; x += 1) {
        builder.addVertex({
          position: pos.init(x / vertices - 0.5, 0, z / vertices - 0.5).selfMultiplyScalar(size),
          texture: uv.init(x / vertices, z / vertices)
        });
      }
    }

    for (z = 0; z < vertices; z += 1) {
      for (x = 0; x < vertices; x += 1) {
        var a = x + z * (vertices + 1);
        var b = a + 1;
        var c = x + (z + 1) * (vertices + 1);
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
