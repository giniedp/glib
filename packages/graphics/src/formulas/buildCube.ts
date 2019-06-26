import { Mat4 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import { ModelBuilder } from '../ModelBuilder'
import { buildPlane } from './buildPlane'

/**
 * Options for the {@link buildCube} function
 *
 * @public
 */
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
 * Builds a cube shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildCube(builder: ModelBuilder, options: BuildCubeOptions = {}) {
  const size = getOption(options, 'size', 1)
  const halfSize = size * 0.5
  const halfPi = Math.PI * 0.5
  const steps = getOption(options, 'tesselation', 1)
  const halfUp = Mat4.createTranslation(0, size * 0.5, 0)
  const transform = Mat4.createIdentity()
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
