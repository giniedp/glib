import { Log } from '@gglib/core'
import { Vec3 } from '@gglib/math'
import { FrontFace } from '../enums'
import { ModelBuilderChannelMap } from '../ModelBuilderChannel'

/**
 * Recalculates the normals for each vertex
 *
 * @public
 * @remarks channels must contain a `normal` and a `position` channel
 */
export function calculateNormals(
  indices: number[],
  channels: ModelBuilderChannelMap,
  vCount: number,
  frontFace: FrontFace = FrontFace.CounterClockWise) {
  if (!channels.normal) {
    Log.w(`[calculateNormals] buffer must have a 'normal' attrubte`)
    return
  }
  if (!channels.position) {
    Log.w(`[calculateNormals] buffer must have a 'position' attrubte`)
    return
  }

  let epsilon = 0
  const normals = channels.normal
  const positions = channels.position

  const v0 = Vec3.createZero()
  const v1 = Vec3.createZero()
  const v2 = Vec3.createZero()
  const t0 = Vec3.createZero()
  const t1 = Vec3.createZero()
  const normal = Vec3.createZero()

  // clear previous normals
  for (let i = 0; i < vCount; i++) {
    normals.write(i, 0, 0) // x
    normals.write(i, 1, 0) // y
    normals.write(i, 2, 0) // z
  }

  // accumulate normals for each vertex of each triangle face
  for (let i = 0; i < indices.length - 2; i += 3) {
    const i0 = indices[i + 0]
    let i1 = indices[i + 1]
    let i2 = indices[i + 2]
    if (frontFace === FrontFace.CounterClockWise) {
      [i1, i2] = [i2, i1]
    }

    v0.x = positions.read(i0, 0)
    v0.y = positions.read(i0, 1)
    v0.z = positions.read(i0, 2)

    v1.x = positions.read(i1, 0)
    v1.y = positions.read(i1, 1)
    v1.z = positions.read(i1, 2)

    v2.x = positions.read(i2, 0)
    v2.y = positions.read(i2, 1)
    v2.z = positions.read(i2, 2)

    Vec3.subtract(v2, v0, t0)
    Vec3.subtract(v1, v0, t1)
    Vec3.cross(t0, t1, normal)

    normals.write(i0, 0, normals.read(i0, 0) + normal.x)
    normals.write(i0, 1, normals.read(i0, 1) + normal.y)
    normals.write(i0, 2, normals.read(i0, 2) + normal.z)

    normals.write(i1, 0, normals.read(i1, 0) + normal.x)
    normals.write(i1, 1, normals.read(i1, 1) + normal.y)
    normals.write(i1, 2, normals.read(i1, 2) + normal.z)

    normals.write(i2, 0, normals.read(i2, 0) + normal.x)
    normals.write(i2, 1, normals.read(i2, 1) + normal.y)
    normals.write(i2, 2, normals.read(i2, 2) + normal.z)
  }

  // normalize all normals
  for (let i = 0; i < vCount; i++) {
    normal.x = normals.read(i, 0)
    normal.y = normals.read(i, 1)
    normal.z = normals.read(i, 2)

    if (normal.lengthSquared() > epsilon) {
      normal.normalize()
    } else {
      normal.init(0, 0, 0)
    }

    normals.write(i, 0, normal.x)
    normals.write(i, 1, normal.y)
    normals.write(i, 2, normal.z)
  }
}
