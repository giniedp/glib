import { Mat4, Vec2, Vec3 } from '@glib/math'
import { ModelBuilder } from '../ModelBuilder'
import { buildPlane } from './buildPlane'
function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export function buildCube(builder: ModelBuilder, options: {
  size?: number,
  steps?: number,
} = {}) {
  let size = withDefault(options.size, 1)
  let halfSize = size * 0.5
  let halfPi = Math.PI * 0.5
  let steps = withDefault(options.steps, 1)
  let halfUp = Mat4.createTranslation(0, size * 0.5, 0)
  let transform = Mat4.identity()
  let tId: number

  // top plane
  transform.initTranslation(0, halfSize, 0)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, steps: steps})
  builder.endTransform(tId)

  // bottom plane
  transform.initYawPitchRoll(0, 0, Math.PI).setTranslationY(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, steps: steps})
  builder.endTransform(tId)

  // front plane
  transform.initYawPitchRoll(0, halfPi, 0).setTranslationZ(halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, steps: steps})
  builder.endTransform(tId)

  // right plane
  transform.initYawPitchRoll(halfPi, halfPi, 0).setTranslationX(halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, steps: steps})
  builder.endTransform(tId)

  // back plane
  transform.initYawPitchRoll(Math.PI, halfPi, 0).setTranslationZ(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, steps: steps})
  builder.endTransform(tId)

  // left plane
  transform.initYawPitchRoll(3 * halfPi, halfPi, 0).setTranslationX(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, steps: steps})
  builder.endTransform(tId)
}

ModelBuilder.formulas['Cube'] = buildCube
