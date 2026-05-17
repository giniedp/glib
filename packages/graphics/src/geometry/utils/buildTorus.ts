import { IVec3 } from '@gglib/math'
import { Device } from '../../Device'
import { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface, resolveLines } from './buildParametricSurface'

export const BuildTorusDefaults = {
  radius: 1,
  tubeRadius: 0.4,
  radialSegments: 32,
  tubularSegments: 32,
  angleStart: 0,
  angleSweep: Math.PI * 2,
  tubeAngleStart: 0,
  tubeAngleSweep: Math.PI * 2,
  invert: false,
}

/**
 * Options for the {@link buildTorus} function
 *
 * @public
 */
export interface BuildTorusOptions {
  /**
   * Distance from the center of the torus to the center of the tube.
   * @default 1
   */
  radius?: number

  /**
   * Radius of the tube.
   * @default 0.4
   */
  tubeRadius?: number

  /**
   * Number of subdivisions around the torus ring.
   * @default 32
   */
  radialSegments?: number

  /**
   * Number of subdivisions around the tube cross-section.
   * @default 32
   */
  tubularSegments?: number

  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * Start angle in radians.
   * @default 0
   */
  angleStart?: number

  /**
   * Angular sweep in radians.
   * @default Math.PI * 2
   */
  angleSweep?: number

  /**
   * Start angle in radians around the tube cross-section.
   * @default 0
   */
  tubeAngleStart?: number

  /**
   * Angular sweep in radians around the tube cross-section.
   * @default Math.PI * 2
   */
  tubeAngleSweep?: number

  /**
   * Inverts winding order and normals.
   * @default false
   */
  invert?: boolean

  /**
   * When `true`, builds a wireframe line mesh instead of a solid surface.
   * @default false
   */
  lines?: boolean
}

export function torusGeometry(device: Device, options?: BuildTorusOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildTorus, {
    name: 'Torus',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds a torus shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildTorus(builder: GeometryBuilder, options?: BuildTorusOptions) {
  const radius = options?.radius ?? BuildTorusDefaults.radius
  const tubeRadius = options?.tubeRadius ?? BuildTorusDefaults.tubeRadius
  const radialSegments = options?.radialSegments ?? BuildTorusDefaults.radialSegments
  const tubularSegments = options?.tubularSegments ?? BuildTorusDefaults.tubularSegments
  const angleStart = options?.angleStart ?? BuildTorusDefaults.angleStart
  const angleEnd = angleStart + (options?.angleSweep ?? BuildTorusDefaults.angleSweep)
  const tubeAngleStart = options?.tubeAngleStart ?? BuildTorusDefaults.tubeAngleStart
  const tubeAngleEnd = tubeAngleStart + (options?.tubeAngleSweep ?? BuildTorusDefaults.tubeAngleSweep)

  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0
  const surface = options?.lines ? buildParametricLines : buildParametricSurface

  surface(builder, {
    position: (phi, theta) => ({
      x: ox + (radius + tubeRadius * Math.cos(theta)) * Math.cos(phi),
      y: oy + tubeRadius * Math.sin(theta),
      z: oz + (radius + tubeRadius * Math.cos(theta)) * Math.sin(phi),
    }),
    normal: (phi, theta) => ({
      x: Math.cos(theta) * Math.cos(phi),
      y: Math.sin(theta),
      z: Math.cos(theta) * Math.sin(phi),
    }),
    uStart: angleStart,
    uEnd: angleEnd,
    uSegments: radialSegments,
    vStart: tubeAngleStart,
    vEnd: tubeAngleEnd,
    vSegments: tubularSegments,
    invert: options?.invert ?? BuildTorusDefaults.invert,
  })
}
