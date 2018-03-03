import { Log } from '@gglib/core'
import { Vec2, Vec3 } from '@gglib/math'
import { BufferDataOption } from './../Buffer'
import { VertexLayout } from './../VertexLayout'

export function calculateTangents(layout: VertexLayout, indices: number[], vertices: number[]) {
  if (!layout.normal) {
    Log.l('Can not calculate tangents for buffer. Normal definition not found in layout ', layout)
  }
  if (!layout.normal) {
    Log.l('Can not calculate tangents for buffer. Normal definition not found in layout ', layout)
  }
  if (!layout.texture) {
    Log.l('Can not calculate tangents for buffer. Texture definition not found in layout ', layout)
  }
  if (!layout.tangent) {
    Log.l('Can not calculate tangents for buffer. Tangent definition not found in layout ', layout)
  }
  if (!layout.bitangent) {
    Log.l('Can not calculate tangents for buffer. Bitangent definition not found in layout ', layout)
  }

  let stride = VertexLayout.countElements(layout)
  let offPos = VertexLayout.countElementsBefore(layout, 'position')
  let offNrm = VertexLayout.countElementsBefore(layout, 'normal')
  let offTex = VertexLayout.countElementsBefore(layout, 'texture')
  let offTan = VertexLayout.countElementsBefore(layout, 'tangent')
  let offBit = VertexLayout.countElementsBefore(layout, 'bitangent')

  let count = vertices.length / VertexLayout.countElements(layout)
  let index

  let p1 = Vec3.createZero()
  let p2 = Vec3.createZero()
  let p3 = Vec3.createZero()
  let t1 = Vec2.createZero()
  let t2 = Vec2.createZero()
  let t3 = Vec2.createZero()
  let d1 = Vec3.createZero()
  let d2 = Vec3.createZero()
  let uv1 = Vec2.createZero()
  let uv2 = Vec2.createZero()

  // zero out tangents
  for (let i = 0; i < count; i += 1) {
    index = i * stride + offTan
    vertices[index    ] = 0
    vertices[index + 1] = 0
    vertices[index + 2] = 0

    index = i * stride + offBit
    vertices[index    ] = 0
    vertices[index + 1] = 0
    vertices[index + 2] = 0
  }

  // accumulate tangents
  for (let i = 0; i < indices.length; i += 1) {
    let i1 = indices[i    ]
    let i2 = indices[i + 1]
    let i3 = indices[i + 2]

    p1.initFromBuffer(vertices, i1 * stride + offPos)
    p2.initFromBuffer(vertices, i2 * stride + offPos)
    p3.initFromBuffer(vertices, i3 * stride + offPos)

    t1.initFromBuffer(vertices, i1 * stride + offTex)
    t2.initFromBuffer(vertices, i2 * stride + offTex)
    t3.initFromBuffer(vertices, i3 * stride + offTex)

    Vec3.subtract(p2, p1, d1)
    Vec3.subtract(p3, p1, d2)

    Vec2.subtract(t2, t1, uv1)
    Vec2.subtract(t3, t1, uv2)

    let r = 1 / (uv1.x * uv2.y - uv1.y * uv2.x)
    let dir1 = Vec3.subtract<Vec3>(
      Vec3.multiplyScalar(d1, uv2.y),
      Vec3.multiplyScalar(d2, uv1.y),
    ).multiplyScalar(r)
    let dir2 = Vec3.subtract<Vec3>(
      Vec3.multiplyScalar(d2, uv1.x),
      Vec3.multiplyScalar(d1, uv2.x),
    ).multiplyScalar(r)

    index = i1 * stride + offTan
    vertices[index    ] += dir1.x
    vertices[index + 1] += dir1.y
    vertices[index + 2] += dir1.z

    index = i2 * stride + offTan
    vertices[index    ] += dir1.x
    vertices[index + 1] += dir1.y
    vertices[index + 2] += dir1.z

    index = i3 * stride + offTan
    vertices[index    ] += dir1.x
    vertices[index + 1] += dir1.y
    vertices[index + 2] += dir1.z

    index = i1 * stride + offBit
    vertices[index    ] += dir2.x
    vertices[index + 1] += dir2.y
    vertices[index + 2] += dir2.z

    index = i2 * stride + offBit
    vertices[index    ] += dir2.x
    vertices[index + 1] += dir2.y
    vertices[index + 2] += dir2.z

    index = i3 * stride + offBit
    vertices[index    ] += dir2.x
    vertices[index + 1] += dir2.y
    vertices[index + 2] += dir2.z
  }

  let normal = Vec3.createZero()
  let tangent = Vec3.createZero()
  let bitangent = Vec3.createZero()
  // orthogonalize
  for (let i = 0; i < count; i += 1) {
    index = i * stride
    normal.initFromBuffer(vertices, index + offNrm)
    tangent.initFromBuffer(vertices, index + offTan)
    bitangent.initFromBuffer(vertices, index + offBit)

    let t = Vec3.subtract<Vec3>(tangent, Vec3.multiplyScalar(normal, normal.dot(tangent)))
    let h = Vec3.cross<Vec3>(normal, tangent).dot(bitangent) < 0 ? -1 : 1
    let b = Vec3.cross<Vec3>(normal, t).multiplyScalar(h)

    if (!t.lengthSquared() || !b.lengthSquared()) {
      t.init(1, 0, 0)
      b.init(0, 0, 1)
    } else {
      t.normalize()
      b.normalize()
    }

    t.copy(vertices, index + offTan)
    b.copy(vertices, index + offBit)
  }
}
