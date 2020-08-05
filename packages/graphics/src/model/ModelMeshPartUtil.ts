import { Log } from '@gglib/utils'
import { BoundingBox, BoundingSphere } from '@gglib/math'

import { BufferOptions } from '../resources'
import { VertexAttribute, commonVertexAttribute } from '../VertexLayout'
import { BufferType, PrimitiveType, FrontFace, nameOfPrimitiveType } from '../enums'
import { calculateNormals, calculateTangents } from '../formulas'

import { ModelBuilderChannel } from './ModelBuilderChannel'

export class ModelMeshPartUtil {

  private channels = new Map<string, ModelBuilderChannel>()
  private get indices(): ReadonlyArray<number> {
    return this.iBuffer.data as any
  }

  public boundingBox: BoundingBox = new BoundingBox()
  public boundingSphere: BoundingSphere = new BoundingSphere()

  public channelNames: string[] = []

  public constructor(
    public readonly iBuffer: BufferOptions,
    public readonly vBuffer: BufferOptions[],
    public readonly primitiveType: PrimitiveType,
  ) {
    if (primitiveType !== PrimitiveType.TriangleList) {
      throw new Error(`primitive type is not supporetd: '${nameOfPrimitiveType(primitiveType)}'`)
    }

    for (const buffer of vBuffer) {
      Object.keys(buffer.layout).forEach((name) => {
        this.channelNames.push(name)
        this.channels.set(name, new ModelBuilderChannel(buffer, name))
      })
    }
  }

  public hasChannel(semantic: string) {
    return this.channels.has(semantic)
  }

  public getChannel(semantic: string) {
    return this.channels.get(semantic)
  }

  public createChannel(semantic: string, attribute: VertexAttribute, defaults?: number[]) {

    if (this.hasChannel(semantic)) {
      throw new Error(`channel '${semantic}' already exists`)
    }
    if (!attribute) {
      throw new Error(`attribute parameter is missing`)
    }

    const data = []
    const vCount = this.getVertexCount()
    for (let i = 0; i < vCount; i++) {
      if (defaults?.length === attribute.elements) {
        data.push(...defaults)
      } else {
        for (let j = 0; j < attribute.elements; j++) {
          data.push(0)
        }
      }
    }
    this.vBuffer.push({
      layout: {
        [semantic]: {
          ...attribute,
          offset: 0,
        },
      },
      type: BufferType.VertexBuffer,
      dataType: attribute.type,
      data: data,
    })
    this.channelNames.push(semantic)
  }

  public getVertexCount() {
    return this.getChannel('position').count
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
    const vBuffer = this.vBuffer.map((buf) => {
      return {
        ...buf,
        data: [],
      }
    })
    // accessor to new vertex buffer
    const vChannels = ModelBuilderChannel.fromVertexBuffer(vBuffer)
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
      Log.d(`[ModelBuilder] Mesh size reduced from ${oldVCount} to ${vCount} vertices.`)
      vBuffer.forEach((buf, i) => {
        this.vBuffer[i].data = buf.data
      })
      this.iBuffer.data = newIndices
    }
    return this
  }

  public calculateBoundings() {
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

  public calculateNormals(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    const semantic = 'normal'
    if (!this.hasChannel(semantic) && create) {
      this.createChannel(semantic, commonVertexAttribute(semantic), [0, 1, 0])
    }
    if (this.hasChannel(semantic)) {
      calculateNormals(this.indices, {
        [semantic]: this.getChannel(semantic),
        position: this.getChannel('position'),
      }, this.getVertexCount(), frontFace)
    }
    return this
  }

  public calculateTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    const semantic1 = 'tangent'
    if (!this.hasChannel(semantic1) && create) {
      this.createChannel(semantic1, commonVertexAttribute(semantic1), [1, 0, 0])
    }
    const semantic2 = 'bitangent'
    if (!this.hasChannel(semantic2) && create) {
      this.createChannel(semantic2, commonVertexAttribute(semantic2), [0, 0, 1])
    }
    if (this.hasChannel(semantic1) && this.hasChannel(semantic2)) {
      calculateTangents(this.indices, {
        position: this.getChannel('position'),
        normal: this.getChannel('normal'),
        texture: this.getChannel('texture') || this.getChannel('texcoord'),
        [semantic1]: this.getChannel(semantic1),
        [semantic2]: this.getChannel(semantic2)
      }, this.getVertexCount(), frontFace)
    }
    return this
  }

  public calculateNormalsAndTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    this.calculateNormals(create, frontFace)
    this.calculateTangents(create, frontFace)
    return this
  }
}
