import { IVec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface } from './buildParametricSurface'

export const BuildPlaneDefaults = {
  size: 1,
  segments: 1,
}

/**
 * Options for the {@link buildPlane} function
 *
 * @public
 */
export interface BuildPlaneOptions {
  /**
   * Uniform size along both axes.
   * Overridden per-axis by `width` and `depth`.
   * @default 1
   */
  size?: number

  /**
   * Size along the X axis.
   * @default size
   */
  width?: number

  /**
   * Size along the Z axis.
   * @default size
   */
  depth?: number

  /**
   * Uniform subdivision along both axes.
   * Overridden per-axis by `widthSegments` and `depthSegments`.
   * @default 1
   */
  segments?: number

  /**
   * Subdivisions along the X axis.
   * @default segments
   */
  widthSegments?: number

  /**
   * Subdivisions along the Z axis.
   * @default segments
   */
  depthSegments?: number

  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * Inverts winding order and normals, creating a plane facing downwards.
   * @default false
   */
  invert?: boolean
}

export function planeGeometry(device: Device, options?: BuildPlaneOptions & BuildGeometryOptions): Geometry {
  const fn = options?.primitiveType === 'LineList' ? buildPlaneLines : buildPlane
  return buildGeometry(device, fn, {
    name: 'Plane',
    ...options,
  })
}

export function planeLinesGeometry(device: Device, options?: BuildPlaneOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildPlaneLines, {
    name: 'Plane Lines',
    ...options,
    primitiveType: 'LineList',
  })
}

/**
 * Builds a plane shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildPlane(builder: GeometryBuilder, options?: BuildPlaneOptions) {
  const size = options?.size ?? BuildPlaneDefaults.size
  const segments = options?.segments ?? BuildPlaneDefaults.segments
  const width = options?.width ?? size
  const depth = options?.depth ?? size
  const widthSegments = options?.widthSegments ?? segments
  const depthSegments = options?.depthSegments ?? segments
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  buildParametricSurface(builder, {
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy,
      z: oz + (v - 0.5) * depth,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uSegments: widthSegments,
    vSegments: depthSegments,
    invert: !!options?.invert,
  })
}

/**
 * Builds a cube lines shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildPlaneLines(builder: GeometryBuilder, options?: BuildPlaneOptions) {
  const size = options?.size ?? BuildPlaneDefaults.size
  const segments = options?.segments ?? BuildPlaneDefaults.segments
  const width = options?.width ?? size
  const depth = options?.depth ?? size
  const widthSegments = options?.widthSegments ?? segments
  const depthSegments = options?.depthSegments ?? segments
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  buildParametricLines(builder, {
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy,
      z: oz + (v - 0.5) * depth,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uSegments: widthSegments,
    vSegments: depthSegments,
    invert: !!options?.invert,
  })
}
