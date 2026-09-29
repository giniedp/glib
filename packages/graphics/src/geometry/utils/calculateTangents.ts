import {
  vec2,
  vec2Subtract,
  vec3,
  vec3$init,
  vec3$normalize,
  vec3Cross,
  vec3Dot,
  vec3LengthSquared,
  vec3MultiplyScalar,
  vec3Subtract,
} from '@gglib/math'
import { FrontFace } from '../../enums'
import { GeometryBuilderChannelMap } from '../GeometryBuilderChannel'

/**
 * Recalculates the tangents for each vertex
 *
 * @public
 * @remarks channels must contain a `normal` a `texture` and a `tangent` channel
 */
export function calculateTangents(
  indices: ReadonlyArray<number>,
  channels: GeometryBuilderChannelMap,
  vCount: number,
  frontFace: FrontFace = 'ccw',
) {
  if (!channels.normal) {
    console.warn('Can not calculate tangents for buffer. Normal definition not found in layout ')
    return
  }
  if (!channels.texture && !channels.texcoord) {
    console.warn('Can not calculate tangents for buffer. Texture definition not found in layout ')
    return
  }
  if (!channels.tangent) {
    console.warn('Can not calculate tangents for buffer. Tangent definition not found in layout ')
    return
  }

  const positions = channels.position
  const normals = channels.normal
  const tangents = channels.tangent
  const bitangents = channels.bitangent
  const textures = channels.texture || channels.texcoord

  let p1 = vec3()
  let p2 = vec3()
  let p3 = vec3()
  let t1 = vec2()
  let t2 = vec2()
  let t3 = vec2()
  let d1 = vec3()
  let d2 = vec3()
  let uv1 = vec2()
  let uv2 = vec2()

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
    let i0 = indices[i]
    let i1 = indices[i + 1]
    let i2 = indices[i + 2]
    if (frontFace === 'ccw') {
      ;[i1, i2] = [i2, i1]
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

    vec3Subtract(p2, p1, d1)
    vec3Subtract(p3, p1, d2)

    vec2Subtract(t2, t1, uv1)
    vec2Subtract(t3, t1, uv2)

    let r = 1 / (uv1.x * uv2.y - uv1.y * uv2.x)
    let dir1 = vec3MultiplyScalar(vec3Subtract(vec3MultiplyScalar(d1, uv2.y), vec3MultiplyScalar(d2, uv1.y)), r)
    let dir2 = vec3MultiplyScalar(vec3Subtract(vec3MultiplyScalar(d2, uv1.x), vec3MultiplyScalar(d1, uv2.x)), r)

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

  let normal = vec3()
  let tangent = vec3()
  let bitangent = vec3()

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

    let t = vec3Subtract(tangent, vec3MultiplyScalar(normal, vec3Dot(normal, tangent)))
    let h = vec3Dot(vec3Cross(normal, tangent), bitangent) < 0 ? -1 : 1
    let b = vec3MultiplyScalar(vec3Cross(normal, t), h)

    if (!vec3LengthSquared(t) || !vec3LengthSquared(b)) {
      vec3$init(t, 1, 0, 0)
      vec3$init(b, 0, 0, 1)
    } else {
      vec3$normalize(t)
      vec3$normalize(b)
    }

    tangents.write(i, 0, tangent.x)
    tangents.write(i, 1, tangent.y)
    tangents.write(i, 2, tangent.z)

    bitangents.write(i, 0, bitangent.x)
    bitangents.write(i, 1, bitangent.y)
    bitangents.write(i, 2, bitangent.z)
  }
}
