import { BoundingBox, BoundingSphere } from '@gglib/math'

import { arrayTypeToDataType, DataType, FrontFace } from '../enums'
import { BufferOptions, isPlainBufferData, PlainBufferData } from '../resources'
import { vertexAttribute, VertexAttribute } from '../VertexLayout'
import { calculateNormals } from './utils/calculateNormals'
import { calculateTangents } from './utils/calculateTangents'

import { GeometryBuilderChannel } from './GeometryBuilderChannel'

export class GeometryUtil {
  public channels = new Map<string, GeometryBuilderChannel>()
  private get indices(): ReadonlyArray<number> {
    return this.indexBuffer.data as any
  }

  public boundingBox: BoundingBox = new BoundingBox()
  public boundingSphere: BoundingSphere = new BoundingSphere()

  public channelNames: string[] = []

  public constructor(
    public readonly indexBuffer: BufferOptions,
    public readonly vertexBuffer: Array<BufferOptions>,
  ) {
    for (const buffer of vertexBuffer) {
      for (const semantic in buffer.vertexLayout) {
        this.channelNames.push(semantic)
        this.channels.set(semantic, new GeometryBuilderChannel(buffer, semantic))
      }
    }
  }

  /**
   * Checks if vertex buffer channel with given semantic exists
   *
   * @param semantic
   */
  public hasChannel(semantic: string): boolean {
    return this.channels.has(semantic)
  }

  /**
   * Returns a vertex buffer channel with given semantic
   *
   * @param semantic
   */
  public getChannel(semantic: string): GeometryBuilderChannel | null {
    return this.channels.get(semantic)
  }

  /**
   * Creates a channel in vertex buffer
   *
   * @param semantic - the semantic channel name
   * @param attribute - the attribute specification
   * @param defaults - default vertex values
   */
  public createChannel(semantic: string, attribute: VertexAttribute, defaults?: number[]) {
    if (this.hasChannel(semantic)) {
      throw new Error(`channel '${semantic}' already exists`)
    }
    if (!attribute) {
      throw new Error(`attribute parameter is missing`)
    }

    const data: PlainBufferData = {
      type: attribute.elementType,
      elements: [],
    }
    const vCount = this.getVertexCount()
    for (let i = 0; i < vCount; i++) {
      if (defaults?.length === attribute.elementCount) {
        data.elements.push(...defaults)
      } else {
        for (let j = 0; j < attribute.elementCount; j++) {
          data.elements.push(0)
        }
      }
    }

    const vBuffer: BufferOptions<PlainBufferData> = {
      vertexLayout: {
        [semantic]: {
          ...attribute,
          byteOffset: 0,
        },
      },
      type: 'VertexBuffer',

      //dataType: attribute.type,
      data: data,
    }
    this.vertexBuffer.push(vBuffer)
    this.channelNames.push(semantic)
    this.channels.set(semantic, new GeometryBuilderChannel(vBuffer, semantic))
  }

  /**
   * Gets the number of vertices
   *
   * @remarks
   * This is defined by the number vertices in the `position` channel
   */
  public getVertexCount() {
    return this.getChannel('position').count
  }

  public getIndexCount() {
    return this.indices.length
  }

