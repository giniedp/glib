import { IVec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface } from './buildParametricSurface'

export const BuildDiscDefaults = {
  radius: 1,
  innerRadius: 0,
  radialSegments: 32,
  ringSegments: 1,
  startAngle: 0,
  endAngle: Math.PI * 2,
  invert: false,
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
  startAngle?: number

  /**
   * End angle in radians.
   * @default Math.PI * 2
   */
  endAngle?: number

  /**
   * Inverts winding order and normals, creating a disc facing downwards.
   * @default false
   */
  invert?: boolean
}

export function discGeometry(device: Device, options?: BuildDiscOptions & BuildGeometryOptions): Geometry {
  const fn = options?.primitiveType === 'LineList' ? buildDiscLines : buildDisc
  return buildGeometry(device, fn, {
    name: 'disc',
    ...(options || {}),
  })
}
export function discGeometryLines(device: Device, options?: BuildDiscOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildDiscLines, {
    name: 'disc',
    ...(options || {}),
    primitiveType: 'LineList',
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
  const startAngle = options?.startAngle ?? BuildDiscDefaults.startAngle
  const endAngle = options?.endAngle ?? BuildDiscDefaults.endAngle
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  buildParametricSurface(builder, {
    position: (u, v) => ({
      x: v * Math.cos(u) + ox,
      y: oy,
      z: v * Math.sin(u) + oz,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uStart: startAngle,
    uEnd: endAngle,
    uSegments: radialSegments,
    vStart: innerRadius,
    vEnd: radius,
    vSegments: ringSegments,
    invert: options?.invert ?? BuildDiscDefaults.invert,
  })
}

/**
 * Builds a disc or ring shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildDiscLines(builder: GeometryBuilder, options?: BuildDiscOptions) {
  const radius = options?.radius ?? BuildDiscDefaults.radius
  const innerRadius = options?.innerRadius ?? BuildDiscDefaults.innerRadius
  const radialSegments = options?.radialSegments ?? BuildDiscDefaults.radialSegments
  const ringSegments = options?.ringSegments ?? BuildDiscDefaults.ringSegments
  const startAngle = options?.startAngle ?? BuildDiscDefaults.startAngle
  const endAngle = options?.endAngle ?? BuildDiscDefaults.endAngle
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  buildParametricLines(builder, {
    position: (u, v) => ({
      x: v * Math.cos(u) + ox,
      y: oy,
      z: v * Math.sin(u) + oz,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uStart: startAngle,
    uEnd: endAngle,
    uSegments: radialSegments,
    vStart: innerRadius,
    vEnd: radius,
    vSegments: ringSegments,
    invert: options?.invert ?? BuildDiscDefaults.invert,
  })
}
