import { Mat4 } from '@gglib/math'
import { Device } from '../Device'
import { Geometry } from '../model'
import { beginGeometry, type GeometryBuilder } from '../model/GeometryBuilder'
import { buildPlane } from './buildPlane'

export const BuildCubeDefaults = {
  size: 1,
  tesselation: 1,
}

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
  size?: number
  /**
   * The tesselation factor for each face
   */
  tesselation?: number
}

export function cubeGeometry(device: Device, options?: BuildCubeOptions): Geometry {
  return beginGeometry().append(buildCube, options).endGeometry(device, {
    name: 'cube',
  })
}

/**
 * Builds a cube shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCube(builder: GeometryBuilder, options?: BuildCubeOptions) {
  const steps = options?.tesselation ?? BuildCubeDefaults.tesselation
  const size = options?.size ?? BuildCubeDefaults.size
  const halfSize = size * 0.5
  const halfPi = Math.PI * 0.5
  const transform = Mat4.createIdentity()
  let tId: number

  // top plane
  transform.initTranslation(0, halfSize, 0)
  tId = builder.beginTransform(transform)
  buildPlane(builder, { size: size, tesselation: steps })
  builder.endTransform(tId)

  // bottom plane
  transform.initYawPitchRoll(0, 0, Math.PI).setTranslationY(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, { size: size, tesselation: steps })
  builder.endTransform(tId)

  // front plane
  transform.initYawPitchRoll(0, halfPi, 0).setTranslationZ(halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, { size: size, tesselation: steps })
  builder.endTransform(tId)

  // right plane
  transform.initYawPitchRoll(halfPi, halfPi, 0).setTranslationX(halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, { size: size, tesselation: steps })
  builder.endTransform(tId)

  // back plane
  transform.initYawPitchRoll(Math.PI, halfPi, 0).setTranslationZ(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, { size: size, tesselation: steps })
  builder.endTransform(tId)

  // left plane
  transform.initYawPitchRoll(3 * halfPi, halfPi, 0).setTranslationX(-halfSize)
  tId = builder.beginTransform(transform)
  buildPlane(builder, { size: size, tesselation: steps })
  builder.endTransform(tId)
}
