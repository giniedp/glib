import { Log } from '@gglib/core'
import { Vec2, Vec3 } from '@gglib/math'
import { FrontFace } from '../enums'
import { ModelBuilderChannelMap } from '../ModelBuilderChannel'

/**
 * @public
 */
export function calculateTangents(
  indices: number[],
  channels: ModelBuilderChannelMap,
  vCount: number,
  frontFace: FrontFace = FrontFace.CounterClockWise) {
  if (!channels.normal) {
    Log.w('Can not calculate tangents for buffer. Normal definition not found in layout ')
    return
  }
  if (!channels.texture && !channels.texcoord) {
    Log.w('Can not calculate tangents for buffer. Texture definition not found in layout ')
    return
  }
  if (!channels.tangent) {
    Log.w('Can not calculate tangents for buffer. Tangent definition not found in layout ')
    return
  }

  const positions = channels.position
  const normals = channels.normal
  const tangents = channels.tangent
  const bitangents = channels.bitangent
  const textures = channels.texture || channels.texcoord

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
  for (let i = 0; i < vCount; i++) {
    tangents.write(i, 0, 0)
    tangents.write(i, 1, 0)
    tangents.write(i, 2, 0)

    bitangents.write(i, 0, 0)
    bitangents.write(i, 1, 0)
    bitangents.write(i, 2, 0)
  }

  // accumulate tangents
  for (let i = 0; i < indices.length - 2; i += 3) {
    let i0 = indices[i    ]
    let i1 = indices[i + 1]
    let i2 = indices[i + 2]
    if (frontFace === FrontFace.CounterClockWise) {
      [i1, i2] = [i2, i1]
    }

    p1.x = positions.read(i0, 0)
    p1.y = positions.read(i0, 1)
    p1.z = positions.read(i0, 2)

    p2.x = positions.read(i1, 0)
    p2.y = positions.read(i1, 1)
    p2.z = positions.read(i1, 2)

    p3.x = positions.read(i2, 0)
    p3.y = positions.read(i2, 1)
    p3.z = positions.read(i2, 2)

    t1.x = textures.read(i0, 0)
    t1.y = textures.read(i0, 1)

    t2.x = textures.read(i1, 0)
    t2.y = textures.read(i1, 1)

    t3.x = textures.read(i2, 0)
    t3.y = textures.read(i2, 1)

    Vec3.subtract(p2, p1, d1)
    Vec3.subtract(p3, p1, d2)

    Vec2.subtract(t2, t1, uv1)
    Vec2.subtract(t3, t1, uv2)

    let r = 1 / (uv1.x * uv2.y - uv1.y * uv2.x)
    let dir1 = Vec3.subtract(
      Vec3.multiplyScalar(d1, uv2.y),
      Vec3.multiplyScalar(d2, uv1.y),
    ).multiplyScalar(r)
    let dir2 = Vec3.subtract(
      Vec3.multiplyScalar(d2, uv1.x),
      Vec3.multiplyScalar(d1, uv2.x),
    ).multiplyScalar(r)

    tangents.write(i0, 0, tangents.read(i0, 0) + dir1.x)
    tangents.write(i0, 1, tangents.read(i0, 1) + dir1.y)
    tangents.write(i0, 2, tangents.read(i0, 2) + dir1.z)

    tangents.write(i1, 0, tangents.read(i1, 0) + dir1.x)
    tangents.write(i1, 1, tangents.read(i1, 1) + dir1.y)
    tangents.write(i1, 2, tangents.read(i1, 2) + dir1.z)

    tangents.write(i2, 0, tangents.read(i2, 0) + dir1.x)
    tangents.write(i2, 1, tangents.read(i2, 1) + dir1.y)
    tangents.write(i2, 2, tangents.read(i2, 2) + dir1.z)

    bitangents.write(i0, 0, bitangents.read(i0, 0) + dir2.x)
    bitangents.write(i0, 1, bitangents.read(i0, 1) + dir2.y)
    bitangents.write(i0, 2, bitangents.read(i0, 2) + dir2.z)

    bitangents.write(i1, 0, bitangents.read(i1, 0) + dir2.x)
    bitangents.write(i1, 1, bitangents.read(i1, 1) + dir2.y)
    bitangents.write(i1, 2, bitangents.read(i1, 2) + dir2.z)

    bitangents.write(i2, 0, bitangents.read(i2, 0) + dir2.x)
    bitangents.write(i2, 1, bitangents.read(i2, 1) + dir2.y)
    bitangents.write(i2, 2, bitangents.read(i2, 2) + dir2.z)
  }

  let normal = Vec3.createZero()
  let tangent = Vec3.createZero()
  let bitangent = Vec3.createZero()

  // orthogonalize
  for (let i = 0; i < vCount; i++) {

    normal.x = normals.read(i, 0)
    normal.y = normals.read(i, 1)
    normal.z = normals.read(i, 2)

    tangent.x = tangents.read(i, 0)
    tangent.y = tangents.read(i, 1)
    tangent.z = tangents.read(i, 2)

    bitangent.x = bitangents.read(i, 0)
    bitangent.y = bitangents.read(i, 1)
    bitangent.z = bitangents.read(i, 2)

    let t = Vec3.subtract(tangent, Vec3.multiplyScalar(normal, normal.dot(tangent)))
    let h = Vec3.cross(normal, tangent).dot(bitangent) < 0 ? -1 : 1
    let b = Vec3.cross(normal, t).multiplyScalar(h)

    if (!t.lengthSquared() || !b.lengthSquared()) {
      t.init(1, 0, 0)
      b.init(0, 0, 1)
    } else {
      t.normalize()
      b.normalize()
    }

    tangents.write(i, 0, tangent.x)
    tangents.write(i, 1, tangent.y)
    tangents.write(i, 2, tangent.z)

    bitangents.write(i, 0, bitangent.x)
    bitangents.write(i, 1, bitangent.y)
    bitangents.write(i, 2, bitangent.z)
  }
}
