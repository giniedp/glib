import { Mat4 } from '@gglib/math'
import { ModelBuilder } from '../ModelBuilder'
import { buildPlane } from './buildPlane'
import { formulas } from './formulas'

function withDefault(opt: any, value: any) {
  return opt == null ? value : opt
}

export interface BuildCubeOptions {
  /**
   * The uniform size (width, height, depth) of the cube
   * @remarks
   * defaults to 1
   */
  size?: number,
  /**
   * The tesselation factor for each face
   */
  tesselation?: number,
}

/**
 * @public
 */
export function buildCube(builder: ModelBuilder, options: BuildCubeOptions = {}) {
  let size = withDefault(options.size, 1)
  let halfSize = size * 0.5
  let halfPi = Math.PI * 0.5
  let steps = withDefault(options.tesselation, 1)
  let halfUp = Mat4.createTranslation(0, size * 0.5, 0)
  let transform = Mat4.createIdentity()
  let tId: number

  // top plane
  transform.initTranslation(0, halfSize, 0)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, tesselation: steps})
  builder.endTransform(tId)

  // bottom plane
  transform.initYawPitchRoll(0, 0, Math.PI).setTranslationY(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, tesselation: steps})
  builder.endTransform(tId)

  // front plane
  transform.initYawPitchRoll(0, halfPi, 0).setTranslationZ(halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, tesselation: steps})
  builder.endTransform(tId)

  // right plane
  transform.initYawPitchRoll(halfPi, halfPi, 0).setTranslationX(halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, tesselation: steps})
  builder.endTransform(tId)

  // back plane
  transform.initYawPitchRoll(Math.PI, halfPi, 0).setTranslationZ(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, tesselation: steps})
  builder.endTransform(tId)

  // left plane
  transform.initYawPitchRoll(3 * halfPi, halfPi, 0).setTranslationX(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, {size: size, tesselation: steps})
  builder.endTransform(tId)
}

formulas['Cube'] = buildCube
