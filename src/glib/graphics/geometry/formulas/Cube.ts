module Glib.Graphics.Geometry.Formulas {

  function withDefault(opt, value) {
    return opt == null ? value : opt;
  }

  export function Cube(builder:Builder, options:{
    size?:number,
    steps?:number
  } = {}) {
    var size = withDefault(options.size, 1)
    var halfSize = size * 0.5
    var halfPi = Math.PI * 0.5
    var steps = withDefault(options.steps, 1)
    var halfUp = Mat4.createTranslation(0, size * 0.5, 0)
    let transform = Mat4.identity()
    let tId:number
    
    // top plane
    transform.initTranslation(0, halfSize, 0)
    tId = builder.beginTransform(transform)
    builder.append("Plane", {size: size, steps: steps});
    builder.endTransform(tId)

    // bottom plane
    transform.initYawPitchRoll(0, 0, Math.PI).setTranslationY(-halfSize)
    tId = builder.beginTransform(transform)
    builder.append("Plane", {size: size, steps: steps})
    builder.endTransform(tId)

    // front plane
    transform.initYawPitchRoll(0, halfPi, 0).setTranslationZ(halfSize)
    tId = builder.beginTransform(transform)
    builder.append("Plane", {size: size, steps: steps})
    builder.endTransform(tId)

    // right plane
    transform.initYawPitchRoll(halfPi, halfPi, 0).setTranslationX(halfSize)
    tId = builder.beginTransform(transform)
    builder.append("Plane", {size: size, steps: steps})
    builder.endTransform(tId)

    // back plane
    transform.initYawPitchRoll(Math.PI, halfPi, 0).setTranslationZ(-halfSize)
    tId = builder.beginTransform(transform)
    builder.append("Plane", {size: size, steps: steps})
    builder.endTransform(tId)

    // left plane
    transform.initYawPitchRoll(3 * halfPi, halfPi, 0).setTranslationX(-halfSize)
    tId = builder.beginTransform(transform)
    builder.append("Plane", {size: size, steps: steps})
    builder.endTransform(tId)
  }
}
