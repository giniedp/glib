import { IVec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface, resolveLines } from './buildParametricSurface'

export const BuildDiscDefaults = {
  radius: 1,
  innerRadius: 0,
  radialSegments: 32,
  ringSegments: 1,
  angleStart: 0,
  angleSweep: Math.PI * 2,
}

/**
 * Options for the {@link buildDisc} function
 *
 * @public
 */
export interface BuildDiscOptions {
  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * Outer radius of the disc.
   * @default 1
   */
  radius?: number

  /**
   * Inner radius, creating a ring when greater than zero.
   * @default 0
   */
  innerRadius?: number

  /**
   * Number of subdivisions around the circumference.
   * @default 32
   */
  radialSegments?: number

  /**
   * Number of subdivisions between the inner and outer radius.
   * @default 1
   */
  ringSegments?: number

  /**
   * Start angle in radians.
   * @default 0
   */
  angleStart?: number

  /**
   * End angle in radians.
   * @default Math.PI * 2
   */
  angleSweep?: number

  /**
   * Inverts winding order and normals, creating a disc facing downwards.
   * @default false
   */
  invert?: boolean

  /**
   * When `true`, builds a wireframe line mesh instead of a solid surface.
   * @default false
   */
  lines?: boolean
}

export function discGeometry(device: Device, options?: BuildDiscOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildDisc, {
    name: 'Disc',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds a disc or ring shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildDisc(builder: GeometryBuilder, options?: BuildDiscOptions) {
  const radius = options?.radius ?? BuildDiscDefaults.radius
  const innerRadius = options?.innerRadius ?? BuildDiscDefaults.innerRadius
  const radialSegments = options?.radialSegments ?? BuildDiscDefaults.radialSegments
  const ringSegments = options?.ringSegments ?? BuildDiscDefaults.ringSegments
  const angleStart = options?.angleStart ?? BuildDiscDefaults.angleStart
  const angleSweep = options?.angleSweep ?? BuildDiscDefaults.angleSweep
  const angleEnd = angleStart + angleSweep
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  const surface = options?.lines ? buildParametricLines : buildParametricSurface

  surface(builder, {
    position: (u, v) => ({
      x: v * Math.cos(u) + ox,
      y: oy,
      z: v * Math.sin(u) + oz,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uStart: angleEnd,
    uEnd: angleStart,
    uSegments: radialSegments,
    vStart: innerRadius,
    vEnd: radius,
    vSegments: ringSegments,
    invert: !!options?.invert,
  })
}