  /**
   * In current state it reads through the vertex buffer and eliminates redundant vertices
   *
   * @remarks
   * This does not operate on already closed mesh parts. When building a model with multiple
   * meshes or parts, this must be called each time before closing a part.
   */
  public mergeDublicates(): this {
    // vertex index cache
    const hashMap = new Map<string, number>()
    // the new vertex buffer
    const vBuffer = this.vertexBuffer.map((buf) => {
      let type: DataType
      if (isPlainBufferData(buf.data)) {
        type = buf.data.type
      } else if (ArrayBuffer.isView(buf.data)) {
        type = arrayTypeToDataType(buf.data)
      } else {
        throw new Error(`unknown buffer data type`)
      }
      return {
        ...buf,
        data: {
          elements: [],
          type,
        },
      }
    })
    // accessor to new vertex buffer
    const vChannels = GeometryBuilderChannel.fromVertexBuffer(vBuffer)
    // new vertex count
    let vCount = 0
    // new indices
    let newIndices: any = []

    const vertex: number[] = []
    const channelNames = Object.keys(this.channels)

    for (let index of this.indices) {
      // build vertex object
      vertex.length = 0
      for (const name of channelNames) {
        const channel = this.channels[name]
        const elements = channel.elements
        for (let i = 0; i < elements; i++) {
          vertex.push(channel.read(index, i))
        }
      }
      // build vertex hash value
      const hash = vertex.join('|')
      if (!hashMap.has(hash)) {
        // write back new vertex
        for (const name of channelNames) {
          const channel = vChannels[name]
          const elements = channel.elements
          for (let i = 0; i < elements; i++) {
            channel.write(vCount, i, vertex.shift())
          }
        }
        // remember vertex position
        hashMap.set(hash, vCount)
        vCount += 1
      }
      newIndices.push(hashMap.get(hash))
    }

    const oldVCount = this.getVertexCount()
    if (oldVCount !== vCount) {
      vBuffer.forEach((buf, i) => {
        this.vertexBuffer[i].data = buf.data
      })
      this.indexBuffer.data = newIndices
    }
    return this
  }

  public calculateBounds() {
    const box = this.boundingBox
    const sphere = this.boundingSphere

    box.init(0, 0, 0, 0, 0, 0)
    sphere.init(0, 0, 0, 0)

    this.getChannel('position').forEach((item, i) => {
      if (i === 0) {
        box.min.x = item[0]
        box.min.y = item[1]
        box.min.z = item[2]

        box.max.x = item[0]
        box.max.y = item[1]
        box.max.z = item[2]
      } else {
        box.mergePoint({ x: item[0], y: item[1], z: item[2] })
      }
    })

    sphere.initFromBox(box)
    return this
  }

  public calculateNormals(options?: { create?: boolean; update?: boolean; frontFace?: FrontFace }): this {
    const create = options?.create ?? false
    let update = options?.update ?? false
    const frontFace = options?.frontFace ?? 'CCW'

    const normal = 'normal'
    if (!this.hasChannel(normal) && create) {
      update = true
      this.createChannel(normal, vertexAttribute(normal), [0, 1, 0])
    }

    if (update) {
      calculateNormals(
        this.indices,
        {
          [normal]: this.getChannel(normal),
          position: this.getChannel('position'),
        },
        this.getVertexCount(),
        frontFace,
      )
    }
    return this
  }

  public calculateTangents(options?: { create?: boolean; update?: boolean; frontFace?: FrontFace }): this {
    const create = options?.create ?? false
    let update = options?.update ?? false
    const frontFace = options?.frontFace ?? 'CCW'

    const tangent = 'tangent'
    const bitangent = 'bitangent'

    if (!this.hasChannel(tangent) && create) {
      update = true
      this.createChannel(tangent, vertexAttribute(tangent), [1, 0, 0])
    }
    if (!this.hasChannel(bitangent) && create) {
      update = true
      this.createChannel(bitangent, vertexAttribute(bitangent), [0, 0, 1])
    }

    if (update) {
      calculateTangents(
        this.indices,
        {
          position: this.getChannel('position'),
          normal: this.getChannel('normal'),
          texture: this.getChannel('texture') || this.getChannel('texcoord'),
          [tangent]: this.getChannel(tangent),
          [bitangent]: this.getChannel(bitangent),
        },
        this.getVertexCount(),
        frontFace,
      )
    }

    return this
  }

  public calculateNormalsAndTangents(options?: { create?: boolean; update?: boolean; frontFace?: FrontFace }): this {
    this.calculateNormals(options)
    this.calculateTangents(options)
    return this
  }
}
