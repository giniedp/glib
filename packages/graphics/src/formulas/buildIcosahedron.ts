import { Vec2, Vec3 } from '@gglib/math'
import { getOption } from '@gglib/utils'
import type { ModelBuilder } from '../model/ModelBuilder'

function normalize(v: number[]) {
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

/**
 * Builds an tetrahedron shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildTetrahedron(builder: ModelBuilder, options: {
  radius?: number
  tesselation?: number,
} = {}) {
  const radius = getOption(options, 'radius', 0.5)
  const steps = getOption(options, 'tesselation', 0)
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
  function onVetex(v: Vec3) {
    builder.addIndex(builder.vertexCount)
    builder.addVertex({
      position: Vec3.multiplyScalar(v, radius),
      normal: v,
      texture: Vec2.create(v.x, v.z),
    })
  }
  for (const face of faces) {
    subdivide(
      normalize(vertices[face[0]]),
      normalize(vertices[face[1]]),
      normalize(vertices[face[2]]),
      steps, onVetex)
  }
}

/**
 * Builds an octahedron shape into the {@link ModelBuilder}
 *
 * @public
 */
export function buildOctahedron(builder: ModelBuilder, options: {
  radius?: number
  tesselation?: number,
} = {}) {
  const radius = getOption(options, 'radius', 0.5)
  const steps = getOption(options, 'tesselation', 0)
  const vertices = [
    [+1, 0, 0],
    [-1, 0, 0], // left
    [0, +1, 0], // up
    [0, -1, 0], // down
    [0, 0, +1], // front
    [0, 0, -1],  // back
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
  function onVetex(v: Vec3) {
    builder.addIndex(builder.vertexCount)
    builder.addVertex({
      position: Vec3.multiplyScalar(v, radius),
      normal: v,
      texture: Vec2.create(v.x, v.z),
    })
  }
  for (let face of faces) {
    subdivide(
      normalize(vertices[face[0]]),
      normalize(vertices[face[1]]),
      normalize(vertices[face[2]]),
      steps, onVetex)
  }
}

/**
 * Builds an icosahedron shape into the {@link ModelBuilder}
 *
 * @public
 * @remarks
 * The implementation is based on http://www.opengl.org.ru/docs/pg/0208.html
 */
export function buildIcosahedron(builder: ModelBuilder, options: {
  radius?: number
  tesselation?: number,
} = {}) {
  const radius = getOption(options, 'radius', 0.5)
  const steps = getOption(options, 'tesselation', 0)

  const X = .525731112119133606
  const Z = .850650808352039932
  const vertices = [
    [-X, 0, Z], [X, 0, Z], [-X, 0, -Z], [X, 0, -Z],
    [0, Z, X], [0, Z, -X], [0, -Z, X], [0, -Z, -X],
    [Z, X, 0], [-Z, X, 0], [Z, -X, 0], [-Z, -X, 0],
  ]
  const faces = [
    [0, 4, 1], [0, 9, 4], [9, 5, 4], [4, 5, 8], [4, 8, 1],
    [8, 10, 1], [8, 3, 10], [5, 3, 8], [5, 2, 3], [2, 7, 3],
    [7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6], [0, 1, 6],
    [6, 1, 10], [9, 0, 11], [9, 11, 2], [9, 2, 5], [7, 2, 11],
  ]
  function onVetex(v: Vec3) {
    builder.addIndex(builder.vertexCount)
    builder.addVertex({
      position: Vec3.multiplyScalar(v, radius),
      normal: v,
      texture: Vec2.create(v.x, v.z),
    })
  }
  for (let face of faces) {
    subdivide(
      vertices[face[0]],
      vertices[face[1]],
      vertices[face[2]],
      steps, onVetex)
  }
}
