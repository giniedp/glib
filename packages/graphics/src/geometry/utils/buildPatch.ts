import { Device } from '@gglib/graphics'
import { IVec3, Vec2, Vec3 } from '@gglib/math'
import { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { resolveLines } from './buildParametricSurface'
import { trianglesToLines } from './indices'

export const BuildPatchDefaults = {
  size: 1,
  segments: 1,
  diagonal: 'forward' as 'forward' | 'backward' | 'alternating',
  patternOffsetX: 0,
  patternOffsetY: 0,
  invert: false,
  lines: false,
}

export interface BuildPatchOptions {
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
   * Diagonal direction for quad subdivision.
   * - `'forward'` — all quads split from top-left to bottom-right
   * - `'backward'` — all quads split from top-right to bottom-left
   * - `'alternating'` — alternates per quad, reducing visual artifacts
   * @default 'forward'
   */
  diagonal?: 'forward' | 'backward' | 'alternating'

  /**
   * X tile coordinate for globally consistent alternating diagonals.
   * @default 0
   */
  patternOffsetX?: number

  /**
   * Y tile coordinate for globally consistent alternating diagonals.
   * @default 0
   */
  patternOffsetY?: number

  /**
   * Optional position callback to transform vertex positions.
   * Receives world-space XYZ and returns the transformed position.
   *
   * @param x - World-space X
   * @param y - World-space Y (always 0 for a flat patch)
   * @param z - World-space Z
   */
  position?: (x: number, y: number, z: number) => IVec3

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

export function patchGeometry(device: Device, options?: BuildPatchOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildPatch, {
    name: 'Patch',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds a subdivided quad patch into the {@link GeometryBuilder}.
 *
 * Unlike {@link buildPlane}, this builder supports configurable diagonal
 * patterns and an optional position callback for vertex deformation,
 * making it suitable for terrain, cloth, and other deformable surfaces.
 *
 * @public
 */
export function buildPatch(builder: GeometryBuilder, options?: BuildPatchOptions) {
  const size = options?.size ?? BuildPatchDefaults.size
  const segments = options?.segments ?? BuildPatchDefaults.segments
  const width = options?.width ?? size
  const depth = options?.depth ?? size
  const widthSegments = options?.widthSegments ?? segments
  const depthSegments = options?.depthSegments ?? segments
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0
  const diagonal = options?.diagonal ?? BuildPatchDefaults.diagonal
  const patternOffsetX = options?.patternOffsetX ?? BuildPatchDefaults.patternOffsetX
  const patternOffsetY = options?.patternOffsetY ?? BuildPatchDefaults.patternOffsetY
  const positionFn = options?.position
  const invert = options?.invert ?? BuildPatchDefaults.invert
  const lines = options?.lines ?? BuildPatchDefaults.lines
  const isBackward = diagonal === 'backward'
  const isForward = diagonal === 'forward'
  const isAlternating = diagonal === 'alternating'

  // build vertices
  const baseVertex = builder.vertexCount
  for (let row = 0; row <= depthSegments; row++) {
    for (let col = 0; col <= widthSegments; col++) {
      const s = col / widthSegments
      const t = row / depthSegments
      const wx = (s - 0.5) * width + ox
      const wz = (t - 0.5) * depth + oz

      const pos = positionFn ? positionFn(wx, oy, wz) : { x: wx, y: oy, z: wz }

      builder.addVertex({
        position: Vec3.convert(pos),
        normal: Vec3.convert(invert ? { x: 0, y: -1, z: 0 } : { x: 0, y: 1, z: 0 }),
        texture: Vec2.convert({ x: s, y: t }),
      })
    }
  }

  // build triangle indices
  const stride = widthSegments + 1
  const triangleIndices: number[] = []

  for (let row = 0; row < depthSegments; row++) {
    let even = (row + patternOffsetY + patternOffsetX) % 2 === 0
    for (let col = 0; col < widthSegments; col++) {
      const i = baseVertex + row * stride + col
      const a = i
      const b = i + 1
      const c = i + stride
      const d = i + stride + 1

      if (!isBackward && (isForward || even)) {
        // a--b
        // |\ |
        // | \|
        // c--d
        if (invert) {
          triangleIndices.push(a, b, d)
          triangleIndices.push(a, d, c)
        } else {
          triangleIndices.push(a, d, b)
          triangleIndices.push(a, c, d)
        }
      } else {
        // a--b
        // | /|
        // |/ |
        // c--d
        if (invert) {
          triangleIndices.push(a, b, c)
          triangleIndices.push(c, b, d)
        } else {
          triangleIndices.push(a, c, b)
          triangleIndices.push(c, d, b)
        }
      }

      if (isAlternating) {
        even = !even
      }
    }
    if (isAlternating) {
      even = !even
    }
  }

  // emit indices — convert to lines if needed
  if (lines) {
    for (const i of trianglesToLines(triangleIndices)) {
      builder.addIndex(i)
    }
  } else {
    for (const i of triangleIndices) {
      builder.addIndex(i)
    }
  }
}
