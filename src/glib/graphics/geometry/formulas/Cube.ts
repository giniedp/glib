module Glib.Graphics.Geometry.Formulas {

  import Vec2 = Vlib.Vec2;
  import Vec3 = Vlib.Vec3;
  import Vec4 = Vlib.Vec4;
  import Mat4 = Vlib.Mat4;

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Cube(builder:Builder, options:{
    size?:number,
    steps?:number
  } = {}) {
    var size = withDefault(options.size, 1);
    var steps = withDefault(options.steps, 1);
    var transform = builder.transform.clone();
    var halfUp = Mat4.createTranslation(0, size * 0.5, 0);

    // top plane
    builder.transform = Mat4.multiplyChain(
      halfUp,
      transform
    );
    builder.append("Plane", {size: size, steps: steps});

    // bottom plane
    builder.transform = Mat4.multiplyChain(
      halfUp,
      Mat4.createRotationZ(Math.PI),
      transform
    );
    builder.append("Plane", {size: size, steps: steps});

    // back plane
    builder.transform = Mat4.multiplyChain(
      halfUp,
      Mat4.createRotationX(Math.PI * 0.5),
      transform
    );
    builder.append("Plane", {size: size, steps: steps});

    // right plane
    builder.transform = Mat4.multiplyChain(
      halfUp,
      Mat4.createRotationX(Math.PI * 0.5),
      Mat4.createRotationY(Math.PI * 0.5),
      transform
    );
    builder.append("Plane", {size: size, steps: steps});

    // front plane
    builder.transform = Mat4.multiplyChain(
      halfUp,
      Mat4.createRotationX(Math.PI * 0.5),
      Mat4.createRotationY(Math.PI),
      transform
    );
    builder.append("Plane", {size: size, steps: steps});

    // left plane
    builder.transform = Mat4.multiplyChain(
      halfUp,
      Mat4.createRotationX(Math.PI * 0.5),
      Mat4.createRotationY(Math.PI * 1.5),
      transform
    );
    builder.append("Plane", {size: size, steps: steps});

    builder.transform = transform;
  }
}
