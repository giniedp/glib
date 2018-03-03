import { Log } from '@gglib/core'
import { Vec2, Vec3 } from '@gglib/math'
import { BufferDataOption } from './../Buffer'
import { VertexLayout } from './../VertexLayout'

export function calculateNormals(layout: VertexLayout, indices: number[], vertices: number[]) {
  if (!layout.normal) {
    Log.l('Can not create normals for buffer. Normal definition not found in layout ', layout)
  }
  if (!layout.position) {
    Log.l('Can not create normals for buffer. Position definition not found in layout ', layout)
  }

  let epsilon = 0
  let stride = VertexLayout.countElements(layout)
  let offPos = VertexLayout.countElementsBefore(layout, 'position')
  let offNrm = VertexLayout.countElementsBefore(layout, 'normal')

  let v0 = Vec3.createZero()
  let v1 = Vec3.createZero()
  let v2 = Vec3.createZero()
  let t0 = Vec3.createZero()
  let t1 = Vec3.createZero()
  let normal = Vec3.createZero()

  // clear previous normals
  for (let i = 0; i < indices.length; i += 1) { // tslint:disable-line
    let index = indices[i] * stride + offNrm
    vertices[index    ] = 0 // x
    vertices[index + 1] = 0 // y
    vertices[index + 2] = 0 // z
  }

  // accumulate normals for each vertex of each each triangle face
  for (let i = 0; i < indices.length; i += 3) {
    v0.initFromBuffer(vertices, indices[i    ] * stride + offPos)
    v1.initFromBuffer(vertices, indices[i + 1] * stride + offPos)
    v2.initFromBuffer(vertices, indices[i + 2] * stride + offPos)

    Vec3.subtract(v2, v0, t0)
    Vec3.subtract(v1, v0, t1)
    Vec3.cross(t0, t1, normal)

    let index = indices[i] * stride + offNrm
    vertices[index    ] += normal.x
    vertices[index + 1] += normal.y
    vertices[index + 2] += normal.z

    index = indices[i + 1] * stride + offNrm
    vertices[index    ] += normal.x
    vertices[index + 1] += normal.y
    vertices[index + 2] += normal.z

    index = indices[i + 2] * stride + offNrm
    vertices[index    ] += normal.x
    vertices[index + 1] += normal.y
    vertices[index + 2] += normal.z
  }

  // normalize all normals
  for (let i = 0; i < indices.length; i += 1) { // tslint:disable-line
    let index = indices[i] * stride + offNrm
    normal.initFromBuffer(vertices, index)
    if (normal.lengthSquared() > epsilon) {
      normal.normalize()
    } else {
      normal.init(0, 0, 0)
    }
    normal.copy(vertices, index)
  }
}
