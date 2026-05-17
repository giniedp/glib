import { IVec3, Vec2, Vec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, GeometryBuilder } from '../GeometryBuilder'
import { trianglesToLines } from './indices'
import { resolveLines } from './buildParametricSurface'

export const BuildPolyhedronDefaults = {
  radius: 1,
  subdivisions: 4,
  invert: false,
}

/**
 * Options for polyhedron builders such as {@link buildTetrahedron},
 * {@link buildOctahedron}, and {@link buildIcosahedron}.
 *
 * @public
 */
export interface BuildPolyhedronOptions {
  /**
   * Radius of the circumscribed sphere.
   * @default 1
   */
  radius?: number

  /**
   * Number of times each face is recursively subdivided.
   * Higher values produce a smoother sphere-like surface.
   * @default 4
   */
  subdivisions?: number

  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

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

  /**
   * Vertex positions as `[x, y, z]` tuples on the unit sphere.
   * Required — must be provided alongside `faces`.
   */
  vertices?: number[][]

  /**
   * Face definitions as index triples into `vertices`.
   * Required — must be provided alongside `vertices`.
   */
  faces?: number[][]
}

export function tetrahedronGeometry(device: Device, options?: BuildPolyhedronOptions): Geometry {
  return buildGeometry(device, buildTetrahedron, {
    name: 'Tetrahedron',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds an tetrahedron shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildTetrahedron(builder: GeometryBuilder, options?: BuildPolyhedronOptions) {
  const vertices = [
    [+1, +1, +1],
    [+1, -1, -1],
    [-1, +1, -1],
    [-1, -1, +1],
  ]
  const faces = [
    [0, 3, 2],
    [1, 3, 0],
    [2, 1, 0],
    [2, 3, 1],
  ]

  buildPolyhedron(builder, {
    ...(options || {}),
    vertices,
    faces,
  })
}

export function octahedronGeometry(device: Device, options?: BuildPolyhedronOptions): Geometry {
  return buildGeometry(device, buildOctahedron, {
    name: 'Octahedron',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds an octahedron shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildOctahedron(builder: GeometryBuilder, options?: BuildPolyhedronOptions) {
  const vertices = [
    [+1, 0, 0],
    [-1, 0, 0], // left
    [0, +1, 0], // up
    [0, -1, 0], // down
    [0, 0, +1], // front
    [0, 0, -1], // back
  ]
  const faces = [
    [0, 4, 2],
    [0, 3, 4],
    [0, 5, 3],
    [0, 2, 5],
    [1, 5, 2],
    [1, 3, 5],
    [1, 4, 3],
    [1, 2, 4],
  ]

  buildPolyhedron(builder, {
    ...(options || {}),
    vertices,
    faces,
  })
}

export function icosahedronGeometry(device: Device, options?: BuildPolyhedronOptions): Geometry {
  return buildGeometry(device, buildIcosahedron, {
    name: 'Icosahedron',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds an icosahedron shape into the {@link GeometryBuilder}
 *
 * @public
 * @remarks
 * The implementation is based on http://www.opengl.org.ru/docs/pg/0208.html
 */
export function buildIcosahedron(builder: GeometryBuilder, options?: BuildPolyhedronOptions) {
  const X = 0.525731112119133606
  const Z = 0.850650808352039932
  const vertices = [
    [-X, 0, Z],
    [X, 0, Z],
    [-X, 0, -Z],
    [X, 0, -Z],
    [0, Z, X],
    [0, Z, -X],
    [0, -Z, X],
    [0, -Z, -X],
    [Z, X, 0],
    [-Z, X, 0],
    [Z, -X, 0],
    [-Z, -X, 0],
  ]
  const faces = [
    [0, 4, 1],
    [0, 9, 4],
    [9, 5, 4],
    [4, 5, 8],
    [4, 8, 1],
    [8, 10, 1],
    [8, 3, 10],
    [5, 3, 8],
    [5, 2, 3],
    [2, 7, 3],
    [7, 10, 3],
    [7, 6, 10],
    [7, 11, 6],
    [11, 0, 6],
    [0, 1, 6],
    [6, 1, 10],
    [9, 0, 11],
    [9, 11, 2],
    [9, 2, 5],
    [7, 2, 11],
  ]

  buildPolyhedron(builder, {
    ...(options || {}),
    vertices,
    faces,
  })
}

export function buildPolyhedron(builder: GeometryBuilder, options?: BuildPolyhedronOptions) {
  const radius = options?.radius ?? BuildPolyhedronDefaults.radius
  const subdivisions = options?.subdivisions ?? BuildPolyhedronDefaults.subdivisions
  const invert = options?.invert ?? BuildPolyhedronDefaults.invert
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0
  const vertices = options?.vertices
  const faces = options?.faces
  const lines = !!options?.lines

  if (!vertices || !faces) {
    throw new Error('buildPolyhedron requires vertices and faces to be specified in options')
  }

  const indices: number[] = []
  const baseVertex = builder.vertexCount
  function onVertex(v: Vec3) {
    // Equirectangular (longitude/latitude) UV projection.
    // Note: triangles straddling the 180° meridian seam may exhibit
    // texture stretching.
    // TODO: implement split seam
    const u = 0.5 + Math.atan2(v.z, v.x) / (Math.PI * 2)
    const t = 0.5 - Math.asin(v.y) / Math.PI

    if (lines) {
      indices.push(baseVertex + indices.length)
    } else {
      builder.addIndex(builder.vertexCount)
    }

    builder.addVertex({
      position: Vec3.createFrom({
        x: v.x * radius + ox,
        y: v.y * radius + oy,
        z: v.z * radius + oz,
      }),
      normal: invert ? Vec3.createFrom(v).negate() : v,
      texture: Vec2.create(u, t),
    })
  }

  for (const face of faces) {
    const a = normalize(vertices[face[invert ? 2 : 0]])
    const b = normalize(vertices[face[1]])
    const c = normalize(vertices[face[invert ? 0 : 2]])
    subdivide(a, b, c, subdivisions, onVertex)
  }

  if (lines) {
    const lineIndices = trianglesToLines(indices)
    for (const index of lineIndices) {
      builder.addIndex(index)
    }
  }
}

function normalize(v: number[]): number[] {
  let x = v[0]
  let y = v[1]
  let z = v[2]
  let d = 1.0 / Math.sqrt(x * x + y * y + z * z)
  v[0] *= d
  v[1] *= d
  v[2] *= d
  return v
}

function subdivide(a: number[], b: number[], c: number[], depth: number, block: (v: Vec3) => void) {
  if (depth <= 0) {
    block(Vec3.convert(a))
    block(Vec3.convert(c))
    block(Vec3.convert(b))
    return
  }
  let a1 = []
  let b1 = []
  let c1 = []
  for (let i = 0; i < 3; i++) {
    a1[i] = a[i] + b[i]
    b1[i] = b[i] + c[i]
    c1[i] = c[i] + a[i]
  }
  normalize(a1)
  normalize(b1)
  normalize(c1)
  subdivide(a, a1, c1, depth - 1, block)
  subdivide(b, b1, a1, depth - 1, block)
  subdivide(c, c1, b1, depth - 1, block)
  subdivide(a1, b1, c1, depth - 1, block)
}
