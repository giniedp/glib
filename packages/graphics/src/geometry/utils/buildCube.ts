import { BoundingBox, Mat4 } from '@gglib/math'
import { Color } from '../../Color'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { beginGeometry, buildGeometry, BuildGeometryOptions, type GeometryBuilder } from '../GeometryBuilder'
import { buildLines } from './buildLines'
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

export function cubeGeometry(device: Device, options?: BuildCubeOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildCube, options)
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
  transform.initTranslationXYZ(0, halfSize, 0)
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

export function cubeLinesGeometry(device: Device, options?: BuildCubeLinesOptions): Geometry {
  return beginGeometry().append(buildCubeLines, options).endGeometry(device, {
    name: 'cube',
    primitiveType: 'LineList',
  })
}

/**
 * Options for the {@link buildCubeLines} function
 *
 * @public
 */
export interface BuildCubeLinesOptions {
  /**
   * The uniform size (width, height, depth) of the cube
   * @remarks
   * defaults to 1
   */
  size?: number
  /**
   * The lines color
   */
  color?: Color
}

/**
 * Builds a cube lines shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCubeLines(builder: GeometryBuilder, options?: BuildCubeLinesOptions) {
  const s = (options?.size ?? BuildCubeDefaults.size) * 0.5
  builder.append(buildLines, {
    // prettier-ignore
    lines: [
      [[-s, -s, -s], [ s, -s, -s]],
      [[ s, -s, -s], [ s,  s, -s]],
      [[ s,  s, -s], [-s,  s, -s]],
      [[-s,  s, -s], [-s, -s, -s]],

      [[-s, -s,  s], [ s, -s,  s]],
      [[ s, -s,  s], [ s,  s,  s]],
      [[ s,  s,  s], [-s,  s,  s]],
      [[-s,  s,  s], [-s, -s,  s]],

      [[-s, -s, -s], [-s, -s,  s]],
      [[ s, -s, -s], [ s, -s,  s]],
      [[ s,  s, -s], [ s,  s,  s]],
      [[-s,  s, -s], [-s,  s,  s]],
    ],
    color: options?.color,
  })
}

export function boxLinesGeometry(device: Device, options?: BuildBoxLinesOptions): Geometry {
  return beginGeometry().append(buildBoxLines, options).endGeometry(device, {
    name: 'box',
    primitiveType: 'LineList',
  })
}

export interface BuildBoxLinesOptions {
  box: BoundingBox
  color?: Color
}

/**
 * Builds a cube lines shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildBoxLines(builder: GeometryBuilder, options?: BuildBoxLinesOptions) {
  const box = options?.box ?? BoundingBox.create(-1, -1, -1, 1, 1, 1)

  builder.append(buildLines, {
    // prettier-ignore
    lines: [
      [box.getCorner(0), box.getCorner(1)],
      [box.getCorner(2), box.getCorner(3)],
      [box.getCorner(0), box.getCorner(2)],
      [box.getCorner(1), box.getCorner(3)],

      [box.getCorner(4 + 0), box.getCorner(4 + 1)],
      [box.getCorner(4 + 2), box.getCorner(4 + 3)],
      [box.getCorner(4 + 0), box.getCorner(4 + 2)],
      [box.getCorner(4 + 1), box.getCorner(4 + 3)],

      [box.getCorner(0), box.getCorner(4 + 0)],
      [box.getCorner(1), box.getCorner(4 + 1)],
      [box.getCorner(2), box.getCorner(4 + 2)],
      [box.getCorner(3), box.getCorner(4 + 3)],
    ],
    color: options?.color,
  })
}
