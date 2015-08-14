module Glib.MeshTools.Formulas {

  import valueOrDefault = Glib.utils.valueOrDefault;
  import Vec2 = Vlib.Vec2;
  import Vec3 = Vlib.Vec3;
  import Vec4 = Vlib.Vec4;
  import Mat4 = Vlib.Mat4;

  function circleVector(position, total, out) {
    out = out || new Vec3();
    var angle = position * Math.PI * 2 / total;
    var dx = Math.cos(angle);
    var dz = Math.sin(angle);
    return out.init(dx, 0, dz);
  }

  export function Cone(builder:Builder, options:{
    height?:number,
    steps?:number,
    upperDiameter?:number,
    lowerDiameter?:number
  } = {}) {
    var height = valueOrDefault(options.height, 2);
    var steps = valueOrDefault(options.steps, 8);
    var upperDiameter = valueOrDefault(options.upperDiameter, 0);
    var lowerDiameter = valueOrDefault(options.lowerDiameter, 2);

    var stepsH = 2;
    var stepsV = steps;
    var radiusUp = upperDiameter * 0.5;
    var radiusLo = lowerDiameter * 0.5;
    var baseVertex = builder.vertexCount;
    var x, y, t;
    var position = Vec3.zero();
    var texture = Vec2.zero();

    for (y = 0; y <= stepsH; y += 1) {
      for (x = 0; x <= stepsV; x += 1) {
        t = y / stepsH;

        circleVector(x, stepsV, position);
        position.selfMultiplyScalar(radiusUp * t + radiusLo * (1 - t));
        position.y = t * height;

        builder.addVertex({
          position: position,
          texture: texture.init(x / stepsV, y / stepsH)
        });
      }
    }

    var a, b, c, d;
    for (y = 0; y < stepsH; y += 1) {
      for (x = 0; x < stepsV; x += 1) {
        a = x + y * (stepsV + 1);
        b = a + 1;
        c = x + (y + 1) * (stepsV + 1);
        d = c + 1;

        builder.addIndex(baseVertex + a);
        builder.addIndex(baseVertex + b);
        builder.addIndex(baseVertex + c);

        builder.addIndex(baseVertex + c);
        builder.addIndex(baseVertex + b);
        builder.addIndex(baseVertex + d);
      }
    }

    // Create flat triangle fan caps to seal the top and bottom.
    builder.append("Cap", {
      diameter: lowerDiameter,
      steps: steps
    });

    var transform = builder.transform;
    builder.transform = Mat4.multiplyChain(
      Mat4.createRotationX(Math.PI),
      Mat4.createTranslation(0, height, 0),
      transform
    );

    builder.append("Cap", {
      diameter: upperDiameter,
      steps: steps
    });
    builder.transform = transform;
  }
}
