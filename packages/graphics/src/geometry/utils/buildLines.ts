import { IVec3, Vec3 } from '@gglib/math'
import { Color } from '../../Color'
import { Buffer } from '../../resources/Buffer'
import type { GeometryBuilder } from '../GeometryBuilder'
import { GeometryBuilderChannel } from '../GeometryBuilderChannel'

export type LinePoint = [number, number, number] | ({ toArray: (buf: number[]) => void })
export type Line = [LinePoint, LinePoint]

export interface BuildLinesOptions {
  lines: Line[]
  colors?: Color[]
  color?: Color
}

/**
 * Builds lines to display vertex normal tangent and bitangent vectors
 *
 * @public
 * @param builder - The model builder
 * @param vertexBuffer - The vertex buffer to inspect
 */
export function buildLines(builder: GeometryBuilder, options: BuildLinesOptions) {
  for (let i = 0; i < options.lines.length; i++) {
    const line = options.lines[i]
    const color = options.colors?.[i] ?? options.color ?? Color.White
    builder.addIndex(builder.indexCount)
    builder.addVertex({
      position: line[0],
      color: [color.rgba],
    })

    builder.addIndex(builder.indexCount)
    builder.addVertex({
      position: line[1],
      color: [color.rgba],
    })
  }
}

/**
 * Builds lines to display vertex normal tangent and bitangent vectors
 *
 * @public
 * @param builder - The model builder
 * @param vertexBuffer - The vertex buffer to inspect
 */
export function buildVertexNormals(builder: GeometryBuilder, vertexBuffer: Buffer[]) {
  const channels = GeometryBuilderChannel.fromVertexBuffer(vertexBuffer)
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
