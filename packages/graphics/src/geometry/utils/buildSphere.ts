import { IVec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface, resolveLines } from './buildParametricSurface'

export const BuildSphereDefaults = {
  radius: 1,
  stacks: 16,
  slices: 32,
  angleStart: 0,
  angleSweep: Math.PI * 2,
  latitudeStart: 0,
  latitudeSweep: Math.PI,
  invert: false,
}

/**
 * Options for the {@link buildSphere} function
 *
 * @public
 */
export interface BuildSphereOptions {
  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * The sphere radius.
   * @default 1
   */
  radius?: number

  /**
   * Number of horizontal rings from pole to pole (latitude subdivisions).
   * Higher values produce a smoother silhouette along the vertical axis.
   * @default 16
   */
  stacks?: number

  /**
   * Number of vertical segments around the equator (longitude subdivisions).
   * Higher values produce a smoother silhouette around the circumference.
   * @default 32
   */
  slices?: number

  /**
   * Start angle in radians around the Y axis (longitude).
   * @default 0
   */
  angleStart?: number

  /**
   * End angle in radians around the Y axis (longitude).
   * @default Math.PI * 2
   */
  angleSweep?: number

  /**
   * Start latitude in radians, measured from the north pole.
   * @default 0
   */
  latitudeStart?: number

  /**
   * End latitude in radians, measured from the north pole.
   * Use `Math.PI * 0.5` for a hemisphere, `Math.PI` for a full sphere.
   * @default Math.PI
   */
  latitudeSweep?: number

  /**
   * Inverts winding order and normals, creating a sphere facing inwards.
   * @default false
   */
  invert?: boolean

  /**
   * When `true`, builds a wireframe line mesh instead of a solid surface.
   * @default false
   */
  lines?: boolean
}

export function sphereGeometry(device: Device, options?: BuildSphereOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildSphere, {
    name: 'Sphere',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds a sphere shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildSphere(builder: GeometryBuilder, options: BuildSphereOptions = {}) {
  const radius = options?.radius ?? BuildSphereDefaults.radius
  const stacks = options?.stacks ?? BuildSphereDefaults.stacks
  const slices = options?.slices ?? BuildSphereDefaults.slices
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  const angleStart = options?.angleStart ?? BuildSphereDefaults.angleStart
  const angleSweep = options?.angleSweep ?? BuildSphereDefaults.angleSweep
  const angleEnd = angleStart + angleSweep

  const latitudeStart = options?.latitudeStart ?? BuildSphereDefaults.latitudeStart
  const latitudeSweep = options?.latitudeSweep ?? BuildSphereDefaults.latitudeSweep
  const latitudeEnd = latitudeStart + latitudeSweep
  const surface = options?.lines ? buildParametricLines : buildParametricSurface
  surface(builder, {
    position: (phi, theta) => ({
      x: ox + radius * Math.sin(theta) * Math.sin(phi),
      y: oy + radius * Math.cos(theta),
      z: oz + radius * Math.sin(theta) * Math.cos(phi),
    }),
    normal: (phi, theta) => ({
      x: Math.sin(theta) * Math.sin(phi),
      y: Math.cos(theta),
      z: Math.sin(theta) * Math.cos(phi),
    }),
    uStart: angleStart,
    uEnd: angleEnd,
    uSegments: slices,
    vStart: latitudeStart,
    vEnd: latitudeEnd,
    vSegments: stacks,
    invert: options?.invert ?? BuildSphereDefaults.invert,
  })
}
