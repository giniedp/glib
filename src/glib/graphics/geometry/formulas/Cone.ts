module Glib.Graphics.Geometry.Formulas {

  function circleVector(position, total, out) {
    out = out || new Vec3();
    let angle = position * Math.PI * 2 / total;
    let dx = Math.cos(angle);
    let dz = Math.sin(angle);
    return out.init(dx, 0, dz);
  }

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Cone(builder:Builder, options:{
    height?: number
    steps?: number
    topDiameter?: number
    topRadius?: number
    bottomDiameter?: number
    bottomRadius?: number
  } = {}) {
    let height = withDefault(options.height, 2)
    let steps = withDefault(options.steps, 8)
    let radiusUp = withDefault(options.topRadius, withDefault(options.topDiameter, 1) * 0.5)
    let radiusLo = withDefault(options.bottomRadius, withDefault(options.bottomDiameter, 1) * 0.5)

    let stepsH = 2
    let stepsV = steps
    let invStepsH = 1 / stepsH
    let invStepsV = 1 / steps
    let baseVertex = builder.vertexCount
    let x, y, t
    let position = Vec3.zero()
    let texture = Vec2.zero()

    for (y = 0; y <= stepsH; y += 1) {
      for (x = 0; x <= stepsV; x += 1) {
        t = y * invStepsH;

        circleVector(x, stepsV, position)
        position.multiplyScalar(radiusUp * t + radiusLo * (1 - t))
        position.y = t * height

        builder.addVertex({
          position: position,
          texture: texture.init(x * invStepsV, y * invStepsH)
        })
      }
    }

    let a, b, c, d;
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
      radius: radiusLo,
      steps: steps
    });

    let transform = Mat4.multiplyChain(
      Mat4.createRotationX(Math.PI),
      Mat4.createTranslation(0, height, 0)
    );
    let tId = builder.beginTransform(transform)
    builder.append("Cap", {
      radius: radiusUp,
      steps: steps
    });
    builder.endTransform(tId)
  }
}
