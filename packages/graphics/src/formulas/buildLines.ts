import { Vec3 } from '@gglib/math'
import { Color } from '../Color'
import type { ModelBuilder } from '../model'
import { ModelBuilderChannel } from '../model/ModelBuilderChannel'
import { Buffer } from '../resources'

/**
 * Builds lines to display vertex normal tangent and bitangent vectors
 *
 * @public
 * @param builder - The model builder
 * @param vertexBuffer - The vertex buffer to inspect
 */
export function buildLines(builder: ModelBuilder, vertexBuffer: Buffer[]) {
  const channels = ModelBuilderChannel.fromVertexBuffer(vertexBuffer)
  const position = channels.position
  const normal = channels.normal
  const tangent = channels.tangent
  const bitangent = channels.bitangent

  const p0 = Vec3.create()
  const p1 = Vec3.create()
  const n = Vec3.create()
  const scale = 0.1

  for (let i = 0; i < vertexBuffer[0].elementCount; i++) {
    p0.x = position.read(i, 0)
    p0.y = position.read(i, 1)
    p0.z = position.read(i, 2)

    n.x = normal.read(i, 0)
    n.y = normal.read(i, 1)
    n.z = normal.read(i, 2)
    Vec3.addScaled(p0, n, scale, p1)

    builder.addIndex(builder.indexCount)
    builder.addVertex({
      position: p0,
      color: [Color.Blue.rgba],
    })
    builder.addIndex(builder.indexCount)
    builder.addVertex({
      position: p1,
      color: [Color.Blue.rgba],
    })

    if (tangent) {
      n.x = tangent.read(i, 0)
      n.y = tangent.read(i, 1)
      n.z = tangent.read(i, 2)
      Vec3.addScaled(p0, n, scale, p1)

      builder.addIndex(builder.indexCount)
      builder.addVertex({
        position: p0,
        color: [Color.Red.rgba],
      })
      builder.addIndex(builder.indexCount)
      builder.addVertex({
        position: p1,
        color: [Color.Red.rgba],
      })
    }

    if (bitangent) {
      n.x = bitangent.read(i, 0)
      n.y = bitangent.read(i, 1)
      n.z = bitangent.read(i, 2)
      Vec3.addScaled(p0, n, scale, p1)

      builder.addIndex(builder.indexCount)
      builder.addVertex({
        position: p0,
        color: [Color.Green.rgba],
      })
      builder.addIndex(builder.indexCount)
      builder.addVertex({
        position: p1,
        color: [Color.Green.rgba],
      })
    }
  }
}
