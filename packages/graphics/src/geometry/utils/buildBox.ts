import { IVec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, buildLinesGeometry, type GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface } from './buildParametricSurface'

export const BuildBoxDefaults = {
  size: 1,
  segments: 1,
}

/**
 * Options for the {@link buildBox} function
 *
 * @public
 */
export interface BuildBoxOptions {
  /**
   * Uniform size along all axes.
   * Overridden per-axis by `width`, `height`, and `depth`.
   * @default 1
   */
  size?: number

  /**
   * Size along the X axis.
   * @default size
   */
  width?: number

  /**
   * Size along the Y axis.
   * @default size
   */
  height?: number

  /**
   * Size along the Z axis.
   * @default size
   */
  depth?: number

  /**
   * Uniform subdivision along all axes.
   * Overridden per-axis by `widthSegments`, `heightSegments`, and `depthSegments`.
   * @default 1
   */
  segments?: number

  /**
   * Subdivisions along the X axis, per face.
   * @default segments
   */
  widthSegments?: number

  /**
   * Subdivisions along the Y axis, per face.
   * @default segments
   */
  heightSegments?: number

  /**
   * Subdivisions along the Z axis, per face.
   * @default segments
   */
  depthSegments?: number

  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * Inverts winding order and normals, creating a box facing inwards.
   * @default false
   */
  invert?: boolean
}

export function boxGeometry(device: Device, options?: BuildBoxOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildBox, {
    name: 'box',
    ...(options || {}),
  })
}

export function boxLinesGeometry(device: Device, options?: BuildBoxOptions & BuildGeometryOptions): Geometry {
  return buildLinesGeometry(device, buildBoxLines, {
    name: 'box',
    ...(options || {}),
  })
}

/**
 * Builds a box shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildBox(builder: GeometryBuilder, options?: BuildBoxOptions) {
  const size = options?.size ?? BuildBoxDefaults.size
  const segments = options?.segments ?? BuildBoxDefaults.segments

  const width = options?.width ?? size
  const height = options?.height ?? size
  const depth = options?.depth ?? size

  const widthSegments = options?.widthSegments ?? segments
  const heightSegments = options?.heightSegments ?? segments
  const depthSegments = options?.depthSegments ?? segments

  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  const invert = !!options?.invert

  // top plane
  buildParametricSurface(builder, {
    invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + height * 0.5,
      z: oz + (v - 0.5) * depth,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uSegments: widthSegments,
    vSegments: depthSegments,
  })

  // bottom plane
  buildParametricSurface(builder, {
    invert: !invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + -height * 0.5,
      z: oz + (v - 0.5) * depth,
    }),
    normal: () => ({ x: 0, y: -1, z: 0 }),
    uSegments: widthSegments,
    vSegments: depthSegments,
  })

  // front
  buildParametricSurface(builder, {
    invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + (v - 0.5) * height,
      z: oz + depth * 0.5,
    }),
    normal: () => ({ x: 0, y: 0, z: 1 }),
    uSegments: widthSegments,
    vSegments: heightSegments,
  })

  // back
  buildParametricSurface(builder, {
    invert: !invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + (v - 0.5) * height,
      z: oz + -depth * 0.5,
    }),
    normal: () => ({ x: 0, y: 0, z: -1 }),
    uSegments: widthSegments,
    vSegments: heightSegments,
  })

  // left
  buildParametricSurface(builder, {
    invert,
    position: (u, v) => ({
      x: ox + -width * 0.5,
      y: oy + (v - 0.5) * height, // v → Y
      z: oz + (u - 0.5) * depth, // u → Z
    }),
    normal: () => ({ x: -1, y: 0, z: 0 }),
    uSegments: depthSegments,
    vSegments: heightSegments,
  })

  // right
  buildParametricSurface(builder, {
    invert: !invert,
    position: (u, v) => ({
      x: ox + width * 0.5,
      y: oy + (v - 0.5) * height, // v → Y
      z: oz + (u - 0.5) * depth, // u → Z
    }),
    normal: () => ({ x: 1, y: 0, z: 0 }),
    uSegments: depthSegments,
    vSegments: heightSegments,
  })
}

/**
 * Builds a cube lines shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildBoxLines(builder: GeometryBuilder, options?: BuildBoxOptions) {
  const size = options?.size ?? BuildBoxDefaults.size
  const segments = options?.segments ?? BuildBoxDefaults.segments

  const width = options?.width ?? size
  const height = options?.height ?? size
  const depth = options?.depth ?? size

  const widthSegments = options?.widthSegments ?? segments
  const heightSegments = options?.heightSegments ?? segments
  const depthSegments = options?.depthSegments ?? segments

  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0

  const invert = !!options?.invert

  // top plane
  buildParametricLines(builder, {
    invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + height * 0.5,
      z: oz + (v - 0.5) * depth,
    }),
    normal: () => ({ x: 0, y: 1, z: 0 }),
    uSegments: widthSegments,
    vSegments: depthSegments,
  })

  // bottom plane
  buildParametricLines(builder, {
    invert: !invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + -height * 0.5,
      z: oz + (v - 0.5) * depth,
    }),
    normal: () => ({ x: 0, y: -1, z: 0 }),
    uSegments: widthSegments,
    vSegments: depthSegments,
  })

  // front
  buildParametricLines(builder, {
    invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + (v - 0.5) * height,
      z: oz + depth * 0.5,
    }),
    normal: () => ({ x: 0, y: 0, z: 1 }),
    uSegments: widthSegments,
    vSegments: heightSegments,
  })

  // back
  buildParametricLines(builder, {
    invert: !invert,
    position: (u, v) => ({
      x: ox + (u - 0.5) * width,
      y: oy + (v - 0.5) * height,
      z: oz + -depth * 0.5,
    }),
    normal: () => ({ x: 0, y: 0, z: -1 }),
    uSegments: widthSegments,
    vSegments: heightSegments,
  })

  // left
  buildParametricLines(builder, {
    invert,
    position: (u, v) => ({
      x: ox + -width * 0.5,
      y: oy + (v - 0.5) * height, // v → Y
      z: oz + (u - 0.5) * depth, // u → Z
    }),
    normal: () => ({ x: -1, y: 0, z: 0 }),
    uSegments: depthSegments,
    vSegments: heightSegments,
  })

  // right
  buildParametricLines(builder, {
    invert: !invert,
    position: (u, v) => ({
      x: ox + width * 0.5,
      y: oy + (v - 0.5) * height, // v → Y
      z: oz + (u - 0.5) * depth, // u → Z
    }),
    normal: () => ({ x: 1, y: 0, z: 0 }),
    uSegments: depthSegments,
    vSegments: heightSegments,
  })
}
